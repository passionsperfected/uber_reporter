import React, { useState } from 'react';
import DatePicker from './DatePicker';
import TripList from './TripList';
import TripStatistics from './TripStatistics';

function DownloadTab({ settings }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTrips, setSelectedTrips] = useState(new Set());
  const [downloading, setDownloading] = useState(false);
  const [activeView, setActiveView] = useState('trips');

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError(null);
    setTrips([]);
    setSelectedTrips(new Set());

    try {
      const result = await window.electronAPI.fetchTrips(startDate, endDate, settings.browserType);

      if (result.success) {
        setTrips(result.trips);
      } else {
        setError(result.error || 'Failed to fetch trips');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching trips');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedTrips.size === trips.length) {
      setSelectedTrips(new Set());
    } else {
      const allTripUUIDs = trips
        .filter(t => t.trip && t.trip.status === 'COMPLETED')
        .map(t => t.trip.jobUUID || t.activity.uuid);
      setSelectedTrips(new Set(allTripUUIDs));
    }
  };

  const handleTripSelect = (uuid) => {
    const newSelected = new Set(selectedTrips);
    if (newSelected.has(uuid)) {
      newSelected.delete(uuid);
    } else {
      newSelected.add(uuid);
    }
    setSelectedTrips(newSelected);
  };

  const handleDownload = async () => {
    if (selectedTrips.size === 0) {
      setError('Please select at least one trip to download');
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      // Ask user to select output directory
      const dirResult = await window.electronAPI.selectDirectory();

      if (!dirResult.success) {
        setDownloading(false);
        return;
      }

      const result = await window.electronAPI.downloadReceipts(
        Array.from(selectedTrips),
        settings.browserType,
        dirResult.path
      );

      if (result.success) {
        alert(`Successfully downloaded and merged ${selectedTrips.size} receipts!\n\nMerged PDF: ${result.mergedPath}`);
      } else {
        setError(result.error || 'Failed to download receipts');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while downloading receipts');
    } finally {
      setDownloading(false);
    }
  };

  const completedTrips = trips.filter(t => t.trip && t.trip.status === 'COMPLETED');

  return (
    <div className="download-tab">
      <h2>Download Receipts</h2>
      <p className="tab-description">
        Select a date range to fetch your Uber trips, then download and merge receipts.
      </p>

      <div className="controls">
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={setStartDate}
        />

        <DatePicker
          label="End Date"
          value={endDate}
          onChange={setEndDate}
        />

        <button
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={loading || !startDate || !endDate}
        >
          {loading ? 'Searching...' : 'Search Trips'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {trips.length > 0 && (
        <>
          <div className="trip-toolbar">
            <button
              className={`toolbar-btn ${activeView === 'trips' ? 'active' : ''}`}
              onClick={() => setActiveView('trips')}
            >
              Trips
            </button>
            <button
              className={`toolbar-btn ${activeView === 'metrics' ? 'active' : ''}`}
              onClick={() => setActiveView('metrics')}
            >
              Metrics
            </button>
          </div>

          {activeView === 'trips' && (
            <>
              <div className="trip-controls">
                <button
                  className="btn btn-secondary"
                  onClick={handleSelectAll}
                >
                  {selectedTrips.size === completedTrips.length ? 'Deselect All' : 'Select All'}
                </button>

                <span className="trip-count">
                  {selectedTrips.size} of {completedTrips.length} trips selected
                </span>

                <button
                  className="btn btn-success"
                  onClick={handleDownload}
                  disabled={selectedTrips.size === 0 || downloading}
                >
                  {downloading ? 'Downloading...' : 'Download & Merge'}
                </button>
              </div>

              <TripList
                trips={trips}
                selectedTrips={selectedTrips}
                onTripSelect={handleTripSelect}
                settings={settings}
              />
            </>
          )}

          {activeView === 'metrics' && (
            <TripStatistics trips={trips} settings={settings} />
          )}
        </>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading trips...</p>
        </div>
      )}
    </div>
  );
}

export default DownloadTab;
