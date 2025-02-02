#!/usr/bin/env node

const chalk = require('chalk');
const puppeteer = require('puppeteer-core');
const chromeLauncher = require('chrome-launcher');
const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const readline = require('readline');
const net = require('net');
const { injectPageScripts } = require('./script-injector');

// Base directories
const DATA_DIR = path.join(__dirname, 'data');
const SESSION_NAME = process.env.SESSION_NAME || 'default';
const SESSION_DIR = path.join(DATA_DIR, 'sessions', SESSION_NAME);
const LOGS_DIR = path.join(SESSION_DIR, 'logs');
const STATE_DIR = path.join(SESSION_DIR, 'state');
const SCREENSHOTS_DIR = path.join(SESSION_DIR, 'screenshots');
const USER_DATA_DIR = path.join(SESSION_DIR, '.browser-data');
const SOCKET_PATH = path.join(SESSION_DIR, '.browser.sock');

// Ensure directories exist and socket doesn't exist
[DATA_DIR, SESSION_DIR, LOGS_DIR, STATE_DIR, SCREENSHOTS_DIR, USER_DATA_DIR].forEach(dir => {
    fs.ensureDirSync(dir);
});
if (fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH);
}

// Session management
function initializeSession() {
    // Initialize empty manifests if they don't exist
    const manifestPath = path.join(__dirname, 'scripts.manifest.json');
    if (!fs.existsSync(manifestPath)) {
        const defaultManifest = {
            scripts: [],
            plugins: []
        };
        fs.writeJsonSync(manifestPath, defaultManifest, { spaces: 2 });
    }

    return { dirs: { logs: LOGS_DIR, state: STATE_DIR, screenshots: SCREENSHOTS_DIR, browserData: USER_DATA_DIR }, socketPath: SOCKET_PATH };
}

// Get session configuration
const { dirs, socketPath } = initializeSession();

// Configure winston logger
const logger = winston.createLogger({
    level: process.env.DEBUG ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(dirs.logs, `error-${moment().format('YYYY-MM-DD')}.log`), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join(dirs.logs, `combined-${moment().format('YYYY-MM-DD')}.log`)
        }),
        new winston.transports.Console({
            level: 'debug',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? '\n' + JSON.stringify(meta, null, 2) : '';
                    return `${timestamp} ${level}: ${message}${metaStr}`;
                })
            )
        })
    ]
});

logger.info(`Initializing session: ${SESSION_NAME}`);

// Utility function for sleeping
const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

// Save browser state
async function saveState(page) {
    try {
        const state = {
            cookies: await page.cookies(),
            localStorage: await page.evaluate(() => {
                let items = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    items[key] = localStorage.getItem(key);
                }
                return items;
            }),
            timestamp: new Date().toISOString()
        };

        const stateFile = path.join(dirs.state, `state-${moment().format('YYYY-MM-DD-HH-mm-ss')}.json`);
        await fs.writeJson(stateFile, state, { spaces: 2 });
        logger.info(`State saved to ${stateFile}`);
    } catch (error) {
        logger.error('Failed to save state:', error);
    }
}

// Load last saved state
async function loadState(page) {
    try {
        const stateFiles = await fs.readdir(dirs.state);
        if (stateFiles.length === 0) {
            logger.info('No state files found, using Chrome profile state only');
            return;
        }

        const latestState = stateFiles
            .filter(f => f.endsWith('.json'))
            .sort()
            .pop();

        if (!latestState) {
            logger.info('No valid state files found, using Chrome profile state only');
            return;
        }

        const state = await fs.readJson(path.join(dirs.state, latestState));
        
        // Restore cookies (only those not already set by Chrome profile)
        const existingCookies = await page.cookies();
        const newCookies = state.cookies.filter(cookie => 
            !existingCookies.some(existing => 
                existing.name === cookie.name && 
                existing.domain === cookie.domain
            )
        );
        if (newCookies.length > 0) {
            await page.setCookie(...newCookies);
            logger.info(`Restored ${newCookies.length} cookies from state file`);
        }
        
        // Restore localStorage (only values not already set by Chrome profile)
        await page.evaluate((storageItems) => {
            for (const [key, value] of Object.entries(storageItems)) {
                if (!localStorage.getItem(key)) {
                    localStorage.setItem(key, value);
                }
            }
        }, state.localStorage);
        
        logger.info(`State loaded from ${latestState}`);
    } catch (error) {
        logger.error('Failed to load state:', error);
    }
}

