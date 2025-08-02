/**
 * Equilateral Triangle Calculation Module
 * Handles optimal listening position geometry with enhanced error handling
 */

// Use global THREE object loaded from CDN
/* global THREE */

export class TriangleCalculator {
    constructor() {
        this.speakers = [];
        this.listenerPosition = null;
        this.optimalTriangle = null;
        this.triangleVisualization = null;
        this.cameraSession = null;
        this.guidanceCallbacks = [];
    }

    /**
     * Initialize with camera session for visualization
     */
    initialize(cameraSession) {
        this.cameraSession = cameraSession;
        console.log('📐 Triangle calculator initialized with camera session');
    }

    /**
     * Set speaker positions
     */
    setSpeakers(speakerPositions) {
        this.speakers = [...speakerPositions];
        console.log(`🔊 Set ${this.speakers.length} speaker positions`);
        
        if (this.speakers.length >= 2 && this.listenerPosition) {
            this.calculateOptimalTriangle();
        }
    }

    /**
     * Set listener position
     */
    setListenerPosition(position) {
        this.listenerPosition = { ...position };
        console.log('👤 Set listener position:', this.listenerPosition);
        
        if (this.speakers.length >= 2) {
            this.calculateOptimalTriangle();
        }
    }

    /**
     * Calculate optimal equilateral triangle
     */
    calculateOptimalTriangle() {
        if (this.speakers.length < 2) {
            console.warn('⚠️ Need at least 2 speakers for triangle calculation');
            return null;
        }

        // Use first two speakers
        const speaker1 = this.speakers[0].position || this.speakers[0];
        const speaker2 = this.speakers[1].position || this.speakers[1];

        // Calculate distance between speakers
        const speakerDistance = this.distance3D(speaker1, speaker2);
        
        // Calculate midpoint between speakers
        const midpoint = {
            x: (speaker1.x + speaker2.x) / 2,
            y: (speaker1.y + speaker2.y) / 2,
            z: (speaker1.z + speaker2.z) / 2
        };

        // Calculate optimal listener position for equilateral triangle
        const optimalListener = this.calculateEquilateralThirdPoint(
            speaker1, speaker2, speakerDistance
        );

        this.optimalTriangle = {
            speaker1,
            speaker2,
            optimalListener,
            currentListener: this.listenerPosition,
            speakerDistance,
            midpoint,
            quality: this.calculateTriangleQuality(speaker1, speaker2, this.listenerPosition)
        };

        // Create visual overlay
        this.createTriangleVisualization();
        
        // Emit guidance updates
        this.emitGuidanceUpdate();

        console.log('📐 Calculated optimal triangle:', this.optimalTriangle);
        return this.optimalTriangle;
    }

    /**
     * Calculate third point of equilateral triangle
     */
    calculateEquilateralThirdPoint(point1, point2, sideLength) {
        // Vector from point1 to point2
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const dz = point2.z - point1.z;

        // Midpoint between speakers
        const mx = (point1.x + point2.x) / 2;
        const my = (point1.y + point2.y) / 2;
        const mz = (point1.z + point2.z) / 2;

        // Height of equilateral triangle
        const height = (sideLength * Math.sqrt(3)) / 2;

        // Perpendicular vector (in XZ plane for floor-level positioning)
        const perpX = -dz;  // Rotate 90 degrees in XZ plane
        const perpZ = dx;
        const perpLength = Math.sqrt(perpX * perpX + perpZ * perpZ);

        if (perpLength === 0) {
            // Speakers are at same XZ position, use Y offset
            return {
                x: mx,
                y: my + height,
                z: mz
            };
        }

        // Normalize perpendicular vector
        const normPerpX = (perpX / perpLength) * height;
        const normPerpZ = (perpZ / perpLength) * height;

        // Calculate optimal listener position
        return {
            x: mx + normPerpX,
            y: my,  // Keep same height as speakers
            z: mz + normPerpZ
        };
    }

    /**
     * Create visual triangle overlay in AR
     */
    createTriangleVisualization() {
        if (!this.cameraSession || !this.optimalTriangle) {
            console.warn('⚠️ Camera session or triangle data not available for visualization');
            return;
        }

        // Remove existing visualization
        this.removeTriangleVisualization();

        const group = new window.THREE.Group();
        
        // Create triangle lines
        this.createTriangleLines(group);
        
        // Create speaker markers
        this.createSpeakerMarkers(group);
        
        // Create optimal position marker
        this.createOptimalPositionMarker(group);
        
        // Create current position indicator
        this.createCurrentPositionIndicator(group);
        
        // Add to camera scene
        this.cameraSession.addToScene(group);
        this.triangleVisualization = group;
        
        console.log('📐 Triangle visualization created');
    }

