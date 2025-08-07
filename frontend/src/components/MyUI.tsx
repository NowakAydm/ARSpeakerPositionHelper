import React, { useState } from 'react';
import ARSpeakerHelper from './ARSpeakerHelper';
import ARSpeakerHelperXR from './ARSpeakerHelperXR';
import { useARStore } from './ARStore';

interface MyUIProps {
  className?: string;
}

export const MyUI: React.FC<MyUIProps> = ({ className }) => {
  const [showARHelper, setShowARHelper] = useState(false);
  const [showXRHelper, setShowXRHelper] = useState(false);
  const [lastMeasurement, setLastMeasurement] = useState<{
    distance: number;
    timestamp: Date;
  } | null>(null);
  
  const { measurements, isARSupported } = useARStore();

  const handleOpenARHelper = () => {
    setShowARHelper(true);
  };

  const handleOpenXRHelper = () => {
    setShowXRHelper(true);
  };

  const handleCloseARHelper = () => {
    setShowARHelper(false);
  };

  const handleCloseXRHelper = () => {
    setShowXRHelper(false);
  };

  const handleMeasurement = (distance: number) => {
    setLastMeasurement({
      distance,
      timestamp: new Date()
    });
  };

  return (
    <div className={className}>
      <div style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        margin: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Speaker Position Tools</h3>
        
        {/* WebXR AR Button */}
        <button
          onClick={handleOpenXRHelper}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '10px',
            marginBottom: '10px'
          }}
        >
          🥽 AR Mode (WebXR)
        </button>
        
        {/* Fallback AR Button */}
        <button
          onClick={handleOpenARHelper}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          📱 Camera Mode (Fallback)
        </button>
        
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
          {isARSupported 
            ? "✅ WebXR AR is supported - use AR Mode for best experience" 
            : "⚠️ WebXR AR not supported - use Camera Mode instead"
          }
        </div>

        {(lastMeasurement || measurements.length > 0) && (
          <div style={{
            padding: '10px',
            backgroundColor: '#e8f5e8',
            borderRadius: '4px',
            border: '1px solid #c3e6c3'
          }}>
            {lastMeasurement && (
              <>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#2d5a2d' }}>
                  Last Camera Measurement:
                </p>
                <p style={{ margin: '0', color: '#2d5a2d' }}>
                  {(lastMeasurement.distance * 100).toFixed(1)} cm 
                  ({(lastMeasurement.distance * 39.37).toFixed(1)} inches)
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                  Measured at {lastMeasurement.timestamp.toLocaleTimeString()}
                </p>
              </>
            )}
            
            {measurements.length > 0 && (
              <>
                <p style={{ margin: '10px 0 5px 0', fontWeight: 'bold', color: '#2d5a2d' }}>
                  AR Measurements ({measurements.length}):
                </p>
                {measurements.slice(-3).map((measurement, index) => (
                  <p key={index} style={{ margin: '0', color: '#2d5a2d', fontSize: '14px' }}>
                    {(measurement.distance * 100).toFixed(1)} cm at {measurement.timestamp.toLocaleTimeString()}
                  </p>
                ))}
              </>
            )}
          </div>
        )}

        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#fff3cd',
          borderRadius: '4px',
          border: '1px solid #ffeaa7'
        }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#856404' }}>
            <strong>💡 Tip:</strong> Use the AR Helper to measure distances between speakers 
            and listening positions for optimal audio setup.
          </p>
        </div>
      </div>

      {showARHelper && (
        <ARSpeakerHelper
          onClose={handleCloseARHelper}
          onMeasurement={handleMeasurement}
        />
      )}
      
      {showXRHelper && (
        <ARSpeakerHelperXR
          onClose={handleCloseXRHelper}
        />
      )}
    </div>
  );
};

export default MyUI;