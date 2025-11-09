import React from 'react';

function TripItem({ tripData, isSelected, onSelect, addressMappings = [] }) {
  const { activity, trip } = tripData;
  const tripId = trip.jobUUID || activity.uuid;

  // Parse date from subtitle (format: "Nov 07 • 10:30 AM")
  const date = activity.subtitle ? activity.subtitle.split(' • ')[0] : 'N/A';
  const time = activity.subtitle ? activity.subtitle.split(' • ')[1] : '';

  // Helper function to get display name for an address
  const getDisplayName = (address) => {
    if (addressMappings.length === 0) {
      return address;
    }
    // Try exact match first
    let mapping = addressMappings.find(m => m.address === address);
    // If no exact match, try partial match
    if (!mapping) {
      mapping = addressMappings.find(m => address.includes(m.address) || m.address.includes(address));
    }
    return mapping ? mapping.displayName : address;
  };

  // Get start and end locations (with mappings if available)
  const startLocationRaw = trip.waypoints && trip.waypoints.length > 0
    ? trip.waypoints[0]
    : 'Unknown';
  const endLocationRaw = trip.waypoints && trip.waypoints.length > 1
    ? trip.waypoints[1]
    : 'Unknown';

  const startLocation = getDisplayName(startLocationRaw);
  const endLocation = getDisplayName(endLocationRaw);

  // Get fare
  const fare = trip.fare || 'N/A';

  // Create comprehensive description for screen readers
  const tripDescription = `${date}${time ? ` at ${time}` : ''}, from ${startLocation} to ${endLocation}, fare ${fare}${trip.vehicleDisplayName ? `, vehicle ${trip.vehicleDisplayName}` : ''}`;

  return (
    <div className={`trip-item ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="trip-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          aria-label={tripDescription}
        />
      </div>

      <div className="trip-details">
        <div className="trip-header">
          <span className="trip-date" aria-hidden="true">
            {date} {time && `at ${time}`}
          </span>
          <div className="trip-header-right" aria-hidden="true">
            <span className={`trip-status-badge status-${trip.status?.toLowerCase()}`}>
              {trip.status}
            </span>
            <span className="trip-fare">
              {fare}
            </span>
          </div>
        </div>

        <div className="trip-route">
          <div className="trip-location">
            <span className="location-icon" aria-hidden="true">📍</span>
            <span className="location-text" aria-hidden="true">{startLocation}</span>
          </div>
          <div className="route-arrow" aria-hidden="true">→</div>
          <div className="trip-location">
            <span className="location-icon" aria-hidden="true">📍</span>
            <span className="location-text" aria-hidden="true">{endLocation}</span>
          </div>
        </div>

        {trip.vehicleDisplayName && (
          <div className="trip-vehicle" aria-hidden="true">
            <span>Vehicle: {trip.vehicleDisplayName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripItem;
