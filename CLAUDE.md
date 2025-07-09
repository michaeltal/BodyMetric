# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BodyMetric is a single-page web application for tracking body composition metrics (weight, body fat percentage, lean muscle mass). The app uses a server-only architecture with reliable data persistence through a Node.js Express server.

## Development Setup

```bash
# Install dependencies
npm install

# Start the server (recommended for multi-browser access)
node server.js

# Alternative: Static file server (server required for data persistence)
python3 -m http.server
```

The app runs on `http://localhost:3000` with the Node server, or `http://localhost:8000` with the static server. **Note: The Node.js server is required for data persistence; the static server is only for UI development.**

## Architecture

- **Service-oriented design**: Modular architecture with clear separation of concerns
- **Server-only data persistence**: All data stored in `data.json` on Express server
- **Core Services**: DataManager, CalculationService, NotificationService
- **UI Management Classes**: UIManager, FormManager, TableManager
- **Module Loading**: Browser-compatible ES6 module system via ModuleLoader
- **Visualization**: Chart.js with date-fns adapter for time-series data visualization
- **Comprehensive Testing**: 196 unit and integration tests ensuring reliability

## Key Files

### Core Application
- `app.js`: Main application orchestrator with `BodyCompositionTracker` class
- `server.js`: Express server with data persistence, write queue, and CORS support
- `index.html`: Single-page application entry point
- `style.css`: Comprehensive CSS with design system using CSS variables
- `data.json`: Server-side JSON data storage

### Modular Services
- `js/services/DataManager.js`: Data persistence, CRUD operations, server communication
- `js/services/CalculationService.js`: BMI calculations, averages, trends, unit conversions
- `js/services/NotificationService.js`: User feedback and error notification system
- `js/ModuleLoader.js`: Browser-compatible ES6 module loader

### UI Management Classes
- `js/ui/UIManager.js`: Statistics display, trends, BMI calculations, date formatting
- `js/ui/FormManager.js`: Form handling, validation, unit toggles, goal management
- `js/ui/TableManager.js`: Table rendering, sorting, pagination, search functionality

### Documentation & Testing
- `Refactor/appJS-Refactor.md`: Architecture refactoring documentation
- `Refactor/Phase2-UI-Plan.md`: Phase 2 UI Management Classes implementation plan
- `Refactor/Phase3-Features-Plan.md`: Phase 3 Feature Classes implementation plan
- `tests/services/`: Service unit tests (DataManager, CalculationService, NotificationService, UIManager, FormManager, TableManager)
- `tests/server.test.js`: API endpoint integration tests
- `tests/data-persistence.test.js`: File system and data integrity tests
- `tests/concurrency.test.js`: Concurrent request handling tests
- `AGENTS.md`: Development workflow guidelines

## Code Style

- **Indentation**: 2 spaces for JavaScript, CSS, and HTML
- **Dependencies**: Keep minimal - Express and body-parser for server, Jest and Supertest for testing
- **Data validation**: Duplicate prevention, unit conversion, BMI calculation built-in

## Testing and Verification

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Test server functionality manually
node server.js
# Stop with Ctrl+C
```

### Test Structure (196 Tests)

#### Core Service Tests
- `tests/services/DataManager.test.js` - Data persistence and CRUD operation tests
- `tests/services/CalculationService.test.js` - Mathematical calculations and conversion tests
- `tests/services/NotificationService.test.js` - User notification system tests

#### UI Management Tests
- `tests/services/UIManager.test.js` - Statistics display and formatting tests
- `tests/services/FormManager.test.js` - Form handling and validation tests
- `tests/services/TableManager.test.js` - Table operations and pagination tests

#### Integration Tests
- `tests/server.test.js` - API endpoint tests using Supertest
- `tests/data-persistence.test.js` - File system operations and data integrity tests
- `tests/concurrency.test.js` - Tests for concurrent request handling and write queue

#### Test Infrastructure
- `tests/fixtures/` - Test data files for consistent testing
- `tests/setup.js` - Global test configuration and cleanup
- `jest.config.js` - Jest configuration with coverage settings

## Data Structure

The application manages measurements with the following structure:
- Date-based entries with weight, body fat percentage, lean muscle mass
- Goals tracking for each metric
- Unit conversion between metric/imperial
- 7-day rolling averages for trend analysis

## Development Notes

- **Server Required**: Application requires Node.js server for all data operations
- **CORS Enabled**: Server automatically handles CORS for localhost development
- **Error Handling**: Comprehensive error handling with user-friendly notifications
- **CSV Import/Export**: Full CSV functionality with detailed error tracking
- **Port Configuration**: Use `PORT=8080 node server.js` for custom ports
- **Modular Architecture**: App refactored from 1,222-line monolith to service-oriented design
- **Current State**: Phase 2 complete (UI Management Classes), Phase 3 planned (Feature Classes)
- **Refactoring History**: See `Refactor/appJS-Refactor.md` for architectural evolution
- **AI Generated**: All code created by AI tools (noted in README)

---

Last update: July 9, 2025