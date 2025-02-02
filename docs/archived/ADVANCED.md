# Advanced Usage Guide

This guide covers advanced usage patterns and examples for the browser automation tool.

## Core Components

### Session Management
Every browser instance runs in a named session with its own:
- Socket for IPC communication
- User data directory for persistent state
- Screenshot directory
- Log directory
- State directory

The session name is specified via the `SESSION_NAME` environment variable:
```bash
SESSION_NAME=demo ./index.js
```

### Logging System
The tool uses Winston for comprehensive logging:
- Console output with timestamps
- File-based logging in `data/logs/`
- Debug mode: `DEBUG=* SESSION_NAME=demo ./index.js`

### State Management
Browser state is automatically managed:
- State is saved periodically
- State files are stored in `data/state/`
- Includes page state, cookies, and local storage
- Enables persistent sessions across restarts

### Screenshots
Screenshots are automatically saved to the session directory:
```bash
# Take a screenshot with auto-generated name
SESSION_NAME=demo ./cli.js screenshot

# Take a screenshot with custom name
SESSION_NAME=demo ./cli.js screenshot my-capture

# Screenshots are saved to:
# data/screenshots/
```

## Command Patterns

### Basic Usage
Always specify the session name for both the browser and CLI:
```bash
# Terminal 1: Start browser
SESSION_NAME=demo ./index.js

# Terminal 2: Run commands
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  console.log('test');
  resolve('result');
})"
```

### Eval Patterns
The eval command executes JavaScript in the browser. Always wrap in a Promise to ensure console.log output is visible:

```bash
# Simple value return
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  resolve('hello world');  # Returns: hello world
})"

# Console logging and return value
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  console.log('debug info');
  resolve('return value');
})"

# Multi-line operations
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const data = { test: 'value' };
  console.log('Data:', data);
  resolve(data);
})"

# Async operations
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  function getData() {
    return new Promise(resolve => setTimeout(() => resolve('async result'), 1000));
  }
  
  getData().then(result => {
    console.log('Got result:', result);
    resolve(result);
  });
})"
```

### Data Extraction
```bash
# Extract structured data from a page
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const data = Array.from(document.querySelectorAll('.item')).map(item => ({
    title: item.querySelector('.title')?.textContent?.trim(),
    price: item.querySelector('.price')?.textContent?.trim()
  }));
  console.log('Found items:', data.length);
  resolve(data);
})"
```

### Dynamic Content Handling
```bash
# Wait for dynamic elements
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  function waitForElement(selector, timeout = 5000) {
    if (document.querySelector(selector)) {
      return Promise.resolve(document.querySelector(selector));
    }
    
    return new Promise((resolve, reject) => {
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for ${selector}`));
      }, timeout);
    });
  }
  
  waitForElement('.dynamic-content')
    .then(element => {
      console.log('Found element:', element.textContent);
      resolve(element.textContent);
    })
    .catch(error => {
      console.error(error);
      resolve(null);
    });
})"
```

### Form Interaction
```bash
# Fill and submit a form
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const form = document.querySelector('form');
  if (!form) {
    console.error('Form not found');
    resolve(false);
    return;
  }
  
  # Fill form fields
  const fields = {
    name: 'Test User',
    email: 'test@example.com',
    message: 'Hello World'
  };
  
  Object.entries(fields).forEach(([field, value]) => {
    const input = form.querySelector(`[name=${field}]`);
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  
  # Submit form
  const submitBtn = form.querySelector('[type=submit]');
  if (submitBtn) {
    submitBtn.click();
    resolve(true);
  } else {
    resolve(false);
  }
})"
```

### DOM Monitoring
```bash
# Monitor DOM changes
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const changes = [];
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        changes.push({
          added: mutation.addedNodes.length,
          removed: mutation.removedNodes.length,
          target: mutation.target.tagName
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  # Monitor for 5 seconds then return changes
  setTimeout(() => {
    observer.disconnect();
    console.log('Changes detected:', changes.length);
    resolve(changes);
  }, 5000);
})"
```

## Advanced Command Patterns

### Promise Pattern for Eval
When using `eval`, ALWAYS wrap code in a Promise with resolve. Remember that ONLY the resolved value will be visible in the response:

```javascript
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    console.log("Debug output");  # This will not be visible
    resolve(yourReturnValue);     # This is required
});'
```

This pattern is REQUIRED for:
1. Seeing console.log output
2. Handling async operations
3. Returning values properly

### Complex Data Extraction
```bash
# Extract structured data from a page
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    const data = Array.from(document.querySelectorAll(".item")).map(item => ({
        title: item.querySelector(".title")?.textContent?.trim(),
        price: item.querySelector(".price")?.textContent?.trim(),
        description: item.querySelector(".desc")?.textContent?.trim(),
        link: item.querySelector("a")?.href
    }));
    
    console.log("Extracted Items:", JSON.stringify(data, null, 2));
    resolve(data);
});'
```

### Dynamic Content Handling
```bash
# Wait for dynamic elements to load
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    const waitForElement = (selector, timeout = 5000) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }
            
            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for ${selector}`));
            }, timeout);
        });
    };
    
    # Use the helper function
    waitForElement(".dynamic-content")
        .then(element => {
            console.log("Found element:", element.textContent);
            resolve(element.textContent);
        })
        .catch(error => {
            console.error(error);
            resolve(null);
        });
});'
```

