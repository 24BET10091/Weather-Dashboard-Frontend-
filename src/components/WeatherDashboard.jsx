import React from 'react';

function WeatherDashboard() {
  return (
    <section id="dashboard" className="dashboard-card">
      <div className="dashboard-header">
        <h1>Weather Dashboard</h1>
        <p>Live weather, forecasts, and air quality insights in one view.</p>
      </div>
      <div className="dashboard-grid">
        <article className="panel">
          <h2>Current Conditions</h2>
          <p>Sunny skies, 31°C, light breezes.</p>
        </article>
        <article className="panel">
          <h2>Forecast</h2>
          <p>Clear mornings, mild evenings, low precipitation.</p>
        </article>
        <article className="panel">
          <h2>Highlights</h2>
          <p>Humidity, pressure, wind, and air quality summaries.</p>
        </article>
      </div>
    </section>
  );
}

export default WeatherDashboard;
