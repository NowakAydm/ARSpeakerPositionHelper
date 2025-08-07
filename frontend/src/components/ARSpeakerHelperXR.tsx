import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, ARButton, Interactive, useXR, useXRHitTest, createXRStore } from '@react-three/xr';
import { Box, Sphere, Text, Line } from '@react-three/drei';
import { Vector3, Mesh } from 'three';
import { useARStore, SpeakerPosition } from './ARStore';

// Speaker component that can be placed in AR
const SpeakerObject: React.FC<{ position: SpeakerPosition; onSelect?: () => void }> = ({ position, onSelect }) => {
  const meshRef = useRef<Mesh>(null);
  
  return (
    <Interactive onSelect={onSelect}>
      <mesh ref={meshRef} position={position.position}>
        <Box args={[0.15, 0.2, 0.1]}>
          <meshStandardMaterial color={position.type === 'speaker' ? '#ff6b6b' : '#4ecdc4'} />
        </Box>
        <Text
          position={[0, 0.15, 0]}
          fontSize={0.05}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {position.type === 'speaker' ? '🔊' : '👤'}
        </Text>
      </mesh>
    </Interactive>
  );
};

// Component for visualizing measurements
const MeasurementLine: React.FC<{ start: Vector3; end: Vector3; distance: number }> = ({ start, end, distance }) => {
  const midPoint = start.clone().add(end).multiplyScalar(0.5);
  
  return (
    <>
      {/* Line between points */}
      <Line points={[start, end]} color="yellow" lineWidth={2} />
      
      {/* Distance label */}
      <Text
        position={midPoint}
        fontSize={0.04}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        {`${(distance * 100).toFixed(1)}cm`}
      </Text>
    </>
  );
};

// Placement indicator for where next object will be placed
const PlacementIndicator: React.FC = () => {
  const { placementMode } = useARStore();
  
  return (
    <mesh position={[0, 0, -1]}>
      <Sphere args={[0.02]}>
        <meshBasicMaterial 
          color={placementMode === 'speaker' ? '#ff6b6b' : '#4ecdc4'} 
          transparent 
          opacity={0.7}
        />
      </Sphere>
    </mesh>
  );
};

// Main AR Scene component
const ARScene: React.FC = () => {
  const { 
    speakers, 
    listeners, 
    measurements, 
    placementMode, 
    selectedPoints,
    addSpeaker, 
    addListener, 
    selectPoint,
    setARActive
  } = useARStore();
  
  const { session } = useXR();
  const [placementCount, setPlacementCount] = useState(0);
  
  // Handle AR session state changes
  React.useEffect(() => {
    setARActive(!!session);
  }, [session, setARActive]);
  
  // Simple placement system - place objects at predefined positions for demo
  const handlePlacement = () => {
    const positions = [
      new Vector3(-0.5, 0, -1),
      new Vector3(0.5, 0, -1),
      new Vector3(0, 0, -1.5),
      new Vector3(-0.3, 0, -0.8),
      new Vector3(0.3, 0, -0.8)
    ];
    
    const position = positions[placementCount % positions.length];
    
    if (placementMode === 'speaker') {
      addSpeaker(position);
    } else if (placementMode === 'listener') {
      addListener(position);
    }
    
    setPlacementCount(prev => prev + 1);
  };
  
  // Use hit test for object placement - simplified for demo
  useXRHitTest((results: any[]) => {
    if (results.length > 0) {
      handlePlacement();
    }
  }, { current: null }, 'plane');
  
  return (
    <>
      {/* Ambient lighting for AR */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      
      {/* Placement indicator */}
      <PlacementIndicator />
      
      {/* Render all speakers */}
      {speakers.map((speaker) => (
        <SpeakerObject
          key={speaker.id}
          position={speaker}
          onSelect={() => placementMode === 'measure' && selectPoint(speaker)}
        />
      ))}
      
      {/* Render all listeners */}
      {listeners.map((listener) => (
        <SpeakerObject
          key={listener.id}
          position={listener}
          onSelect={() => placementMode === 'measure' && selectPoint(listener)}
        />
      ))}
      
      {/* Render measurement lines */}
      {measurements.map((measurement, index) => (
        <MeasurementLine
          key={index}
          start={measurement.points[0].position}
          end={measurement.points[1].position}
          distance={measurement.distance}
        />
      ))}
      
      {/* Show line for currently selected points */}
      {selectedPoints.length === 2 && (
        <Line 
          points={[selectedPoints[0].position, selectedPoints[1].position]} 
          color="orange" 
          lineWidth={3}
        />
      )}
    </>
  );
};

// AR Controls component
const ARControls: React.FC = () => {
  const { 
    placementMode, 
    setPlacementMode, 
    clearAll, 
    speakers, 
    listeners, 
    measurements,
    selectedPoints,
    clearSelectedPoints
  } = useARStore();
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      {/* Mode selection buttons */}
      <button
        onClick={() => setPlacementMode('speaker')}
        style={{
          padding: '10px 15px',
          backgroundColor: placementMode === 'speaker' ? '#ff6b6b' : '#666',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔊 Speaker
      </button>
      
      <button
        onClick={() => setPlacementMode('listener')}
        style={{
          padding: '10px 15px',
          backgroundColor: placementMode === 'listener' ? '#4ecdc4' : '#666',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        👤 Listener
      </button>
      
      <button
        onClick={() => setPlacementMode('measure')}
        style={{
          padding: '10px 15px',
          backgroundColor: placementMode === 'measure' ? '#ffd93d' : '#666',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        📏 Measure
      </button>
      
      {/* Clear buttons */}
      {selectedPoints.length > 0 && (
        <button
          onClick={clearSelectedPoints}
          style={{
            padding: '10px 15px',
            backgroundColor: '#ff9500',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Clear Selection
        </button>
      )}
      
      <button
        onClick={clearAll}
        style={{
          padding: '10px 15px',
          backgroundColor: '#ff4757',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Clear All
      </button>
      
      {/* Status display */}
      <div style={{
        padding: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        borderRadius: '5px',
        fontSize: '12px'
      }}>
        Speakers: {speakers.length} | Listeners: {listeners.length} | Measurements: {measurements.length}
      </div>
    </div>
  );
};

// Main AR component with WebXR integration
export const ARSpeakerHelperXR: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { isARSupported, setARSupported } = useARStore();
  const [error, setError] = useState<string | null>(null);
  
  // Create XR store
  const store = createXRStore();
  
  // Check AR support on mount
  React.useEffect(() => {
    if ('xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
        setARSupported(supported);
        if (!supported) {
          setError('WebXR AR is not supported on this device');
        }
      }).catch(() => {
        setARSupported(false);
        setError('Unable to check WebXR AR support');
      });
    } else {
      setARSupported(false);
      setError('WebXR is not available in this browser');
    }
  }, [setARSupported]);
  
  if (error || !isARSupported) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        zIndex: 1000
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2>AR Not Available</h2>
          <p>{error}</p>
          <p>Please try on a device that supports WebXR AR (e.g., newer Android devices with Chrome)</p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1000
    }}>
      {/* Header with close button */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1001
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px',
            backgroundColor: '#ff4757',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ✕ Close AR
        </button>
      </div>
      
      {/* AR Button */}
      <ARButton
        store={store}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '15px 30px',
          fontSize: '18px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          zIndex: 1001
        }}
      />
      
      {/* AR Controls */}
      <ARControls />
      
      {/* Canvas with XR */}
      <Canvas>
        <XR store={store}>
          <ARScene />
        </XR>
      </Canvas>
    </div>
  );
};

export default ARSpeakerHelperXR;