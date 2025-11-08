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

  return (
    <div className="app">
      <div className="title-bar">
        <h1>Uber Utilities</h1>
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
