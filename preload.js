const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadCookies: (browserType) => ipcRenderer.invoke('load-cookies', browserType),
  testConnection: (browserType) => ipcRenderer.invoke('test-connection', browserType),
  fetchTrips: (startDate, endDate, browserType) =>
    ipcRenderer.invoke('fetch-trips', { startDate, endDate, browserType }),
  downloadReceipts: (tripUUIDs, browserType, outputDir) =>
    ipcRenderer.invoke('download-receipts', { tripUUIDs, browserType, outputDir }),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getCacheStats: () => ipcRenderer.invoke('get-cache-stats'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  generateReport: (trips, reportConfig, outputDir) =>
    ipcRenderer.invoke('generate-report', { trips, reportConfig, outputDir })
});