## Project Structure

```
_tools/
├── cli.js              # Command-line interface
├── index.js            # Browser controller
├── script-injector.js  # Script injection system
├── scripts.manifest.json # Script configuration
├── scripts/           # Inject scripts directory
│   ├── chatgpt-prompt-inject.js
│   ├── click-monitor.js
│   └── hustle-prompt-inject.js
├── data/             # Session and runtime data
├── GUIDE.md          # Basic usage guide
├── ADVANCED.md       # Advanced usage guide
├── monitors.md       # Monitor documentation
├── test.html         # Test page
├── package.json      # Dependencies
└── package-lock.json # Lock file
```

### Key Files and Directories

1. **Core Files**:
   - `cli.js`: Command-line interface for sending commands
   - `index.js`: Main browser controller implementation
   - `script-injector.js`: Handles script injection system
   - `scripts.manifest.json`: Configuration for script injection

2. **Scripts Directory** (`scripts/`):
   - Contains inject scripts for different interfaces
   - Each script follows the naming pattern: `feature-name-inject.js`
   - Example: `chatgpt-prompt-inject.js`, `click-monitor.js`

3. **Data Directory** (`data/`):
   - Stores session information
   - Runtime data and logs
   - Socket files for communication

4. **Test Files**:
   - `test.html`: Test page with various interaction examples
   - `test/`: Directory for additional test files

5. **Documentation**:
   - `GUIDE.md`: Basic usage and getting started
   - `ADVANCED.md`: Advanced features and patterns
   - `monitors.md`: Documentation for monitoring features

6. **Package Files**:
   - `package.json`: Project dependencies and scripts
   - `package-lock.json`: Dependency lock file

## Script Injection System

### Overview
The tool provides an automatic script injection system that can inject JavaScript code into web pages based on URL patterns. This is useful for:
- Adding custom functionality to specific websites
- Automating repetitive tasks
- Enhancing website functionality
- Debugging and monitoring

### Script Configuration
Scripts are configured in `scripts.manifest.json`:

```json
{
  "scripts": [
    {
      "path": "scripts/my-script.js",
      "sessions": ["demo", "*"],
      "urlPatterns": {
        "dev": ["localhost:3000"],
        "prod": ["example.com"]
      }
    }
  ]
}
```

Configuration fields:
- `path`: Path to the script file relative to the tool directory
- `sessions`: List of session names to inject into. Use "*" for all sessions
- `urlPatterns`: URL patterns to match for injection
  - `dev`: Patterns for development environments
  - `prod`: Patterns for production environments

### Creating Inject Scripts
Scripts should be created in the `scripts/` directory following these guidelines:

1. Use an IIFE (Immediately Invoked Function Expression) to avoid global scope pollution:
```javascript
// scripts/my-script.js
(() => {
  // Script code here
  console.log('[MyScript] Initializing...');
  
  // Add global functions if needed
  window.myFunction = async () => {
    // Function implementation
  };
})();
```

2. Include clear logging:
```javascript
console.log('%c[MyScript] Status:', 'color: #2196F3', 'message');
console.error('%c[MyScript] Error:', 'color: #f44336', error);
```

