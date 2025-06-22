# Body Composition Tracker

This project is a simple web application for tracking body composition metrics such as weight, body fat percentage, and lean muscle mass. The app is entirely client-side and stores data in the browser's local storage.

## Features

- Add, edit, and remove body measurements
- Visualize progress with charts powered by Chart.js
- Track goals for weight, body fat percentage, and lean muscle mass
- Calculates BMI when a height is provided

## Getting Started

Open `index.html` in your web browser to start using the tracker. No server is required as all functionality runs in the browser. Data persists between sessions using local storage.

For development, any static file server or live reload tool can be used. For example, with Python installed you can run:

```bash
python3 -m http.server
```

Then navigate to `http://localhost:8000` in your browser.

## Folder Structure

- `index.html` – Main HTML page
- `style.css` – Styles for the application
- `app.js` – JavaScript logic

## License

This project is provided as-is without any specific license information.
