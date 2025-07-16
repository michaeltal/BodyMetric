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

### UI Services
- `js/ui/UIManager.js`: Manages overall UI updates and state.
- `js/ui/FormManager.js`: Handles all form interactions, including data entry, validation, and submission.
- `js/ui/TableManager.js`: Manages the display, sorting, and pagination of measurement data.
- `js/ui/ChartManager.js`: Responsible for rendering and updating all charts.

### Feature Services
- `js/features/GoalManager.js`: Manages user-defined goals for weight, body fat, and lean mass.
- `js/features/ImportExportManager.js`: Handles the import and export of user data.
- `js/features/InsightsManager.js`: Provides data analysis and insights into user progress.
- `js/features/UnifiedGoalManager.js`: A newer, more comprehensive goal management system.

### Documentation & Testing
- `tests/services/`: Contains unit tests for the core services.
- `tests/ui/`: Contains unit tests for the UI components.
- `tests/features/`: Contains unit tests for the feature modules.
- `tests/server.test.js`: API endpoint integration tests.
- `tests/data-persistence.test.js`: Tests for file system and data integrity.
- `tests/concurrency.test.js`: Concurrent request handling tests.

## UI/UX

- **Dashboard**: Centralized view of all key metrics, charts, and goal progress.
- **Interactive Charts**: Time-series charts for visualizing trends in weight, body fat, and lean mass.
- **Data Entry Form**: A unified form for entering new measurements, setting goals, and configuring user settings.
- **Measurement Table**: A paginated and searchable table of all historical data, with options for editing and deleting entries.

## Testing and Verification

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```
