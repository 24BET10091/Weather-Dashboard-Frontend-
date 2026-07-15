import React from 'react';
import Navbar from './components/Navbar';
import WeatherDashboard from './components/WeatherDashboard';
import AirQualityInsights from './components/AirQualityInsights';

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <WeatherDashboard />
        <AirQualityInsights />
      </main>
    </div>
  );
}

export default App;
