# Getting Started with Glyde

## Prerequisites
- Node.js installed
- Chrome browser installed
- Basic terminal knowledge

## Installation
```bash
git clone <repository>
cd glyde
npm install
```

## First Steps

### 1. Start a Glyde Session
Every browser instance runs in a named session. Always start with the Glyde browser controller:

```bash
SESSION_NAME=demo ./index.js
```

This will:
- Launch a Chrome instance
- Set up command socket
- Load script injection system
- Initialize state management

### 2. Send Commands
In a new terminal, use the Glyde CLI to send commands:

```bash
# CRITICAL: Only the resolved value will be returned
# CORRECT: Resolve the value you want to see
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => { 
    const message = "Hello World";
    resolve({ message, timestamp: Date.now() }); 
})'

# WRONG: Console.log will not be visible
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => { 
    console.log("This will not be visible");
    resolve("Only this is returned"); 
})'
```

### 3. Understanding Scripts
Scripts are automatically injected based on the current URL. Check available scripts:

```bash
cat scripts.manifest.json
```

Common scripts:
- `chatgpt-prompt-inject.js`: ChatGPT interaction
- `hustle-prompt-inject.js`: Hustle AI interaction
- `click-monitor.js`: Click tracking

### 4. Command Patterns

#### Always Use Promises and Resolve Values
```bash
# CORRECT: Resolve all data you need
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    const data = { status: "success", value: 42 };
    resolve(data);  // This is what you'll see
})'

# WRONG: Don't use console.log
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    console.log("This is lost");
    resolve("success");
})'
```

#### Handling Quotes
1. Use single quotes for outer command
2. Use double quotes for inner strings
3. Escape single quotes inside command if needed

## Common Issues

1. **Quote Problems**
   - Solution: Follow quote pattern above
   - Use single quotes outside, double inside

2. **Command Timeout**
   - Cause: Long-running operations
   - Solution: Increase timeout or use background jobs

3. **Script Not Loading**
   - Check scripts.manifest.json
   - Verify URL patterns match
   - Check browser console for errors

4. **Lost Output**
   - NEVER use console.log() - it won't be visible
   - Always resolve() the data you want to see
   - Include all relevant data in the resolved object

## Next Steps

1. Learn about [Scripts](scripts.md)
2. Try [Examples](examples.md) 