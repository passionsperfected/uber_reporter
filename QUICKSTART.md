# Quick Start Guide

Get the Uber Utilities Electron app up and running in 3 minutes!

## Step 1: Install Dependencies

Open your terminal, navigate to the electron-app folder, and run:

```bash
cd electron-app
npm install
```

This will install all required packages. It may take a few minutes.

## Step 2: Build the React App

Build the frontend before running:

```bash
npm run build
```

## Step 3: Launch the App

Start the application:

```bash
npm start
```

## Step 4: Use the App

1. **Select your browser** (Firefox, Chrome, or Safari)
   - Make sure you're logged into Uber in that browser!

2. **Pick your date range**
   - Start date: The first day you want receipts from
   - End date: The last day you want receipts from

3. **Click "Search Trips"**
   - The app will fetch all your trips in that date range

4. **Select trips to download**
   - Check the boxes next to trips you want
   - Or click "Select All" to grab everything

5. **Click "Download & Merge"**
   - Choose where to save the PDFs
   - Wait for the magic to happen
   - All individual PDFs + one merged PDF will be saved!

## Tips

- **First Time**: The first search might be slower as it fetches from Uber
- **Cached Data**: Subsequent searches for the same dates will be much faster
- **Browser Issues**: If cookie loading fails, try Firefox (most reliable)
- **Large Date Ranges**: Be patient with large date ranges (6+ months)

## Development Mode

For development with hot reload:

```bash
npm run dev
```

This will start Electron and watch for changes to your React code.

## Need Help?

Check the main README.md for detailed documentation and troubleshooting.

---

Enjoy your organized Uber receipts!
