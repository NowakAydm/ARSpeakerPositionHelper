/**
 * AR Speaker Position Helper
 * Main application entry point
 */

class ARSpeakerApp {
    constructor() {
        this.isARSupported = false;
        this.arSession = null;
        this.speakers = [];
        this.userPosition = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing AR Speaker Position Helper');
        
        try {
            // Initialize UI elements
            this.initializeUI();
            
            // Check AR support
            await this.checkARSupport();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide loading overlay
            this.hideLoading();
            
            console.log('✅ Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showError('Failed to initialize AR capabilities. Please ensure you\'re using HTTPS and a compatible browser.');
        }
    }

    initializeUI() {
        // Get DOM elements
        this.elements = {
            startButton: document.getElementById('start-ar'),
            calibrateButton: document.getElementById('calibrate'),
            arContainer: document.getElementById('ar-container'),
            arStatus: document.getElementById('ar-status'),
            speakerCount: document.getElementById('speaker-count'),
            positionStatus: document.getElementById('position-status'),
            loading: document.getElementById('loading'),
            errorModal: document.getElementById('error-modal'),
            errorMessage: document.getElementById('error-message'),
            errorClose: document.getElementById('error-close')
        };

        // Validate required elements
        const requiredElements = ['startButton', 'arContainer', 'arStatus'];
        for (const elementKey of requiredElements) {
            if (!this.elements[elementKey]) {
                throw new Error(`Required UI element not found: ${elementKey}`);
            }
        }
    }

    async checkARSupport() {
        this.updateStatus('Checking AR support...');
        
        // Check if browser supports WebXR
        if (!navigator.xr) {
            this.isARSupported = false;
            this.updateStatus('WebXR not supported');
            throw new Error('WebXR not supported in this browser');
        }

        try {
            // Check if immersive AR is supported
            const supported = await navigator.xr.isSessionSupported('immersive-ar');
            this.isARSupported = supported;
            
            if (supported) {
                this.updateStatus('AR Ready');
                this.elements.startButton.disabled = false;
                this.elements.startButton.textContent = 'Start AR Session';
            } else {
                this.updateStatus('AR not available');
                this.elements.startButton.textContent = 'AR Not Available';
            }
            
        } catch (error) {
            console.warn('AR support check failed:', error);
            this.isARSupported = false;
            this.updateStatus('AR support unknown');
            this.elements.startButton.disabled = false;
            this.elements.startButton.textContent = 'Try AR Session';
        }
    }

    setupEventListeners() {
        // Start AR button
        this.elements.startButton.addEventListener('click', () => {
            if (this.arSession) {
                this.stopARSession();
            } else {
                this.startARSession();
            }
        });

        // Calibrate button
        this.elements.calibrateButton?.addEventListener('click', () => {
            this.calibratePosition();
        });

        // Error modal close
        this.elements.errorClose?.addEventListener('click', () => {
            this.hideError();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });
    }

    async startARSession() {
        if (!this.isARSupported) {
            this.showError('AR is not supported on this device or browser.');
            return;
        }

        try {
            this.updateStatus('Starting AR session...');
            this.elements.startButton.disabled = true;
            
            // This is a placeholder for actual WebXR implementation
            console.log('🔄 Starting AR session...');
            
            // Simulate AR session startup
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update UI for active session
            this.arSession = { active: true }; // Placeholder session object
            this.elements.startButton.textContent = 'Stop AR Session';
            this.elements.startButton.disabled = false;
            this.elements.calibrateButton.disabled = false;
            
            this.updateStatus('AR Active');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Not Set');
            
            console.log('✅ AR session started');
            
        } catch (error) {
            console.error('❌ Failed to start AR session:', error);
            this.showError('Failed to start AR session. Please check camera permissions.');
            this.elements.startButton.disabled = false;
        }
    }

    async stopARSession() {
        try {
            this.updateStatus('Stopping AR session...');
            
            // Cleanup AR session
            if (this.arSession) {
                this.arSession = null;
            }
            
            // Reset UI
            this.elements.startButton.textContent = 'Start AR Session';
            this.elements.calibrateButton.disabled = true;
            
            this.updateStatus('AR Ready');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Not Set');
            
            console.log('🛑 AR session stopped');
            
        } catch (error) {
            console.error('❌ Failed to stop AR session:', error);
        }
    }

    calibratePosition() {
        if (!this.arSession) {
            this.showError('Please start AR session first.');
            return;
        }

        console.log('🎯 Calibrating user position...');
        
        // Placeholder for actual calibration logic
        this.userPosition = { x: 0, y: 0, z: 0 };
        this.updatePositionStatus('Calibrated');
        
        // Enable triangle calculation if we have speakers
        if (this.speakers.length >= 2) {
            this.calculateOptimalTriangle();
        }
    }

    calculateOptimalTriangle() {
        console.log('📐 Calculating optimal listening triangle...');
        
        // Placeholder for triangle calculation
        // In real implementation, this would:
        // 1. Use speaker positions
        // 2. Calculate equilateral triangle
        // 3. Provide visual guidance
    }

    // UI Update Methods
    updateStatus(status) {
        if (this.elements.arStatus) {
            this.elements.arStatus.textContent = status;
        }
        console.log(`📊 Status: ${status}`);
    }

    updateSpeakerCount(count) {
        if (this.elements.speakerCount) {
            this.elements.speakerCount.textContent = count.toString();
        }
    }

    updatePositionStatus(status) {
        if (this.elements.positionStatus) {
            this.elements.positionStatus.textContent = status;
        }
    }

    showError(message) {
        if (this.elements.errorModal && this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorModal.classList.remove('hidden');
        }
        console.error('🚨 Error:', message);
    }

    hideError() {
        if (this.elements.errorModal) {
            this.elements.errorModal.classList.add('hidden');
        }
    }

    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.style.display = 'none';
        }
    }

    handleResize() {
        // Handle responsive layout changes
        console.log('📱 Handling resize/orientation change');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.arSpeakerApp = new ARSpeakerApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.arSpeakerApp?.arSession) {
        console.log('⏸️ Page hidden, pausing AR session');
        // In real implementation, pause AR session
    } else if (!document.hidden && window.arSpeakerApp) {
        console.log('▶️ Page visible, resuming AR session');
        // In real implementation, resume AR session
    }
});

export default ARSpeakerApp;