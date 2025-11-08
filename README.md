# Uber Utilities - Electron App

A desktop application for downloading and merging Uber receipts with a beautiful, user-friendly interface.

## Features

- **Date Range Selection**: Choose start and end dates to fetch trips
- **Multi-Browser Support**: Works with Firefox, Chrome, and Safari (limited)
- **Trip Filtering**: View all completed trips with locations and fares
- **Batch Download**: Select multiple trips or select all at once
- **PDF Merging**: Automatically merge all downloaded receipts into one PDF
- **Local Caching**: Cache trip data to avoid unnecessary API calls
- **Modern UI**: Clean, macOS-inspired interface with tabs for future features

## Prerequisites

- Node.js 16+ installed
- One of the following browsers installed:
  - Firefox (recommended)
  - Chrome
  - Safari (limited support)
- An active Uber account with logged-in browser session

## Installation

1. Navigate to the electron-app directory:
```bash
cd electron-app
```

2. Install dependencies:
```bash
npm install
```

## Running the App

### Development Mode

To run the app in development mode with auto-reload:

```bash
npm run dev
```

### Production Mode

To build and run the production version:

```bash
npm run build
npm start
```

## How to Use

1. **Select Browser**: Choose the browser where you're logged into Uber (Firefox, Chrome, or Safari)

2. **Choose Date Range**:
   - Select a start date
   - Select an end date
   - Click "Search Trips"

3. **Review Trips**:
   - Browse through your completed trips
   - Each trip shows date, time, locations, and fare

4. **Select Trips to Download**:
   - Click checkboxes next to trips you want to download
   - Or click "Select All" to select all trips

5. **Download & Merge**:
   - Click "Download & Merge"
   - Choose a directory to save the PDFs
   - Wait for download to complete
   - Individual PDFs and merged PDF will be saved to chosen directory

## Browser Cookie Authentication

The app uses browser cookies to authenticate with Uber's API. This means:

- You must be logged into Uber in your selected browser
- The app reads cookies from your browser's cookie storage
- No username/password required

### Browser Support

- **Firefox**: Full support (recommended)
- **Chrome**: Full support
- **Safari**: Limited support (macOS only, may require additional permissions)

## Cache Location

Trip data is cached in your home directory:
- macOS/Linux: `~/.uber-utilities-cache/`
- Windows: `%USERPROFILE%\.uber-utilities-cache\`

## Project Structure

```
electron-app/
├── main.js                 # Electron main process
├── preload.js              # Preload script for IPC
├── index.html              # HTML entry point
├── webpack.config.js       # Webpack configuration
├── src/
│   ├── services/          # Backend services
│   │   ├── cookieService.js    # Browser cookie extraction
│   │   ├── uberApi.js          # Uber GraphQL API calls
│   │   ├── pdfService.js       # PDF download & merge
│   │   └── cacheService.js     # Local caching
│   └── renderer/          # React frontend
│       ├── index.js
│       ├── App.js
│       ├── styles.css
│       └── components/
│           ├── DownloadTab.js
│           ├── DatePicker.js
│           ├── TripList.js
│           └── TripItem.js
└── package.json
```

## Troubleshooting

### "Failed to load cookies"
- Make sure you're logged into Uber in your selected browser
- Try a different browser
- On macOS, you may need to grant Terminal/Electron Keychain access

### "No trips found"
- Verify the date range is correct
- Make sure you have trips in that date range
- Check that you're logged into the correct Uber account

### "Failed to download PDF"
- Check your internet connection
- Verify you're still logged into Uber
- Try re-launching the app

## Future Features

The tab bar is designed to accommodate future features such as:
- Expense reports and CSV export
- Trip analytics and statistics
- Settings and configuration
- Address aliasing

## Development

### Building for Production

To package the app for distribution:

```bash
npm run build
```

Then use electron-builder or electron-forge to package for your platform.

### Key Technologies

- **Electron**: Desktop app framework
- **React**: UI framework
- **Webpack**: Module bundler
- **Axios**: HTTP client
- **pdf-lib**: PDF manipulation
- **sqlite3**: Firefox cookie database reading
- **chrome-cookies-secure**: Chrome cookie extraction

## License

MIT

## Credits

Converted from the original Python script by the same author.
