import React, { useState } from 'react';

function AddressMapping({ settings, setSettings }) {
  const [newAddress, setNewAddress] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');

  const handleAddMapping = () => {
    if (!newAddress.trim() || !newDisplayName.trim()) {
      alert('Please enter both address and display name');
      return;
    }

    const newMapping = {
      id: Date.now(), // Simple ID using timestamp
      address: newAddress.trim(),
      displayName: newDisplayName.trim()
    };

    setSettings({
      ...settings,
      addressMappings: [...settings.addressMappings, newMapping]
    });

    // Clear inputs
    setNewAddress('');
    setNewDisplayName('');
  };

  const handleDeleteMapping = (id) => {
    setSettings({
      ...settings,
      addressMappings: settings.addressMappings.filter(m => m.id !== id)
    });
  };

  const handleEditMapping = (id, field, value) => {
    setSettings({
      ...settings,
      addressMappings: settings.addressMappings.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      )
    });
  };

  return (
    <div className="address-mapping">
      <h2>Address Mapping</h2>
      <p className="settings-description">
        Map long addresses to friendly display names (e.g., "123 Main St" → "Home").
        These will be shown instead of full addresses in your trip list.
      </p>

      <div className="settings-section">
        <label className="settings-label">Add New Mapping</label>

        <div className="mapping-input-row">
          <div className="mapping-input-group">
            <label>Full Address</label>
            <input
              type="text"
              className="settings-input"
              placeholder="e.g., 123 Main Street, San Francisco, CA"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMapping()}
            />
          </div>

          <div className="mapping-arrow">→</div>

          <div className="mapping-input-group">
            <label>Display Name</label>
            <input
              type="text"
              className="settings-input"
              placeholder="e.g., Home"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMapping()}
            />
          </div>

          <button
            className="btn btn-success mapping-add-btn"
            onClick={handleAddMapping}
          >
            Add
          </button>
        </div>
      </div>

      {settings.addressMappings.length > 0 && (
        <div className="settings-section">
          <label className="settings-label">Current Mappings ({settings.addressMappings.length})</label>

          <div className="mappings-list">
            {settings.addressMappings.map((mapping) => (
              <div key={mapping.id} className="mapping-item">
                <div className="mapping-details">
                  <div className="mapping-address">
                    <input
                      type="text"
                      className="mapping-edit-input"
                      value={mapping.address}
                      onChange={(e) => handleEditMapping(mapping.id, 'address', e.target.value)}
                    />
                  </div>
                  <div className="mapping-arrow-small">→</div>
                  <div className="mapping-display-name">
                    <input
                      type="text"
                      className="mapping-edit-input"
                      value={mapping.displayName}
                      onChange={(e) => handleEditMapping(mapping.id, 'displayName', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteMapping(mapping.id)}
                  title="Delete mapping"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {settings.addressMappings.length === 0 && (
        <div className="empty-state">
          <p>No address mappings yet. Add one above to get started!</p>
        </div>
      )}
    </div>
  );
}

export default AddressMapping;
