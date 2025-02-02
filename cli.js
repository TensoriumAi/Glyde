#!/usr/bin/env node

const net = require('net');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const yargs = require('yargs');

const SESSION_NAME = process.env.SESSION_NAME || 'default';
const SOCKET_PATH = path.join(__dirname, 'data', 'sessions', SESSION_NAME, '.browser.sock');

// Parse command line arguments
const parseArgs = () => {
    const argv = yargs
        .command('inject <script>', 'Inject and execute JavaScript')
        .command('eval <expression>', 'Evaluate JavaScript and get result')
        .command('screenshot [name]', 'Take a screenshot')
        .command('click <selector>', 'Click an element')
        .command('type <selector> <text>', 'Type text into element')
        .command('url', 'Get current URL')
        .command('reload', 'Reload the page')
        .command('chat <message>', 'Send a chat message and get response')
        .command('label <selector> [options]', 'Add a visual label to element(s)')
        .option('number', {
            alias: 'n',
            type: 'boolean',
            description: 'Add sequential numbers to matching elements'
        })
        .option('coords', {
            alias: 'c',
            type: 'boolean',
            description: 'Show coordinates of the elements'
        })
        .option('color', {
            alias: 'C',
            type: 'string',
            description: 'Label color (default: "#00ff9d")'
        })
        .option('size', {
            alias: 's',
            type: 'number',
            description: 'Label size in pixels (default: 20)'
        })
        .option('nocleanup', {
            alias: 'N',
            type: 'boolean',
            description: 'Keep labels permanently (do not auto-remove after 5s)'
        })
        .help()
        .argv;

    return argv;
};

const focusChrome = () => {
    try {
        execSync('osascript -e \'tell application "Google Chrome" to activate\'');
    } catch (error) {
        console.warn(chalk.yellow('Warning: Failed to focus Chrome window'));
    }
};

const sendCommand = async (command, args) => {
    if (!fs.existsSync(SOCKET_PATH)) {
        console.error(chalk.red('Error: Browser is not running. Start it first with ./index.js'));
        process.exit(1);
    }

    // Focus Chrome window before sending command
    focusChrome();

    console.log('Sending command:', { command, args });  

    return new Promise((resolve, reject) => {
        const client = net.createConnection(SOCKET_PATH, () => {
            client.write(JSON.stringify({ command, args }));
        });

        let data = '';

        client.on('data', (chunk) => {
            data += chunk;
        });

        client.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result);
                }
            } catch (error) {
                reject(error);
            }
        });

        client.on('error', (error) => {
            reject(error);
        });
    });
};

// Main
(async () => {
    try {
        const argv = parseArgs();

        if (argv._.length === 0 || argv.help) {
            yargs.showHelp();
            process.exit(0);
        }

        let command = argv._[0];
        let args = argv._.slice(1).join(' ');

        if (command === 'eval') {
            // For eval, preserve the exact expression
            args = process.argv.slice(3).join(' ');
        }

        if (command === 'label') {
            const options = argv;
            const selector = options.selector;
            const labelCommand = {
                command: 'eval',
                args: `new Promise(resolve => {
                    const elements = document.querySelectorAll('${selector}');
                    const labels = [];
                    
                    elements.forEach((el, index) => {
                        // Skip empty text nodes, script tags, and style tags for * selector
                        if ('${selector}' === '*' && (
                            el.nodeType === 3 || // Text node
                            el.tagName === 'SCRIPT' ||
                            el.tagName === 'STYLE' ||
                            !el.offsetParent || // Hidden elements
                            (el.textContent || '').trim() === '' // Empty elements
                        )) {
                            return;
                        }

                        const rect = el.getBoundingClientRect();
                        
                        // Skip elements with zero size
                        if (rect.width === 0 || rect.height === 0) {
                            return;
                        }
                        
                        const label = document.createElement('div');
                        label.className = 'glyde-label';
                        
                        const text = [];
                        if (${options.number}) text.push(index + 1);
                        if (${options.coords}) text.push(\`(\${Math.round(rect.x)}, \${Math.round(rect.y)})\`);
                        
                        label.textContent = text.join(' ');
                        label.style.cssText = \`
                            position: fixed;
                            z-index: 10000;
                            background: rgba(0, 255, 157, 0.15);
                            color: #00ff9d;
                            padding: 2px 4px;
                            border-radius: 2px;
                            font-size: 11px;
                            font-family: 'Courier New', monospace;
                            font-weight: 500;
                            pointer-events: none;
                            top: \${rect.top}px;
                            left: \${rect.left}px;
                            animation: glyde-label-fade 0.3s ease-in-out;
                            border: 1px solid rgba(0, 255, 157, 0.3);
                            backdrop-filter: blur(2px);
                            white-space: nowrap;
                            box-shadow: 0 0 5px rgba(0, 255, 157, 0.1);
                            letter-spacing: -0.2px;
                        \`;
                        
                        // Add animation style if not present
                        if (!document.querySelector('#glyde-label-style')) {
                            const style = document.createElement('style');
                            style.id = 'glyde-label-style';
                            style.textContent = \`
                                @keyframes glyde-label-fade {
                                    from { opacity: 0; transform: translateY(10px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                            \`;
                            document.head.appendChild(style);
                        }
                        
                        document.body.appendChild(label);
                        labels.push(label);
                        
                        // Remove labels after 5 seconds unless nocleanup is specified
                        if (!${options.nocleanup}) {
                            setTimeout(() => {
                                label.style.opacity = '0';
                                label.style.transform = 'translateY(-10px)';
                                label.style.transition = 'all 0.3s ease-in-out';
                                setTimeout(() => label.remove(), 300);
                            }, 5000);
                        }
                    });
                    
                    resolve(\`Added \${labels.length} label(s)\${${options.nocleanup} ? ' permanently' : ''}\`);
                })`
            };
            await sendCommand(labelCommand.command, labelCommand.args);
        } else {
            const result = await sendCommand(command, args);
            
            if (result !== undefined) {
                if (typeof result === 'string') {
                    console.log('\nResponse:', result);
                } else {
                    console.log('\nResponse:', JSON.stringify(result, null, 2));
                }
            }
        }
    } catch (error) {
        console.error(chalk.red('\nError:', error.message));
        process.exit(1);
    }
})();
