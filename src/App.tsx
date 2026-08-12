// @ts-nocheck
import React, { useState, useEffect } from 'react';
import './App.css';

export default function AgeResponsiveSmartHome() {
  
  // =========================================================================
  //  LAYER 1: THE DATA LAYER (Local Storage & State Management)
  //  This section replaces a traditional cloud database.
  // It securely stores the user's device states, temperature preferences, 
  // and daily habits directly on their physical tablet, ensuring absolute 
  // data sovereignty and zero-latency performance.
  // =========================================================================
  const [deviceStates, setDeviceStates] = useState(() => {
    const savedStates = localStorage.getItem('smartHomeStates');
    return savedStates ? JSON.parse(savedStates) : {
      livingRoomLamp: false,
      television: false,
      airConditioner: false,
      bedsideLamp: false,
      bedroomFan: true, 
      kitchenLights: false,
      kettle: false,
      frontDoor: true,
    };
  });

  const [acTemp, setAcTemp] = useState(() => {
    const savedTemp = localStorage.getItem('smartHomeTemp');
    return savedTemp ? parseInt(savedTemp) : 22;
  });

  const [habitLog, setHabitLog] = useState(() => {
    const savedLog = localStorage.getItem('smartHomeHabits');
    return savedLog ? JSON.parse(savedLog) : [];
  });

  const [lastAction, setLastAction] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [activeFilter, setActiveFilter] = useState('Everything');

  useEffect(() => {
    localStorage.setItem('smartHomeStates', JSON.stringify(deviceStates));
  }, [deviceStates]);

  useEffect(() => {
    localStorage.setItem('smartHomeTemp', acTemp.toString());
  }, [acTemp]);

  useEffect(() => {
    localStorage.setItem('smartHomeHabits', JSON.stringify(habitLog));
  }, [habitLog]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  // =========================================================================
  //  LAYER 2: THE LOGIC LAYER (Device Control, Audio & Error Recovery)
  //  This executes the core actions. When a user taps 
  // a button, this layer instantly updates the UI, triggers an offline audio 
  // confirmation for accessibility, logs the interaction for the AI, and 
  // deploys the 10-second "Undo" toast to prevent technological anxiety.
  // =========================================================================
  const toggleDevice = (deviceKey, deviceName) => {
    const newState = !deviceStates[deviceKey];
    const previousState = { ...deviceStates };
    
    setLastAction({ previousState, deviceName });
    setDeviceStates(prev => ({ ...prev, [deviceKey]: newState }));

    if ('speechSynthesis' in window) {
      let statusSpeech = newState ? "ON" : "OFF";
      if (deviceKey === 'frontDoor') statusSpeech = newState ? "LOCKED" : "UNLOCKED";
      const speech = new SpeechSynthesisUtterance(`${deviceName} is now ${statusSpeech}`);
      window.speechSynthesis.speak(speech);
    }

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
    }, 8000); 
  };

  const executeUndo = () => {
    if (lastAction) {
      setDeviceStates(lastAction.previousState); 
      setShowUndo(false);
      setLastAction(null);
    }
  };

  const changeTemp = (e, amount) => {
    e.stopPropagation(); 
    setAcTemp(prev => prev + amount);
  };

  // =========================================================================
  //  LAYER 3: PREDICTIVE AI MODULE (Pattern Recognition Engine)
  //  This is our localized heuristic AI. It scans the 
  // user's habit log to calculate their most frequent action for the current 
  // time of day. It dynamically prepares the suggestion banner to reduce 
  // cognitive load, without ever sending data to an external server.
  // =========================================================================
 const getPredictiveSuggestion = () => {
    const currentHour = currentTime.getHours();
    
    const habitsThisHour = habitLog.filter(log => {
      return new Date(log.time).getHours() === currentHour;
    });

    if (habitsThisHour.length === 0) return null;

    const frequency = {};
    habitsThisHour.forEach(log => {
      const patternKey = `${log.deviceKey}|${log.state}|${log.device}`;
      frequency[patternKey] = (frequency[patternKey] || 0) + 1;
    });

    const topPattern = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
    const [deviceKey, expectedState, deviceName] = topPattern.split('|');

    const isCurrentlyOn = deviceStates[deviceKey];
    const needsToTurnOn = expectedState === "ON" && !isCurrentlyOn;
    const needsToTurnOff = expectedState === "OFF" && isCurrentlyOn;

    if (needsToTurnOn || needsToTurnOff) {
      let actionWord = expectedState === "ON" ? "turn on" : "turn off";
      if (deviceKey === 'frontDoor') {
         actionWord = expectedState === "ON" ? "lock" : "unlock";
      }

      return {
        message: `You usually ${actionWord} the ${deviceName} around this time.`,
        action: () => toggleDevice(deviceKey, deviceName)
      };
    }
    
    return null; 
  };

  const aiSuggestion = getPredictiveSuggestion();

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // =========================================================================
  //  LAYER 4: THE PRESENTATION LAYER (Age-Responsive Interface)
  //  This renders the visual UI based on our accessibility 
  // guidelines. It applies Fitts's Law through massive touch targets and utilizes 
  // the Gestalt Principle of Proximity by flattening the navigation into a 
  // single, scroll-free layout, completely eliminating deep menus.
  // =========================================================================
