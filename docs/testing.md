# Testing Guide

The Glyde testing environment provides a comprehensive test page with various interactive elements to help you validate browser automation functionality.

## Getting Started

1. Start the test server:
```bash
python3 -m http.server 8000
```

2. Start a Glyde session:
```bash
SESSION_NAME=test ./index.js
```

3. Navigate to the test page:
```bash
SESSION_NAME=test ./cli.js eval 'new Promise(resolve => {
    window.location.href = "http://localhost:8000/test.html";
    resolve(window.location.href);
})'
```

## Available Test Sections

The test page includes multiple sections for testing different interactions:

- Click Testing (simple clicks, coordinates, double clicks)
- Type Command Testing
- Key Combination Testing
- Hover Testing
- Complex Interaction Testing
- Searchable Dropdown Testing
- Label Command Testing

Each section includes example commands you can copy and run to test the functionality.

## Example Tests

Here are some basic tests you can try:

```bash
# Test simple click
SESSION_NAME=test ./cli.js eval 'new Promise(resolve => {
    document.querySelector("#simple-click").click();
    resolve("clicked");
})'

# Test typing
SESSION_NAME=test ./cli.js eval 'new Promise(resolve => {
    const input = document.querySelector("#type-test");
    input.value = "Hello World";
    input.dispatchEvent(new Event("input"));
    resolve(input.value);
})'
```

For more examples, check the "Test Cases" section under each test area on the page. 