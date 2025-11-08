import React, { useState } from 'react';
import DownloadTab from './components/DownloadTab';
import SettingsTab from './components/SettingsTab';

function App() {
  const [activeView, setActiveView] = useState('download');
  const [settings, setSettings] = useState({
    browserType: 'firefox',
    addressMappings: [],
    reportConfig: {
      name: 'Jillian Daigle',
      vendorNumber: '40000076',
      purchaseOrder: '26001297',
      department: 'VI Hauke'
    }
  });
  const [exportingLogs, setExportingLogs] = useState(false);
  const [logMessage, setLogMessage] = useState(null);

  const handleExportLogs = async () => {
    setExportingLogs(true);
    setLogMessage(null);

    try {
      const dirResult = await window.electronAPI.selectDirectory();

      if (!dirResult.success) {
        setExportingLogs(false);
        return;
      }

      const result = await window.electronAPI.exportLogs(dirResult.path);

      if (result.success) {
        setLogMessage(`Logs exported successfully!\n\nSaved to: ${result.zipPath}`);
        setTimeout(() => setLogMessage(null), 5000);
      } else {
        setLogMessage(`Failed to export logs: ${result.error}`);
        setTimeout(() => setLogMessage(null), 5000);
      }
    } catch (error) {
      setLogMessage(`Error: ${error.message}`);
      setTimeout(() => setLogMessage(null), 5000);
    } finally {
      setExportingLogs(false);
    }
  };

  return (
    <div className="app">
      {logMessage && (
        <div className="notification success">
          <div className="notification-content">
            <span className="notification-icon">✓</span>
            <div className="notification-text">{logMessage}</div>
            <button
              className="notification-close"
              onClick={() => setLogMessage(null)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="title-bar">
        <h1>Uber Utilities</h1>
        <button
          className="bug-report-btn"
          onClick={handleExportLogs}
          disabled={exportingLogs}
          title="Export logs for bug report"
        >
          {exportingLogs ? '⏳' : '🐛'}
        </button>
      </div>

      <div className="main-nav">
        <button
          className={`nav-btn ${activeView === 'download' ? 'active' : ''}`}
          onClick={() => setActiveView('download')}
        >
          📥 Download
        </button>
        <button
          className={`nav-btn ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="tab-content">
        {activeView === 'download' && <DownloadTab settings={settings} />}
        {activeView === 'settings' && <SettingsTab settings={settings} setSettings={setSettings} />}
      </div>
    </div>
  );
}

export default App;
