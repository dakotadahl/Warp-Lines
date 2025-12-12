# Alluvium - Line Field React App

A React application featuring an interactive line field animation with gyroscope support.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Project Structure

```
Alluvium/
├── src/
│   ├── components/
│   │   ├── LineField.jsx    # Main line field animation component
│   │   └── LineField.css    # Styles for the line field
│   ├── App.jsx              # Main app component
│   ├── App.css             # App styles
│   ├── main.jsx            # React entry point
│   └── index.css           # Global styles
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies and scripts
```

## Features

- Interactive line field animation with mouse/touch support
- Gyroscope support for mobile devices
- Smooth animations using requestAnimationFrame
- Responsive design
- Dev mode for debugging gyroscope values

## Technologies

- React 18
- Vite 5
- Canvas API for rendering