3. Document available commands:
```javascript
console.log('%c[MyScript] Available commands:', 'color: #2196F3');
console.log('%c  myFunction() - Description', 'color: #2196F3');
```

4. Handle errors gracefully:
```javascript
try {
  // Risky operation
} catch (error) {
  console.error('%c[MyScript] Error:', 'color: #f44336', error);
}
```

### Using Injected Scripts
Once a script is injected, its functions are available through the `eval` command:

```bash
# Call an injected function
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
  myFunction().then(result => {
    console.log("Function result:", result);
    resolve(result);
  });
});'
```

### Best Practices
1. **Naming**:
   - Use descriptive script names: `feature-name-inject.js`
   - Prefix console logs with script name: `[ScriptName]`
   - Use consistent function naming patterns

2. **Error Handling**:
   - Always catch and log errors
   - Provide helpful error messages
   - Fail gracefully when features are unavailable

3. **Performance**:
   - Minimize script size
   - Use async/await for operations
   - Clean up resources when done

4. **Security**:
   - Validate input data
   - Don't expose sensitive information
   - Be careful with cross-origin requests

### Example: Chat Script
Here's a complete example of a chat interaction script:

```javascript
// scripts/chat-inject.js
(() => {
  // Initialize with clear logging
  console.log('%c[Chat] Script loaded and initializing...', 'color: #2196F3');
  
  // Document available commands
  console.log('%c[Chat] Available commands:', 'color: #2196F3');
  console.log('%c  chat(message) - Send a message', 'color: #2196F3');
  
  // Add chat function
  window.chat = async (message) => {
    try {
      // Input validation
      if (!message || typeof message !== 'string') {
        throw new Error('Invalid message format');
      }
      
      // Send message
      console.log('%c[Chat] Sending:', 'color: #2196F3', message);
      const response = await sendMessageAndWait(message);
      console.log('%c[Chat] Received:', 'color: #4CAF50', response);
      
      return response;
    } catch (error) {
      console.error('%c[Chat] Error:', 'color: #f44336', error);
      throw error;
    }
  };
  
  console.log('%c[Chat] Initialization complete ✓', 'color: #4CAF50');
})();
```

Configure in manifest:
```json
{
  "scripts": [
    {
      "path": "scripts/chat-inject.js",
      "sessions": ["*"],
      "urlPatterns": {
        "prod": ["chat.example.com"]
      }
    }
  ]
}
```

Use the script:
```bash
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
  chat("Hello!").then(resolve);
});'
```

## Message Input Automation

The tool provides a robust pattern for automating message input in web applications. This pattern is particularly useful for:
- Chat applications
- Comment systems
- Form submissions
- Any input that requires Enter key simulation

### Basic Pattern
Here's the core message input pattern:

```javascript
function sendMessage(text, inputSelector = '[placeholder="Message..."]') {
    const messageInput = document.querySelector(inputSelector);
    if (!messageInput) {
        return 'Message input not found';
    }
    
    // Focus the input
    messageInput.focus();
    
    // Set the value
    messageInput.value = text;
    
    // Trigger input event for reactive frameworks
    messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Simulate Enter key
    messageInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
    }));
    
    return 'Message sent!';
}
```

### Usage
Use this pattern with the `eval` command:

```bash
./cli.js eval 'new Promise(resolve => {
    function sendMessage(text) {
        // ... pattern code here ...
    }
    const result = sendMessage("Hello World!");
    console.log("Result:", result);
    resolve(result);
});'
```

### Why This Pattern Works
1. `focus()` ensures the input is active
2. Setting `value` puts the text in the input
3. `input` event with `bubbles: true` notifies reactive frameworks
4. `KeyboardEvent` simulates pressing Enter
5. All events bubble up the DOM tree for framework compatibility

### Common Use Cases

1. Basic message:
```bash
./cli.js eval 'new Promise(resolve => {
    const input = document.querySelector("#message-input");
    input.value = "Hello";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true
    }));
    resolve("Message sent");
});'
```

2. With special characters:
```bash
./cli.js eval 'new Promise(resolve => {
    const input = document.querySelector("#message-input");
    input.value = "Testing @#$%! Special 🚀 Characters";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true
    }));
    resolve("Message sent");
});'
```

