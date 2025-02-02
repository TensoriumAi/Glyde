# Glyde 🚀

> Seamless browser automation for the modern web

A powerful Node.js-based browser control system that provides fine-grained automation capabilities. Glyde makes it easy to control Chrome browser sessions with precision and reliability.

<div align="center">

[![Made for Automation](https://img.shields.io/badge/Made_for-Automation-2ea44f?style=for-the-badge)](https://github.com)
[![Powered by Node.js](https://img.shields.io/badge/Powered_by-Node.js-43853d?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Chrome Control](https://img.shields.io/badge/Chrome-Control-4285f4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://www.google.com/chrome/)

</div>

## Why Glyde? ✨

- 🎯 **Precise Control**: Fine-grained control over browser sessions
- 🔄 **Real-Time**: Instant feedback and command execution
- 🎨 **Visual Feedback**: Built-in labeling and debugging tools
- 🔌 **Extensible**: Powerful script injection system
- 🛠 **Developer-First**: Built for developers, by developers

## Features ✨

### 🎯 Core Capabilities
- **Session Management**: Run multiple isolated browser sessions simultaneously
- **Command-Line Interface**: Control browsers through an intuitive CLI
- **Real-Time Interaction**: Send commands and get instant feedback
- **Event Simulation**: Accurately simulate user interactions (clicks, typing, key combinations)
- **Flexible Selectors**: Target elements using CSS selectors or XPath
- **Visual Feedback**: Add visual labels to elements for debugging

### 🔌 Script Injection System
Automatically inject JavaScript into web pages based on URL patterns. Our powerful inject scripts enhance AI interfaces with advanced automation capabilities:

#### ChatGPT Inject Script
Supercharge your ChatGPT interactions with:
- **Smart Message Handling**: Reliable message sending with automatic retry
- **Response Tracking**: Accurately capture AI responses including code blocks
- **Visual Feedback**: Color-coded console logging for easy debugging
- **Error Recovery**: Robust error handling and detailed error messages
- **Markdown Support**: Properly handles formatted text and code blocks
- **Event Simulation**: Natural typing and click event simulation
- **State Management**: Tracks conversation state and message count

#### Hustle AI Inject Script
Enhance Hustle AI interface with:
- **Automated Messaging**: Reliable message sending and response capture
- **Response Monitoring**: Intelligent polling for new messages
- **Timeout Handling**: Configurable timeouts with clear error messages
- **Visual Feedback**: Color-coded console logging for debugging
- **State Tracking**: Monitors message count and conversation state
- **Error Recovery**: Graceful error handling with detailed feedback
- **Framework Integration**: Works seamlessly with the UI framework

Both scripts feature:
- 🎯 Intuitive `chat()` function for sending messages
- 📝 Detailed logging with color-coded output
- ⚡ Async/await support for easy integration
- 🔄 Automatic retries for reliability
- 🚨 Comprehensive error handling
- 🎨 Beautiful console formatting

### 🛠 Advanced Features
- **Visual Labeling**: Add temporary or permanent labels to any element
- **Event Monitoring**: Track clicks, inputs, and state changes
- **Network Monitoring**: Watch XHR requests and responses
- **Framework Support**: Works with modern JavaScript frameworks
- **Error Handling**: Robust error detection and reporting

## Quick Start 🚀

1. Start the browser controller:
```bash
SESSION_NAME=demo ./index.js
```

2. Send commands using CLI:
```bash
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => {
    // Note: Only the resolved value will be visible in the response
    resolve("Command executed successfully");
});'
```

## Common Use Cases 💡

1. **Web Automation**
   - Form filling
   - Button clicking
   - Navigation
   - State management

2. **Testing**
   - UI interaction testing
   - Event simulation
   - Visual verification
   - State validation

3. **Development**
   - Rapid prototyping
   - Debugging
   - Feature testing
   - Performance monitoring

4. **AI Interface Enhancement**
   - ChatGPT automation
   - Hustle AI integration
   - Custom AI workflows
   - Response processing

## Documentation 📚

- [GUIDE.md](GUIDE.md) - Getting started and basic usage
- [ADVANCED.md](ADVANCED.md) - Advanced features and patterns
- [monitors.md](monitors.md) - Monitoring capabilities

## Project Structure 📁

```
_tools/
├── cli.js              # Command-line interface
├── index.js            # Browser controller
├── script-injector.js  # Script injection system
├── scripts/           # Inject scripts
│   ├── chatgpt-prompt-inject.js
│   ├── click-monitor.js
│   └── hustle-prompt-inject.js
└── scripts.manifest.json # Script configuration
```

## Development 🔧

1. Install dependencies:
```bash
npm install
```

2. Start in debug mode:
```bash
DEBUG=* SESSION_NAME=dev ./index.js
```

## Best Practices 🎯

1. **Session Management**
   - Use descriptive session names
   - One session per task
   - Clean up old sessions

2. **Script Injection**
   - Follow naming conventions
   - Document script capabilities
   - Handle errors gracefully

3. **Performance**
   - Use efficient selectors
   - Clean up observers
   - Limit concurrent operations

## Security 🔒

- Never expose sensitive data
- Use environment variables for secrets
- Review injected scripts carefully
- Follow web scraping best practices

## Author 👩‍💻

**Shannon Code**

- 🌐 [GitHub](https://github.com/shannoncode)

## License 📄

Glyde is MIT licensed. See the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Shannon Code

## Contributing 🤝

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.
