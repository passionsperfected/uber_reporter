import React, { useState } from 'react';
import BrowserSettings from './BrowserSettings';
import AddressMapping from './AddressMapping';
import CacheManagement from './CacheManagement';
import ReportConfig from './ReportConfig';

function SettingsTab({ settings, setSettings }) {
  const [activeSettingsTab, setActiveSettingsTab] = useState('browser');

  return (
    <div className="settings-tab">
      <nav className="settings-nav" role="tablist" aria-label="Settings categories">
        <button
          className={`settings-nav-btn ${activeSettingsTab === 'browser' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('browser')}
          role="tab"
          aria-selected={activeSettingsTab === 'browser'}
          aria-controls="browser-panel"
          id="browser-tab"
        >
          Browser & Connection
        </button>
        <button
          className={`settings-nav-btn ${activeSettingsTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('addresses')}
          role="tab"
          aria-selected={activeSettingsTab === 'addresses'}
          aria-controls="addresses-panel"
          id="addresses-tab"
        >
          Address Mapping
        </button>
        <button
          className={`settings-nav-btn ${activeSettingsTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('report')}
          role="tab"
          aria-selected={activeSettingsTab === 'report'}
          aria-controls="report-panel"
          id="report-tab"
        >
          Report
        </button>
        <button
          className={`settings-nav-btn ${activeSettingsTab === 'cache' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('cache')}
          role="tab"
          aria-selected={activeSettingsTab === 'cache'}
          aria-controls="cache-panel"
          id="cache-tab"
        >
          Cache
        </button>
      </nav>

      <div className="settings-content">
        {activeSettingsTab === 'browser' && (
          <div id="browser-panel" role="tabpanel" aria-labelledby="browser-tab">
            <BrowserSettings
              settings={settings}
              setSettings={setSettings}
            />
          </div>
        )}
        {activeSettingsTab === 'addresses' && (
          <div id="addresses-panel" role="tabpanel" aria-labelledby="addresses-tab">
            <AddressMapping
              settings={settings}
              setSettings={setSettings}
            />
          </div>
        )}
        {activeSettingsTab === 'report' && (
          <div id="report-panel" role="tabpanel" aria-labelledby="report-tab">
            <ReportConfig
              settings={settings}
              setSettings={setSettings}
            />
          </div>
        )}
        {activeSettingsTab === 'cache' && (
          <div id="cache-panel" role="tabpanel" aria-labelledby="cache-tab">
            <CacheManagement />
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsTab;
