import React from 'react';

function DatePicker({ label, value, onChange }) {
  return (
    <div className="date-picker">
      <label>{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default DatePicker;
