import React, { useState } from 'react';
import BrowserSettings from './BrowserSettings';
import AddressMapping from './AddressMapping';
import CacheManagement from './CacheManagement';
import ReportConfig from './ReportConfig';

function SettingsTab({ settings, setSettings }) {
  const [activeSettingsTab, setActiveSettingsTab] = useState('browser');

  return (
    <div className="settings-tab">
      <div className="settings-nav">
        <button
          className={`settings-nav-btn ${activeSettingsTab === 'browser' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('browser')}
        >
          Browser & Connection
        </button>
        <button
          className={`settings-nav-btn ${activeSettingsTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('addresses')}
        >
          Address Mapping
        </button>
        <button
          className={`settings-nav-btn ${activeSettingsTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('report')}
        >
          Report
        </button>
        <button
          className={`settings-nav-btn ${activeSettingsTab === 'cache' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('cache')}
        >
          Cache
        </button>
      </div>

      <div className="settings-content">
        {activeSettingsTab === 'browser' && (
          <BrowserSettings
            settings={settings}
            setSettings={setSettings}
          />
        )}
        {activeSettingsTab === 'addresses' && (
          <AddressMapping
            settings={settings}
            setSettings={setSettings}
          />
        )}
        {activeSettingsTab === 'report' && (
          <ReportConfig
            settings={settings}
            setSettings={setSettings}
          />
        )}
        {activeSettingsTab === 'cache' && (
          <CacheManagement />
        )}
      </div>
    </div>
  );
}

export default SettingsTab;