async function setupPageLogging(page) {
    logger.info('Setting up page logging...');
    
    // Listen to console events
    page.on('console', async (msg) => {
        const type = msg.type();
        const text = msg.text();
        const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => '[Unable to serialize]')));
        
        // Format the output
        const timestamp = moment().format('HH:mm:ss');
        const prefix = chalk.gray(`[${timestamp}]`);
        
        switch(type) {
            case 'log':
                console.log(prefix, chalk.white(text), ...args);
                break;
            case 'debug':
                console.log(prefix, chalk.blue(text), ...args);
                break;
            case 'info':
                console.log(prefix, chalk.cyan(text), ...args);
                break;
            case 'error':
                console.error(prefix, chalk.red(text), ...args);
                break;
            case 'warning':
                console.warn(prefix, chalk.yellow(text), ...args);
                break;
            default:
                console.log(prefix, chalk.gray(`[${type}]`), text, ...args);
        }
        
        // Log to file as well
        logger.info('Browser console:', { type, text, args });
    });

    // Listen to page errors
    page.on('pageerror', error => {
        console.error(chalk.red('Page Error:'), error.message);
        logger.error('Page error:', error);
    });

    // Listen to request failures
    page.on('requestfailed', request => {
        const failure = request.failure();
        console.error(chalk.red('Request Failed:'), 
            request.url().slice(0, 100) + '...', 
            failure ? failure.errorText : ''
        );
        logger.error('Request failed:', {
            url: request.url(),
            failure: failure ? failure.errorText : null
        });
    });
}

// Command interface for browser interaction
class BrowserInterface {
    constructor(page, logger) {
        this.page = page;
        this.logger = logger;
        
        // Debug log available commands
        logger.debug('Registering commands...');
        
        // Bind all methods to this instance
        this.showHelp = this.showHelp.bind(this);
        this.injectScript = this.injectScript.bind(this);
        this.evalInPage = this.evalInPage.bind(this);
        this.takeScreenshot = this.takeScreenshot.bind(this);
        this.clickElement = this.clickElement.bind(this);
        this.typeText = this.typeText.bind(this);
        this.wait = this.wait.bind(this);
        this.getCurrentUrl = this.getCurrentUrl.bind(this);
        this.reloadPage = this.reloadPage.bind(this);
        this.exit = this.exit.bind(this);
        this.clearConsole = this.clearConsole.bind(this);
        this.sendChatMessage = this.sendChatMessage.bind(this);
        
        this.commands = {
            'help': this.showHelp,
            'inject': this.injectScript,
            'eval': this.evalInPage,
            'screenshot': this.takeScreenshot,
            'click': this.clickElement,
            'type': this.typeText,
            'wait': this.wait,
            'url': this.getCurrentUrl,
            'reload': this.reloadPage,
            'exit': this.exit,
            'clear': this.clearConsole,
            'chat': this.sendChatMessage
        };
        
        // Debug log registered commands
        logger.debug('Available commands:', Object.keys(this.commands));

        // Create IPC server
        this.server = net.createServer((socket) => {
            socket.on('data', async (data) => {
                try {
                    const { command, args } = JSON.parse(data.toString());
                    this.logger.debug('Received command:', { command, args });

                    const handler = this.commands[command];
                    if (handler) {
                        try {
                            const result = await handler(args);
                            this.logger.debug('Command result:', result);
                            socket.write(JSON.stringify({ result }));
                        } catch (error) {
                            this.logger.error('Command error:', error);
                            socket.write(JSON.stringify({ error: error.message }));
                        }
                    } else {
                        this.logger.error('Unknown command:', command);
                        socket.write(JSON.stringify({ error: 'Unknown command' }));
                    }
                } catch (error) {
                    this.logger.error('Invalid command format:', error);
                    socket.write(JSON.stringify({ error: 'Invalid command format' }));
                }
                socket.end();
            });
        });

        // Start IPC server
        this.server.listen(socketPath, () => {
            logger.info('Command server listening on socket:', socketPath);
        });
    }

