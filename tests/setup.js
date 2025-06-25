// Global test setup for Jest
const fs = require('fs');
const path = require('path');

// Clean up any test files that might exist from previous runs
beforeAll(() => {
  const testFiles = [
    path.join(__dirname, 'test-data.json'),
    path.join(__dirname, 'persistence-test-data.json'),
    path.join(__dirname, 'test-static.txt')
  ];

  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
});

// Clean up test files after all tests complete
afterAll(() => {
  const testFiles = [
    path.join(__dirname, 'test-data.json'),
    path.join(__dirname, 'persistence-test-data.json'),
    path.join(__dirname, 'test-static.txt')
  ];

  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
});

// Suppress console.error during tests to avoid noise
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});