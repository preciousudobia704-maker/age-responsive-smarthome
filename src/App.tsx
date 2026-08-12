// @ts-nocheck
import React, { useState, useEffect } from 'react';
import './App.css';

export default function AgeResponsiveSmartHome() {
  // --------------------------------------------------------
  // DATA LAYER
  // --------------------------------------------------------
  const [deviceStates, setDeviceStates] = useState(() => {
    const savedStates = localStorage.getItem('smartHomeStates');
    return savedStates ? JSON.parse(savedStates) : {
      livingRoomLight: false,
      bedroomFan: false,
      frontDoorLock: true,
    };
  });

  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('smartHomeSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      simpleModeActive: true
    };
  });

  const [lastAction, setLastAction] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [habitLog, setHabitLog] = useState(() => {
    const savedLog = localStorage.getItem('smartHomeHabits');
    return savedLog ? JSON.parse(savedLog) : [];
  });

  // Keep the clock updated for the greeting
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('smartHomeStates', JSON.stringify(deviceStates));
  }, [deviceStates]);

  useEffect(() => {
    localStorage.setItem('smartHomeSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('smartHomeHabits', JSON.stringify(habitLog));
  }, [habitLog]);

  // --------------------------------------------------------
  // LOGIC LAYER
  // --------------------------------------------------------
  const toggleDevice = (deviceKey, deviceName) => {
    const newState = !deviceStates[deviceKey];
    const previousState = { ...deviceStates };
    
    setLastAction({ previousState, deviceName });
    setDeviceStates(prev => ({ ...prev, [deviceKey]: newState }));

    const newLogEntry = {
      device: deviceName,
      deviceKey: deviceKey,
      state: newState ? "ON" : "OFF",
      time: new Date().toISOString() 
    };
    setHabitLog(prevLog => [...prevLog, newLogEntry]);

    setShowUndo(true);
    setTimeout(() => {
      setShowUndo(false);
      setLastAction(null);
    }, 5000);
  };

  const executeUndo = () => {
    if (lastAction) {
      setDeviceStates(lastAction.previousState); 
      setShowUndo(false);
      setLastAction(null);
    }
  };

  const toggleSimpleMode = () => {
    setSettings(prev => ({ ...prev, simpleModeActive: !prev.simpleModeActive }));
  };

  // --------------------------------------------------------
  // PREDICTIVE AI MODULE (Advanced Pattern Recognition)
  // --------------------------------------------------------
  const getPredictiveSuggestion = () => {
    const currentHour = currentTime.getHours();
    
    // 1. Find all actions (ON or OFF) that happened in this hour historically
    const habitsThisHour = habitLog.filter(log => {
      const logHour = new Date(log.time).getHours();
      return logHour === currentHour;
    });

    if (habitsThisHour.length === 0) return null;

    // 2. Count them to find the true "pattern" (the most frequent action)
    const frequency = {};
    habitsThisHour.forEach(log => {
      const patternKey = `${log.deviceKey}|${log.state}|${log.device}`;
      frequency[patternKey] = (frequency[patternKey] || 0) + 1;
    });

    // 3. Identify the most repeated action for this specific time period
    const topPattern = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
    const [deviceKey, expectedState, deviceName] = topPattern.split('|');

    // 4. Check if the device needs to be changed to match the pattern
    const isCurrentlyOn = deviceStates[deviceKey];
    const needsToTurnOn = expectedState === "ON" && !isCurrentlyOn;
    const needsToTurnOff = expectedState === "OFF" && isCurrentlyOn;

    if (needsToTurnOn || needsToTurnOff) {
      // Make the phrasing context-aware (lock vs light)
      let actionWord = expectedState === "ON" ? "turn on" : "turn off";
      if (deviceKey === 'frontDoorLock') {
         actionWord = expectedState === "ON" ? "unlock" : "lock";
      }

      return {
        message: `You usually ${actionWord} the ${deviceName} around this time.`,
        action: () => toggleDevice(deviceKey, deviceName)
      };
    }
    
    return null; 
  };
  const aiSuggestion = getPredictiveSuggestion();

  // Dynamic Greeting Logic
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --------------------------------------------------------
  // PRESENTATION LAYER 
  // --------------------------------------------------------
  return (
    <div className={`app-wrapper ${settings.simpleModeActive ? 'simple-mode' : 'advanced-mode'}`}>
      
      {/* Top Header & Settings */}
      <header className="app-header">
        <div className="greeting-container">
          <h2>{greeting}.</h2>
          <p className="time-display">It is currently {timeString}.</p>
        </div>
        <button className="settings-toggle" onClick={toggleSimpleMode}>
          {settings.simpleModeActive ? 'Standard View' : 'Simple View'}
        </button>
      </header>

      <main className="dashboard-content">
        {/* Predictive AI Banner */}
        {aiSuggestion && (
          <div className="ai-banner" onClick={aiSuggestion.action}>
            <div className="ai-icon">✨</div>
            <div className="ai-text">
              <strong>Suggestion</strong>
              <span>{aiSuggestion.message} Tap to apply.</span>
            </div>
          </div>
        )}

        {/* Section Headers organize the space */}
        <h3 className="section-title">Home Controls</h3>
        
        <div className="device-grid">
          {/* Lighting */}
          <button 
            className={`device-card ${deviceStates.livingRoomLight ? 'active' : 'inactive'}`}
            onClick={() => toggleDevice('livingRoomLight', 'Living Room Light')}
          >
            <div className="card-info">
              <span className="device-title">Living Room Light</span>
              <span className="device-category">Lighting</span>
            </div>
            <span className="device-status">
              {deviceStates.livingRoomLight ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Climate */}
          <button 
            className={`device-card ${deviceStates.bedroomFan ? 'active' : 'inactive'}`}
            onClick={() => toggleDevice('bedroomFan', 'Bedroom Fan')}
          >
            <div className="card-info">
              <span className="device-title">Bedroom Fan</span>
              <span className="device-category">Climate</span>
            </div>
            <span className="device-status">
              {deviceStates.bedroomFan ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Security */}
          <button 
            className={`device-card ${deviceStates.frontDoorLock ? 'active' : 'inactive'}`}
            onClick={() => toggleDevice('frontDoorLock', 'Front Door Lock')}
          >
            <div className="card-info">
              <span className="device-title">Front Door</span>
              <span className="device-category">Security</span>
            </div>
            <span className="device-status">
              {deviceStates.frontDoorLock ? 'UNLOCKED' : 'LOCKED'}
            </span>
          </button>
        </div>
      </main>

      {/* Graceful Error Recovery */}
      {showUndo && (
        <div className="undo-toast">
          <span><strong>{lastAction?.deviceName}</strong> was changed.</span>
          <button className="undo-button" onClick={executeUndo}>Undo</button>
        </div>
      )}
    </div>
  );
}
