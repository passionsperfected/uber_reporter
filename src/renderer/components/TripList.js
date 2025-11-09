import React from 'react';
import TripItem from './TripItem';

function TripList({ trips, selectedTrips, onTripSelect, settings }) {
  if (trips.length === 0) {
    return (
      <div className="no-trips" role="status" aria-live="polite">
        <p>No trips found for the selected date range and status filters.</p>
      </div>
    );
  }

  return (
    <div
      className="trip-list"
      role="group"
      aria-label={`${trips.length} trip${trips.length !== 1 ? 's' : ''}`}
    >
      {trips.map((tripData) => {
        const uuid = tripData.trip.jobUUID || tripData.activity.uuid;
        return (
          <TripItem
            key={uuid}
            tripData={tripData}
            isSelected={selectedTrips.has(uuid)}
            onSelect={() => onTripSelect(uuid)}
            addressMappings={settings.addressMappings}
          />
        );
      })}
    </div>
  );
}

export default TripList;
