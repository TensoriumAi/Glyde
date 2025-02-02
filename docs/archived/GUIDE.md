# Browser Control Tool Guide

## What is it?
A Node.js-based tool for controlling Chrome browser sessions programmatically. It consists of two main components:
- A browser controller (`index.js`)
- A command-line interface (`cli.js`)

## Key Concept: Sessions
Every browser instance runs in a named session. The session name must be specified for both the controller and CLI commands using the `SESSION_NAME` environment variable.

## Starting Up

1. Start the browser controller:
```bash
SESSION_NAME=demo ./index.js
```

Want debug output? Add DEBUG=*:
```bash
DEBUG=* SESSION_NAME=demo ./index.js
```

2. Send commands using CLI:
```bash
SESSION_NAME=demo ./cli.js <command> <args>
```

## Commands

### Navigation
To navigate to a URL:
```bash
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => { 
    window.location.href = "https://chat.openai.com"; 
    resolve(true); 
});'
```

### Important: The Promise Pattern
When using `eval`, ALWAYS wrap your code in a Promise with resolve. Note that ONLY the resolved value will be visible in the response:
```bash
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    // Only the resolved value will be visible
    resolve("This will be visible");
});'
```

Without this pattern:
- Return values will be lost
- Async operations may not complete

### String Escaping in Commands

The browser control tool passes commands through multiple layers (CLI → Unix socket → Browser), requiring careful string escaping. Here are the rules:

#### Basic Eval Commands
For simple eval commands, use single quotes for the outer string and double quotes for inner strings:
```bash
SESSION_NAME=demo ./cli.js eval 'console.log("Hello World")'
```

#### Promises with String Content
When using Promises (required for seeing console.log output), nest the quotes properly:
```bash
# Good - Uses single outer quotes, double quotes for Promise
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    console.log("Debug output");
    resolve("Done");
});'

# Bad - Will fail due to quote mismatch
SESSION_NAME=demo ./cli.js eval "new Promise(resolve => {
    console.log('Debug output');
    resolve('Done');
});"
```

#### Complex String Content
For commands containing quotes, newlines, or special characters:

1. Use backticks for template literals:
```bash
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    window.chat(`This is a
    multiline message with "quotes"
    and special characters: ${}!`).then(response => {
        resolve(response);
    });
});'
```

2. Or escape inner quotes:
```bash
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    window.chat("This message has \\"escaped quotes\\" and a line\\nbreak").then(response => {
        resolve(response);
    });
});'
```

#### Common Issues

1. **Quote Mismatch**: Always use single quotes for the outer command:
```bash
# Good
./cli.js eval 'window.chat("Hello")'

# Bad - will fail
./cli.js eval "window.chat('Hello')"
```

2. **Missing Promise**: Console output requires Promise wrapper:
```bash
# Good - will show console output
./cli.js eval 'new Promise(resolve => {
    console.log("Debug info");
    resolve(true);
});'

# Bad - console output will be lost
./cli.js eval 'console.log("Debug info")'
```

3. **Unescaped Special Characters**: Be careful with backslashes and newlines:
```bash
# Good - properly escaped
./cli.js eval 'new Promise(resolve => {
    window.chat("Line 1\\nLine 2").then(r => resolve(r));
});'

# Bad - unescaped newline
./cli.js eval 'new Promise(resolve => {
    window.chat("Line 1
    Line 2").then(r => resolve(r));
});'
```

Remember: The command passes through multiple layers of parsing, so proper escaping is crucial for reliability.

### Common Issues

1. "Browser is not running" error:
   - Check if controller is running
   - Verify SESSION_NAME matches between controller and CLI
   - Make sure you're in the right directory

2. Socket errors:
   - Previous session might still be running
   - Check data/sessions/[SESSION_NAME]/.browser.sock

3. Command fails silently:
   - Make sure to use Promise pattern with eval
   - Check debug output for errors

## Testing the CLI

### Setting Up the Test Environment

1. Start a Python HTTP server to serve the test page:
```bash
# Navigate to the tools directory
cd _tools

# Start Python HTTP server on port 8000
python3 -m http.server 8000
```

2. Open Chrome and navigate to:
```
http://localhost:8000/test.html
```

3. In a new terminal, start the browser automation:
```bash
SESSION_NAME=test ./index.js
```

4. In another terminal, run test commands:
```bash
SESSION_NAME=test ./cli.js type "#type-test" "Hello World"
```

### Cleaning Up

To stop the test environment:

1. Kill the Python HTTP server:
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

2. Stop the browser automation by pressing Ctrl+C in its terminal

### Common Issues

- If port 8000 is already in use, either:
  - Kill the existing process using the command above
  - Or use a different port: `python3 -m http.server 8001`
- If the browser doesn't connect, ensure:
  - The Python server is running
  - You're using the correct SESSION_NAME
  - Chrome is installed and accessible

## Real Examples

Start a new demo session:
```bash
SESSION_NAME=demo ./index.js
```

In another terminal, navigate to ChatGPT:
```bash
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => { 
    window.location.href = "https://chat.openai.com"; 
    resolve(true); 
});'
```

Type into a text field:
```bash
SESSION_NAME=demo ./cli.js type "#prompt-textarea" "Hello ChatGPT"
```

Click a button:
```bash
SESSION_NAME=demo ./cli.js click "#send-button"
```

## Tips

1. Always use the same SESSION_NAME for controller and CLI

2. Debug mode is your friend:
```bash
DEBUG=* SESSION_NAME=demo ./index.js
```

3. One session per task - don't reuse sessions

4. Keep sessions organized with meaningful names:
   - SESSION_NAME=chat-demo
   - SESSION_NAME=test-session
   - SESSION_NAME=prod-automation
