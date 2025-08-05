/**
 * AR Measuring Tool Module
 * Handles point placement, line drawing, and distance measurement
 */

// Use global THREE object loaded from CDN
/* global THREE */

export class MeasurementTool {
    constructor() {
        this.points = [];
        this.lines = [];
        this.measurements = [];
        this.isActive = false;
        this.scene = null;
        this.camera = null;
        this.container = null;
        this.raycaster = null;
        this.plane = null; // Reference plane for point placement
        this.pointMaterial = null;
        this.lineMaterial = null;
        this.measurementLabels = [];
        this.units = 'metric'; // 'metric' or 'imperial'
        this.onStatsUpdate = null; // Callback for stats updates
        
        // Visual settings
        this.pointSize = 0.05;
        this.pointColor = 0x00ff00; // Bright green for visibility
        this.lineColor = 0xffff00; // Yellow lines
        this.lineWidth = 0.02;
        
        // Setup for screen-to-world coordinate conversion
        this.setupRaycaster();
    }

    /**
     * Initialize the measurement tool with Three.js scene
     */
    initialize(scene, camera, container) {
        const log = window.appDebugInfo || console.log;
        const success = window.appDebugSuccess || console.log;
        
        log('📏 Initializing measurement tool...');
        
        this.scene = scene;
        this.camera = camera;
        this.container = container;
        
        // Create materials for visual elements
        this.createMaterials();
        
        // Create reference plane for point placement (invisible ground plane)
        this.createReferencePlane();
        
        success('✅ Measurement tool initialized');
    }

    /**
     * Setup raycaster for screen-to-world coordinate conversion
     */
    setupRaycaster() {
        if (window.THREE) {
            this.raycaster = new window.THREE.Raycaster();
        }
    }

    /**
     * Create materials for points and lines
     */
    createMaterials() {
        if (!window.THREE) return;
        
        // Point material - bright and visible
        this.pointMaterial = new window.THREE.MeshBasicMaterial({ 
            color: this.pointColor,
            transparent: true,
            opacity: 0.9
        });
        
        // Line material - bright and contrasting
        this.lineMaterial = new window.THREE.LineBasicMaterial({ 
            color: this.lineColor,
            linewidth: 3, // Note: linewidth may not work on all platforms
            transparent: true,
            opacity: 0.8
        });
    }

    /**
     * Create invisible reference plane for point placement
     */
    createReferencePlane() {
        if (!window.THREE || !this.scene) return;
        
        // Create a large invisible plane at ground level (y=0)
        const planeGeometry = new window.THREE.PlaneGeometry(20, 20);
        const planeMaterial = new window.THREE.MeshBasicMaterial({ 
            visible: false,
            transparent: true,
            opacity: 0 
        });
        
        this.plane = new window.THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        this.plane.position.y = 0; // Ground level
        this.plane.name = 'measurementPlane';
        
        this.scene.add(this.plane);
    }

    /**
     * Activate measurement mode
     */
    activate() {
        const log = window.appDebugInfo || console.log;
        
        this.isActive = true;
        log('📏 Measurement tool activated');
        
        // Add click event listener to container
        if (this.container) {
            this.container.addEventListener('click', this.handleClick.bind(this));
            this.container.style.cursor = 'crosshair';
        }
    }

    /**
     * Deactivate measurement mode
     */
    deactivate() {
        const log = window.appDebugInfo || console.log;
        
        this.isActive = false;
        log('📏 Measurement tool deactivated');
        
        // Remove click event listener
        if (this.container) {
            this.container.removeEventListener('click', this.handleClick.bind(this));
            this.container.style.cursor = 'default';
        }
    }

    /**
     * Handle click events for point placement
     */
    handleClick(event) {
        if (!this.isActive || !this.raycaster || !this.camera || !this.plane) return;
        
        const log = window.appDebugInfo || console.log;
        
        // Calculate mouse position in normalized device coordinates
        const rect = this.container.getBoundingClientRect();
        const mouse = new window.THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Cast ray from camera through mouse position
        this.raycaster.setFromCamera(mouse, this.camera);
        
        // Find intersection with reference plane
        const intersects = this.raycaster.intersectObject(this.plane);
        
        if (intersects.length > 0) {
            const worldPosition = intersects[0].point;
            this.placePoint(worldPosition);
            log(`📍 Point placed at: (${worldPosition.x.toFixed(2)}, ${worldPosition.y.toFixed(2)}, ${worldPosition.z.toFixed(2)})`);
        }
    }

