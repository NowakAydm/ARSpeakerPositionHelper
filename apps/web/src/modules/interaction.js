/**
 * User Interaction Module
 * Handles touch input and AR space interaction with robust error handling
 */

// Use global THREE object loaded from CDN
/* global THREE */

export class UserInteraction {
    constructor() {
        this.isEnabled = false;
        this.tapPosition = null;
        this.listeners = new Map();
        this.container = null;
        this.arSession = null;
        this.markers = [];
        this.currentFrame = null;
    }

    /**
     * Initialize touch interaction for AR
     */
    initialize(container, arSession) {
        this.container = container;
        this.arSession = arSession;
        this.setupTouchListeners();
        this.setupMarkerSystem();
        this.isEnabled = true;
        console.log('👆 Touch interaction initialized');
    }

    /**
     * Setup visual marker system for AR feedback
     */
    setupMarkerSystem() {
        this.markers = [];
        
        // Set frame callback to get XR frame data
        if (this.arSession) {
            this.arSession.setFrameCallback((timestamp, frame) => {
                this.currentFrame = frame;
            });
        }
    }

    /**
     * Setup touch event listeners
     */
    setupTouchListeners() {
        if (!this.container) return;

        // Handle touch events
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.container.addEventListener('click', this.handleClick.bind(this), { passive: false });

        // Prevent default touch behaviors that interfere with AR
        this.container.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.container.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.container.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.container.addEventListener('gestureend', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    /**
     * Handle touch start event
     */
    handleTouchStart(event) {
        if (!this.isEnabled) return;

        event.preventDefault();
        const touch = event.touches[0];
        
        this.tapPosition = {
            x: touch.clientX,
            y: touch.clientY,
            timestamp: Date.now()
        };

        // Visual feedback - show touch ripple
        this.showTouchFeedback(touch.clientX, touch.clientY);
        
        console.log('👆 Touch start:', this.tapPosition);
    }

    /**
     * Handle touch end event
     */
    handleTouchEnd(event) {
        if (!this.isEnabled || !this.tapPosition) return;

        event.preventDefault();
        const touch = event.changedTouches[0];
        const endTime = Date.now();
        const duration = endTime - this.tapPosition.timestamp;

        // Check if it's a tap (short duration, minimal movement)
        const deltaX = Math.abs(touch.clientX - this.tapPosition.x);
        const deltaY = Math.abs(touch.clientY - this.tapPosition.y);
        const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (duration < 300 && movement < 10) {
            this.handleTap(touch.clientX, touch.clientY);
        }

        this.tapPosition = null;
    }

    /**
     * Handle click event (for desktop testing)
     */
    handleClick(event) {
        if (!this.isEnabled) return;

        event.preventDefault();
        this.handleTap(event.clientX, event.clientY);
    }

    /**
     * Process tap/click for AR positioning
     */
    async handleTap(x, y) {
        console.log(`🎯 Tap detected at: (${x}, ${y})`);

        try {
            // Convert screen coordinates to AR world coordinates
            const worldPosition = await this.screenToWorldCoordinates(x, y);
            
            if (worldPosition) {
                // Place visual marker at tap location
                const marker = this.placeMarker(worldPosition);
                
                // Emit tap event with enhanced data
                this.emit('tap', {
                    screen: { x, y },
                    world: worldPosition,
                    marker: marker,
                    hasValidTarget: true
                });
                
                // Provide haptic feedback if available
                this.triggerHapticFeedback();
                
            } else {
                // No valid surface found
                this.emit('tap', {
                    screen: { x, y },
                    world: null,
                    marker: null,
                    hasValidTarget: false
                });
                
                this.showInvalidTargetFeedback(x, y);
            }
            
        } catch (error) {
            console.error('❌ Tap handling failed:', error);
        }
    }

    /**
     * Convert screen coordinates to AR world coordinates using hit testing
     */
    async screenToWorldCoordinates(screenX, screenY) {
        if (!this.arSession || !this.currentFrame) {
            console.warn('⚠️ AR session or frame not available for hit testing');
            return this.fallbackScreenToWorld(screenX, screenY);
        }

        try {
            // Use AR session's screen to world conversion with hit testing
            const worldPosition = await this.arSession.screenToWorld(screenX, screenY, this.currentFrame);
            
            if (worldPosition && (worldPosition.x !== 0 || worldPosition.y !== 0 || worldPosition.z !== 0)) {
                return worldPosition;
            }
            
            // Fallback if hit testing fails
            return this.fallbackScreenToWorld(screenX, screenY);
            
        } catch (error) {
            console.warn('⚠️ AR hit testing failed, using fallback:', error);
            return this.fallbackScreenToWorld(screenX, screenY);
        }
    }

    /**
     * Fallback screen to world coordinate conversion
     */
    fallbackScreenToWorld(screenX, screenY) {
        if (!this.container) return null;
        
        const rect = this.container.getBoundingClientRect();
        const normalizedX = (screenX - rect.left) / rect.width;
        const normalizedY = (screenY - rect.top) / rect.height;

        // Convert to AR coordinate space (-2 to 2 meters width, -1.5 to 1.5 meters height)
        return {
            x: (normalizedX - 0.5) * 4,  // -2 to 2 meters
            y: (0.5 - normalizedY) * 3,  // -1.5 to 1.5 meters (flip Y)
            z: -2.0  // 2 meters in front of camera
        };
    }

    /**
     * Place visual marker in AR space
     */
    placeMarker(position) {
        if (!this.arSession || !this.arSession.scene) {
            console.warn('⚠️ AR scene not available for marker placement');
            return null;
        }

        // Create marker geometry
        const geometry = new THREE.SphereGeometry(0.05, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
        
        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(position.x, position.y, position.z);
        
        // Add pulsing animation
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const scale = 1 + Math.sin(elapsed * 0.01) * 0.2;
            marker.scale.setScalar(scale);
            
            if (elapsed < 3000) { // Animate for 3 seconds
                requestAnimationFrame(animate);
            }
        };
        animate();
        
        // Add to scene
        this.arSession.addToScene(marker);
        
        // Store marker reference
        const markerData = {
            id: `marker_${Date.now()}`,
            mesh: marker,
            position: { ...position },
            timestamp: Date.now(),
            type: 'user_position'
        };
        
        this.markers.push(markerData);
        
        // Limit number of markers (keep only last 3)
        while (this.markers.length > 3) {
            const oldMarker = this.markers.shift();
            this.arSession.removeFromScene(oldMarker.mesh);
        }
        
        console.log('📍 Marker placed at:', position);
        return markerData;
    }

    /**
     * Show visual feedback for touch interaction
     */
    showTouchFeedback(x, y) {
        // Create temporary visual feedback element
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            left: ${x - 20}px;
            top: ${y - 20}px;
            width: 40px;
            height: 40px;
            border: 2px solid #00ff00;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: touchRipple 0.6s ease-out forwards;
        `;
        
        // Add CSS animation if not already present
        if (!document.querySelector('#touchFeedbackStyles')) {
            const style = document.createElement('style');
            style.id = 'touchFeedbackStyles';
            style.textContent = `
                @keyframes touchRipple {
                    0% {
                        transform: scale(0.5);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(feedback);
        
        // Remove after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 600);
    }

    /**
     * Show feedback when no valid AR surface is found
     */
    showInvalidTargetFeedback(x, y) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            left: ${x - 30}px;
            top: ${y - 30}px;
            width: 60px;
            height: 60px;
            border: 2px solid #ff6b6b;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ff6b6b;
            font-size: 24px;
            animation: invalidTargetPulse 0.8s ease-out forwards;
        `;
        feedback.innerHTML = '×';
        
        // Add CSS animation if not already present
        if (!document.querySelector('#invalidTargetStyles')) {
            const style = document.createElement('style');
            style.id = 'invalidTargetStyles';
            style.textContent = `
                @keyframes invalidTargetPulse {
                    0%, 50% {
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(1.2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(feedback);
        
        // Remove after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 800);
    }

    /**
     * Trigger haptic feedback if available
     */
    triggerHapticFeedback() {
        if (navigator.vibrate) {
            navigator.vibrate(50); // 50ms vibration
        }
    }

    /**
     * Clear all markers from AR scene
     */
    clearMarkers() {
        this.markers.forEach(marker => {
            if (this.arSession) {
                this.arSession.removeFromScene(marker.mesh);
            }
        });
        this.markers = [];
        console.log('🧹 All markers cleared');
    }

    /**
     * Get all placed markers
     */
    getMarkers() {
        return [...this.markers];
    }

    /**
     * Enable/disable interaction
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`👆 Interaction ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to listeners
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in ${event} listener:`, error);
                }
            });
        }
    }

    /**
     * Cleanup interaction
     */
    destroy() {
        this.isEnabled = false;
        this.listeners.clear();
        this.clearMarkers();
        
        if (this.container) {
            // Remove event listeners
            this.container.removeEventListener('touchstart', this.handleTouchStart);
            this.container.removeEventListener('touchend', this.handleTouchEnd);
            this.container.removeEventListener('click', this.handleClick);
        }
        
        console.log('👆 Interaction destroyed');
    }
}

export default UserInteraction;