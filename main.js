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
const {
  saveAddressMappings: saveAddressMappingsInternal,
  loadAddressMappings: loadAddressMappingsInternal,
  saveReportConfig: saveReportConfigInternal,
  loadReportConfig: loadReportConfigInternal,
  exportAddressMappings,
  importAddressMappings,
  exportReportConfig,
  importReportConfig
} = require('./src/services/settingsService');

let mainWindow;

// Log capture system
const logBuffer = [];
const MAX_LOG_ENTRIES = 1000; // Limit log buffer size

// Helper to format log entry
function formatLogEntry(level, args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
  return `[${timestamp}] [${level}] ${message}`;
}

// Capture console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

console.log = function(...args) {
  logBuffer.push(formatLogEntry('INFO', args));
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  originalConsole.log.apply(console, args);
};

console.error = function(...args) {
  logBuffer.push(formatLogEntry('ERROR', args));
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  originalConsole.error.apply(console, args);
};

console.warn = function(...args) {
  logBuffer.push(formatLogEntry('WARN', args));
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  originalConsole.warn.apply(console, args);
};

console.info = function(...args) {
  logBuffer.push(formatLogEntry('INFO', args));
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  originalConsole.info.apply(console, args);
};

// Capture uncaught exceptions
process.on('uncaughtException', (error) => {
  const errorLog = formatLogEntry('UNCAUGHT_EXCEPTION', [error.stack || error.message]);
  logBuffer.push(errorLog);
  originalConsole.error('Uncaught Exception:', error);
});

// Capture unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const errorLog = formatLogEntry('UNHANDLED_REJECTION', [reason]);
  logBuffer.push(errorLog);
  originalConsole.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Log startup
console.log('Uber Reporter starting...');

function createWindow() {
  console.log('Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Uber Reporter',
    titleBarStyle: 'default'
  });

  mainWindow.loadFile('index.html');

  // Capture renderer process console logs
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levelMap = ['INFO', 'WARN', 'ERROR'];
    const logLevel = levelMap[level] || 'INFO';
    logBuffer.push(formatLogEntry(`RENDERER_${logLevel}`, [message, `(${sourceId}:${line})`]));
    if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
    console.log('DevTools opened (development mode)');
  }

  console.log('Main window created successfully');
}

