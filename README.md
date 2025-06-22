# Body Composition Tracker

This project is a simple web application for tracking body composition metrics such as weight, body fat percentage, and lean muscle mass. Data can be stored on a small Node.js server so it is accessible from multiple browsers. If the server is not available the app falls back to local storage.

## Features

- Add, edit, and remove body measurements
- Visualize progress with charts powered by Chart.js
- Track goals for weight, body fat percentage, and lean muscle mass
- Calculates BMI when a height is provided
- Optional Node.js backend for shared data storage

## Getting Started

To make data accessible from multiple browsers, start the included Node.js server first:

```bash
npm install
node server.js
```

With the server running, open `index.html` in your web browser. All data will be stored in `data.json` on the server and shared across browsers. If the server isn't running, the application will fall back to using local storage.

For development without the Node server you can still use a static file server such as:

```bash
python3 -m http.server
```

Then navigate to `http://localhost:8000` in your browser.

## Folder Structure

- `index.html` – Main HTML page
- `style.css` – Styles for the application
- `app.js` – JavaScript logic
- `server.js` – Simple Express server storing data in `data.json`
- `data.json` – Server side data storage

## License

This project is provided as-is without any specific license information.