3. With validation:
```bash
./cli.js eval 'new Promise(resolve => {
    const input = document.querySelector("#message-input");
    if (!input) {
        resolve("Input not found");
        return;
    }
    if (input.disabled || input.readOnly) {
        resolve("Input not editable");
        return;
    }
    input.value = "Hello World";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true
    }));
    resolve("Message sent");
});'
```

### Best Practices
1. **Input Detection**:
   - Always check if input exists
   - Verify input is enabled and editable
   - Use specific selectors

2. **Event Simulation**:
   - Include all necessary events
   - Use `bubbles: true` for framework compatibility
   - Set proper event properties

3. **Error Handling**:
   - Handle missing inputs gracefully
   - Provide meaningful error messages
   - Consider retry logic for flaky inputs

4. **Framework Compatibility**:
   - Trigger appropriate framework events
   - Use proper event bubbling
   - Consider framework-specific requirements

### Troubleshooting
1. **Message not appearing**:
   - Check if input selector is correct
   - Verify input events are bubbling
   - Ensure no JavaScript errors

2. **Framework not updating**:
   - Add framework-specific events
   - Verify event bubbling
   - Check framework state management

3. **Special characters issues**:
   - Use proper text encoding
   - Handle emoji and Unicode
   - Test with various character sets

## Label Command

The `label` command allows you to add visual labels to elements on the page. This is useful for:
- Debugging element positions
- Creating visual guides
- Marking elements in sequence
- Showing coordinate information

### Usage

```bash
./cli.js label <selector> [options]
```

### Options

- `--number` or `-n`: Add sequential numbers to matching elements
- `--coords` or `-c`: Show coordinates of the elements
- `--color <color>`: Set the label color (default: "#00ff9d")
- `--size <size>`: Set the label font size in pixels (default: 20)
- `--nocleanup` or `-N`: Keep labels permanently (do not auto-remove after 5s)

### Examples

1. Add numbered labels to all buttons:
```bash
./cli.js label "button" --number
```

2. Show coordinates for specific elements:
```bash
./cli.js label ".clickable" --coords
```

3. Combine numbers and coordinates with custom styling:
```bash
./cli.js label ".item" --number --coords --color "#ff00ff" --size 16
```

4. Add permanent labels that don't fade out:
```bash
./cli.js label ".item" --number --coords --nocleanup
```

5. Label all elements on the page:
```bash
./cli.js label "*" --number --coords
```

### Notes

- Labels automatically fade out after 5 seconds (unless --nocleanup is specified)
- Labels are non-interactive (pointer-events: none)
- Multiple labels can be added simultaneously
- Labels are positioned above the target elements
- Using `*` as selector will label all elements on the page
- Empty text nodes and script elements are automatically filtered out

## Console Logging

The tool now includes enhanced console logging features:

### Log Types and Colors
- Regular logs: White
- Debug messages: Blue
- Info messages: Cyan
- Warnings: Yellow
- Errors: Red

### Timestamp Format
All console messages include timestamps in `HH:mm:ss` format:
```
[14:30:45] Starting operation...
[14:30:45] Background color changed
```

### Error Tracking
The tool automatically captures and logs:
- Page errors
- Network request failures
- JavaScript evaluation errors
- Console errors from the page

### Log Files
All console output is also saved to log files in the `data/logs` directory with:
- Timestamp
- Log level
- Full message content
- Stack traces for errors
- Request/response details

## Directory Structure

```
glyde/
├── index.js           # Main browser controller
├── cli.js            # Command-line interface
├── package.json      # Dependencies
└── data/
    ├── logs/         # Operation logs
    │   ├── error.log    # Error logs
    │   └── combined.log # All logs
    ├── screenshots/  # Captured screenshots
    ├── state/        # Browser state
    └── .browser-data/ # Chrome user data
```

## Dependencies

- puppeteer-core: Browser automation
- chrome-launcher: Chrome process management
- winston: Logging
- chalk: CLI styling
- fs-extra: Enhanced file operations
- moment: Time formatting

## Configuration

The tool uses several environment variables that can be configured in `.tools/.env`:

```env
CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
CHROME_USER_DATA_DIR=/path/to/custom/profile
LOG_LEVEL=info
LOG_FORMAT=simple  # or 'detailed' for more verbose logging
```

## Debugging Tips

1. Use console logging to track operations:
```javascript
SESSION_NAME=demo ./cli.js inject "
console.log('Starting operation');
const element = document.querySelector('#target');
console.log('Element found:', element);
element.click();
console.log('Click performed');
"
```

