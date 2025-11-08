import React from 'react';

function TripItem({ tripData, isSelected, onSelect, addressMappings = [] }) {
  const { activity, trip } = tripData;

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

  return (
    <div className={`trip-item ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="trip-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="trip-details">
        <div className="trip-header">
          <span className="trip-date">{date} {time && `at ${time}`}</span>
          <span className="trip-fare">{fare}</span>
        </div>

        <div className="trip-route">
          <div className="trip-location">
            <span className="location-icon">📍</span>
            <span className="location-text">{startLocation}</span>
          </div>
          <div className="route-arrow">→</div>
          <div className="trip-location">
            <span className="location-icon">📍</span>
            <span className="location-text">{endLocation}</span>
          </div>
        </div>

        {trip.vehicleDisplayName && (
          <div className="trip-vehicle">
            <span>Vehicle: {trip.vehicleDisplayName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripItem;
