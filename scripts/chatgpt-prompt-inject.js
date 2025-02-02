// This script will be read and injected directly into the page
(() => {
  // Initialize with clear logging
  console.log('%c[ChatGPT Prompt] Script loaded and initializing...', 'color: #2196F3; font-weight: bold;');
  
  // Document available commands
  console.log('%c[ChatGPT Prompt] Available commands:', 'color: #2196F3; font-weight: bold;');
  console.log('%c  chat(message) - Send a chat message and wait for response', 'color: #2196F3');
  console.log('%c  Example: await chat("Hello, how are you?")', 'color: #2196F3');
  console.log('%c  Returns: Promise<string> with the AI response', 'color: #2196F3');
  
  // Add a more intuitive chat function with error handling
  window.chat = async function(message) {
    if (!message || typeof message !== 'string') {
      const error = 'Invalid message format. Message must be a non-empty string.';
      console.error('%c[ChatGPT Prompt] Error: ' + error, 'color: #f44336');
      throw new Error(error);
    }

    console.log('%c[ChatGPT Prompt] Sending chat message...', 'color: #2196F3');
    try {
      const response = await window.sendMessageAndReturnResponse(message);
      console.log('%c[ChatGPT Prompt] Received response', 'color: #4CAF50');
      return response;
    } catch (error) {
      console.error('%c[ChatGPT Prompt] Error: ' + error.message, 'color: #f44336');
      throw error;
    }
  };
  
  // Main message sending function with response handling
  window.sendMessageAndReturnResponse = async function(message) {
    return new Promise((resolve, reject) => {
      try {
        console.log('%c[ChatGPT Prompt] Processing message...', 'color: #2196F3');
        
        // Get the editor
        const editor = document.querySelector('#prompt-textarea');
        if (!editor) {
          const error = 'Editor not found. Are you on the correct page?';
          console.error('%c[ChatGPT Prompt] Error: ' + error, 'color: #f44336');
          throw new Error(error);
        }

        // Initial message count to track new messages
        const initialMessages = document.querySelectorAll('[data-message-author-role]').length;
        console.log('%c[ChatGPT Prompt] Current message count: ' + initialMessages, 'color: #2196F3');
        
        // Focus and click the editor
        editor.focus();
        editor.click();
        
        // Set the message text
        editor.value = message;
        editor.textContent = message;
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('%c[ChatGPT Prompt] Message text set', 'color: #2196F3');
        
        // Wait a bit for the SVG to become available
        setTimeout(() => {
          // Find and click the SVG icon
          const svg = document.querySelector('svg.icon-2xl');
          if (!svg) {
            const error = 'SVG icon not found';
            console.error('%c[ChatGPT Prompt] Error: ' + error, 'color: #f44336');
            reject(new Error(error));
            return;
          }
          
          console.log('%c[ChatGPT Prompt] Found SVG icon, clicking...', 'color: #2196F3');
          
          // Create and dispatch a proper click event
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          svg.dispatchEvent(clickEvent);

          // Wait for and process the response
          const checkResponse = () => {
            try {
              const messages = document.querySelectorAll('[data-message-author-role]');
              const newMessageCount = messages.length;
              
              if (newMessageCount > initialMessages) {
                const lastMessage = messages[messages.length - 1];
                const article = lastMessage.closest("article[data-testid^=\"conversation-turn\"]");
                if (article && article.querySelectorAll("[data-testid$=\"-turn-action-button\"]").length > 0) {
                    // Give the UI time to fully update
                    setTimeout(() => {
                        const markdownDiv = lastMessage.querySelector('.markdown');
                        if (!markdownDiv) {
                          const error = 'Markdown content not found';
                          console.error('%c[ChatGPT Prompt] Error: ' + error, 'color: #f44336');
                          reject(new Error(error));
                          return;
                        }
                        
                        // Get all text content, including code blocks
                        const text = Array.from(markdownDiv.querySelectorAll('p, pre code'))
                          .map(el => {
                            // For code blocks, get the raw text content
                            if (el.tagName.toLowerCase() === 'code') {
                              return '```\n' + el.textContent + '\n```';
                            }
                            // For paragraphs, just get the text
                            return el.textContent;
                          })
                          .join('\n\n');
                        
                        if (!text.trim()) {
                          const error = 'No text content found';
                          console.error('%c[ChatGPT Prompt] Error: ' + error, 'color: #f44336');
                          reject(new Error(error));
                          return;
                        }
                        
                        console.log('%c[ChatGPT Prompt] Response received', 'color: #4CAF50');
                        resolve(text);
                    }, 2000);
                } else {
                  // Keep checking if we haven't found the assistant's response yet
                  setTimeout(checkResponse, 1000);
                }
              } else {
                // Keep checking if no new messages yet
                setTimeout(checkResponse, 1000);
              }
            } catch (error) {
              console.error('%c[ChatGPT Prompt] Error getting response: ' + error.message, 'color: #f44336');
              reject(error);
            }
          };

          // Start checking for response
          setTimeout(checkResponse, 1000);
        }, 500); // Wait 500ms for SVG to be available
      } catch (error) {
        console.error('%c[ChatGPT Prompt] Unexpected error: ' + error.message, 'color: #f44336');
        reject(error);
      }
    });
  };

  console.log('%c[ChatGPT Prompt] Initialization complete ✓', 'color: #4CAF50; font-weight: bold;');
})();