app.whenReady().then(() => {
  console.log('Electron app ready');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    console.log('Quitting application');
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
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
  console.log(`Fetching trips from ${startDate} to ${endDate} using ${browserType}`);
  try {
    // Load browser cookies
    const cookies = await loadBrowserCookies(browserType);

    // Check cache first
    const cacheKey = `${startDate}_${endDate}`;
    let activities = await getCachedActivities(cacheKey);

    if (!activities || activities.length === 0) {
      console.log('Cache miss, fetching from API');
      // Fetch from API
      activities = await fetchActivitiesByDate(startDate, endDate, cookies);
      // Cache the results
      await cacheActivities(cacheKey, activities);
      console.log(`Fetched ${activities.length} activities from API`);
    } else {
      console.log(`Cache hit, found ${activities.length} activities`);
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

    console.log(`Successfully fetched ${tripsWithDetails.length} trips with details`);
    return { success: true, trips: tripsWithDetails };
  } catch (error) {
    console.error('Error fetching trips:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-receipts', async (event, { tripUUIDs, browserType, outputDir }) => {
  console.log(`Downloading ${tripUUIDs.length} receipts to ${outputDir}`);
  try {
    const cookies = await loadBrowserCookies(browserType);
    const pdfPaths = [];

    // Download each PDF
    for (const uuid of tripUUIDs) {
      const pdfPath = await downloadPDF(uuid, cookies, outputDir);
      pdfPaths.push(pdfPath);
    }

    console.log(`Downloaded ${pdfPaths.length} PDFs, merging...`);
    // Merge PDFs
    const mergedPath = await mergePDFs(pdfPaths, outputDir);

    console.log(`Successfully merged PDFs to ${mergedPath}`);
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
  console.log(`Generating report for ${trips.length} trips to ${outputDir}`);
  try {
    const fileName = `Travel_Report_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.pdf`;
    const outputPath = require('path').join(outputDir, fileName);
    const reportPath = await generateTravelReport(trips, reportConfig, outputPath);
    console.log(`Report generated successfully: ${reportPath}`);
    return { success: true, reportPath };
  } catch (error) {
    console.error('Error generating report:', error);
    return { success: false, error: error.message };
  }
});

// Auto-save address mappings (internal persistence)
ipcMain.handle('save-address-mappings', async (event, mappings) => {
  console.log('Auto-saving address mappings');
  try {
    await saveAddressMappingsInternal(mappings);
    return { success: true };
  } catch (error) {
    console.error('Error auto-saving address mappings:', error);
    return { success: false, error: error.message };
  }
});

// Auto-load address mappings (internal persistence)
ipcMain.handle('load-address-mappings', async () => {
  console.log('Auto-loading address mappings');
  try {
    const mappings = await loadAddressMappingsInternal();
    return { success: true, mappings };
  } catch (error) {
    console.error('Error auto-loading address mappings:', error);
    return { success: false, error: error.message, mappings: [] };
  }
});

// Export address mappings (user-selected file)
ipcMain.handle('export-address-mappings', async (event, mappings) => {
  const { dialog } = require('electron');
  console.log('Exporting address mappings to file');

  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Address Mappings',
      defaultPath: 'address-mappings.json',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled) {
      return { success: false };
    }

    await exportAddressMappings(mappings, result.filePath);
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Error exporting address mappings:', error);
    return { success: false, error: error.message };
  }
});

// Import address mappings (user-selected file)
ipcMain.handle('import-address-mappings', async () => {
  const { dialog } = require('electron');
  console.log('Importing address mappings from file');

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Address Mappings',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false };
    }

    const mappings = await importAddressMappings(result.filePaths[0]);
    return { success: true, mappings };
  } catch (error) {
    console.error('Error importing address mappings:', error);
    return { success: false, error: error.message };
  }
});

// Auto-save report config (internal persistence)
ipcMain.handle('save-report-config', async (event, config) => {
  console.log('Auto-saving report configuration');
  try {
    await saveReportConfigInternal(config);
    return { success: true };
  } catch (error) {
    console.error('Error auto-saving report config:', error);
    return { success: false, error: error.message };
  }
});

// Auto-load report config (internal persistence)
ipcMain.handle('load-report-config', async () => {
  console.log('Auto-loading report configuration');
  try {
    const config = await loadReportConfigInternal();
    return { success: true, config };
  } catch (error) {
    console.error('Error auto-loading report config:', error);
    return {
      success: false,
      error: error.message,
      config: {
        name: '',
        vendorNumber: '',
        purchaseOrder: '',
        department: ''
      }
    };
  }
});

// Export report config (user-selected file)
ipcMain.handle('export-report-config', async (event, config) => {
  const { dialog } = require('electron');
  console.log('Exporting report configuration to file');

  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Report Configuration',
      defaultPath: 'report-config.json',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled) {
      return { success: false };
    }

    await exportReportConfig(config, result.filePath);
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Error exporting report config:', error);
    return { success: false, error: error.message };
  }
});

// Import report config (user-selected file)
ipcMain.handle('import-report-config', async () => {
  const { dialog } = require('electron');
  console.log('Importing report configuration from file');

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Report Configuration',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false };
    }

    const config = await importReportConfig(result.filePaths[0]);
    return { success: true, config };
  } catch (error) {
    console.error('Error importing report config:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-logs', async (event, outputDir, bugDescription) => {
  console.log(`Exporting logs to ${outputDir}`);
  console.log(`Current log buffer contains ${logBuffer.length} entries`);
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const zipFileName = `uber-reporter-logs-${timestamp}.zip`;
    const zipPath = path.join(outputDir, zipFileName);
    console.log(`Creating log archive: ${zipPath}`);

    // Create a write stream for the zip file
    const output = fsSync.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Return a promise that resolves when zipping is complete
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`Log export complete: ${zipPath} (${archive.pointer()} bytes)`);
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
      const consoleLog = logBuffer.length > 0
        ? logBuffer.join('\n')
        : 'No logs captured during this session.';
      archive.append(consoleLog, { name: 'console-output.txt' });

      // Add bug description if provided
      if (bugDescription && bugDescription.trim()) {
        archive.append(bugDescription.trim(), { name: 'bug-description.txt' });
      }

      // Add a summary
      const summaryFiles = [
        '- system-info.json: System and application information',
        '- logs/: Electron framework logs (if available)',
        '- console-output.txt: Application console logs from this session'
      ];

      if (bugDescription && bugDescription.trim()) {
        summaryFiles.push('- bug-description.txt: User-provided description of the issue');
      }

      const summary = `Uber Reporter Log Export
Generated: ${new Date().toISOString()}
Total Log Entries: ${logBuffer.length}
Platform: ${process.platform}
Electron Version: ${process.versions.electron}
Node Version: ${process.versions.node}

This archive contains:
${summaryFiles.join('\n')}
`;
      archive.append(summary, { name: 'README.txt' });

      // Finalize the archive
      archive.finalize();
    });
  } catch (error) {
    console.error('Error exporting logs:', error);
    return { success: false, error: error.message };
  }
});
