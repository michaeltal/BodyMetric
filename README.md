**Everything you see here - except for this line - has been created 100% by various AI tools as a toy project for me to experiment with Codex / Claude Code / GEMINI CLI... judge the code / project history accordingly ;)**

# Body Composition Tracker

This project is a web application for tracking body composition metrics such as weight, body fat percentage, and lean muscle mass. Built with a modular service-oriented architecture, data is stored on a Node.js server and accessible from multiple browsers.

## Features

- Add, edit, and remove body measurements
- Prevent duplicate entries by disabling the form when a selected date already has data
- Visualize progress with charts powered by Chart.js
- Track goals for weight, body fat percentage, and lean muscle mass
- Calculates BMI when a height is provided
- Existing goal values and height are preloaded when available
- Node.js backend with reliable data persistence and error handling
- Modular service architecture with comprehensive test coverage (113 tests)
- View 7‑day rolling averages with trends compared to the prior week

## Getting Started

**Note: The Node.js server is required for the application to function.**

### Start the Server

```bash
npm install
node server.js
```

With the server running, open `index.html` in your web browser at `http://localhost:3000`. All data will be stored in `data.json` on the server and shared across browsers.

#### Custom Port

To run the server on a different port, use the `PORT` environment variable:

```bash
# Run on port 8080
PORT=8080 node server.js

# Or on Windows
set PORT=8080 && node server.js

# Then navigate to http://localhost:8080
```

### Development and Testing

```bash
# Run the test suite (113 tests)
npm test

# Run tests in watch mode during development  
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

For development you can also use a static file server, but the app requires the Node server for data persistence:

```bash
python3 -m http.server
# Then navigate to http://localhost:8000
```

## Folder Structure

- `index.html` – Main HTML page
- `style.css` – Styles for the application  
- `app.js` – Main application orchestrator
- `server.js` – Express server with data persistence
- `data.json` – Server-side data storage
- `js/` – Modular services directory
  - `js/services/DataManager.js` – Data persistence and validation
  - `js/services/CalculationService.js` – Mathematical operations and conversions
  - `js/services/NotificationService.js` – User notification system
  - `js/ModuleLoader.js` – Browser-compatible ES6 module loader
- `tests/` – Comprehensive test suite (113 tests)
  - `tests/services/` – Service unit tests
  - `tests/data-persistence.test.js` – Data integrity tests
  - `tests/server.test.js` – API endpoint tests
- `Refactor/` – Architecture documentation and refactoring notes

## Architecture

The application uses a **service-oriented architecture** with clear separation of concerns:

- **DataManager**: Handles all data persistence, CRUD operations, and server communication
- **CalculationService**: Provides BMI calculations, averages, trends, and unit conversions  
- **NotificationService**: Manages user feedback with success/error notifications
- **ModuleLoader**: Enables ES6 modules in browser without build tools

All services are thoroughly tested with **113 unit and integration tests** ensuring reliability and maintainability.

## License

This project is provided as-is without any specific license information.