    async start() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.blue('browser> ')
        });

        console.log(chalk.yellow('\nBrowser Command Interface Ready'));
        console.log(chalk.cyan('Type "help" for available commands'));
        console.log(chalk.cyan('Or use ./cli.js for command-line interface\n'));

        this.rl.prompt();

        this.rl.on('line', async (line) => {
            const [command, ...args] = line.trim().split(' ');
            const cmd = this.commands[command];

            if (cmd) {
                try {
                    await cmd(args.join(' '));
                } catch (error) {
                    console.error(chalk.red('Error:', error.message));
                    this.logger.error('Command error:', error);
                }
            } else if (line.trim()) {
                console.log(chalk.red('Unknown command. Type "help" for available commands.'));
            }

            this.rl.prompt();
        });
    }

    async cleanup() {
        if (this.server) {
            this.server.close();
        }
        if (fs.existsSync(socketPath)) {
            fs.unlinkSync(socketPath);
        }
    }

    async showHelp() {
        console.log(chalk.cyan('\nGlyde - Available Commands:'));
        console.log(chalk.yellow('  help                          Show this help message'));
        console.log(chalk.yellow('  inject <script>               Inject and execute JavaScript in the page'));
        console.log(chalk.yellow('  eval <expression>             Evaluate JavaScript expression and return result'));
        console.log(chalk.yellow('  screenshot [filename]         Take a screenshot of the current page'));
        console.log(chalk.yellow('  click <selector>              Click an element matching the selector'));
        console.log(chalk.yellow('  type <selector> <text>        Type text into an element'));
        console.log(chalk.yellow('  wait <ms>                     Wait for specified milliseconds'));
        console.log(chalk.yellow('  url                           Get current page URL'));
        console.log(chalk.yellow('  reload                        Reload the current page'));
        console.log(chalk.yellow('  exit                          Close browser and exit'));
        console.log(chalk.yellow('  clear                         Clear the console'));
        console.log(chalk.yellow('  chat <message>                Send a message and get the response'));
    }

    async evalInPage(expression) {
        return this.injectScript(expression);
    }

    async injectScript(script) {
        try {
            const result = await this.page.evaluate((code) => {
                try {
                    return eval(code);
                } catch (e) {
                    return `Error: ${e.message}`;
                }
            }, script);
            
            if (result !== undefined) {
                const timestamp = moment().format('HH:mm:ss');
                console.log(chalk.gray(`[${timestamp}]`), chalk.green('Result:'), result);
            }
            return result;
        } catch (error) {
            console.error(chalk.red('Injection Error:'), error.message);
            this.logger.error('Script injection error:', error);
            throw error;
        }
    }

    async takeScreenshot(filename) {
        // If no filename provided, use default
        if (!filename) {
            filename = `screenshot-${moment().format('YYYY-MM-DD-HH-mm-ss')}.png`;
        }
        // Ensure .png extension
        const screenshotPath = path.join(dirs.screenshots, filename + (filename.endsWith('.png') ? '' : '.png'));
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(chalk.green(`Screenshot saved to: ${screenshotPath}`));
        this.logger.info('Screenshot taken:', screenshotPath);
    }

    async clickElement(selector) {
        if (!selector) {
            console.log(chalk.red('Please provide a selector'));
            return;
        }
        try {
            await this.page.click(selector);
            console.log(chalk.green(`Clicked element: ${selector}`));
            this.logger.info('Clicked element:', selector);
        } catch (error) {
            console.error(chalk.red(`Failed to click element: ${error.message}`));
            this.logger.error('Click failed:', error);
        }
    }

    async typeText(selector, text) {
        if (!selector || !text) {
            console.log(chalk.red('Please provide both selector and text'));
            return;
        }
        try {
            await this.page.type(selector, text);
            console.log(chalk.green(`Typed text into: ${selector}`));
            this.logger.info('Typed text:', { selector, text });
        } catch (error) {
            console.error(chalk.red(`Failed to type text: ${error.message}`));
            this.logger.error('Type failed:', error);
        }
    }

    async wait(ms) {
        const delay = parseInt(ms, 10);
        if (isNaN(delay)) {
            console.log(chalk.red('Please provide a valid number of milliseconds'));
            return;
        }
        await sleep(delay / 1000);
        console.log(chalk.green(`Waited ${delay}ms`));
    }

    async getCurrentUrl() {
        const url = await this.page.url();
        console.log(chalk.green('Current URL:', url));
        return url;
    }

    async reloadPage() {
        await this.page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] });
        console.log(chalk.green('Page reloaded'));
    }

    async exit() {
        console.log(chalk.yellow('\nClosing browser...'));
        await this.cleanup();
        this.rl.close();
        process.exit(0);
    }

    clearConsole() {
        console.clear();
        console.log(chalk.cyan('\n👀 Browser Command Interface Ready'));
        console.log(chalk.cyan('Type "help" for available commands\n'));
    }

    async sendChatMessage(message) {
        this.logger.debug('sendChatMessage called with:', message);
        try {
            const response = await this.page.evaluate(async (msg) => {
                console.log('Evaluating in page with message:', msg);
                if (!window.sendMessageAndReturnResponse) {
                    throw new Error('sendMessageAndReturnResponse not available - are you on the correct page?');
                }
                return await window.sendMessageAndReturnResponse(msg);
            }, message);
            this.logger.debug('Got response:', response);
            return response;
        } catch (error) {
            this.logger.error('Failed to send chat message:', error);
            throw error;
        }
    }
}