2. Monitor network requests:
```javascript
SESSION_NAME=demo ./cli.js inject "
console.log('Monitoring network...');
const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
        console.log('Request:', entry.name);
    });
});
observer.observe({ entryTypes: ['resource'] });
"
```

3. Track DOM changes:
```javascript
SESSION_NAME=demo ./cli.js inject "
console.log('Setting up DOM observer...');
new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        console.log('DOM changed:', mutation.type);
    });
}).observe(document.body, { 
    childList: true, 
    subtree: true 
});
"
```

## Interacting with Web Applications

### Navigation
```bash
# Navigate to a URL using eval
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  window.location.href = 'http://localhost:3000';
  resolve('Navigating...');
})"
```

### Element Interaction
The tool provides several ways to interact with page elements:

#### Finding Elements
```bash
# List all buttons with their properties
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
    type: b.type,
    text: b.textContent,
    class: b.className,
    ariaLabel: b.getAttribute('aria-label')
  }));
  console.log('Buttons:', buttons);
  resolve(buttons);
})"

# Find specific input field
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const input = document.querySelector('input[placeholder=\"Search...\"]');
  console.log('Input value:', input?.value);
  resolve(input?.value);
})"
```

#### Form Interaction
```bash
# Type into input field
SESSION_NAME=demo ./cli.js type "input[placeholder=\"Search...\"]" "search text"

# Click submit button
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const submitBtn = document.querySelector('form button[type=\"submit\"]');
  if (submitBtn) {
    submitBtn.click();
    resolve('Clicked submit');
  } else {
    resolve('Submit button not found');
  }
})"
```

### Google Search Examples
```bash
# Direct navigation to search results
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  window.location.href = 'https://www.google.com/search?q=cursor+web+automation';
  resolve('Navigating...');
})"

# Modify search using form
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const input = document.querySelector('input[name=\"q\"]');
  input.value = 'web scraping with puppeteer';
  input.form.submit();
  resolve('Form submitted');
})"

# Verify current search URL
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  console.log('Current URL:', window.location.href);
  resolve(window.location.href);
})"

# Chain multiple searches
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const input = document.querySelector('input[name=\"q\"]');
  input.value = 'javascript browser automation tools';
  input.form.submit();
  resolve('Form submitted');
})"
```

### Getting Feedback
Always use eval to get feedback from your commands:

```bash
# Check if element exists and is interactive
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const btn = document.querySelector('button#submit');
  console.log('Button exists:', !!btn);
  console.log('Button disabled:', btn?.disabled);
  console.log('Button visible:', btn?.offsetParent !== null);
  resolve({
    exists: !!btn,
    disabled: btn?.disabled,
    visible: btn?.offsetParent !== null
  });
})"

# Verify input value after typing
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const input = document.querySelector('input#search');
  console.log('Input value:', input.value);
  resolve(input.value);
})"

# Check form state
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const form = document.querySelector('form');
  console.log('Form valid:', form.checkValidity());
  console.log('Form elements:', form.elements.length);
  console.log('Submit button:', !!form.querySelector('[type=\"submit\"]'));
  resolve({
    valid: form.checkValidity(),
    elements: form.elements.length,
    submitButton: !!form.querySelector('[type=\"submit\"]')
  });
})"
```

### Event Handling
When interacting with modern web applications, proper event handling is crucial:

```bash
# Trigger input events after value change
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const input = document.querySelector('input#search');
  input.value = 'search text';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  resolve('Events dispatched');
})"

# Simulate keyboard events
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const input = document.querySelector('input#search');
  const enterEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true
  });
  input.dispatchEvent(enterEvent);
  resolve('Enter key pressed');
})"
```

### Debugging Tips
1. Always check element existence before interaction
2. Use proper event simulation for modern frameworks
3. Verify command results using eval
4. Check element state (disabled, visibility) before interactions
5. Use proper selectors (id, class, attributes) for reliable element targeting

### Best Practices
1. **Use `eval` to get feedback from commands**
2. **Chain commands to verify state changes**
3. **Handle errors gracefully**
4. **Use appropriate selectors for stability**
5. **Simulate proper events for framework compatibility**

## Important Notes

