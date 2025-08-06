import { useState, useEffect } from 'react';
import MyUI from './components/MyUI';
import { useResourceInstances } from './components/models/ResourceInstances';
import './App.css';

interface AppState {
  isARSupported: boolean;
  hasPermissions: boolean;
  currentView: 'home' | 'ar' | 'settings';
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    isARSupported: false,
    hasPermissions: false,
    currentView: 'home'
  });

  const {
    instances,
    getSpeakers,
    getListeners,
    calculateDistance
  } = useResourceInstances();

  // Check for AR/camera support and permissions
  useEffect(() => {
    const checkARSupport = async () => {
      try {
        // Check if getUserMedia is available
        const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        
        if (hasGetUserMedia) {
          try {
            // Check camera permissions
            const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
            const hasPermissions = permissionStatus.state === 'granted';
            
            setAppState(prev => ({
              ...prev,
              isARSupported: true,
              hasPermissions
            }));
          } catch (permissionError) {
            // Permissions API might not be available, assume we need to request permissions
            setAppState(prev => ({
              ...prev,
              isARSupported: true,
              hasPermissions: false
            }));
          }
        } else {
          setAppState(prev => ({
            ...prev,
            isARSupported: false,
            hasPermissions: false
          }));
        }
      } catch (error) {
        console.error('Error checking AR support:', error);
        setAppState(prev => ({
          ...prev,
          isARSupported: false,
          hasPermissions: false
        }));
      }
    };

    checkARSupport();
  }, []);

  const speakers = getSpeakers();
  const listeners = getListeners();

  // Calculate some basic statistics
  const stats = {
    totalInstances: instances.length,
    speakerCount: speakers.length,
    listenerCount: listeners.length,
    averageDistance: speakers.length > 0 && listeners.length > 0 
      ? speakers.reduce((sum, speaker) => {
          const distances = listeners.map(listener => 
            calculateDistance(speaker.id, listener.id) || 0
          );
          return sum + (distances.reduce((a, b) => a + b, 0) / distances.length);
        }, 0) / speakers.length
      : 0
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔊 AR Speaker Position Helper</h1>
        <p>Optimize your audio setup with augmented reality measurement tools</p>
      </header>

      <main className="App-main">
        {/* System Status */}
        <div className="status-panel">
          <h3>System Status</h3>
          <div className="status-items">
            <div className={`status-item ${appState.isARSupported ? 'supported' : 'not-supported'}`}>
              <span className="status-icon">{appState.isARSupported ? '✅' : '❌'}</span>
              <span>Camera Support: {appState.isARSupported ? 'Available' : 'Not Available'}</span>
            </div>
            <div className={`status-item ${appState.hasPermissions ? 'supported' : 'not-supported'}`}>
              <span className="status-icon">{appState.hasPermissions ? '✅' : '⚠️'}</span>
              <span>Camera Permissions: {appState.hasPermissions ? 'Granted' : 'Required'}</span>
            </div>
          </div>
        </div>

        {/* Statistics Panel */}
        <div className="stats-panel">
          <h3>Current Setup</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.speakerCount}</span>
              <span className="stat-label">Speakers</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.listenerCount}</span>
              <span className="stat-label">Listeners</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.totalInstances}</span>
              <span className="stat-label">Total Items</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {stats.averageDistance > 0 ? `${(stats.averageDistance * 100).toFixed(0)}cm` : '-'}
              </span>
              <span className="stat-label">Avg Distance</span>
            </div>
          </div>
        </div>

        {/* Main UI Component */}
        <MyUI className="main-ui" />

        {/* Instructions */}
        <div className="instructions-panel">
          <h3>How to Use</h3>
          <ol>
            <li><strong>Grant Camera Permission:</strong> Allow camera access when prompted for AR functionality.</li>
            <li><strong>Launch AR Helper:</strong> Click the "AR Helper" button to start measuring distances.</li>
            <li><strong>Measure Distances:</strong> Tap two points on your screen to measure the distance between them.</li>
            <li><strong>Position Speakers:</strong> Use measurements to optimize speaker placement for best audio experience.</li>
          </ol>
          
          <div className="tips">
            <h4>💡 Tips for Better Measurements</h4>
            <ul>
              <li>Ensure good lighting for better camera performance</li>
              <li>Hold your device steady when taking measurements</li>
              <li>Measurements are most accurate for distances between 0.5m - 5m</li>
              <li>For stereo setups, aim for equal distances from each speaker to the listening position</li>
            </ul>
          </div>
        </div>

        {/* Browser Compatibility */}
        {!appState.isARSupported && (
          <div className="compatibility-warning">
            <h3>⚠️ Browser Compatibility</h3>
            <p>
              Your browser doesn't support camera access required for AR functionality. 
              Please use a modern browser like Chrome, Firefox, Safari, or Edge on a device with a camera.
            </p>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>AR Speaker Position Helper - Optimize your audio experience</p>
        <p>
          <a href="/ar-demo.html" target="_blank" rel="noopener noreferrer">View Demo</a>
          {' | '}
          <a href="/ar-test.html" target="_blank" rel="noopener noreferrer">Test AR Features</a>
          {' | '}
          <a href="/stats.html" target="_blank" rel="noopener noreferrer">Statistics</a>
        </p>
      </footer>
    </div>
  );
}

export default App;