import React from 'react';
import * as THREE from 'three';

// Fixed import syntax - using proper ES module imports
export interface ResourceInstance {
  id: string;
  type: 'speaker' | 'listener' | 'obstacle';
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  metadata?: {
    name?: string;
    brand?: string;
    model?: string;
    frequency_response?: string;
    power?: number;
  };
}

export interface SpeakerResource extends ResourceInstance {
  type: 'speaker';
  metadata: {
    name: string;
    brand: string;
    model: string;
    frequency_response: string;
    power: number;
    directivity_pattern?: 'omnidirectional' | 'cardioid' | 'figure-8' | 'shotgun';
    optimal_distance?: number; // in meters
  };
}

export interface ListenerResource extends ResourceInstance {
  type: 'listener';
  metadata: {
    name: string;
    height?: number; // listening height in meters
    preferred_volume?: number; // 0-100
  };
}

export interface ObstacleResource extends ResourceInstance {
  type: 'obstacle';
  metadata: {
    name: string;
    material?: 'wall' | 'furniture' | 'curtain' | 'other';
    acoustic_properties?: {
      absorption_coefficient?: number;
      reflection_coefficient?: number;
    };
  };
}

export class ResourceInstanceManager {
  private instances: Map<string, ResourceInstance> = new Map();
  private changeListeners: Set<(instances: ResourceInstance[]) => void> = new Set();

  constructor() {
    // Initialize with some default speaker configurations
    this.addDefaultInstances();
  }

  private addDefaultInstances() {
    // Add default speaker configurations
    const defaultSpeaker: SpeakerResource = {
      id: 'speaker-1',
      type: 'speaker',
      position: new THREE.Vector3(0, 1, -2),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      metadata: {
        name: 'Main Speaker',
        brand: 'Generic',
        model: 'Studio Monitor',
        frequency_response: '20Hz - 20kHz',
        power: 100,
        directivity_pattern: 'cardioid',
        optimal_distance: 2.0
      }
    };

    const defaultListener: ListenerResource = {
      id: 'listener-1',
      type: 'listener',
      position: new THREE.Vector3(0, 1.7, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      metadata: {
        name: 'Listener Position',
        height: 1.7,
        preferred_volume: 75
      }
    };

    this.instances.set(defaultSpeaker.id, defaultSpeaker);
    this.instances.set(defaultListener.id, defaultListener);
  }

  addInstance(instance: ResourceInstance): void {
    this.instances.set(instance.id, instance);
    this.notifyListeners();
  }

  removeInstance(id: string): boolean {
    const removed = this.instances.delete(id);
    if (removed) {
      this.notifyListeners();
    }
    return removed;
  }

  updateInstance(id: string, updates: Partial<ResourceInstance>): boolean {
    const instance = this.instances.get(id);
    if (!instance) return false;

    const updatedInstance = { ...instance, ...updates };
    this.instances.set(id, updatedInstance);
    this.notifyListeners();
    return true;
  }

  getInstance(id: string): ResourceInstance | undefined {
    return this.instances.get(id);
  }

  getAllInstances(): ResourceInstance[] {
    return Array.from(this.instances.values());
  }

  getInstancesByType(type: ResourceInstance['type']): ResourceInstance[] {
    return this.getAllInstances().filter(instance => instance.type === type);
  }

  getSpeakers(): SpeakerResource[] {
    return this.getInstancesByType('speaker') as SpeakerResource[];
  }

  getListeners(): ListenerResource[] {
    return this.getInstancesByType('listener') as ListenerResource[];
  }

  getObstacles(): ObstacleResource[] {
    return this.getInstancesByType('obstacle') as ObstacleResource[];
  }

  // Calculate distance between two instances
  calculateDistance(id1: string, id2: string): number | null {
    const instance1 = this.getInstance(id1);
    const instance2 = this.getInstance(id2);
    
    if (!instance1 || !instance2) return null;
    
    return instance1.position.distanceTo(instance2.position);
  }

  // Find optimal speaker placement for a listener
  findOptimalSpeakerPlacement(listenerId: string, speakerId: string): THREE.Vector3 | null {
    const listener = this.getInstance(listenerId) as ListenerResource;
    const speaker = this.getInstance(speakerId) as SpeakerResource;
    
    if (!listener || !speaker) return null;
    
    const optimalDistance = speaker.metadata.optimal_distance || 2.0;
    const direction = new THREE.Vector3(0, 0, -1); // Default forward direction
    
    // Calculate optimal position based on listener position and optimal distance
    const optimalPosition = listener.position.clone().add(
      direction.multiplyScalar(optimalDistance)
    );
    
    return optimalPosition;
  }

  // Add listener for changes
  addChangeListener(listener: (instances: ResourceInstance[]) => void): void {
    this.changeListeners.add(listener);
  }

  removeChangeListener(listener: (instances: ResourceInstance[]) => void): void {
    this.changeListeners.delete(listener);
  }

  private notifyListeners(): void {
    const instances = this.getAllInstances();
    this.changeListeners.forEach(listener => listener(instances));
  }

  // Export/Import functionality
  exportToJSON(): string {
    const exportData = {
      instances: Array.from(this.instances.entries()).map(([, instance]) => ({
        ...instance,
        position: instance.position.toArray(),
        rotation: instance.rotation.toArray(),
        scale: instance.scale.toArray()
      }))
    };
    return JSON.stringify(exportData, null, 2);
  }

  importFromJSON(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      this.instances.clear();
      
      data.instances.forEach((instanceData: any) => {
        const instance: ResourceInstance = {
          ...instanceData,
          position: new THREE.Vector3().fromArray(instanceData.position),
          rotation: new THREE.Euler().fromArray(instanceData.rotation),
          scale: new THREE.Vector3().fromArray(instanceData.scale)
        };
        this.instances.set(instance.id, instance);
      });
      
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to import resource instances:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const resourceInstanceManager = new ResourceInstanceManager();

// React hook for using resource instances
export const useResourceInstances = () => {
  const [instances, setInstances] = React.useState<ResourceInstance[]>(
    resourceInstanceManager.getAllInstances()
  );

  React.useEffect(() => {
    const handleChange = (newInstances: ResourceInstance[]) => {
      setInstances([...newInstances]);
    };

    resourceInstanceManager.addChangeListener(handleChange);
    
    return () => {
      resourceInstanceManager.removeChangeListener(handleChange);
    };
  }, []);

  return {
    instances,
    addInstance: resourceInstanceManager.addInstance.bind(resourceInstanceManager),
    removeInstance: resourceInstanceManager.removeInstance.bind(resourceInstanceManager),
    updateInstance: resourceInstanceManager.updateInstance.bind(resourceInstanceManager),
    getInstance: resourceInstanceManager.getInstance.bind(resourceInstanceManager),
    getSpeakers: resourceInstanceManager.getSpeakers.bind(resourceInstanceManager),
    getListeners: resourceInstanceManager.getListeners.bind(resourceInstanceManager),
    getObstacles: resourceInstanceManager.getObstacles.bind(resourceInstanceManager),
    calculateDistance: resourceInstanceManager.calculateDistance.bind(resourceInstanceManager),
    findOptimalSpeakerPlacement: resourceInstanceManager.findOptimalSpeakerPlacement.bind(resourceInstanceManager),
    exportToJSON: resourceInstanceManager.exportToJSON.bind(resourceInstanceManager),
    importFromJSON: resourceInstanceManager.importFromJSON.bind(resourceInstanceManager)
  };
};

export default ResourceInstanceManager;