async function launchBrowser() {
    try {
        // Use session-specific user data directory
        const chromeFlags = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            `--user-data-dir=${USER_DATA_DIR}`,
            '--start-maximized',
            '--disable-infobars',
            '--window-position=0,0'
        ];

        // Launch Chrome
        const chrome = await chromeLauncher.launch({
            chromeFlags,
            logFile: path.join(USER_DATA_DIR, 'chrome-out.log'),
            errFile: path.join(USER_DATA_DIR, 'chrome-err.log'),
            pidFile: path.join(USER_DATA_DIR, 'chrome.pid')
        });

        // Connect Puppeteer
        const browser = await puppeteer.connect({
            browserURL: `http://localhost:${chrome.port}`,
            defaultViewport: null
        });

        const page = await browser.newPage();
        await setupPageLogging(page);

        // Set viewport
        await page.setViewport({
            width: 1280,
            height: 800,
            deviceScaleFactor: 1,
        });

        // Initialize interface with session-specific socket path
        const interface = new BrowserInterface(page, logger);
        await interface.start();

        // Load state if it exists
        await loadState(page);

        // Set up page event handlers
        page.on('load', () => {
            saveState(page);
            injectPageScripts(page, logger);
        });

        // Navigate to initial page
        logger.info('Navigating to agenthustle.ai...');
        await page.goto('https://agenthustle.ai', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        return page;
    } catch (error) {
        logger.error('Failed to launch browser:', error);
        throw error;
    }
}

// Install process error handlers
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection:', error);
    process.exit(1);
});

// Run the browser if this is the main module
(async () => {
    try {
        const page = await launchBrowser();
        
        // Keep process alive
        process.stdin.resume();
        console.log(chalk.green('Browser running. Press Ctrl+C to exit.'));
        
        // Handle cleanup on exit
        process.on('SIGINT', async () => {
            console.log(chalk.yellow('\nShutting down...'));
            const browser = page.browser();
            await browser.close();
            process.exit(0);
        });
    } catch (error) {
        logger.error('Failed to start:', error);
        process.exit(1);
    }
})();