- **Console.log Limitation**: When using `cli.js eval`, NEVER use `console.log()`. Instead:
  1. Return values directly from the evaluation
  2. Assign to window/global objects only if absolutely necessary
  3. Keep the evaluation chain pure and return-focused

Example:
```javascript
# This won't work:
SESSION_NAME=demo ./cli.js eval "console.log('test')"  # Output not visible

# This will work:
SESSION_NAME=demo ./cli.js eval "'test'"  # Returns 'test' directly
SESSION_NAME=demo ./cli.js eval "const result = 'test'; result"  # Returns result
```

## Eval and Console Logging Patterns

The `eval` command in `cli.js` executes JavaScript in the page context and returns results through an IPC socket. Here are some effective patterns for using eval with console logging:

### Basic Pattern
```javascript
new Promise(resolve => {
    # Your code here
    console.log("DEBUG:", "your debug info");
    resolve(yourData);
});
```

### Data Extraction Pattern
For reliably extracting data from dynamic pages:

```javascript
new Promise(resolve => {
    const content = document.body.innerText;
    # Use regex patterns to find data in the full page content
    const dataMatch = content.match(/Your Pattern.*?\n.*?\n.*?([0-9.]+[BMK])/s);
    const data = {
        value: dataMatch ? dataMatch[1] : null
    };
    console.log("EXTRACTED_DATA:", JSON.stringify(data));
    resolve(data);
});
```

### Console Output Capture
To capture all console output during execution:

```javascript
new Promise(resolve => {
    let output = "";
    const originalConsoleLog = console.log;
    console.log = (...args) => {
        output += args.join(" ") + "\n";
        originalConsoleLog(...args);
    };
    
    # Your code here
    
    console.log("CAPTURED_OUTPUT:", output);
    resolve({ output });
});
```

### DOM Traversal Pattern
For complex DOM structures:

```javascript
new Promise(resolve => {
    const data = {};
    const walk = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
    );
    
    let node;
    while (node = walk.nextNode()) {
        const text = node.textContent.trim();
        if (text.includes("Your Target")) {
            # Process the node or its siblings
            console.log("Found target:", text);
        }
    }
    
    resolve(data);
});
```

### Best Practices

1. **Always use Promises**
   - Ensures proper async handling
   - Allows both console logging and data return
   - Provides clean error handling

2. **Structured Data Return**
   - Return data as structured objects
   - Include both success/failure status
   - Add metadata when useful

3. **Error Handling**
   ```javascript
   new Promise(resolve => {
       try {
           # Your code here
           resolve({ success: true, data });
       } catch (error) {
           console.error("ERROR:", error);
           resolve({ success: false, error: error.message });
       }
   });
   ```

4. **Debug Logging**
   - Use descriptive prefixes: DEBUG:, INFO:, ERROR:
   - Log intermediate steps for complex operations
   - Include timestamps for timing-sensitive operations

## JavaScript Evaluation Rules

### Console Output
When using `cli.js eval`, NEVER use `console.log()`. Instead:
1. Return values directly from the evaluation
2. Assign to window/global objects only if absolutely necessary
3. Keep the evaluation chain pure and return-focused

### Examples

#### WRONG:
```javascript
SESSION_NAME=demo ./cli.js eval "const data = getData(); console.log(data)"
```

#### RIGHT:
```javascript
SESSION_NAME=demo ./cli.js eval "getData()"
```

### Common Patterns

#### Extracting Content:
```javascript
# Return directly
SESSION_NAME=demo ./cli.js eval "Array.from(document.querySelectorAll('div')).map(d => ({text: d.innerText}))"

# NOT
SESSION_NAME=demo ./cli.js eval "const divs = Array.from(document.querySelectorAll('div')); console.log(divs)"
```

#### Processing Data:
```javascript
# Return the processed result
SESSION_NAME=demo ./cli.js eval "const process = x => x * 2; process(getData())"

# NOT
SESSION_NAME=demo ./cli.js eval "const result = process(getData()); console.log(result)"
```

Remember: The eval command will automatically return the last expression's value. Use this instead of console.log().

## Socket-Based Command System

Glyde uses Unix domain sockets for reliable communication between the CLI and browser interface. Each session gets its own socket file, ensuring isolation and clean cleanup.

### Socket File Location
Socket files are stored in the session directory:
```
data/sessions/<session_name>/.browser.sock
```

