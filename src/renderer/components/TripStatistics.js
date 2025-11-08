import React from 'react';

function TripStatistics({ trips }) {
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

  return (
    <div className="trip-statistics" role="region" aria-label="Trip statistics and metrics">
      <div className="statistics-section">
        <h3 id="trip-summary-heading">Trip Summary</h3>
        <div className="stats-grid" role="list" aria-labelledby="trip-summary-heading">
          <div className="stat-card" role="listitem" tabIndex={0} aria-label={`Total spent: $${totalCost.toFixed(2)}`}>
            <div className="stat-value" aria-hidden="true">${totalCost.toFixed(2)}</div>
            <div className="stat-label" aria-hidden="true">Total Spent</div>
          </div>

          <div className="stat-card" role="listitem" tabIndex={0} aria-label={`Average per trip: $${avgCost.toFixed(2)}`}>
            <div className="stat-value" aria-hidden="true">${avgCost.toFixed(2)}</div>
            <div className="stat-label" aria-hidden="true">Avg per Trip</div>
          </div>

          {totalDistance > 0 && (
            <div className="stat-card" role="listitem" tabIndex={0} aria-label={`Total distance: ${totalDistance.toFixed(1)} miles`}>
              <div className="stat-value" aria-hidden="true">{totalDistance.toFixed(1)} mi</div>
              <div className="stat-label" aria-hidden="true">Total Distance</div>
            </div>
          )}

          {totalDuration > 0 && (
            <div className="stat-card" role="listitem" tabIndex={0} aria-label={`Total ride time: ${totalHours > 0 ? `${totalHours} hours and ${totalMinutes} minutes` : `${totalMinutes} minutes`}`}>
              <div className="stat-value" aria-hidden="true">
                {totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`}
              </div>
              <div className="stat-label" aria-hidden="true">Total Ride Time</div>
            </div>
          )}
        </div>
      </div>

      <div className="statistics-section">
        <h3 id="report-details-heading">Report Details</h3>
        <div className="stats-grid" role="list" aria-labelledby="report-details-heading">
          <div className="stat-card" role="listitem" tabIndex={0} aria-label={`Total trips: ${totalTrips}`}>
            <div className="stat-value" aria-hidden="true">{totalTrips}</div>
            <div className="stat-label" aria-hidden="true">Total Trips</div>
          </div>

          <div className="stat-card" role="listitem" tabIndex={0} aria-label={`Surge trips: ${surgeTrips}, which is ${((surgeTrips / totalTrips) * 100).toFixed(0)} percent`}>
            <div className="stat-value" aria-hidden="true">{surgeTrips}</div>
            <div className="stat-label" aria-hidden="true">Surge Trips</div>
            <div className="stat-detail" aria-hidden="true">{((surgeTrips / totalTrips) * 100).toFixed(0)}%</div>
          </div>

          <div className="stat-card" role="listitem" tabIndex={0} aria-label={`Scheduled trips: ${scheduledTrips}, which is ${((scheduledTrips / totalTrips) * 100).toFixed(0)} percent`}>
            <div className="stat-value" aria-hidden="true">{scheduledTrips}</div>
            <div className="stat-label" aria-hidden="true">Scheduled Trips</div>
            <div className="stat-detail" aria-hidden="true">{((scheduledTrips / totalTrips) * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripStatistics;