return (
    <div className="app-wrapper">
      
      <header className="app-header">
        <div className="greeting-container">
          <h2>{greeting}.</h2>
          <div className="status-row">
            <p className="time-display">It is currently {timeString}.</p>
            <div className="connected-badge">
              <span className="pulse-dot"></span>
              All devices connected
            </div>
          </div>
        </div>
      </header>

      <nav className="filter-scroll">
        {['Everything', 'Living Room', 'Bedroom', 'Kitchen', 'Front Door'].map(category => (
          <button 
            key={category}
            className={`filter-pill ${activeFilter === category ? 'active' : ''}`}
            onClick={() => setActiveFilter(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        
        {aiSuggestion && activeFilter === 'Everything' && (
          <div className="ai-banner" onClick={aiSuggestion.action}>
            <div className="ai-icon">✨</div>
            <div className="ai-text">
              <strong>Suggestion</strong>
              <span>{aiSuggestion.message} Tap to apply.</span>
            </div>
          </div>
        )}
        
        <div className="device-grid">
          
          {/* Living Room Lamp */}
          {(activeFilter === 'Everything' || activeFilter === 'Living Room') && (
            <div className={`device-card ${deviceStates.livingRoomLamp ? 'active' : 'inactive'}`} onClick={() => toggleDevice('livingRoomLamp', 'Living Room Lamp')}>
              <div className="card-icon">💡</div>
              <div className="card-info">
                <span className="device-title">Living Room Lamp</span>
                <span className="device-category">Living Room</span>
              </div>
              <div className="status-badge">{deviceStates.livingRoomLamp ? 'ON' : 'OFF'}</div>
            </div>
          )}

          {/* Television */}
          {(activeFilter === 'Everything' || activeFilter === 'Living Room') && (
            <div className={`device-card ${deviceStates.television ? 'active' : 'inactive'}`} onClick={() => toggleDevice('television', 'Television')}>
              <div className="card-icon">📺</div>
              <div className="card-info">
                <span className="device-title">Television</span>
                <span className="device-category">Living Room</span>
              </div>
              <div className="status-badge">{deviceStates.television ? 'ON' : 'OFF'}</div>
            </div>
          )}

          {/* Expanding Air Conditioner */}
          {(activeFilter === 'Everything' || activeFilter === 'Living Room') && (
            <div className={`device-card ${deviceStates.airConditioner ? 'active' : 'inactive'}`} onClick={() => toggleDevice('airConditioner', 'Air Conditioner')}>
              <div className="card-main">
                <div className="card-icon">❄️</div>
                <div className="card-info">
                  <span className="device-title">Air Conditioner</span>
                  <span className="device-category">Living Room</span>
                </div>
                <div className="status-badge">{deviceStates.airConditioner ? 'ON' : 'OFF'}</div>
              </div>
              
              {deviceStates.airConditioner && (
                <div className="card-expanded" onClick={(e) => e.stopPropagation()}>
                  <button className="temp-btn" onClick={(e) => changeTemp(e, -1)}>–</button>
                  <span className="temp-display">{acTemp}°C</span>
                  <button className="temp-btn" onClick={(e) => changeTemp(e, 1)}>+</button>
                </div>
              )}
            </div>
          )}

          {/* Bedroom Lights (Updated Icon) */}
          {(activeFilter === 'Everything' || activeFilter === 'Bedroom') && (
            <div className={`device-card ${deviceStates.bedsideLamp ? 'active' : 'inactive'}`} onClick={() => toggleDevice('bedsideLamp', 'Bedroom Lights')}>
              <div className="card-icon">💡</div>
              <div className="card-info">
                <span className="device-title">Bedroom Lights</span>
                <span className="device-category">Bedroom</span>
              </div>
              <div className="status-badge">{deviceStates.bedsideLamp ? 'ON' : 'OFF'}</div>
            </div>
          )}

          {/* Bedroom Fan (Updated Icon) */}
          {(activeFilter === 'Everything' || activeFilter === 'Bedroom') && (
            <div className={`device-card ${deviceStates.bedroomFan ? 'active' : 'inactive'}`} onClick={() => toggleDevice('bedroomFan', 'Bedroom Fan')}>
              <div className="card-icon">🌀</div>
              <div className="card-info">
                <span className="device-title">Bedroom Fan</span>
                <span className="device-category">Bedroom</span>
              </div>
              <div className="status-badge">{deviceStates.bedroomFan ? 'ON' : 'OFF'}</div>
            </div>
          )}

          {/* Kitchen Lights */}
          {(activeFilter === 'Everything' || activeFilter === 'Kitchen') && (
            <div className={`device-card ${deviceStates.kitchenLights ? 'active' : 'inactive'}`} onClick={() => toggleDevice('kitchenLights', 'Kitchen Lights')}>
              <div className="card-icon">💡</div>
              <div className="card-info">
                <span className="device-title">Kitchen Lights</span>
                <span className="device-category">Kitchen</span>
              </div>
              <div className="status-badge">{deviceStates.kitchenLights ? 'ON' : 'OFF'}</div>
            </div>
          )}

          {/* Kettle */}
          {(activeFilter === 'Everything' || activeFilter === 'Kitchen') && (
            <div className={`device-card ${deviceStates.kettle ? 'active' : 'inactive'}`} onClick={() => toggleDevice('kettle', 'Kettle')}>
              <div className="card-icon">☕</div>
              <div className="card-info">
                <span className="device-title">Kettle</span>
                <span className="device-category">Kitchen</span>
              </div>
              <div className="status-badge">{deviceStates.kettle ? 'ON' : 'OFF'}</div>
            </div>
          )}

          {/* Front Door */}
          {(activeFilter === 'Everything' || activeFilter === 'Front Door') && (
            <div className={`device-card ${deviceStates.frontDoor ? 'active' : 'inactive'}`} onClick={() => toggleDevice('frontDoor', 'Front Door')}>
              <div className="card-icon">🔒</div>
              <div className="card-info">
                <span className="device-title">Front Door</span>
                <span className="device-category">Front Door</span>
              </div>
              <div className="status-badge">{deviceStates.frontDoor ? 'LOCKED' : 'UNLOCKED'}</div>
            </div>
          )}

        </div>
      </main>

      {showUndo && (
        <div className="undo-toast">
          <span><strong>{lastAction?.deviceName}</strong> was changed.</span>
          <button className="undo-button" onClick={executeUndo}>Undo</button>
        </div>
      )}
    </div>
  );
}
