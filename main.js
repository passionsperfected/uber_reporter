const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const archiver = require('archiver');
const { loadBrowserCookies } = require('./src/services/cookieService');
const { fetchActivitiesByDate, fetchTripDetails, testConnection } = require('./src/services/uberApi');
const { downloadPDF, mergePDFs } = require('./src/services/pdfService');
const { getCachedActivities, cacheActivities, getCachedTrip, cacheTrip, getCacheStats, clearCache } = require('./src/services/cacheService');
const { generateTravelReport } = require('./src/services/reportService');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Uber Utilities',
    titleBarStyle: 'default'
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('load-cookies', async (event, browserType) => {
  try {
    const cookies = await loadBrowserCookies(browserType);
    return { success: true, cookies };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-connection', async (event, browserType) => {
  try {
    const cookies = await loadBrowserCookies(browserType);
    const result = await testConnection(cookies);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('fetch-trips', async (event, { startDate, endDate, browserType }) => {
  try {
    // Load browser cookies
    const cookies = await loadBrowserCookies(browserType);

    // Check cache first
    const cacheKey = `${startDate}_${endDate}`;
    let activities = await getCachedActivities(cacheKey);

    if (!activities || activities.length === 0) {
      // Fetch from API
      activities = await fetchActivitiesByDate(startDate, endDate, cookies);
      // Cache the results
      await cacheActivities(cacheKey, activities);
    }

    // Fetch details for each activity
    const tripsWithDetails = [];
    for (const activity of activities) {
      let tripDetails = await getCachedTrip(activity.uuid);

      if (!tripDetails) {
        tripDetails = await fetchTripDetails(activity.uuid, cookies);
        await cacheTrip(activity.uuid, tripDetails);
      }

      tripsWithDetails.push({
        activity,
        trip: tripDetails
      });
    }

    return { success: true, trips: tripsWithDetails };
  } catch (error) {
    console.error('Error fetching trips:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-receipts', async (event, { tripUUIDs, browserType, outputDir }) => {
  try {
    const cookies = await loadBrowserCookies(browserType);
    const pdfPaths = [];

    // Download each PDF
    for (const uuid of tripUUIDs) {
      const pdfPath = await downloadPDF(uuid, cookies, outputDir);
      pdfPaths.push(pdfPath);
    }

    // Merge PDFs
    const mergedPath = await mergePDFs(pdfPaths, outputDir);

    return { success: true, mergedPath, individualPaths: pdfPaths };
  } catch (error) {
    console.error('Error downloading receipts:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-directory', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] };
  }

  return { success: false };
});

ipcMain.handle('get-cache-stats', async () => {
  try {
    const stats = await getCacheStats();
    return { success: true, stats };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-cache', async () => {
  try {
    await clearCache();
    return { success: true };
  } catch (error) {
    console.error('Error clearing cache:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('generate-report', async (event, { trips, reportConfig, outputDir }) => {
  try {
    const fileName = `Travel_Report_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.pdf`;
    const outputPath = require('path').join(outputDir, fileName);
    const reportPath = await generateTravelReport(trips, reportConfig, outputPath);
    return { success: true, reportPath };
  } catch (error) {
    console.error('Error generating report:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-logs', async (event, outputDir) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const zipFileName = `uber-reporter-logs-${timestamp}.zip`;
    const zipPath = path.join(outputDir, zipFileName);

    // Create a write stream for the zip file
    const output = fsSync.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Return a promise that resolves when zipping is complete
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({ success: true, zipPath, size: archive.pointer() });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Add system info
      const systemInfo = {
        platform: process.platform,
        arch: process.arch,
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        appVersion: app.getVersion(),
        timestamp: new Date().toISOString(),
        userDataPath: app.getPath('userData'),
        logsPath: app.getPath('logs')
      };

      archive.append(JSON.stringify(systemInfo, null, 2), { name: 'system-info.json' });

      // Add Electron logs if they exist
      const logsPath = app.getPath('logs');
      try {
        const logFiles = fsSync.readdirSync(logsPath);
        logFiles.forEach(file => {
          const filePath = path.join(logsPath, file);
          if (fsSync.statSync(filePath).isFile()) {
            archive.file(filePath, { name: `logs/${file}` });
          }
        });
      } catch (err) {
        console.log('No logs directory found or error reading logs:', err.message);
      }

      // Add console logs captured during this session
      const consoleLog = `Application logs would be captured here.\n\nThis is a placeholder for runtime logs.`;
      archive.append(consoleLog, { name: 'console-output.txt' });

      // Finalize the archive
      archive.finalize();
    });
  } catch (error) {
    console.error('Error exporting logs:', error);
    return { success: false, error: error.message };
  }
});
