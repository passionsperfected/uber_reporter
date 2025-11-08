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
      <h2 id="report-config-heading">Report Configuration</h2>
      <p className="settings-description">
        Configure the information that will appear on your travel reports. These values will be used when generating PDF reports from your trip data.
      </p>

      <div className="settings-section">
        <label htmlFor="report-name" className="settings-label">Name</label>
        <p id="name-description" className="field-description">Your full name as it should appear on the report</p>
        <input
          id="report-name"
          type="text"
          className="settings-input"
          placeholder="e.g., Jillian Daigle"
          value={settings.reportConfig?.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          aria-describedby="name-description"
          aria-required="true"
        />
      </div>

      <div className="settings-section">
        <label htmlFor="vendor-number" className="settings-label">Vendor Number</label>
        <p id="vendor-description" className="field-description">Your assigned vendor identification number</p>
        <input
          id="vendor-number"
          type="text"
          className="settings-input"
          placeholder="e.g., 40000076"
          value={settings.reportConfig?.vendorNumber || ''}
          onChange={(e) => handleChange('vendorNumber', e.target.value)}
          aria-describedby="vendor-description"
          aria-required="true"
        />
      </div>

      <div className="settings-section">
        <label htmlFor="purchase-order" className="settings-label">Purchase Order Number</label>
        <p id="po-description" className="field-description">Purchase order number for travel reimbursements</p>
        <input
          id="purchase-order"
          type="text"
          className="settings-input"
          placeholder="e.g., 26001297"
          value={settings.reportConfig?.purchaseOrder || ''}
          onChange={(e) => handleChange('purchaseOrder', e.target.value)}
          aria-describedby="po-description"
        />
      </div>

      <div className="settings-section">
        <label htmlFor="department" className="settings-label">Department</label>
        <p id="dept-description" className="field-description">Your department or division</p>
        <input
          id="department"
          type="text"
          className="settings-input"
          placeholder="e.g., VI Hauke"
          value={settings.reportConfig?.department || ''}
          onChange={(e) => handleChange('department', e.target.value)}
          aria-describedby="dept-description"
        />
      </div>

      <div className="settings-info-box" role="region" aria-label="Report preview">
        <strong><span aria-hidden="true">📋</span> Report Preview</strong>
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