    /**
     * Place a measurement point at the given world position
     */
    placePoint(position) {
        if (!window.THREE || !this.scene) return;
        
        const log = window.appDebugInfo || console.log;
        const success = window.appDebugSuccess || console.log;
        
        // Create point geometry and mesh
        const pointGeometry = new window.THREE.SphereGeometry(this.pointSize, 16, 16);
        const pointMesh = new window.THREE.Mesh(pointGeometry, this.pointMaterial);
        pointMesh.position.copy(position);
        pointMesh.name = `measurementPoint_${this.points.length}`;
        
        // Add visual highlight animation
        this.animatePointPlacement(pointMesh);
        
        // Store point data
        const pointData = {
            id: this.points.length,
            position: position.clone(),
            mesh: pointMesh
        };
        
        this.points.push(pointData);
        this.scene.add(pointMesh);
        
        // If we have at least 2 points, create a line between the last two
        if (this.points.length >= 2) {
            this.createLineBetweenPoints(
                this.points[this.points.length - 2],
                this.points[this.points.length - 1]
            );
        }
        
        success(`✅ Point ${this.points.length} placed successfully`);
        log(`📏 Total points: ${this.points.length}`);
        
        // Trigger stats update callback
        this.triggerStatsUpdate();
    }

    /**
     * Animate point placement for visual feedback
     */
    animatePointPlacement(pointMesh) {
        if (!pointMesh) return;
        
        // Start with larger scale and animate to normal size
        pointMesh.scale.set(2, 2, 2);
        
        // Add pulsing effect for better visibility
        let pulseDirection = -1;
        let pulseCount = 0;
        const maxPulses = 3;
        
        const animate = () => {
            const scale = pointMesh.scale.x;
            
            if (pulseCount < maxPulses) {
                // Pulse effect
                if (scale <= 1) {
                    pulseDirection = 1;
                    pulseCount++;
                } else if (scale >= 1.3) {
                    pulseDirection = -1;
                }
                
                pointMesh.scale.multiplyScalar(1 + (pulseDirection * 0.02));
                requestAnimationFrame(animate);
            } else {
                // Final settle to normal size
                if (scale > 1) {
                    pointMesh.scale.multiplyScalar(0.95);
                    requestAnimationFrame(animate);
                } else {
                    pointMesh.scale.set(1, 1, 1);
                }
            }
        };
        
        animate();
    }

    /**
     * Create a line between two points with distance measurement
     */
    createLineBetweenPoints(point1, point2) {
        if (!window.THREE || !this.scene) return;
        
        const log = window.appDebugInfo || console.log;
        
        // Create line geometry
        const lineGeometry = new window.THREE.BufferGeometry().setFromPoints([
            point1.position,
            point2.position
        ]);
        
        const line = new window.THREE.Line(lineGeometry, this.lineMaterial);
        line.name = `measurementLine_${this.lines.length}`;
        
        // Add animated line appearance
        this.animateLineAppearance(line);
        
        // Calculate distance
        const distance = point1.position.distanceTo(point2.position);
        
        // Create measurement label
        const label = this.createDistanceLabel(point1.position, point2.position, distance);
        
        // Store line data
        const lineData = {
            id: this.lines.length,
            point1: point1,
            point2: point2,
            distance: distance,
            mesh: line,
            label: label
        };
        
        this.lines.push(lineData);
        this.scene.add(line);
        
        if (label) {
            this.scene.add(label);
        }
        
        log(`📏 Line created: ${this.formatDistance(distance)}`);
    }

