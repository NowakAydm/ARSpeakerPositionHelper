/**
 * User Interaction Module
 * Handles touch input and camera space interaction with robust error handling
 * Updated to work with camera session instead of WebXR AR
 */

// Use global THREE object loaded from CDN
/* global THREE */

export class UserInteraction {
    constructor() {
        this.isEnabled = false;
        this.tapPosition = null;
        this.listeners = new Map();
        this.container = null;
        this.cameraSession = null;
        this.markers = [];
        this.currentFrame = null;
    }

    /**
     * Cleanup and destroy interaction
     */
    destroy() {
        this.isEnabled = false;
        this.listeners.clear();
        this.clearMarkers();
        
        // Remove event listeners from the correct target
        const target = this.eventTarget || this.container;
        if (target) {
            // Remove event listeners (note: binding might not match, but this is cleanup)
            try {
                target.removeEventListener('touchstart', this.handleTouchStart);
                target.removeEventListener('touchend', this.handleTouchEnd);
                target.removeEventListener('click', this.handleClick);
                target.removeEventListener('touchmove', this.handleTouchMove);
                target.removeEventListener('gesturestart', this.handleGestureStart);
                target.removeEventListener('gesturechange', this.handleGestureChange);
                target.removeEventListener('gestureend', this.handleGestureEnd);
            } catch (error) {
                console.warn('⚠️ Error removing event listeners:', error);
            }
        }
        
        console.log('👆 Interaction destroyed');
    }

    /**
     * Initialize touch interaction for camera space
     */
    initialize(container, cameraSession) {
        this.container = container;
        this.cameraSession = cameraSession;
        this.setupTouchListeners();
        this.setupMarkerSystem();
        this.isEnabled = true;
        
        // Show status message to user
        if (this.cameraSession && this.cameraSession.showStatusMessage) {
            this.cameraSession.showStatusMessage('👆 Touch controls ready!');
        }
        
        console.log('👆 Touch interaction initialized for camera session');
    }

    /**
     * Setup visual marker system for camera feedback
     */
    setupMarkerSystem() {
        this.markers = [];
        
        // Set frame callback for camera session
        if (this.cameraSession) {
            this.cameraSession.setFrameCallback(() => {
                // Basic frame callback for marker updates
                this.updateMarkers();
            });
        }
    }

    /**
     * Update markers each frame
     */
    updateMarkers() {
        // Simple marker updating - can be expanded for animations, etc.
        this.markers.forEach(marker => {
            if (marker.mesh && marker.mesh.material) {
                // Simple pulsing effect
                const time = Date.now() * 0.002;
                marker.mesh.material.opacity = 0.7 + Math.sin(time) * 0.2;
            }
        });
    }

    /**
     * Setup touch event listeners
     */
    setupTouchListeners() {
        if (!this.container) return;

        // Get the correct target for event binding
        const eventTarget = this.getEventTarget();
        
        console.log('👆 Setting up touch listeners on:', eventTarget.tagName, eventTarget.className);

        // Handle touch events
        eventTarget.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        eventTarget.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        eventTarget.addEventListener('click', this.handleClick.bind(this), { passive: false });

        // Prevent default touch behaviors that interfere with AR
        eventTarget.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        eventTarget.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        eventTarget.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        eventTarget.addEventListener('gestureend', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Store reference for cleanup
        this.eventTarget = eventTarget;
    }

    /**
     * Get the correct target for event binding
     */
    getEventTarget() {
        // If camera session is available and has an interaction target, use that
        if (this.cameraSession && this.cameraSession.getInteractionTarget) {
            const target = this.cameraSession.getInteractionTarget();
            if (target) {
                return target;
            }
        }
        
        // Fall back to container
        return this.container;
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

        // Show visual feedback immediately
        this.showTapConfirmation(x, y);
        
        // Show status message
        if (this.cameraSession && this.cameraSession.showStatusMessage) {
            this.cameraSession.showStatusMessage(`🎯 Tap at (${Math.round(x)}, ${Math.round(y)})`);
        }

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
     * Convert screen coordinates to camera world coordinates
     */
    async screenToWorldCoordinates(screenX, screenY) {
        if (!this.cameraSession) {
            console.warn('⚠️ Camera session not available');
            return this.fallbackScreenToWorld(screenX, screenY);
        }

        try {
            // Use camera session's screen to world conversion
            const worldPosition = this.cameraSession.screenToWorld(screenX, screenY, 2.0); // 2 meters distance
            
            if (worldPosition) {
                return worldPosition;
            }
            
            // Fallback if conversion fails
            return this.fallbackScreenToWorld(screenX, screenY);
            
        } catch (error) {
            console.warn('⚠️ Camera coordinate conversion failed, using fallback:', error);
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
     * Place visual marker in camera space
     */
    placeMarker(position) {
        if (!this.cameraSession || !this.cameraSession.scene) {
            console.warn('⚠️ Camera scene not available for marker placement');
            return null;
        }

        // Create marker geometry
        const geometry = new window.THREE.SphereGeometry(0.05, 16, 16);
        const material = new window.THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
        
        const marker = new window.THREE.Mesh(geometry, material);
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
        this.cameraSession.addToScene(marker);
        
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
            this.cameraSession.removeFromScene(oldMarker.mesh);
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
     * Show visual confirmation for successful tap
     */
    showTapConfirmation(x, y) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            left: ${x - 15}px;
            top: ${y - 15}px;
            width: 30px;
            height: 30px;
            background: rgba(0, 255, 0, 0.8);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1001;
            animation: tapConfirm 0.4s ease-out forwards;
        `;
        
        // Add CSS animation if not already present
        if (!document.querySelector('#tapConfirmStyles')) {
            const style = document.createElement('style');
            style.id = 'tapConfirmStyles';
            style.textContent = `
                @keyframes tapConfirm {
                    0% {
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scale(1.5);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(0.5);
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
        }, 400);
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
     * Cleanup and destroy interaction
     */
    destroy() {
        this.isEnabled = false;
        this.listeners.clear();
        this.clearMarkers();
        
        // Remove event listeners from the correct target
        const target = this.eventTarget || this.container;
        if (target) {
            // Remove event listeners (note: binding might not match, but this is cleanup)
            try {
                target.removeEventListener('touchstart', this.handleTouchStart);
                target.removeEventListener('touchend', this.handleTouchEnd);
                target.removeEventListener('click', this.handleClick);
                target.removeEventListener('touchmove', this.handleTouchMove);
                target.removeEventListener('gesturestart', this.handleGestureStart);
                target.removeEventListener('gesturechange', this.handleGestureChange);
                target.removeEventListener('gestureend', this.handleGestureEnd);
            } catch (error) {
                console.warn('⚠️ Error removing event listeners:', error);
            }
        }
        
        console.log('👆 Interaction destroyed');
    }
}

export default UserInteraction;