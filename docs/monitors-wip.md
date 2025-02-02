# Browser Monitoring Tools

A collection of battle-tested browser monitoring tools for intercepting, observing, and analyzing various browser events and data streams.

## Network Monitors

### 1. Enhanced Fetch Monitor
Intercepts and logs all fetch requests with response content inspection.

```javascript
new Promise(resolve => {
    const origFetch = window.fetch;
    
    window.fetch = async (...args) => {
        const start = performance.now();
        console.log(`[${new Date().toISOString()}] Fetch request:`, args[0]);
        
        try {
            const response = await origFetch.apply(window, args);
            const duration = performance.now() - start;
            
            // Clone response for reading
            const clone = response.clone();
            
            // Parse based on content-type
            const contentType = response.headers.get("content-type");
            if (contentType?.includes("application/json")) {
                clone.json().then(data => {
                    console.log(`[${new Date().toISOString()}] JSON Response (${duration}ms):`, {
                        url: args[0],
                        status: response.status,
                        data: data
                    });
                }).catch(err => console.error("Error parsing JSON:", err));
            } else if (contentType?.includes("text")) {
                clone.text().then(text => {
                    console.log(`[${new Date().toISOString()}] Text Response (${duration}ms):`, {
                        url: args[0],
                        status: response.status,
                        text: text.substring(0, 500) + (text.length > 500 ? "..." : "")
                    });
                }).catch(err => console.error("Error parsing text:", err));
            } else {
                console.log(`[${new Date().toISOString()}] Response (${duration}ms):`, {
                    url: args[0],
                    status: response.status,
                    type: contentType
                });
            }
            
            return response;
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Fetch error:`, error);
            throw error;
        }
    };
    
    resolve({ message: "Enhanced fetch monitoring initialized" });
});
```

### 2. XHR Monitor
Captures traditional XMLHttpRequest traffic.

```javascript
new Promise(resolve => {
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        
        xhr.open = function(...args) {
            const [method, url] = args;
            console.log(`XHR ${method} request to: ${url}`);
            
            xhr.addEventListener("load", () => {
                console.log(`XHR Response from ${url}:`, xhr.status);
            });
            
            xhr.addEventListener("error", (error) => {
                console.error(`XHR Error from ${url}:`, error);
            });
            
            return originalOpen.apply(xhr, args);
        };
        
        return xhr;
    };
    
    resolve({ message: "XHR monitoring initialized" });
});
```

### 3. Performance Resource Monitor
Tracks all resource loads with detailed timing information.

```javascript
new Promise(resolve => {
    const requests = [];
    
    const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
            if (entry.entryType === "resource") {
                console.log(`Resource: ${entry.name}\nDuration: ${entry.duration}ms\nType: ${entry.initiatorType}`);
                requests.push({
                    url: entry.name,
                    duration: entry.duration,
                    type: entry.initiatorType,
                    timestamp: entry.startTime
                });
            }
        });
    });
    
    observer.observe({ entryTypes: ["resource", "navigation"] });
    resolve({ message: "Performance monitoring initialized" });
});
```

### 4. WebSocket Monitor
Monitors WebSocket connections and messages.

```javascript
new Promise(resolve => {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(...args) {
        const ws = new originalWebSocket(...args);
        const url = args[0];
        
        console.log(`[${new Date().toISOString()}] WebSocket connecting to:`, url);
        
        // Track connection state
        ws.addEventListener('open', () => {
            console.log(`[${new Date().toISOString()}] WebSocket connected:`, url);
        });
        
        ws.addEventListener('close', (event) => {
            console.log(`[${new Date().toISOString()}] WebSocket closed:`, {
                url,
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean
            });
        });
        
        ws.addEventListener('error', (error) => {
            console.error(`[${new Date().toISOString()}] WebSocket error:`, {
                url,
                error
            });
        });
        
        // Intercept messages
        const originalSend = ws.send;
        ws.send = function(data) {
            console.log(`[${new Date().toISOString()}] WebSocket sending:`, {
                url,
                data: typeof data === 'string' ? data : '(Binary data)'
            });
            return originalSend.apply(ws, arguments);
        };
        
        ws.addEventListener('message', (event) => {
            console.log(`[${new Date().toISOString()}] WebSocket received:`, {
                url,
                data: typeof event.data === 'string' ? event.data : '(Binary data)'
            });
        });
        
        return ws;
    };
    
    resolve({ message: "WebSocket monitoring initialized" });
});
```

## DOM Monitors

### 1. DOM Mutation Observer
Tracks changes to the DOM structure.

```javascript
new Promise(resolve => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            console.log(`[${new Date().toISOString()}] DOM Mutation:`, {
                type: mutation.type,
                target: mutation.target.nodeName,
                addedNodes: mutation.addedNodes.length,
                removedNodes: mutation.removedNodes.length
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    });
    
    resolve({ message: "DOM mutation monitoring initialized" });
});
```

## Data Collection Strategies

### 1. In-Memory Collection
Store monitored data in memory for immediate analysis:

```javascript
new Promise(resolve => {
    // Create collectors for different types of data
    const collectors = {
        network: [],
        websocket: [],
        dom: [],
        state: []
    };
    
    // Example network collector
    const origFetch = window.fetch;
    window.fetch = async (...args) => {
        const startTime = performance.now();
        const request = {
            url: args[0],
            options: args[1],
            timestamp: new Date().toISOString()
        };
        
        try {
            const response = await origFetch.apply(window, args);
            const duration = performance.now() - startTime;
            
            collectors.network.push({
                request,
                response: {
                    status: response.status,
                    duration
                },
                timestamp: new Date().toISOString()
            });
            
            return response;
        } catch (error) {
            collectors.network.push({
                request,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    };
    
    // Query interface
    window.queryMonitors = {
        // Get all network requests in the last N minutes
        getRecentNetwork: (minutes = 5) => {
            const cutoff = new Date(Date.now() - minutes * 60000);
            return collectors.network.filter(entry => 
                new Date(entry.timestamp) > cutoff
            );
        },
        
        // Get requests by URL pattern
        getRequestsByUrl: (pattern) => {
            const regex = new RegExp(pattern);
            return collectors.network.filter(entry =>
                regex.test(entry.request.url)
            );
        },
        
        // Get all collectors
        getAllCollectors: () => collectors,
        
        // Clear collectors
        clearCollectors: () => {
            Object.keys(collectors).forEach(key => {
                collectors[key] = [];
            });
        }
    };
    
    resolve({ message: "Data collection system initialized" });
});
```

### 2. Storage-Based Collection
Persist monitored data to localStorage for longer-term analysis:

```javascript
new Promise(resolve => {
    const STORAGE_KEYS = {
        network: 'monitor_network',
        websocket: 'monitor_websocket',
        dom: 'monitor_dom',
        state: 'monitor_state'
    };
    
    const storage = {
        save: (key, data) => {
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push({
                ...data,
                timestamp: new Date().toISOString()
            });
            // Keep last 1000 entries
            if (existing.length > 1000) {
                existing.shift();
            }
            localStorage.setItem(key, JSON.stringify(existing));
        },
        
        query: (key, filter) => {
            const data = JSON.parse(localStorage.getItem(key) || '[]');
            return filter ? data.filter(filter) : data;
        },
        
        clear: (key) => {
            localStorage.removeItem(key);
        }
    };
    
    // Example WebSocket collector with storage
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(...args) {
        const ws = new originalWebSocket(...args);
        
        ws.addEventListener('message', (event) => {
            storage.save(STORAGE_KEYS.websocket, {
                type: 'receive',
                url: args[0],
                data: event.data
            });
        });
        
        const originalSend = ws.send;
        ws.send = function(data) {
            storage.save(STORAGE_KEYS.websocket, {
                type: 'send',
                url: args[0],
                data: data
            });
            return originalSend.apply(ws, arguments);
        };
        
        return ws;
    };
    
    // Query interface
    window.queryStorage = {
        // Get recent WebSocket messages
        getRecentMessages: (minutes = 5) => {
            const cutoff = new Date(Date.now() - minutes * 60000);
            return storage.query(STORAGE_KEYS.websocket, 
                entry => new Date(entry.timestamp) > cutoff
            );
        },
        
        // Get messages by type
        getMessagesByType: (type) => {
            return storage.query(STORAGE_KEYS.websocket,
                entry => entry.type === type
            );
        },
        
        // Clear all stored data
        clearAll: () => {
            Object.values(STORAGE_KEYS).forEach(key => {
                storage.clear(key);
            });
        }
    };
    
    resolve({ message: "Storage-based collection initialized" });
});
```

## Querying Monitor Data

### IMPORTANT: Always Use Promise Pattern
When querying monitor data using `cli.js eval`, you MUST wrap the command in a Promise with resolve to see console.log output:

```javascript
// ✅ CORRECT - Will show console.log output
./cli.js eval 'new Promise(resolve => {
    const clicks = window.__clickMonitor?.getClicks();
    console.log("Collected clicks:", JSON.stringify(clicks, null, 2));
    resolve(clicks);
});'

// ❌ WRONG - console.log output will be lost
./cli.js eval 'console.log(window.__clickMonitor?.getClicks());'

// Example: Checking monitor status
./cli.js eval 'new Promise(resolve => {
    console.log("Monitors installed:", {
        clicks: !!window.__clickMonitor,
        network: !!window.__networkMonitor,
        websocket: !!window.__wsMonitor
    });
    resolve(true);
});'