    /**
     * Animate line appearance for visual feedback
     */
    animateLineAppearance(lineMesh) {
        if (!lineMesh || !lineMesh.material) return;
        
        // Start with transparent and fade in
        const originalOpacity = lineMesh.material.opacity;
        lineMesh.material.opacity = 0;
        
        let currentOpacity = 0;
        const animate = () => {
            if (currentOpacity < originalOpacity) {
                currentOpacity += 0.05;
                lineMesh.material.opacity = Math.min(currentOpacity, originalOpacity);
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    /**
     * Create a text label showing the distance
     */
    createDistanceLabel(pos1, pos2, distance) {
        if (!window.THREE) return null;
        
        // Calculate midpoint between the two positions
        const midpoint = new window.THREE.Vector3();
        midpoint.addVectors(pos1, pos2).multiplyScalar(0.5);
        midpoint.y += 0.1; // Offset slightly above the line
        
        // Create text geometry (simplified for web compatibility)
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        // Set up text styling
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#ffffff';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw distance text
        const distanceText = this.formatDistance(distance);
        context.fillText(distanceText, canvas.width / 2, canvas.height / 2);
        
        // Create texture from canvas
        const texture = new window.THREE.CanvasTexture(canvas);
        const material = new window.THREE.SpriteMaterial({ map: texture });
        const sprite = new window.THREE.Sprite(material);
        
        sprite.position.copy(midpoint);
        sprite.scale.set(0.5, 0.25, 1); // Adjust size as needed
        sprite.name = `measurementLabel_${this.measurements.length}`;
        
        this.measurementLabels.push(sprite);
        
        return sprite;
    }

    /**
     * Format distance with both metric and imperial units
     */
    formatDistance(distance) {
        // Distance is in Three.js units (typically meters)
        const meters = distance;
        const feet = meters * 3.28084;
        const inches = feet * 12;
        
        if (this.units === 'metric') {
            if (meters < 1) {
                return `${(meters * 100).toFixed(1)} cm`;
            } else {
                return `${meters.toFixed(2)} m`;
            }
        } else {
            if (feet < 1) {
                return `${inches.toFixed(1)}"`;
            } else {
                return `${feet.toFixed(2)}'`;
            }
        }
    }

    /**
     * Toggle between metric and imperial units
     */
    toggleUnits() {
        this.units = this.units === 'metric' ? 'imperial' : 'metric';
        
        // Update all existing labels
        this.updateAllLabels();
        
        const log = window.appDebugInfo || console.log;
        log(`📏 Units changed to: ${this.units}`);
    }

    /**
     * Update all distance labels with current unit setting
     */
    updateAllLabels() {
        this.lines.forEach((lineData, index) => {
            if (lineData.label) {
                // Remove old label
                this.scene.remove(lineData.label);
                
                // Create new label with updated units
                const newLabel = this.createDistanceLabel(
                    lineData.point1.position,
                    lineData.point2.position,
                    lineData.distance
                );
                
                lineData.label = newLabel;
                if (newLabel) {
                    this.scene.add(newLabel);
                }
            }
        });
    }

    /**
     * Remove the last placed point and its associated line
     */
    undoLastPoint() {
        if (this.points.length === 0) return;
        
        const log = window.appDebugInfo || console.log;
        
        // Remove the last point
        const lastPoint = this.points.pop();
        if (lastPoint.mesh) {
            this.scene.remove(lastPoint.mesh);
        }
        
        // Remove the last line if it exists
        if (this.lines.length > 0 && this.lines.length >= this.points.length) {
            const lastLine = this.lines.pop();
            if (lastLine.mesh) {
                this.scene.remove(lastLine.mesh);
            }
            if (lastLine.label) {
                this.scene.remove(lastLine.label);
                // Remove from labels array
                const labelIndex = this.measurementLabels.indexOf(lastLine.label);
                if (labelIndex > -1) {
                    this.measurementLabels.splice(labelIndex, 1);
                }
            }
        }
        
        log(`🔙 Undid last point. Points remaining: ${this.points.length}`);
        
        // Trigger stats update callback
        this.triggerStatsUpdate();
    }

    /**
     * Clear all measurement points and lines
     */
    clearAll() {
        const log = window.appDebugInfo || console.log;
        
        // Remove all points
        this.points.forEach(point => {
            if (point.mesh) {
                this.scene.remove(point.mesh);
            }
        });
        
        // Remove all lines
        this.lines.forEach(line => {
            if (line.mesh) {
                this.scene.remove(line.mesh);
            }
            if (line.label) {
                this.scene.remove(line.label);
            }
        });
        
        // Remove all labels
        this.measurementLabels.forEach(label => {
            this.scene.remove(label);
        });
        
        // Clear arrays
        this.points = [];
        this.lines = [];
        this.measurements = [];
        this.measurementLabels = [];
        
        log('🧹 All measurements cleared');
        
        // Trigger stats update callback
        this.triggerStatsUpdate();
    }

    /**
     * Get current measurement data for export/save
     */
    getMeasurementData() {
        return {
            points: this.points.map(p => ({
                id: p.id,
                position: {
                    x: p.position.x,
                    y: p.position.y,
                    z: p.position.z
                }
            })),
            lines: this.lines.map(l => ({
                id: l.id,
                point1Id: l.point1.id,
                point2Id: l.point2.id,
                distance: l.distance,
                formattedDistance: this.formatDistance(l.distance)
            })),
            totalPoints: this.points.length,
            totalDistance: this.lines.reduce((sum, line) => sum + line.distance, 0),
            units: this.units
        };
    }

    /**
     * Load measurement data (for restore functionality)
     */
    loadMeasurementData(data) {
        // Clear existing measurements first
        this.clearAll();
        
        if (!data || !data.points) return;
        
        const log = window.appDebugInfo || console.log;
        
        // Restore units setting
        if (data.units) {
            this.units = data.units;
        }
        
        // Recreate points
        data.points.forEach(pointData => {
            const position = new window.THREE.Vector3(
                pointData.position.x,
                pointData.position.y,
                pointData.position.z
            );
            this.placePoint(position);
        });
        
        log(`📏 Loaded ${this.points.length} measurement points`);
    }

    /**
     * Check if measurement tool is ready for use
     */
    isReady() {
        return this.scene && this.camera && this.container && this.raycaster && this.plane;
    }

    /**
     * Get measurement statistics
     */
    getStatistics() {
        const totalDistance = this.lines.reduce((sum, line) => sum + line.distance, 0);
        
        return {
            pointCount: this.points.length,
            lineCount: this.lines.length,
            totalDistance: totalDistance,
            formattedTotalDistance: this.formatDistance(totalDistance),
            averageDistance: this.lines.length > 0 ? totalDistance / this.lines.length : 0,
            units: this.units
        };
    }

    /**
     * Trigger stats update callback if set
     */
    triggerStatsUpdate() {
        if (this.onStatsUpdate && typeof this.onStatsUpdate === 'function') {
            const stats = this.getStatistics();
            this.onStatsUpdate(stats);
        }
    }
}