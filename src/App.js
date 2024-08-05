import React from 'react';
import './App.css';
import PendulumSimulation from './PendulumSimulation';

const App = () => {
  return (
    <div className="app-container">
      <div className="main-content">
        <div className="controls-box">
          {/* Your controls here */}
        </div>
        <PendulumSimulation />
        <div>
        </div>
      </div>
    </div>
  );
};

export default App;
