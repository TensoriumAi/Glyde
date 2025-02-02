// This script will be read and injected directly into the page
(() => {
  // Initialize with clear logging
  console.log('%c[Hustle Prompt] Script loaded and initializing...', 'color: #2196F3; font-weight: bold;');
  
  // Document available commands
  console.log('%c[Hustle Prompt] Available commands:', 'color: #2196F3; font-weight: bold;');
  console.log('%c  chat(message) - Send a chat message and wait for response', 'color: #2196F3');
  console.log('%c  Example: await chat("Hello, how are you?")', 'color: #2196F3');
  console.log('%c  Returns: Promise<string> with the AI response', 'color: #2196F3');
  
  // Add a more intuitive chat function with error handling
  window.chat = async function(message) {
    if (!message || typeof message !== 'string') {
      const error = 'Invalid message format. Message must be a non-empty string.';
      console.error('%c[Hustle Prompt] Error: ' + error, 'color: #f44336');
      throw new Error(error);
    }

    console.log('%c[Hustle Prompt] Sending chat message...', 'color: #2196F3');
    try {
      const response = await window.sendMessageAndReturnResponse(message);
      console.log('%c[Hustle Prompt] Received response', 'color: #4CAF50');
      return response;
    } catch (error) {
      console.error('%c[Hustle Prompt] Error: ' + error.message, 'color: #f44336');
      throw error;
    }
  };
  
  // Legacy function with improved error handling
  window.sendMessageAndReturnResponse = async function(message) {
    if (!window.sendMessage) {
      const error = 'sendMessage function not found. Are you on the correct page?';
      console.error('%c[Hustle Prompt] Error: ' + error, 'color: #f44336');
      throw new Error(error);
    }

    console.log('%c[Hustle Prompt] Processing message...', 'color: #2196F3');
    return new Promise((resolve, reject) => {
      try {
        // Initial message count to track new messages
        const initialMessages = document.querySelectorAll('.rounded-2xl.bg-gray-800.text-gray-100').length;
        console.log('%c[Hustle Prompt] Current message count: ' + initialMessages, 'color: #2196F3');
        
        // Send the message
        window.sendMessage(message).catch(error => {
          console.error('%c[Hustle Prompt] Failed to send message: ' + error.message, 'color: #f44336');
          reject(error);
        });
        
        // Poll for new response
        const startTime = Date.now();
        const timeout = 30000; // 30 second timeout
        const interval = setInterval(() => {
          const messages = Array.from(document.querySelectorAll('.rounded-2xl.bg-gray-800.text-gray-100'));
          if (messages.length > initialMessages) {
            clearInterval(interval);
            const response = messages[messages.length - 1].textContent;
            console.log('%c[Hustle Prompt] Response received', 'color: #4CAF50');
            resolve(response);
          } else if (Date.now() - startTime > timeout) {
            clearInterval(interval);
            const error = 'Timeout waiting for response after 30 seconds';
            console.error('%c[Hustle Prompt] Error: ' + error, 'color: #f44336');
            reject(new Error(error));
          }
        }, 100);
      } catch (error) {
        console.error('%c[Hustle Prompt] Unexpected error: ' + error.message, 'color: #f44336');
        reject(error);
      }
    });
  };

  console.log('%c[Hustle Prompt] Initialization complete ✓', 'color: #4CAF50; font-weight: bold;');
})();
