# Glyde

> Seamless browser automation for the modern web

I built this tool so agenthustle.ai could be used within cursor and windsurf to collaborate, and it's grown into a full browser automation developer tool to allow for natural language browser control.

<div align="center">

[![Made for AgentHustle](https://img.shields.io/badge/Made_for-AgentHustle-2ea44f?style=for-the-badge)](https://agenthustle.ai)
[![Powered by Node.js](https://img.shields.io/badge/Powered_by-Node.js-43853d?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Chrome Control](https://img.shields.io/badge/Chrome-Control-4285f4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://www.google.com/chrome/)

</div>

## Why Glyde? ✨

- 🎯 **Precise Control**: Fine-grained control over browser sessions
- 🔄 **Real-Time**: Instant feedback and command execution
- 🎨 **Visual Feedback**: Built-in labeling and debugging tools
- 🔌 **Extensible**: Powerful script injection system
- 🛠 **Developer-First**: Built for developers, by developers
- 🤖 **AI-Ready**: Seamless integration with AgentHustle and other AI platforms

<div align="center">
  <video autoplay loop muted playsinline style="width: 66%; border: 2px solid #30363d; border-radius: 6px;">
    <source src="glyde.mp4" type="video/mp4">
  </video>
</div>

## Quick Start

```bash
# Terminal 1: Start Glyde browser controller
SESSION_NAME=demo ./index.js

# Terminal 2: Send commands using eval (recommended)
SESSION_NAME=demo ./cli.js eval 'new Promise(resolve => { 
    window.location.href = "https://example.com";
    resolve(window.location.href);
})'
```

## Important Note on Commands

⚠️ Currently, only the `eval` command is fully stable. Other commands (`click`, `type`, `tags`) should be avoided.
Instead, use `eval` with native DOM methods for all browser interactions.


See [Testing Guide](docs/testing.md) for full testing environment details.

## Documentation Structure

1. [Getting Started](docs/getting-started.md)
   - Essential concepts
   - Basic setup
   - First commands

2. [Script System](docs/scripts.md)
   - Script injection
   - Available scripts
   - URL patterns

3. [Examples](docs/examples.md)
   - Common use cases
   - Script-specific examples
   - Error handling

4. [Testing](docs/testing.md)
   - Interactive testing setup
   - Using eval effectively
   - Common test patterns

## Core Concepts

1. **Sessions**
   - One browser instance per named session
   - State persistence across restarts
   - Isolated environments

2. **Commands**
   - Browser controller (index.js)
   - Command-line interface (cli.js)
   - Promise-based evaluation (eval)

3. **Scripts**
   - Automatic injection based on URLs
   - Custom commands per script
   - Event monitoring

## License

MIT © [Shannon Code](https://github.com/shannoncode)