    /**
     * Create triangle edge lines
     */
    createTriangleLines(group) {
        const { speaker1, speaker2, optimalListener } = this.optimalTriangle;
        
        // Triangle vertices
        const vertices = [
            speaker1, speaker2, optimalListener, speaker1 // Close the triangle
        ];
        
        // Create line geometry
        const points = vertices.map(v => new THREE.Vector3(v.x, v.y, v.z));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Optimal triangle outline (green)
        const optimalMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        
        const optimalLine = new THREE.Line(geometry, optimalMaterial);
        group.add(optimalLine);
        
        // Current triangle (if listener is set)
        if (this.listenerPosition) {
            const currentVertices = [
                speaker1, speaker2, this.listenerPosition, speaker1
            ];
            const currentPoints = currentVertices.map(v => new THREE.Vector3(v.x, v.y, v.z));
            const currentGeometry = new THREE.BufferGeometry().setFromPoints(currentPoints);
            
            // Color based on quality
            const quality = this.getTriangleQuality();
            const color = quality > 80 ? 0x00ff00 : quality > 50 ? 0xffff00 : 0xff6b6b;
            
            const currentMaterial = new THREE.LineBasicMaterial({ 
                color: color, 
                linewidth: 2,
                transparent: true,
                opacity: 0.6
            });
            
            const currentLine = new THREE.Line(currentGeometry, currentMaterial);
            group.add(currentLine);
        }
    }

