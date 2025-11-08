import React, { useState, useEffect } from 'react';

function CacheManagement() {
  const [cacheStats, setCacheStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState(null);

  const loadCacheStats = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getCacheStats();
      if (result.success) {
        setCacheStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCacheStats();
  }, []);

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cached data? This cannot be undone.')) {
      return;
    }

    setClearing(true);
    setMessage(null);

    try {
      const result = await window.electronAPI.clearCache();
      if (result.success) {
        setMessage({ type: 'success', text: 'Cache cleared successfully!' });
        await loadCacheStats();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to clear cache' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to clear cache' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="cache-management">
      <h2>Cache Management</h2>
      <p className="settings-description">
        View and manage cached trip data. Cached data helps speed up searches by storing previously fetched trips locally.
      </p>

      {loading ? (
        <div className="cache-loading">Loading cache information...</div>
      ) : cacheStats ? (
        <>
          <div className="cache-stats-grid">
            <div className="cache-stat-card">
              <div className="cache-stat-icon">📊</div>
              <div className="cache-stat-value">{cacheStats.activityCacheCount}</div>
              <div className="cache-stat-label">Activity Caches</div>
            </div>

            <div className="cache-stat-card">
              <div className="cache-stat-icon">🚗</div>
              <div className="cache-stat-value">{cacheStats.tripCacheCount}</div>
              <div className="cache-stat-label">Cached Trips</div>
            </div>

            <div className="cache-stat-card">
              <div className="cache-stat-icon">📄</div>
              <div className="cache-stat-value">{cacheStats.pdfCacheCount}</div>
              <div className="cache-stat-label">Cached PDFs</div>
            </div>

            <div className="cache-stat-card">
              <div className="cache-stat-icon">💾</div>
              <div className="cache-stat-value">{cacheStats.totalSize}</div>
              <div className="cache-stat-label">Total Size</div>
            </div>
          </div>

          <div className="cache-location">
            <strong>Cache Location:</strong>
            <code className="cache-path">{cacheStats.cacheDir}</code>
          </div>

          {message && (
            <div className={`cache-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="cache-actions">
            <button
              className="btn btn-danger"
              onClick={handleClearCache}
              disabled={clearing}
            >
              {clearing ? 'Clearing...' : 'Clear All Cache'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={loadCacheStats}
              disabled={loading || clearing}
            >
              Refresh
            </button>
          </div>
        </>
      ) : (
        <div className="cache-error">Failed to load cache information</div>
      )}
    </div>
  );
}

export default CacheManagement;
