import React, { useState } from 'react';

function TripStatistics({ trips, settings }) {
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(null);
  // Filter completed trips
  const completedTrips = trips.filter(t => t.trip && t.trip.status === 'COMPLETED');

  if (completedTrips.length === 0) {
    return null;
  }

  // Calculate metrics
  const totalTrips = completedTrips.length;

  // Parse fare and calculate totals
  const totalCost = completedTrips.reduce((sum, t) => {
    const fareStr = t.trip.fare || '$0.00';
    const fareNum = parseFloat(fareStr.replace(/[$,]/g, ''));
    return sum + (isNaN(fareNum) ? 0 : fareNum);
  }, 0);

  const avgCost = totalCost / totalTrips;

  // Calculate total distance (if available)
  const totalDistance = completedTrips.reduce((sum, t) => {
    const distanceStr = t.trip.distanceLabel || '0';
    const distanceNum = parseFloat(distanceStr.replace(/[^\d.]/g, ''));
    return sum + (isNaN(distanceNum) ? 0 : distanceNum);
  }, 0);

  // Calculate total ride time (if available)
  const totalDuration = completedTrips.reduce((sum, t) => {
    const duration = t.trip.duration || 0;
    return sum + duration;
  }, 0);
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMinutes = Math.floor((totalDuration % 3600) / 60);

  // Trip type counts
  const surgeTrips = completedTrips.filter(t => t.trip.isSurgeTrip).length;
  const scheduledTrips = completedTrips.filter(t => t.trip.isScheduledRide).length;

  // Date range
  const dates = completedTrips
    .map(t => {
      const subtitle = t.activity.subtitle || '';
      const dateStr = subtitle.split(' • ')[0];
      return new Date(dateStr + ' ' + new Date().getFullYear());
    })
    .filter(d => !isNaN(d.getTime()));

  const earliestDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
  const latestDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;
  const daySpan = earliestDate && latestDate
    ? Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const handleGenerateReport = async () => {
    // Check if report config is set
    if (!settings.reportConfig?.name || !settings.reportConfig?.vendorNumber) {
      setMessage({ type: 'error', text: 'Please configure your report settings first (Settings → Report)' });
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      const dirResult = await window.electronAPI.selectDirectory();

      if (!dirResult.success) {
        setGenerating(false);
        return;
      }

      const result = await window.electronAPI.generateReport(
        trips,
        settings.reportConfig,
        dirResult.path
      );

      if (result.success) {
        setMessage({ type: 'success', text: `Report generated successfully!\n\nSaved to: ${result.reportPath}` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to generate report' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to generate report' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="trip-statistics">
      <div className="statistics-section">
        <h3>Trip Summary</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">${totalCost.toFixed(2)}</div>
            <div className="stat-label">Total Spent</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">${avgCost.toFixed(2)}</div>
            <div className="stat-label">Avg per Trip</div>
          </div>

          {totalDistance > 0 && (
            <div className="stat-card">
              <div className="stat-value">{totalDistance.toFixed(1)} mi</div>
              <div className="stat-label">Total Distance</div>
            </div>
          )}

          {totalDuration > 0 && (
            <div className="stat-card">
              <div className="stat-value">
                {totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`}
              </div>
              <div className="stat-label">Total Ride Time</div>
            </div>
          )}
        </div>
      </div>

      <div className="statistics-section">
        <h3>Report Details</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalTrips}</div>
            <div className="stat-label">Total Trips</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{surgeTrips}</div>
            <div className="stat-label">Surge Trips</div>
            <div className="stat-detail">{((surgeTrips / totalTrips) * 100).toFixed(0)}%</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{scheduledTrips}</div>
            <div className="stat-label">Scheduled Trips</div>
            <div className="stat-detail">{((scheduledTrips / totalTrips) * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`report-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="report-actions">
        <button
          className="btn btn-primary"
          onClick={handleGenerateReport}
          disabled={generating}
        >
          {generating ? 'Generating Report...' : '📄 Generate Travel Report'}
        </button>
      </div>
    </div>
  );
}

export default TripStatistics;
