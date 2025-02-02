# Glyde Script System

Glyde uses an automatic script injection system that loads JavaScript files based on URL patterns.

## Configuration

Scripts are configured in `glyde.manifest.json`:

```json
{
  "scripts": [
    {
      "path": "scripts/example-script.js",
      "sessions": ["demo", "*"],     // Which sessions get this script
      "urlPatterns": {
        "dev": ["localhost:3000"],   // Development URLs
        "prod": ["example.com"]      // Production URLs
      }
    }
  ]
}
```

### Fields
- `path`: Location of script file
- `sessions`: List of session names or "*" for all
- `urlPatterns`: URL patterns for injection
  - `dev`: Development patterns
  - `prod`: Production patterns

## Available Scripts

### 1. ChatGPT Interaction (chatgpt-prompt-inject.js)
Enhances interaction with ChatGPT interface.

```javascript
// Returns: Promise<{ response: string, timestamp: number }>
await chat("Your message")

// Available in sessions: demo
// URLs: chat.openai.com, chatgpt.com
```

### 2. Hustle AI Interaction (hustle-prompt-inject.js)
Provides Hustle AI interface automation.

```javascript
// Returns: Promise<{ response: string, timestamp: number }>
await chat("Your message")

// Available in sessions: * (all)
// URLs: hustle.ai, agenthustle.ai
```

### 3. Click Monitoring (click-monitor.js)
Tracks click events across pages.

```javascript
// Automatically tracks clicks
// No manual commands needed
// Events include: { x, y, target, timestamp }

// Available in sessions: * (all)
// URLs: * (all)
```

## Writing Custom Scripts

### Basic Template
```javascript
(() => {
    // IMPORTANT: Don't use console.log for data you want to see
    // Instead, return values through Promise resolution
    
    window.myFunction = async () => {
        try {
            const result = await someOperation();
            return {
                success: true,
                result,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    };
})();
```

### Best Practices
1. Use IIFE pattern
2. Return values through Promise resolution
3. NEVER use console.log for important data
4. Include timestamps and metadata
5. Use proper error objects

### Error Handling
```javascript
try {
    const result = await riskyOperation();
    return {
        success: true,
        result,
        timestamp: Date.now()
    };
} catch (error) {
    return {
        success: false,
        error: error.message,
        timestamp: Date.now()
    };
}
```

## Debugging Scripts

### 1. Check Injection
```bash
# Watch browser console for script loading
SESSION_NAME=demo ./index.js
```

### 2. Test Commands
```bash
# Test script function with proper return value
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    window.myFunction().then(result => resolve({
        ...result,
        testTimestamp: Date.now()
    }));
})'
```

### 3. Monitor Events
```bash
# Enable debug logging
DEBUG=* SESSION_NAME=demo ./index.js
```

## Common Issues

1. **Lost Data**
   - NEVER use console.log for data you need
   - Always return data through Promise resolution
   - Include metadata in returned objects

2. **Command Not Found**
   - Ensure script is loaded
   - Check function is added to window
   - Verify promise handling

3. **Timeout Issues**
   - Return proper timeout status
   - Include duration in response
   - Use background processing 