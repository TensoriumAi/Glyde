const fs = require('fs-extra');
const path = require('path');

async function injectPageScripts(page, logger) {
    try {
        const currentUrl = await page.url();
        logger.info('Checking URL for script injection:', currentUrl);

        // Get session name from environment
        const sessionName = process.env.SESSION_NAME || 'default';
        const manifestPath = path.join(__dirname, 'scripts.manifest.json');

        // Load root manifest
        let manifest;
        try {
            manifest = await fs.readJson(manifestPath);
            logger.debug('Loaded scripts manifest:', manifest);
        } catch (error) {
            logger.error('Failed to load scripts manifest:', error);
            return;
        }

        const isDev = currentUrl.includes('localhost');
        const env = isDev ? 'dev' : 'prod';

        // Filter scripts that apply to this session
        const applicableScripts = manifest.scripts.filter(script => 
            script.sessions.includes('*') || script.sessions.includes(sessionName)
        );

        // Inject each applicable script
        for (const scriptConfig of applicableScripts) {
            const patterns = scriptConfig.urlPatterns[env] || [];
            const shouldInject = patterns.includes('*') || patterns.some(pattern => currentUrl.includes(pattern));
            
            if (shouldInject) {
                const pattern = patterns.includes('*') ? '*' : patterns.find(p => currentUrl.includes(p));
                logger.info(`Found matching pattern: ${pattern} for script: ${scriptConfig.path}`);

                const scriptPath = path.join(__dirname, scriptConfig.path);
                try {
                    const scriptContent = await fs.readFile(scriptPath, 'utf8');
                    await page.evaluate(scriptContent);
                    logger.info(`Successfully injected script: ${scriptConfig.path}`);
                } catch (error) {
                    logger.error(`Failed to inject script ${scriptConfig.path}:`, error);
                }
            }
        }
    } catch (error) {
        logger.error('Script injection error:', error);
        throw error;
    }
}

module.exports = { injectPageScripts };
