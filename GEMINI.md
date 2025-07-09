# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

BodyMetric is a single-page web application for tracking body composition metrics (weight, body fat percentage, lean muscle mass). The app uses a server-only architecture with reliable data persistence through a Node.js Express server.

## Development Setup

```bash
# Install dependencies
npm install

# Start the server (recommended for multi-browser access)
node server.js
```

The app runs on `http://localhost:3000` with the Node server.

## Architecture

- **Service-oriented design**: Modular architecture with clear separation of concerns.
- **Server-only data persistence**: All data stored in `data.json` on the Express server.
- **Core Services**: DataManager, CalculationService, NotificationService.
- **Module Loading**: Browser-compatible ES6 module system via `ModuleLoader.js`.
- **Visualization**: Chart.js for time-series data visualization.
- **Comprehensive Testing**: Unit and integration tests ensuring reliability.

## Key Files

### Core Application
- `app.js`: Main application orchestrator with `BodyCompositionTracker` class.
- `server.js`: Express server with data persistence and a write queue.
- `index.html`: Single-page application entry point.
- `style.css`: Comprehensive CSS with a design system using CSS variables.
- `data.json`: Server-side JSON data storage.

### Modular Services
- `js/services/DataManager.js`: Handles data persistence, CRUD operations, and server communication.
- `js/services/CalculationService.js`: Performs BMI calculations, averages, trends, and unit conversions.
- `js/services/NotificationService.js`: Manages user feedback and error notifications.
- `js/ModuleLoader.js`: A custom module loader for browser-compatible ES6 modules.

### Documentation & Testing
- `tests/services/`: Contains unit tests for the services.
- `tests/server.test.js`: API endpoint integration tests.
- `tests/data-persistence.test.js`: Tests for file system and data integrity.
- `tests/concurrency.test.js`: Concurrent request handling tests.
- `AGENTS.md`: General development workflow guidelines.
- `CLAUDE.md`: Specific guidelines for the Claude AI.

## Code Style

- **Indentation**: 2 spaces for JavaScript, CSS, and HTML.
- **Dependencies**: Minimal dependencies. Express and body-parser for the server; Jest and Supertest for testing.

## Testing and Verification

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```
