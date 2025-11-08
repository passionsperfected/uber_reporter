import React, { useState, useEffect } from 'react';
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
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (reportMessage) {
      const timer = setTimeout(() => {
        setReportMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [reportMessage]);

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

  const handleGenerateReport = async () => {
    if (selectedTrips.size === 0) {
      setError('Please select at least one trip to generate report');
      return;
    }

    // Check if report config is set
    if (!settings.reportConfig?.name || !settings.reportConfig?.vendorNumber) {
      setError('Please configure your report settings first (Settings → Report)');
      return;
    }

    setGeneratingReport(true);
    setError(null);
    setReportMessage(null);

    try {
      const dirResult = await window.electronAPI.selectDirectory();

      if (!dirResult.success) {
        setGeneratingReport(false);
        return;
      }

      // Filter trips to only include selected ones
      const selectedTripsData = trips.filter(t => {
        const uuid = t.trip?.jobUUID || t.activity?.uuid;
        return selectedTrips.has(uuid);
      });

      const result = await window.electronAPI.generateReport(
        selectedTripsData,
        { ...settings.reportConfig, addressMappings: settings.addressMappings },
        dirResult.path
      );

      if (result.success) {
        setReportMessage(`Report generated successfully!\n\nSaved to: ${result.reportPath}`);
      } else {
        setError(result.error || 'Failed to generate report');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const completedTrips = trips.filter(t => t.trip && t.trip.status === 'COMPLETED');

  return (
    <div className="download-tab">
      {reportMessage && (
        <div
          className="notification success"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="notification-content">
            <span className="notification-icon" aria-hidden="true">✓</span>
            <div className="notification-text">{reportMessage}</div>
            <button
              className="notification-close"
              onClick={() => setReportMessage(null)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <h2 id="download-heading">Download Receipts</h2>
      <p className="tab-description" id="download-description">
        Select a date range to fetch your Uber trips, then download and merge receipts.
      </p>

      <div className="controls" role="search" aria-labelledby="download-heading">
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
          aria-label={loading ? 'Searching for trips, please wait' : 'Search for trips in selected date range'}
          aria-busy={loading}
        >
          {loading ? 'Searching...' : 'Search Trips'}
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      {trips.length > 0 && (
        <>
          <div className="trip-toolbar" role="tablist" aria-label="Trip views">
            <button
              className={`toolbar-btn ${activeView === 'trips' ? 'active' : ''}`}
              onClick={() => setActiveView('trips')}
              role="tab"
              aria-selected={activeView === 'trips'}
              aria-controls="trips-panel"
              id="trips-tab"
            >
              Trips
            </button>
            <button
              className={`toolbar-btn ${activeView === 'metrics' ? 'active' : ''}`}
              onClick={() => setActiveView('metrics')}
              role="tab"
              aria-selected={activeView === 'metrics'}
              aria-controls="metrics-panel"
              id="metrics-tab"
            >
              Metrics
            </button>
          </div>

          {activeView === 'trips' && (
            <>
              <div
                className="trip-controls"
                role="toolbar"
                aria-label="Trip actions"
                id="trips-panel"
                role="tabpanel"
                aria-labelledby="trips-tab"
              >
                <button
                  className="btn btn-secondary"
                  onClick={handleSelectAll}
                  aria-label={selectedTrips.size === completedTrips.length ? `Deselect all ${completedTrips.length} trips` : `Select all ${completedTrips.length} trips`}
                >
                  {selectedTrips.size === completedTrips.length ? 'Deselect All' : 'Select All'}
                </button>

                <span className="trip-count" role="status" aria-live="polite" aria-atomic="true">
                  {selectedTrips.size} of {completedTrips.length} trips selected
                </span>

                <button
                  className="btn btn-success"
                  onClick={handleDownload}
                  disabled={selectedTrips.size === 0 || downloading}
                  aria-label={downloading ? `Downloading ${selectedTrips.size} receipts, please wait` : `Download and merge ${selectedTrips.size} selected receipt${selectedTrips.size !== 1 ? 's' : ''}`}
                  aria-busy={downloading}
                >
                  {downloading ? 'Downloading...' : 'Download & Merge'}
                </button>

                <button
                  className="btn btn-primary"
                  onClick={handleGenerateReport}
                  disabled={selectedTrips.size === 0 || generatingReport}
                  aria-label={generatingReport ? `Generating report for ${selectedTrips.size} trips, please wait` : `Generate travel report for ${selectedTrips.size} selected trip${selectedTrips.size !== 1 ? 's' : ''}`}
                  aria-busy={generatingReport}
                >
                  <span aria-hidden="true">📄</span> {generatingReport ? 'Generating...' : 'Generate Report'}
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
            <div id="metrics-panel" role="tabpanel" aria-labelledby="metrics-tab">
              <TripStatistics trips={trips} />
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="loading" role="status" aria-live="polite" aria-label="Loading trips">
          <div className="spinner" aria-hidden="true"></div>
          <p>Loading trips...</p>
        </div>
      )}

      {downloading && (
        <div className="loading-overlay" role="dialog" aria-modal="true" aria-labelledby="download-status">
          <div className="loading-modal">
            <div className="spinner" aria-hidden="true"></div>
            <p id="download-status">Downloading and merging receipts...</p>
            <div className="loading-details" role="status" aria-live="polite">
              Processing {selectedTrips.size} receipt{selectedTrips.size !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {generatingReport && (
        <div className="loading-overlay" role="dialog" aria-modal="true" aria-labelledby="report-status">
          <div className="loading-modal">
            <div className="spinner" aria-hidden="true"></div>
            <p id="report-status">Generating travel report...</p>
            <div className="loading-details" role="status" aria-live="polite">
              Processing {selectedTrips.size} trip{selectedTrips.size !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DownloadTab;
