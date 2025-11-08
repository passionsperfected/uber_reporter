import React, { useRef } from 'react';

function DatePicker({ label, value, onChange }) {
  const id = `date-picker-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const dateInputRef = useRef(null);

  // Format date for screen reader announcement
  const formattedDate = value ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'No date selected';

  const handleClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div className="date-picker">
      <label htmlFor={id}>{label}</label>
      <div className="date-picker-wrapper">
        <button
          type="button"
          className="date-picker-button"
          onClick={handleClick}
          aria-label={`${label}. ${formattedDate}. Click to open calendar.`}
        >
          <span className="date-picker-display" aria-hidden="true">
            {value || 'Select date'}
          </span>
          <span className="calendar-icon" aria-hidden="true">📅</span>
        </button>
        <input
          ref={dateInputRef}
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="date-picker-hidden-input"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default DatePicker;
