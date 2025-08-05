import React, { useRef, useEffect, useState, useCallback } from 'react';
// import * as THREE from 'three'; // Will be used for 3D calculations

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface MeasurementPoint {
  id: string;
  position: Point3D;
  screenPosition: { x: number; y: number };
}

interface ARSpeakerHelperProps {
  onClose: () => void;
  onMeasurement?: (distance: number, points: MeasurementPoint[]) => void;
}

export const ARSpeakerHelper: React.FC<ARSpeakerHelperProps> = ({ onClose, onMeasurement }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([]);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsActive(true);
      setError(null);
    } catch (err) {
      console.error('Camera initialization error:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  }, [stream]);

  // Calculate distance between two 3D points
  const calculateDistance = (p1: Point3D, p2: Point3D): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  // Convert screen coordinates to estimated 3D position
  const screenTo3D = (screenX: number, screenY: number, estimatedDepth = 1.0): Point3D => {
    if (!canvasRef.current) return { x: 0, y: 0, z: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const normalizedX = (screenX - rect.width / 2) / (rect.width / 2);
    const normalizedY = -(screenY - rect.height / 2) / (rect.height / 2);
    
    // Simple perspective projection approximation
    const fov = Math.PI / 4; // 45 degrees
    const aspect = rect.width / rect.height;
    
    return {
      x: normalizedX * estimatedDepth * Math.tan(fov / 2) * aspect,
      y: normalizedY * estimatedDepth * Math.tan(fov / 2),
      z: -estimatedDepth
    };
  };

  // Handle tap/click to add measurement points
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newPoint: MeasurementPoint = {
      id: `point_${Date.now()}`,
      position: screenTo3D(x, y, 1.5), // Estimate 1.5m depth
      screenPosition: { x, y }
    };

    setMeasurementPoints(prev => {
      const newPoints = [...prev, newPoint];
      
      // Calculate distance if we have two points
      if (newPoints.length === 2) {
        const distance = calculateDistance(newPoints[0].position, newPoints[1].position);
        setCurrentDistance(distance);
        onMeasurement?.(distance, newPoints);
      } else if (newPoints.length > 2) {
        // Reset to just the new point for next measurement
        const resetPoints = [newPoint];
        setCurrentDistance(null);
        return resetPoints;
      }
      
      return newPoints;
    });
  }, [isActive, onMeasurement]);

  // Draw overlay on canvas
  const drawOverlay = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw measurement points
    measurementPoints.forEach((point, index) => {
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(point.screenPosition.x, point.screenPosition.y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw point label
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.fillText(`P${index + 1}`, point.screenPosition.x + 12, point.screenPosition.y - 8);
    });

    // Draw line between points
    if (measurementPoints.length === 2) {
      const [p1, p2] = measurementPoints;
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1.screenPosition.x, p1.screenPosition.y);
      ctx.lineTo(p2.screenPosition.x, p2.screenPosition.y);
      ctx.stroke();

      // Draw distance label
      if (currentDistance !== null) {
        const midX = (p1.screenPosition.x + p2.screenPosition.x) / 2;
        const midY = (p1.screenPosition.y + p2.screenPosition.y) / 2;
        
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${(currentDistance * 100).toFixed(1)} cm`, midX, midY - 10);
      }
    }

    // Draw crosshair in center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 20, centerY);
    ctx.lineTo(centerX + 20, centerY);
    ctx.moveTo(centerX, centerY - 20);
    ctx.lineTo(centerX, centerY + 20);
    ctx.stroke();

    // Draw instructions
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Tap to measure distance between two points', canvas.width / 2, 40);
    
    if (measurementPoints.length === 1) {
      ctx.fillText('Tap second point to complete measurement', canvas.width / 2, canvas.height - 40);
    } else if (measurementPoints.length === 0) {
      ctx.fillText('Tap first point to start measuring', canvas.width / 2, canvas.height - 40);
    }
  }, [measurementPoints, currentDistance]);

  // Animation loop
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      drawOverlay();
      requestAnimationFrame(animate);
    };

    animate();
  }, [isActive, drawOverlay]);

  // Set canvas size when video loads
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const handleLoadedMetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, []);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
    return () => stopCamera();
  }, [initializeCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const clearMeasurements = () => {
    setMeasurementPoints([]);
    setCurrentDistance(null);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>AR Speaker Position Helper</h2>
        <div>
          <button
            onClick={clearMeasurements}
            style={{
              padding: '8px 16px',
              marginRight: '10px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Video and Canvas Container */}
      <div style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {error ? (
          <div style={{
            color: 'white',
            textAlign: 'center',
            padding: '20px'
          }}>
            <p>{error}</p>
            <button
              onClick={initializeCamera}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                cursor: 'crosshair'
              }}
            />
          </>
        )}
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        textAlign: 'center'
      }}>
        {currentDistance !== null && (
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
            Distance: {(currentDistance * 100).toFixed(1)} cm ({(currentDistance * 39.37).toFixed(1)} inches)
          </p>
        )}
        <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
          Points: {measurementPoints.length}/2
        </p>
      </div>
    </div>
  );
};

export default ARSpeakerHelper;