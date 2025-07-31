/**
 * User Interaction Module
 * Handles touch input and AR space interaction
 */

export class UserInteraction {
    constructor() {
        this.isEnabled = false;
        this.tapPosition = null;
        this.listeners = new Map();
    }

    /**
     * Initialize touch interaction for AR
     */
    initialize(container) {
        this.container = container;
        this.setupTouchListeners();
        this.isEnabled = true;
        console.log('👆 Touch interaction initialized');
    }

    /**
     * Setup touch event listeners
     */
    setupTouchListeners() {
        if (!this.container) return;

        // Handle touch events
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));
        this.container.addEventListener('click', this.handleClick.bind(this));

        // Prevent default touch behaviors that interfere with AR
        this.container.addEventListener('touchmove', (e) => e.preventDefault());
        this.container.addEventListener('gesturestart', (e) => e.preventDefault());
        this.container.addEventListener('gesturechange', (e) => e.preventDefault());
        this.container.addEventListener('gestureend', (e) => e.preventDefault());
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
    handleTap(x, y) {
        console.log(`🎯 Tap detected at: (${x}, ${y})`);

        // Convert screen coordinates to AR world coordinates
        const worldPosition = this.screenToWorldCoordinates(x, y);
        
        // Emit tap event
        this.emit('tap', {
            screen: { x, y },
            world: worldPosition
        });
    }

    /**
     * Convert screen coordinates to AR world coordinates
     */
    screenToWorldCoordinates(screenX, screenY) {
        // TODO: Implement proper AR coordinate conversion
        // This would typically use the AR session's hit testing
        
        // Mock conversion for now
        const rect = this.container.getBoundingClientRect();
        const normalizedX = (screenX - rect.left) / rect.width;
        const normalizedY = (screenY - rect.top) / rect.height;

        return {
            x: (normalizedX - 0.5) * 4,  // -2 to 2 meters
            y: (0.5 - normalizedY) * 3,  // -1.5 to 1.5 meters (flip Y)
            z: -2.0  // 2 meters in front of camera
        };
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