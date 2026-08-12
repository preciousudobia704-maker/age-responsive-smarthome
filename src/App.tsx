import React, { useState, useEffect } from "react";
import "./app.css"; // High-contrast styles

export default function AgeResponsiveSmartHome() {
  // --------------------------------------------------------
  // 1. DATA LAYER (Local Storage Initialization)
  // --------------------------------------------------------
  const [deviceStates, setDeviceStates] = useState(() => {
    const savedStates = localStorage.getItem("smartHomeStates");
    return savedStates
      ? JSON.parse(savedStates)
      : {
          livingRoomLight: false,
          bedroomFan: false,
          frontDoorLock: true,
        };
  });

  const [lastAction, setLastAction] = useState(null);
  const [showUndo, setShowUndo] = useState(false);

  // Sync state changes directly to local storage for offline persistence
  useEffect(() => {
    localStorage.setItem("smartHomeStates", JSON.stringify(deviceStates));
  }, [deviceStates]);
  // Add the dynamic habit log to Local Storage
  const [habitLog, setHabitLog] = useState(() => {
    const savedLog = localStorage.getItem("smartHomeHabits");
    return savedLog ? JSON.parse(savedLog) : [];
  });

  useEffect(() => {
    localStorage.setItem("smartHomeHabits", JSON.stringify(habitLog));
  }, [habitLog]);
  // --------------------------------------------------------
  // 2. LOGIC LAYER (Controllers & Error Recovery)
  // --------------------------------------------------------
  const toggleDevice = (deviceKey, deviceName) => {
    const newState = !deviceStates[deviceKey];

    // Save current state to the Undo stack
    const previousState = { ...deviceStates };
    setLastAction({ previousState, deviceName });

    // Update to new device state
    setDeviceStates((prev) => ({ ...prev, [deviceKey]: newState }));

    // DYNAMIC DATASET GENERATION: Log the exact action and timestamp
    const newLogEntry = {
      device: deviceName,
      deviceKey: deviceKey,
      state: newState ? "ON" : "OFF",
      time: new Date().toISOString(),
    };
    setHabitLog((prevLog) => [...prevLog, newLogEntry]);

    // Trigger the Graceful Error Recovery Toast
    setShowUndo(true);
    setTimeout(() => {
      setShowUndo(false);
      setLastAction(null);
    }, 5000);
  };
  const executeUndo = () => {
    if (lastAction) {
      setDeviceStates(lastAction.previousState); // Revert to saved state
      setShowUndo(false);
      setLastAction(null);
    }
  };
  // --------------------------------------------------------
  // 3. PRESENTATION LAYER (High-Contrast UI)
  // --------------------------------------------------------
  // --------------------------------------------------------
  // PREDICTIVE AI MODULE (Localized Rule-Based Heuristics)
  // --------------------------------------------------------
  // --------------------------------------------------------
  // PREDICTIVE AI MODULE (Reads dynamically from habitLog)
  // --------------------------------------------------------
  const getPredictiveSuggestion = () => {
    const currentHour = new Date().getHours();

    // 1. Scan the habitLog for any device turned ON around this time previously
    const learnedHabit = habitLog.find((log) => {
      const logHour = new Date(log.time).getHours();
      return log.state === "ON" && logHour === currentHour;
    });

    // 2. If a habit is found, and that device is currently OFF, suggest it
    if (learnedHabit && !deviceStates[learnedHabit.deviceKey]) {
      return {
        message: `You usually turn on the ${learnedHabit.device} around this time. Turn it on?`,
        action: () => toggleDevice(learnedHabit.deviceKey, learnedHabit.device),
      };
    }

    return null; // No habits learned for this hour yet
  };

  const aiSuggestion = getPredictiveSuggestion();
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>My Home Dashboard</h1>
      </header>
      {/* Predictive UI Banner */}
      {aiSuggestion && (
        <div className="ai-suggestion-banner" onClick={aiSuggestion.action}>
          ✨ <strong>Suggestion:</strong> {aiSuggestion.message}
        </div>
      )}
      <main className="device-grid">
        {/* Device Control Card: Living Room Light */}
        <button
          className={`device-card ${
            deviceStates.livingRoomLight ? "active" : "inactive"
          }`}
          onClick={() => toggleDevice("livingRoomLight", "Living Room Light")}
          aria-pressed={deviceStates.livingRoomLight}
        >
          <span className="device-title">Living Room Light</span>
          <span className="device-status">
            {deviceStates.livingRoomLight ? "ON" : "OFF"}
          </span>
        </button>

        {/* Device Control Card: Front Door Lock */}
        <button
          className={`device-card ${
            deviceStates.frontDoorLock ? "active" : "inactive"
          }`}
          onClick={() => toggleDevice("frontDoorLock", "Front Door Lock")}
          aria-pressed={deviceStates.frontDoorLock}
        >
          <span className="device-title">Front Door Lock</span>
          <span className="device-status">
            {deviceStates.frontDoorLock ? "LOCKED" : "UNLOCKED"}
          </span>
        </button>
      </main>

      {/* Graceful Error Recovery: Undo Toast */}
      {showUndo && (
        <div className="undo-toast">
          <p>{lastAction?.deviceName} was changed.</p>
          <button className="undo-button" onClick={executeUndo}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
