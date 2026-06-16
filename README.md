# BigQuery Release Radar 📡

A premium, interactive web application built with **Python Flask** and **Vanilla JS/CSS** that monitors Google Cloud BigQuery release notes and updates in real-time, allowing you to select and tweet insights directly.

## Features

- 🔄 **Real-Time Synchronization**: Pulls release notes dynamically from the official Google Cloud feeds with an active refresh spinner.
- ⚡ **Smart Memory Caching**: 5-minute cache prevents rate-limiting and guarantees lighting-fast response times.
- 🎨 **Premium Glassmorphic UI**: Vibrant, responsive dark mode design with sleek hover states, micro-animations, and custom typography.
- 🔍 **Granular Filtering & Search**: Instant keyword search, category filters (Features, Deprecations, Resolved, etc.), and date range selection.
- 🐦 **Custom X/Twitter Composers**: Select any release note update to compose, preview, and post a tweet with automated 280-character boundary limits and URL auto-wrapping.
- 📋 **Click-to-Copy**: Quickly copy pre-composed tweet templates to your clipboard with visual toast alerts.

## Technology Stack

- **Backend**: Python Flask, Requests, BeautifulSoup4
- **Frontend**: Vanilla HTML5, CSS3 Variables, ES6 JavaScript, FontAwesome Icons
- **Design**: Google Fonts (Outfit & Inter), Glassmorphic styling, CSS-only animations

## Installation & Setup

1. Make sure Python 3.10+ is installed.
2. Clone or navigate to this directory.
3. Create a virtual environment and install the dependencies:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   python app.py
   ```
5. Open your browser and navigate to `http://127.0.0.1:5000`.

## Directory Structure

```
bq-releases-notes/
├── app.py                 # Flask server and feed parser
├── requirements.txt       # Python package dependencies
├── templates/
│   └── index.html         # Main dashboard interface
├── static/
│   ├── css/
│   │   └── style.css      # Premium dark theme and animations
│   └── js/
│       └── app.js         # Fetching, rendering, and tweet composition
└── README.md              # Project documentation
```