// Example: Getting recent events with timeout
./cli.js eval 'new Promise(resolve => {
    setTimeout(() => {
        const events = window.__networkMonitor?.getEvents();
        console.log("Recent events:", JSON.stringify(events, null, 2));
        resolve(events);
    }, 1000);
});'
```

## Monitor Types and Usage

### Active Monitors
These require explicit querying to access data:

1. **In-Memory Collectors**
   ```javascript
   // Get recent network requests
   const recentRequests = window.queryMonitors.getRecentNetwork(10); // Last 10 minutes
   
   // Find requests matching a pattern
   const apiCalls = window.queryMonitors.getRequestsByUrl('/api/');
   ```

2. **Storage-Based Collectors**
   ```javascript
   // Get recent WebSocket messages
   const messages = window.queryStorage.getRecentMessages(5); // Last 5 minutes
   
   // Get all sent messages
   const sentMessages = window.queryStorage.getMessagesByType('send');
   ```

### Passive Monitors
These automatically log to the console:

1. **Console Loggers**
   - Network requests/responses
   - WebSocket messages
   - DOM mutations
   - State changes

### Hybrid Monitors
Combine both approaches:

```javascript
new Promise(resolve => {
    const monitor = {
        // Passive logging
        log: (type, data) => {
            console.log(`[${new Date().toISOString()}] ${type}:`, data);
        },
        
        // Active collection
        collect: (type, data) => {
            window.queryMonitors.getAllCollectors()[type].push({
                ...data,
                timestamp: new Date().toISOString()
            });
        },
        
        // Storage
        store: (type, data) => {
            window.queryStorage.store(type, data);
        }
    };
    
    // Example usage in a DOM observer
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            const data = {
                type: mutation.type,
                target: mutation.target.nodeName,
                changes: {
                    added: mutation.addedNodes.length,
                    removed: mutation.removedNodes.length
                }
            };
            
            // Passive logging
            monitor.log('DOM', data);
            
            // Active collection
            monitor.collect('dom', data);
            
            // Storage
            monitor.store('dom', data);
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    resolve({ message: "Hybrid monitoring initialized" });
});
```

## Best Practices

1. **Memory Management**
   - Implement circular buffers for in-memory collection
   - Regularly clear old data
   - Set maximum entry limits

2. **Storage Management**
   - Use chunked storage for large datasets
   - Implement data rotation
   - Set appropriate data retention policies

3. **Query Optimization**
   - Index frequently queried fields
   - Implement query result caching
   - Use efficient filter functions

4. **Performance Considerations**
   - Batch updates to reduce overhead
   - Use throttling for high-frequency events
   - Implement selective monitoring based on needs

## Usage Tips

1. **Initialization**: Run these monitors early in the page lifecycle to catch all events.
2. **Cleanup**: Store original references if you need to restore original behavior.
3. **Filtering**: Add conditions to reduce noise in busy applications.
4. **Performance**: Be cautious with response logging on high-traffic pages.

## Common Patterns

### Filtering by URL Pattern
```javascript
if (url.includes('/api/') || url.match(/your-pattern/)) {
    // Log or process the request
}
```

### Tracking Request Timing
```javascript
const start = performance.now();
// ... make request ...
const duration = performance.now() - start;
```

### Handling Binary Data
```javascript
if (response.headers.get('content-type').includes('application/octet-stream')) {
    // Handle binary data differently
    console.log('Binary response received');
}
```

## Investigation Tools

### Request Analysis
```javascript
// Group requests by type
const requestsByType = requests.reduce((acc, req) => {
    acc[req.type] = acc[req.type] || [];
    acc[req.type].push(req);
    return acc;
}, {});