### Command Format
Commands are sent as JSON messages:
```javascript
{
  command: 'eval',  # Command to execute
  args: 'window.location.href'  # Command arguments
}
```

### Response Format
Responses include success/failure and any returned data:
```javascript
{
  success: true,
  data: 'https://example.com'
}
```

### Common Commands
```bash
# Navigate to URL
SESSION_NAME=demo ./cli.js eval "window.location.href = 'https://example.com'"

# Wait for loading
SESSION_NAME=demo ./cli.js wait 3

# Take screenshot
SESSION_NAME=demo ./cli.js screenshot example
```

### Session Management
- Each session has its own isolated socket
- Socket files are automatically cleaned up
- Sessions can run independently

## Form Interaction
```bash
# Complex form interaction with validation
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const form = document.querySelector('form');
  if (!form) {
    console.error('Form not found');
    return resolve(false);
  }
  
  # Fill form fields
  const fields = {
    name: 'Test User',
    email: 'test@example.com',
    message: 'Hello World'
  };
  
  Object.entries(fields).forEach(([field, value]) => {
    const input = form.querySelector(`[name=${field}]`);
    if (input) {
      input.value = value;
      # Trigger change event
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  
  # Submit and wait for response
  form.addEventListener('submit', event => {
    event.preventDefault();
    console.log('Form submitted');
    resolve(true);
  });
  
  form.querySelector('[type=submit]')?.click();
})"
```

## State Monitoring
```bash
# Monitor DOM changes
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      const newNodes = Array.from(mutation.addedNodes);
      newNodes.forEach(node => {
        if (node.matches && node.matches('.result')) {
          console.log('New result added:', node.textContent);
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  # Clean up after 5 seconds
  setTimeout(() => {
    observer.disconnect();
    console.log('Finished monitoring');
    resolve(true);
  }, 5000);
})"
```

## Troubleshooting

1. **Command Fails Silently**
   - Check Promise wrapper
   - Verify selectors
   - Monitor debug output

2. **Script Injection Issues**
   - Validate URL patterns
   - Check script paths
   - Verify permissions

3. **Plugin Problems**
   - Check extension path
   - Verify manifest.json
   - Review browser logs

4. **Performance Issues**
   - Optimize selectors
   - Reduce observer scope
   - Clean up resources

Remember: The tool is designed for automation and testing. Always follow web scraping best practices and respect website terms of service.

## Best Practices

1. **Session Management**
   - Use descriptive session names
   - One session per task
   - Clean up old sessions

2. **Error Handling**
   - Always wrap eval commands in try/catch
   - Set appropriate timeouts
   - Validate element existence

3. **Performance**
   - Use efficient selectors
   - Clean up observers
   - Limit concurrent operations

4. **Debugging**
   - Use DEBUG=* for verbose logging
   - Check browser console
   - Monitor network requests

5. **Security**
   - Validate input data
   - Sanitize output
   - Use secure protocols
   - Review injected scripts

## Common Patterns

### Element Selection
```javascript
// Wait for element with timeout
const waitForElement = (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        
        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout waiting for ${selector}`));
        }, timeout);
    });
};
```

### State Management
```javascript
// Track page state changes
const trackState = (callback, timeout = 5000) => {
    const observer = new MutationObserver(callback);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
    });
    
    setTimeout(() => observer.disconnect(), timeout);
    return observer;
};
```

### Network Monitoring
```javascript
// Monitor XHR requests
const monitorXHR = () => {
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    
    XHR.open = function(method, url) {
        this._url = url;
        return open.apply(this, arguments);
    };
    
    XHR.send = function() {
        this.addEventListener('load', function() {
            console.log(`XHR Complete: ${this._url}`);
        });
        return send.apply(this, arguments);
    };
};
```

## Troubleshooting

1. **Command Fails Silently**
   - Check Promise wrapper
   - Verify selectors
   - Monitor debug output

2. **Script Injection Issues**
   - Validate URL patterns
   - Check script paths
   - Verify permissions

3. **Plugin Problems**
   - Check extension path
   - Verify manifest.json
   - Review browser logs

4. **Performance Issues**
   - Optimize selectors
   - Reduce observer scope
   - Clean up resources

Remember: The tool is designed for automation and testing. Always follow web scraping best practices and respect website terms of service.
