import React, { useState } from 'react';
import ARSpeakerHelper from './ARSpeakerHelper';

interface MyUIProps {
  className?: string;
}

export const MyUI: React.FC<MyUIProps> = ({ className }) => {
  const [showARHelper, setShowARHelper] = useState(false);
  const [lastMeasurement, setLastMeasurement] = useState<{
    distance: number;
    timestamp: Date;
  } | null>(null);

  const handleOpenARHelper = () => {
    setShowARHelper(true);
  };

  const handleCloseARHelper = () => {
    setShowARHelper(false);
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#0056b3';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#007bff';
          }}
        >
          <span>📏</span>
          AR Helper
        </button>

        {lastMeasurement && (
          <div style={{
            padding: '10px',
            backgroundColor: '#e8f5e8',
            borderRadius: '4px',
            border: '1px solid #c3e6c3'
          }}>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#2d5a2d' }}>
              Last Measurement:
            </p>
            <p style={{ margin: '0', color: '#2d5a2d' }}>
              {(lastMeasurement.distance * 100).toFixed(1)} cm 
              ({(lastMeasurement.distance * 39.37).toFixed(1)} inches)
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
              Measured at {lastMeasurement.timestamp.toLocaleTimeString()}
            </p>
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
    </div>
  );
};

export default MyUI;