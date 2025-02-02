# Glyde Usage Examples

## Basic Operations

### Starting a Glyde Session
```bash
# Start with debug output
DEBUG=* SESSION_NAME=demo ./index.js

# Start without debug
SESSION_NAME=demo ./index.js
```

### Navigation
```bash
# Navigate to URL and get new location
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    window.location.href = "https://example.com";
    resolve({ 
        newLocation: window.location.href,
        timestamp: Date.now()
    });
})'
```

## Script-Specific Examples

### ChatGPT Interaction
```bash
# Send message and get response with metadata
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    window.chat("What is the capital of France?")
        .then(response => resolve({
            response,
            timestamp: Date.now(),
            messageLength: response.length
        }));
})'
```

### Hustle AI Interaction
```bash
# Send message and get full response data
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    window.chat("Tell me about your capabilities")
        .then(response => resolve({
            response,
            timestamp: Date.now(),
            length: response.length
        }));
})'
```

### Click Monitoring
```bash
# Monitor clicks for 5 seconds and get results
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    const clicks = [];
    document.addEventListener("click", e => {
        clicks.push({
            x: e.clientX,
            y: e.clientY,
            target: e.target.tagName,
            timestamp: Date.now()
        });
    });
    
    setTimeout(() => resolve({
        totalClicks: clicks.length,
        clicks
    }), 5000);
})'
```

## Advanced Patterns

### Error Handling
```bash
# Handle errors and return status
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    window.chat("test message")
        .then(response => resolve({
            success: true,
            response,
            timestamp: Date.now()
        }))
        .catch(error => resolve({
            success: false,
            error: error.message,
            timestamp: Date.now()
        }));
})'
```

### Long-Running Operations
```bash
# Process items and return progress
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    let processed = 0;
    const results = [];
    
    function processNext() {
        processed++;
        results.push({ item: processed, timestamp: Date.now() });
        
        if (processed < 10) {
            setTimeout(processNext, 1000);
        } else {
            resolve({
                processed,
                results,
                completed: Date.now()
            });
        }
    }
    
    processNext();
})'
```

### State Management
```bash
# Save state and return confirmation
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    const state = {
        lastMessage: "Hello",
        timestamp: Date.now()
    };
    localStorage.setItem("myState", JSON.stringify(state));
    resolve({
        action: "state_saved",
        state,
        timestamp: Date.now()
    });
})'

# Load state with full data
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    const state = JSON.parse(localStorage.getItem("myState") || "{}");
    resolve({
        action: "state_loaded",
        state,
        timestamp: Date.now()
    });
})'
```

## Common Issues and Solutions

### Quote Handling
```bash
# Handle quotes properly and return data
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    window.chat("Message with quotes: \"Hello World\"")
        .then(response => resolve({
            response,
            timestamp: Date.now()
        }));
})'
```

### Timeout Handling
```bash
# Add timeout and return appropriate status
SESSION_NAME=demo ./cli.js eval 'new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timeout = setTimeout(() => {
        resolve({
            success: false,
            error: "Operation timed out",
            duration: Date.now() - startTime
        });
    }, 30000);
    
    window.chat("message")
        .then(response => {
            clearTimeout(timeout);
            resolve({
                success: true,
                response,
                duration: Date.now() - startTime
            });
        })
        .catch(error => {
            clearTimeout(timeout);
            resolve({
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            });
        });
})'
```

### Operation Status
```bash
# Return comprehensive operation status
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    const startTime = Date.now();
    window.chat("test")
        .then(response => resolve({
            phase: "completed",
            success: true,
            response,
            duration: Date.now() - startTime
        }))
        .catch(error => resolve({
            phase: "failed",
            success: false,
            error: error.message,
            duration: Date.now() - startTime
        }));
})'
``` 