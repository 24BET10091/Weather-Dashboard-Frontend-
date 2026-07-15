import React from 'react';

const aqiLevels = [
  { label: 'Good', detail: 'Perfect for outdoor activity.' },
  { label: 'Moderate', detail: 'Sensitive groups should stay attentive.' },
  { label: 'Unhealthy', detail: 'Avoid prolonged outdoor exposure.' }
];

function AirQualityInsights() {
  return (
    <section id="air-quality" className="insights-card">
      <h2>Air Quality Insights</h2>
      <p>
        The Air Quality Index helps translate complex pollutant data into a simple scale for making safer daily choices.
      </p>
      <div className="level-list">
        {aqiLevels.map((item) => (
          <div className="level-item" key={item.label}>
            <h3>{item.label}</h3>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AirQualityInsights;
