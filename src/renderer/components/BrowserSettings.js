import React, { useState } from 'react';

function BrowserSettings({ settings, setSettings }) {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connectionMessage, setConnectionMessage] = useState('');

  const handleBrowserChange = (browserType) => {
    setSettings({ ...settings, browserType });
    setConnectionStatus(null); // Reset connection status when browser changes
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMessage('Testing connection...');

    try {
      const result = await window.electronAPI.testConnection(settings.browserType);

      if (result.success) {
        setConnectionStatus('success');
        setConnectionMessage(result.message);
      } else {
        setConnectionStatus('failed');
        setConnectionMessage(result.message);
      }
    } catch (err) {
      setConnectionStatus('failed');
      setConnectionMessage('Connection test failed: ' + err.message);
    }
  };

  return (
    <div className="browser-settings">
      <h2 id="browser-settings-heading">Browser & Authentication</h2>
      <p className="settings-description">
        Select the browser where you're logged into Uber. The app will use your browser's cookies to authenticate.
      </p>

      <div className="settings-section">
        <label htmlFor="browser-select" className="settings-label">Browser</label>
        <select
          id="browser-select"
          className="settings-select"
          value={settings.browserType}
          onChange={(e) => handleBrowserChange(e.target.value)}
          aria-describedby="browser-hint"
        >
          <option value="firefox">Firefox</option>
          <option value="chrome">Chrome</option>
          <option value="safari">Safari (Limited Support)</option>
        </select>
        <p id="browser-hint" className="settings-hint">
          Make sure you're logged into Uber in your selected browser before testing the connection.
        </p>
      </div>

      <div className="settings-section">
        <label className="settings-label">Test Connection</label>
        <p className="settings-hint" id="test-connection-hint">
          Click the button below to verify that your authentication is working correctly.
        </p>

        <button
          className="btn btn-primary"
          onClick={handleTestConnection}
          disabled={connectionStatus === 'testing'}
          aria-label={connectionStatus === 'testing' ? 'Testing connection, please wait' : 'Test Uber connection'}
          aria-busy={connectionStatus === 'testing'}
          aria-describedby="test-connection-hint"
        >
          {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>

        {connectionStatus && (
          <div
            className={`connection-status ${connectionStatus}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span aria-hidden="true">
              {connectionStatus === 'success' && '✅ '}
              {connectionStatus === 'failed' && '❌ '}
            </span>
            {connectionMessage}
          </div>
        )}
      </div>

      <div className="settings-section">
        <label className="settings-label">How to log in:</label>
        <ol className="settings-instructions">
          <li>Open <strong>{settings.browserType === 'firefox' ? 'Firefox' : settings.browserType === 'chrome' ? 'Chrome' : 'Safari'}</strong></li>
          <li>Go to <a href="https://riders.uber.com" target="_blank" rel="noopener noreferrer">https://riders.uber.com</a></li>
          <li>Log in with your Uber account</li>
          <li>Return here and click "Test Connection"</li>
        </ol>
      </div>
    </div>
  );
}

export default BrowserSettings;
