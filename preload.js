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
    ipcRenderer.invoke('generate-report', { trips, reportConfig, outputDir }),
  exportLogs: (outputDir, bugDescription) => ipcRenderer.invoke('export-logs', outputDir, bugDescription),

  // Settings (auto-save/load - internal persistence)
  saveAddressMappings: (mappings) => ipcRenderer.invoke('save-address-mappings', mappings),
  loadAddressMappings: () => ipcRenderer.invoke('load-address-mappings'),
  saveReportConfig: (config) => ipcRenderer.invoke('save-report-config', config),
  loadReportConfig: () => ipcRenderer.invoke('load-report-config'),

  // Settings (export/import - user files)
  exportAddressMappings: (mappings) => ipcRenderer.invoke('export-address-mappings', mappings),
  importAddressMappings: () => ipcRenderer.invoke('import-address-mappings'),
  exportReportConfig: (config) => ipcRenderer.invoke('export-report-config', config),
  importReportConfig: () => ipcRenderer.invoke('import-report-config')
});