// Find slow requests
const slowRequests = requests.filter(req => req.duration > 1000);

// Track request patterns
const urlPatterns = requests.map(req => new URL(req.url).pathname);
```

### Response Analysis
```javascript
// Track status codes
const statusCodes = {};
requests.forEach(req => {
    statusCodes[req.status] = (statusCodes[req.status] || 0) + 1;
});

// Analyze response sizes
const responseSizes = responses.map(res => ({
    url: res.url,
    size: new Blob([res.data]).size
}));

```

## Monitor Detection and Persistence

### Detecting Installed Monitors

To check which monitors are currently installed, use this detection script:

```javascript
function detectInstalledMonitors() {
    const monitors = {
        inMemory: false,
        storage: false,
        websocket: false,
        dom: false,
        fetch: false,
        react: false,
        vue: false
    };
    
    // Check in-memory monitor system
    monitors.inMemory = !!(window.monitor && window.monitor.collectors);
    
    // Check storage-based monitor
    monitors.storage = !!(window.queryStorage);
    
    // Check WebSocket monitor
    monitors.websocket = !!(
        window.WebSocket.toString().includes('monitor') || 
        window.WebSocket.prototype.hasOwnProperty('__monitorInstalled')
    );
    
    // Check DOM observer
    monitors.dom = !!(window.__domObserver);
    
    // Check fetch monitor
    monitors.fetch = !!(window.fetch.toString().includes('monitor'));
    
    // Check React DevTools hook
    monitors.react = !!(
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && 
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.toString().includes('monitor')
    );
    
    // Check Vue DevTools hook
    monitors.vue = !!(
        window.__VUE_DEVTOOLS_GLOBAL_HOOK__ && 
        window.__VUE_DEVTOOLS_GLOBAL_HOOK__.toString().includes('monitor')
    );
    
    return monitors;
}
```

### Monitor Persistence

1. **Page Reload Persistence**:
   - In-Memory Monitors: ❌ Do not survive page reloads
   - Storage-Based Monitors: ✓ Data persists across reloads
   - DOM Observers: ❌ Must be reinstalled after reload
   - Network Monitors: ❌ Must be reinstalled after reload

2. **Cross-Page Persistence**:
   - In-Memory Monitors: ❌ Unique to each page
   - Storage-Based Monitors: ✓ Data shared across same-origin pages
   - DOM Observers: ❌ Page-specific
   - Network Monitors: ❌ Page-specific

### Installation Methods

1. **Content Script Installation**
   ```javascript
   // Installed via Chrome extension content script
   // Persists across page loads until extension is disabled
   chrome.runtime.onInstalled.addListener(() => {
       chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
           if (changeInfo.status === 'complete') {
               chrome.scripting.executeScript({
                   target: { tabId },
                   function: installMonitors
               });
           }
       });
   });
   ```

2. **Browser DevTools Installation**
   ```javascript
   // Installed via DevTools console
   // Must be reinstalled after page reload
   function installMonitors() {
       // Monitor installation code here
   }
   ```

3. **Bookmarklet Installation**
   ```javascript
   // Can be installed via bookmarklet
   // Must be manually triggered on each page
   javascript:(function(){
       // Monitor installation code here
   })();
   ```

### Querying Monitor Status

1. **Check Installation Status**:
   ```javascript
   // Get current monitor status
   const status = detectInstalledMonitors();
   console.log('Installed Monitors:', status);
   ```

2. **Query In-Memory Data**:
   ```javascript
   // Only works if in-memory monitor is installed
   if (window.monitor) {
       const networkData = window.monitor.query('network');
       const domData = window.monitor.query('dom');
       console.log('Network Data:', networkData);
       console.log('DOM Data:', domData);
   }
   ```

3. **Query Stored Data**:
   ```javascript
   // Works across page reloads if storage monitor is installed
   if (window.queryStorage) {
       const recentMessages = window.queryStorage.getRecentMessages(5);
       console.log('Recent Messages:', recentMessages);
   }
   ```

### Best Practices for Monitor Management

1. **Installation**:
   - Install monitors as early as possible in the page lifecycle
   - Use content scripts for persistent monitoring
   - Implement auto-reinstallation after page reloads

2. **Data Management**:
   - Regularly clean up in-memory data
   - Implement storage rotation for persistent data
   - Set appropriate data retention policies

3. **Performance**:
   - Use selective monitoring when possible
   - Implement throttling for high-frequency events
   - Clean up observers when they're no longer needed

4. **Cross-Origin Considerations**:
   - Storage only works within same origin
   - Network monitoring respects CORS policies
   - WebSocket monitoring works across origins

### Example: Comprehensive Monitor Check

```javascript
function checkMonitoringSystem() {
    // 1. Detect installed monitors
    const installed = detectInstalledMonitors();
    console.log('Installed Monitors:', installed);
    
    // 2. Check in-memory data
    if (window.monitor) {
        Object.keys(window.monitor.collectors).forEach(type => {
            const count = window.monitor.collectors[type].length;
            console.log(`${type} collector: ${count} entries`);
        });
    }
    
    // 3. Check stored data
    if (window.queryStorage) {
        const storageKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('monitor_'));
        storageKeys.forEach(key => {
            const data = JSON.parse(localStorage.getItem(key) || '[]');
            console.log(`${key}: ${data.length} entries`);
        });
    }
    
    // 4. Check monitor settings
    if (window.__domObserver) {
        console.log('DOM Observer Settings:', {
            childList: true,
            subtree: true,
            attributes: true
        });
    }
}
