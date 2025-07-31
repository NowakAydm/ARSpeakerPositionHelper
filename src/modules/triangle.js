/**
 * Equilateral Triangle Calculation Module
 * Handles optimal listening position geometry
 */

export class TriangleCalculator {
    constructor() {
        this.speakers = [];
        this.listenerPosition = null;
        this.optimalTriangle = null;
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
        const speaker1 = this.speakers[0];
        const speaker2 = this.speakers[1];

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
            midpoint
        };

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
        if (!this.optimalTriangle) return false;

        const { speaker1, speaker2, currentListener } = this.optimalTriangle;
        
        if (!currentListener) return false;

        const side1 = this.distance3D(speaker1, speaker2);
        const side2 = this.distance3D(speaker1, currentListener);
        const side3 = this.distance3D(speaker2, currentListener);

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
        if (!this.isEquilateral(1.0)) return 0;  // Not even close

        const error = this.getPositionError();
        if (!error) return 0;

        // Score based on distance from optimal position
        const maxDistance = 2.0;  // 2 meter max for scoring
        const score = Math.max(0, 100 - (error.distance / maxDistance) * 100);
        
        return Math.round(score);
    }

    /**
     * Reset calculator
     */
    reset() {
        this.speakers = [];
        this.listenerPosition = null;
        this.optimalTriangle = null;
        console.log('📐 Triangle calculator reset');
    }
}

export default TriangleCalculator;