import React, { useState } from 'react';
import DownloadTab from './components/DownloadTab';
import SettingsTab from './components/SettingsTab';

function App() {
  const [activeView, setActiveView] = useState('download');
  const [settings, setSettings] = useState({
    browserType: 'firefox',
    addressMappings: [
      { address: '12100 Glenmar, Willis, TX 77318, US', displayName: 'Horse' },
      { address: '10485 League Line Rd, Conroe, TX 77304, US', displayName: 'Home' },
      { address: '10453 League Line Rd, Conroe, TX 77304, US', displayName: 'Home' },
      { address: 'Murray St & N 4th St, Conroe, TX 77301, US', displayName: 'Office' },
      { address: '14796 Highway 105 E, Conroe, TX 77306, US', displayName: 'Austin Elementary' },
      { address: '1101 Foster Dr, Conroe, TX 77301, US', displayName: 'Runyan Elementary' },
      { address: '1000 N Thompson St, Conroe, TX 77301, US', displayName: 'Houston Elementary' },
      { address: '1717 N Loop 336 W, Conroe, TX 77304, US', displayName: 'Reaves Elementary' },
      { address: '1414 E Dallas St, Conroe, TX 77301, US', displayName: 'Anderson Elementary' },
      { address: '2575 Ed Kharbat Dr, Conroe, TX 77301, US', displayName: 'Wilkinson Elementary' },
      { address: '27330 Oak Ridge School Rd, Conroe, TX 77385, US', displayName: 'Oak Ridge High' },
      { address: '27370 Oak Ridge School Rd, Conroe, TX', displayName: 'Houser Elementary' },
      { address: '3875 W Davis St, Conroe, TX 77304, US', displayName: 'HEB' },
      { address: '3205 W Davis St, Conroe, TX 77304, US', displayName: 'Admin Building' },
      { address: '4015 Interstate 45 N, Conroe, TX 77304, US', displayName: 'Doctor' },
      { address: '2218 Interstate 45 N, Conroe, TX 77303, US', displayName: 'TWC' },
      { address: '12350 Interstate 45 N, Willis, TX 77378, US', displayName: 'HEB' }
    ],
    reportConfig: {
      name: 'Jillian Daigle',
      vendorNumber: '40000076',
      purchaseOrder: '26001297',
      department: 'VI Hauke'
    }
  });
  const [exportingLogs, setExportingLogs] = useState(false);
  const [logMessage, setLogMessage] = useState(null);
  const [showBugReport, setShowBugReport] = useState(false);
  const [bugDescription, setBugDescription] = useState('');

  const handleBugButtonClick = () => {
    setShowBugReport(true);
    setBugDescription('');
  };

  const handleExportLogs = async () => {
    setExportingLogs(true);
    setLogMessage(null);

    try {
      const dirResult = await window.electronAPI.selectDirectory();

      if (!dirResult.success) {
        setExportingLogs(false);
        return;
      }

      const result = await window.electronAPI.exportLogs(dirResult.path, bugDescription);

      if (result.success) {
        setLogMessage(`Bug report exported successfully!\n\nSaved to: ${result.zipPath}`);
        setTimeout(() => setLogMessage(null), 5000);
        setShowBugReport(false);
        setBugDescription('');
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

      {showBugReport && (
        <div className="modal-overlay" onClick={() => setShowBugReport(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Report a Bug</h2>
            <p className="modal-description">
              Please describe the issue you encountered. This will be included with your log files.
            </p>
            <textarea
              className="bug-description-input"
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder="Describe what went wrong..."
              rows="6"
            />
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowBugReport(false)}
                disabled={exportingLogs}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExportLogs}
                disabled={exportingLogs}
              >
                {exportingLogs ? 'Exporting...' : 'Report Error'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="title-bar">
        <h1>Uber Utilities</h1>
        <button
          className="bug-report-btn"
          onClick={handleBugButtonClick}
          disabled={exportingLogs}
          title="Report a bug"
        >
          🐛
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
