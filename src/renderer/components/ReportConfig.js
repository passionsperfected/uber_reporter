import React from 'react';

function ReportConfig({ settings, setSettings }) {
  const handleChange = (field, value) => {
    setSettings({
      ...settings,
      reportConfig: {
        ...settings.reportConfig,
        [field]: value
      }
    });
  };

  return (
    <div className="report-config">
      <h2>Report Configuration</h2>
      <p className="settings-description">
        Configure the information that will appear on your travel reports. These values will be used when generating PDF reports from your trip data.
      </p>

      <div className="settings-section">
        <label className="settings-label">Name</label>
        <p className="field-description">Your full name as it should appear on the report</p>
        <input
          type="text"
          className="settings-input"
          placeholder="e.g., Jillian Daigle"
          value={settings.reportConfig?.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>

      <div className="settings-section">
        <label className="settings-label">Vendor Number</label>
        <p className="field-description">Your assigned vendor identification number</p>
        <input
          type="text"
          className="settings-input"
          placeholder="e.g., 40000076"
          value={settings.reportConfig?.vendorNumber || ''}
          onChange={(e) => handleChange('vendorNumber', e.target.value)}
        />
      </div>

      <div className="settings-section">
        <label className="settings-label">Purchase Order Number</label>
        <p className="field-description">Purchase order number for travel reimbursements</p>
        <input
          type="text"
          className="settings-input"
          placeholder="e.g., 26001297"
          value={settings.reportConfig?.purchaseOrder || ''}
          onChange={(e) => handleChange('purchaseOrder', e.target.value)}
        />
      </div>

      <div className="settings-section">
        <label className="settings-label">Department</label>
        <p className="field-description">Your department or division</p>
        <input
          type="text"
          className="settings-input"
          placeholder="e.g., VI Hauke"
          value={settings.reportConfig?.department || ''}
          onChange={(e) => handleChange('department', e.target.value)}
        />
      </div>

      <div className="settings-info-box">
        <strong>📋 Report Preview</strong>
        <p>Your reports will be generated with the following information:</p>
        <ul>
          <li><strong>Name:</strong> {settings.reportConfig?.name || '(Not set)'}</li>
          <li><strong>Vendor Number:</strong> {settings.reportConfig?.vendorNumber || '(Not set)'}</li>
          <li><strong>Purchase Order #:</strong> {settings.reportConfig?.purchaseOrder || '(Not set)'}</li>
          <li><strong>Department:</strong> {settings.reportConfig?.department || '(Not set)'}</li>
        </ul>
      </div>
    </div>
  );
}

export default ReportConfig;
