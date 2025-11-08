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
    <div className="app" role="application" aria-label="Uber Reporter Application">
      {logMessage && (
        <div
          className="notification success"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="notification-content">
            <span className="notification-icon" aria-hidden="true">✓</span>
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
        <div
          className="modal-overlay"
          onClick={() => setShowBugReport(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bug-report-title"
          aria-describedby="bug-report-description"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 id="bug-report-title">Report a Bug</h2>
            <p id="bug-report-description" className="modal-description">
              Please describe the issue you encountered. This will be included with your log files.
            </p>
            <label htmlFor="bug-description" className="visually-hidden">
              Bug description
            </label>
            <textarea
              id="bug-description"
              className="bug-description-input"
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder="Describe what went wrong..."
              rows="6"
              aria-label="Describe the bug or issue you encountered"
              autoFocus
            />
            <div className="modal-actions" role="group" aria-label="Bug report actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowBugReport(false)}
                disabled={exportingLogs}
                aria-label="Cancel bug report"
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExportLogs}
                disabled={exportingLogs}
                aria-label={exportingLogs ? 'Exporting logs, please wait' : 'Submit bug report and export logs'}
                aria-busy={exportingLogs}
              >
                {exportingLogs ? 'Exporting...' : 'Report Error'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="title-bar" role="banner">
        <h1>Uber Reporter</h1>
        <button
          className="bug-report-btn"
          onClick={handleBugButtonClick}
          disabled={exportingLogs}
          aria-label="Oh my god! a cockroach! Report a bug or technical issue"
          title="Report a bug"
        >
          <span aria-hidden="true">🪳</span>
        </button>
      </header>

      <nav className="main-nav" role="navigation" aria-label="Main navigation">
        <button
          className={`nav-btn ${activeView === 'download' ? 'active' : ''}`}
          onClick={() => setActiveView('download')}
          aria-label="Download trips and receipts"
          aria-current={activeView === 'download' ? 'page' : undefined}
        >
          <span aria-hidden="true">📥</span> Download
        </button>
        <button
          className={`nav-btn ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
          aria-label="Yucky Application settings"
          aria-current={activeView === 'settings' ? 'page' : undefined}
        >
          <span aria-hidden="true">⚙️</span> Settings
        </button>
      </nav>

      <main className="tab-content" role="main" aria-label={activeView === 'download' ? 'Download and receipts section' : 'Settings section'}>
        {activeView === 'download' && <DownloadTab settings={settings} />}
        {activeView === 'settings' && <SettingsTab settings={settings} setSettings={setSettings} />}
      </main>
    </div>
  );
}

export default App;