    /**
     * Create speaker markers
     */
    createSpeakerMarkers(group) {
        const { speaker1, speaker2 } = this.optimalTriangle;
        
        [speaker1, speaker2].forEach((speaker, index) => {
            const geometry = new THREE.BoxGeometry(0.2, 0.15, 0.1);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x4444ff,
                transparent: true,
                opacity: 0.8
            });
            
            const marker = new THREE.Mesh(geometry, material);
            marker.position.set(speaker.x, speaker.y, speaker.z);
            
            // Add pulsing animation
            const startTime = Date.now();
            const animate = () => {
                if (!this.triangleVisualization) return;
                
                const elapsed = Date.now() - startTime;
                const scale = 1 + Math.sin(elapsed * 0.003) * 0.1;
                marker.scale.setScalar(scale);
                requestAnimationFrame(animate);
            };
            animate();
            
            group.add(marker);
        });
    }

    /**
     * Create optimal position marker
     */
    createOptimalPositionMarker(group) {
        const { optimalListener } = this.optimalTriangle;
        
        const geometry = new THREE.ConeGeometry(0.1, 0.2, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.9
        });
        
        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(optimalListener.x, optimalListener.y + 0.1, optimalListener.z);
        marker.rotation.x = Math.PI; // Point down
        
        // Add floating animation
        const startTime = Date.now();
        const baseY = optimalListener.y + 0.1;
        const animate = () => {
            if (!this.triangleVisualization) return;
            
            const elapsed = Date.now() - startTime;
            marker.position.y = baseY + Math.sin(elapsed * 0.005) * 0.05;
            marker.rotation.y += 0.02;
            requestAnimationFrame(animate);
        };
        animate();
        
        group.add(marker);
    }

    /**
     * Create current position indicator
     */
    createCurrentPositionIndicator(group) {
        if (!this.listenerPosition) return;
        
        const geometry = new THREE.SphereGeometry(0.08, 16, 16);
        const quality = this.getTriangleQuality();
        const color = quality > 80 ? 0x00ff00 : quality > 50 ? 0xffff00 : 0xff6b6b;
        
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(
            this.listenerPosition.x, 
            this.listenerPosition.y + 0.05, 
            this.listenerPosition.z
        );
        
        group.add(marker);
        
        // Add direction arrow if not optimal
        if (quality < 90) {
            this.createDirectionArrow(group, marker);
        }
    }

    /**
     * Create direction arrow for guidance
     */
    createDirectionArrow(group, currentMarker) {
        const error = this.getPositionError();
        if (!error || error.distance < 0.1) return;
        
        // Arrow geometry pointing in correction direction
        const arrowGeometry = new THREE.ConeGeometry(0.03, 0.15, 6);
        const arrowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.9
        });
        
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.copy(currentMarker.position);
        arrow.position.y += 0.2;
        
        // Point arrow in correction direction
        const direction = error.direction;
        arrow.lookAt(
            arrow.position.x + direction.x,
            arrow.position.y,
            arrow.position.z + direction.z
        );
        arrow.rotation.x = -Math.PI / 2; // Point horizontally
        
        group.add(arrow);
    }

    /**
     * Remove existing triangle visualization
     */
    removeTriangleVisualization() {
        if (this.triangleVisualization && this.cameraSession) {
            this.cameraSession.removeFromScene(this.triangleVisualization);
            this.triangleVisualization = null;
        }
    }

    /**
     * Calculate distance between current and optimal position
     */
    getPositionError() {
        if (!this.optimalTriangle || !this.listenerPosition) {
            return null;
        }

        const optimal = this.optimalTriangle.optimalListener;
        const current = this.listenerPosition;

        const distance = this.distance3D(optimal, current);
        const direction = this.getDirectionVector(current, optimal);

        return {
            distance,
            direction,
            isOptimal: distance < 0.1  // Within 10cm tolerance
        };
    }

    /**
     * Get guidance for user positioning
     */
    getPositioningGuidance() {
        const error = this.getPositionError();
        
        if (!error) {
            return { message: 'Set listener position first', type: 'info' };
        }

        if (error.isOptimal) {
            return { message: 'Perfect position! 🎯', type: 'success' };
        }

        // Generate directional guidance
        const distance = error.distance.toFixed(1);
        let direction = '';

        if (Math.abs(error.direction.x) > 0.1) {
            direction += error.direction.x > 0 ? 'right ' : 'left ';
        }
        if (Math.abs(error.direction.z) > 0.1) {
            direction += error.direction.z > 0 ? 'forward ' : 'backward ';
        }

        return {
            message: `Move ${distance}m ${direction}for optimal position`,
            type: 'guidance',
            distance: error.distance,
            direction: error.direction
        };
    }

    /**
     * Calculate triangle quality based on current listener position
     */
    calculateTriangleQuality(speaker1, speaker2, listener) {
        if (!listener) return 0;
        
        const side1 = this.distance3D(speaker1, speaker2);
        const side2 = this.distance3D(speaker1, listener);
        const side3 = this.distance3D(speaker2, listener);

        // Calculate how close to equilateral the triangle is
        const avgSide = (side1 + side2 + side3) / 3;
        const maxDeviation = Math.max(
            Math.abs(side1 - avgSide),
            Math.abs(side2 - avgSide),
            Math.abs(side3 - avgSide)
        );

        // Quality score based on deviation from equilateral
        const deviation = maxDeviation / avgSide;
        const quality = Math.max(0, 100 - (deviation * 200));
        
        return Math.round(quality);
    }

    /**
     * Calculate 3D distance between two points
     */
    distance3D(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const dz = point2.z - point1.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Calculate direction vector from point1 to point2
     */
    getDirectionVector(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dz = to.z - from.z;
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (length === 0) return { x: 0, y: 0, z: 0 };

        return {
            x: dx / length,
            y: dy / length,
            z: dz / length
        };
    }

    /**
     * Check if triangle is approximately equilateral
     */
    isEquilateral(tolerance = 0.1) {
        if (!this.optimalTriangle || !this.listenerPosition) return false;

        const { speaker1, speaker2 } = this.optimalTriangle;
        const listener = this.listenerPosition;
        
        const side1 = this.distance3D(speaker1, speaker2);
        const side2 = this.distance3D(speaker1, listener);
        const side3 = this.distance3D(speaker2, listener);

        const avgSide = (side1 + side2 + side3) / 3;
        const maxDeviation = Math.max(
            Math.abs(side1 - avgSide),
            Math.abs(side2 - avgSide),
            Math.abs(side3 - avgSide)
        );

        return maxDeviation / avgSide <= tolerance;
    }

    /**
     * Get triangle quality score (0-100)
     */
    getTriangleQuality() {
        if (!this.optimalTriangle || !this.listenerPosition) return 0;
        
        return this.calculateTriangleQuality(
            this.optimalTriangle.speaker1,
            this.optimalTriangle.speaker2,
            this.listenerPosition
        );
    }

    /**
     * Add guidance update callback
     */
    onGuidanceUpdate(callback) {
        this.guidanceCallbacks.push(callback);
    }

    /**
     * Remove guidance callback
     */
    removeGuidanceCallback(callback) {
        const index = this.guidanceCallbacks.indexOf(callback);
        if (index > -1) {
            this.guidanceCallbacks.splice(index, 1);
        }
    }

    /**
     * Emit guidance update to callbacks
     */
    emitGuidanceUpdate() {
        const guidance = this.getPositioningGuidance();
        const quality = this.getTriangleQuality();
        const error = this.getPositionError();
        
        const updateData = {
            guidance,
            quality,
            error,
            triangle: this.optimalTriangle,
            isOptimal: error ? error.isOptimal : false
        };

        this.guidanceCallbacks.forEach(callback => {
            try {
                callback(updateData);
            } catch (error) {
                console.error('❌ Error in guidance callback:', error);
            }
        });
    }

    /**
     * Update visualization when position changes
     */
    updateVisualization() {
        if (this.optimalTriangle) {
            this.createTriangleVisualization();
            this.emitGuidanceUpdate();
        }
    }

    /**
     * Reset calculator
     */
    reset() {
        this.removeTriangleVisualization();
        this.speakers = [];
        this.listenerPosition = null;
        this.optimalTriangle = null;
        this.guidanceCallbacks = [];
        console.log('📐 Triangle calculator reset');
    }

    /**
     * Cleanup resources
     */
    dispose() {
        this.removeTriangleVisualization();
        this.reset();
        console.log('📐 Triangle calculator disposed');
    }
}

export default TriangleCalculator;