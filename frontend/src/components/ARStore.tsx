import { create } from 'zustand';
import { Vector3 } from 'three';

export interface SpeakerPosition {
  id: string;
  position: Vector3;
  type: 'speaker' | 'listener';
  timestamp: Date;
}

export interface MeasurementData {
  distance: number;
  points: SpeakerPosition[];
  timestamp: Date;
}

interface ARStore {
  // AR Session State
  isARActive: boolean;
  isARSupported: boolean;
  
  // Speaker Positions
  speakers: SpeakerPosition[];
  listeners: SpeakerPosition[];
  
  // Measurements
  measurements: MeasurementData[];
  
  // Current interaction state
  placementMode: 'speaker' | 'listener' | 'measure';
  selectedPoints: SpeakerPosition[];
  
  // Actions
  setARActive: (active: boolean) => void;
  setARSupported: (supported: boolean) => void;
  addSpeaker: (position: Vector3) => void;
  addListener: (position: Vector3) => void;
  removeSpeaker: (id: string) => void;
  removeListener: (id: string) => void;
  addMeasurement: (measurement: MeasurementData) => void;
  setPlacementMode: (mode: 'speaker' | 'listener' | 'measure') => void;
  selectPoint: (point: SpeakerPosition) => void;
  clearSelectedPoints: () => void;
  clearAll: () => void;
}

export const useARStore = create<ARStore>((set, get) => ({
  // Initial state
  isARActive: false,
  isARSupported: false,
  speakers: [],
  listeners: [],
  measurements: [],
  placementMode: 'speaker',
  selectedPoints: [],
  
  // Actions
  setARActive: (active) => set({ isARActive: active }),
  setARSupported: (supported) => set({ isARSupported: supported }),
  
  addSpeaker: (position) => {
    const newSpeaker: SpeakerPosition = {
      id: `speaker_${Date.now()}`,
      position: position.clone(),
      type: 'speaker',
      timestamp: new Date()
    };
    set((state) => ({ speakers: [...state.speakers, newSpeaker] }));
  },
  
  addListener: (position) => {
    const newListener: SpeakerPosition = {
      id: `listener_${Date.now()}`,
      position: position.clone(),
      type: 'listener',
      timestamp: new Date()
    };
    set((state) => ({ listeners: [...state.listeners, newListener] }));
  },
  
  removeSpeaker: (id) => {
    set((state) => ({
      speakers: state.speakers.filter(speaker => speaker.id !== id)
    }));
  },
  
  removeListener: (id) => {
    set((state) => ({
      listeners: state.listeners.filter(listener => listener.id !== id)
    }));
  },
  
  addMeasurement: (measurement) => {
    set((state) => ({
      measurements: [...state.measurements, measurement]
    }));
  },
  
  setPlacementMode: (mode) => {
    set({ placementMode: mode, selectedPoints: [] });
  },
  
  selectPoint: (point) => {
    const state = get();
    const newSelectedPoints = [...state.selectedPoints, point];
    
    // Auto-measure when we have 2 points selected
    if (newSelectedPoints.length === 2) {
      const distance = newSelectedPoints[0].position.distanceTo(newSelectedPoints[1].position);
      const measurement: MeasurementData = {
        distance,
        points: newSelectedPoints,
        timestamp: new Date()
      };
      
      set({
        selectedPoints: [],
        measurements: [...state.measurements, measurement]
      });
    } else {
      set({ selectedPoints: newSelectedPoints });
    }
  },
  
  clearSelectedPoints: () => set({ selectedPoints: [] }),
  
  clearAll: () => set({
    speakers: [],
    listeners: [],
    measurements: [],
    selectedPoints: []
  })
}));