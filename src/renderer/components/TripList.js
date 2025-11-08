import React from 'react';
import TripItem from './TripItem';

function TripList({ trips, selectedTrips, onTripSelect, settings }) {
  // Filter to only show completed trips
  const completedTrips = trips.filter(t => t.trip && t.trip.status === 'COMPLETED');

  if (completedTrips.length === 0) {
    return (
      <div className="no-trips">
        <p>No completed trips found for the selected date range.</p>
      </div>
    );
  }

  return (
    <div className="trip-list">
      {completedTrips.map((tripData) => {
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
