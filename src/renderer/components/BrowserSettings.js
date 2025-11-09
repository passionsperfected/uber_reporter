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
      const result = await window.electronAPI.testConnection('firefox');

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
        This app uses Firefox cookies to authenticate with Uber. Make sure you're logged into Uber in Firefox before testing the connection.
      </p>

      <div className="settings-section">
        <label htmlFor="browser-select" className="settings-label">Browser</label>
        <div className="browser-info">
          <strong>Firefox</strong>
          <p className="settings-hint">
            This application currently supports Firefox only. Make sure you're logged into Uber at <a href="https://riders.uber.com" target="_blank" rel="noopener noreferrer">riders.uber.com</a> in Firefox before testing the connection.
          </p>
        </div>
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
          <li>Open <strong>Firefox</strong></li>
          <li>Go to <a href="https://riders.uber.com" target="_blank" rel="noopener noreferrer">https://riders.uber.com</a></li>
          <li>Log in with your Uber account</li>
          <li>Return here and click "Test Connection"</li>
        </ol>
      </div>
    </div>
  );
}

export default BrowserSettings;
