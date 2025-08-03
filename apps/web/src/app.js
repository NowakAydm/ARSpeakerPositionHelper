/**
 * AR Speaker Position Helper - Simplified Version
 * Main application entry point without camera functionality
 */

import { TriangleCalculator } from './modules/triangle.js';
import { CameraSession } from './modules/camera-session.js';

class ARSpeakerApp {
    constructor() {
        this.triangleCalculator = null;
        this.cameraSession = null;
        this.speakers = [];
        this.userPosition = null;
        this.currentStep = 1;
        this.isSessionActive = false;
        
        // Set up global debug logger
        window.appDebugLog = this.debugLog.bind(this);
        window.appDebugError = this.debugError.bind(this);
        window.appDebugWarning = this.debugWarning.bind(this);
        window.appDebugSuccess = this.debugSuccess.bind(this);
        window.appDebugInfo = this.debugInfo.bind(this);
        
        this.init();
    }

    /**
     * Debug console logging methods
     */
    debugLog(message, type = 'info') {
        // Always log to browser console
        console.log(message);
        
        // Also log to debug console if available
        const debugContent = document.getElementById('debug-content');
        if (debugContent) {
            const messageElement = document.createElement('div');
            messageElement.className = `debug-message ${type}`;
            messageElement.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            debugContent.appendChild(messageElement);
            
            // Scroll to bottom
            debugContent.scrollTop = debugContent.scrollHeight;
            
            // Limit to last 100 messages
            const messages = debugContent.children;
            if (messages.length > 100) {
                debugContent.removeChild(messages[0]);
            }
        }
    }

    debugError(message) {
        this.debugLog(`❌ ${message}`, 'error');
    }

    debugWarning(message) {
        this.debugLog(`⚠️ ${message}`, 'warning');
    }

    debugSuccess(message) {
        this.debugLog(`✅ ${message}`, 'success');
    }

    debugInfo(message) {
        this.debugLog(`ℹ️ ${message}`, 'info');
    }

    /**
     * Initialize the application (simplified)
     */
    async init() {
        this.debugInfo('🚀 Initializing Speaker Position Helper');
        
        try {
            // Initialize debug console
            this.initializeDebugConsole();
            this.debugSuccess('Debug console initialized');
            
            // Initialize UI elements
            this.initializeUI();
            this.debugSuccess('UI initialized');
            
            // Initialize triangle calculator
            this.triangleCalculator = new TriangleCalculator();
            this.debugSuccess('Triangle calculator initialized');
            
            // Initialize camera session (for future use)
            await this.initializeCameraSession();
            
            // Setup event listeners
            this.setupEventListeners();
            this.debugSuccess('Event listeners setup');
            
            // Hide loading and enable UI
            this.hideLoading();
            this.enableInitialButtons();
            
            this.debugSuccess('Application initialized successfully');
            
            // Expose debug functions
            this.exposeDebugFunctions();
            
        } catch (error) {
            this.debugError(`Failed to initialize application: ${error.message}`);
            this.hideLoading();
            this.showError('Failed to initialize the application. Please refresh and try again.');
        }
    }

    /**
     * Initialize debug console
     */
    initializeDebugConsole() {
        const debugToggle = document.getElementById('debug-toggle');
        const debugConsole = document.getElementById('debug-console');
        
        if (debugToggle && debugConsole) {
            // Start with debug console visible for development
            debugConsole.classList.remove('hidden');
            
            // Toggle functionality
            debugToggle.addEventListener('click', () => {
                debugConsole.classList.toggle('hidden');
                if (!debugConsole.classList.contains('hidden')) {
                    this.debugInfo('Debug console opened');
                }
            });
            
            // Add welcome message
            this.debugInfo('=== DEBUG CONSOLE INITIALIZED ===');
            this.debugInfo('All app events and camera session logs will appear here');
        }
    }

    /**
     * Initialize camera session for future camera functionality
     */
    async initializeCameraSession() {
        this.debugInfo('Initializing camera session...');
        
        try {
            // Check if camera is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.debugWarning('Camera access not supported in this browser');
                return;
            }
            
            // Create camera session instance but don't start it yet
            this.cameraSession = new CameraSession();
            this.debugSuccess('Camera session object created');
            this.debugInfo('Camera permissions will be requested when user starts session');
            
        } catch (error) {
            this.debugError(`Camera session initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize UI elements
     */
    initializeUI() {
        this.elements = {
            startButton: document.getElementById('start-ar'),
            calibrateButton: document.getElementById('calibrate'),
            resetButton: document.getElementById('reset'),
            arContainer: document.getElementById('ar-container'),
            arStatus: document.getElementById('ar-status'),
            speakerCount: document.getElementById('speaker-count'),
            positionStatus: document.getElementById('position-status'),
            triangleQuality: document.getElementById('triangle-quality'),
            loading: document.getElementById('loading'),
            errorModal: document.getElementById('error-modal'),
            errorMessage: document.getElementById('error-message'),
            errorClose: document.getElementById('error-close'),
            instructions: document.getElementById('instructions'),
            helpButton: document.getElementById('help-toggle')
        };

        // Validate required elements
        const requiredElements = ['startButton', 'arContainer', 'arStatus'];
        for (const elementKey of requiredElements) {
            if (!this.elements[elementKey]) {
                this.debugError(`Required UI element not found: ${elementKey}`);
                throw new Error(`Required UI element not found: ${elementKey}`);
            }
        }

        this.debugInfo('📋 UI elements validated successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Start/Stop button
        if (this.elements.startButton) {
            this.elements.startButton.addEventListener('click', () => {
                this.debugInfo('🔘 Start button clicked');
                
                if (this.isSessionActive) {
                    this.stopCameraSession();
                } else {
                    this.startCameraSession();
                }
            });
        }

        // Calibrate button
        if (this.elements.calibrateButton) {
            this.elements.calibrateButton.addEventListener('click', () => {
                this.calibratePosition();
            });
        }

        // Reset button
        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', () => {
                this.resetSession();
            });
        }

        // Error modal close
        if (this.elements.errorClose) {
            this.elements.errorClose.addEventListener('click', () => {
                this.hideError();
            });
        }

        // Help toggle
        if (this.elements.helpButton) {
            this.elements.helpButton.addEventListener('click', () => {
                this.toggleInstructions();
            });
        }

        // Container clicks to add speakers/position
        if (this.elements.arContainer) {
            this.elements.arContainer.addEventListener('click', (event) => {
                if (this.isSessionActive) {
                    this.handleContainerClick(event);
                }
            });
        }
    }

    /**
     * Enable initial buttons
     */
    enableInitialButtons() {
        if (this.elements.startButton) {
            this.elements.startButton.disabled = false;
            this.elements.startButton.textContent = 'Start Camera Session';
        }
        
        if (this.elements.resetButton) {
            this.elements.resetButton.disabled = false;
        }
        
        this.updateStatus('Ready - Click to start camera session');
        this.debugSuccess('✅ Initial buttons enabled');
    }

    /**
     * Start manual session
     */
    startManualSession() {
        this.debugInfo('🚀 Starting manual session');
        
        try {
            this.isSessionActive = true;
            
            // Update UI
            this.elements.startButton.textContent = 'Stop Manual Mode';
            if (this.elements.calibrateButton) {
                this.elements.calibrateButton.disabled = false;
            }
            
            // Reset data
            this.speakers = [];
            this.userPosition = null;
            
            this.updateStatus('Manual Mode Active - Click container to set listener position first');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Click to set');
            this.updateTriangleQuality('-');
            this.updateInstructionStep(2);
            
            this.debugSuccess('✅ Manual session started');
            
        } catch (error) {
            this.debugError(`Failed to start manual session: ${error.message}`);
            this.showError('Failed to start manual session');
        }
    }

    /**
     * Stop manual session
     */
    stopManualSession() {
        this.debugInfo('🛑 Stopping manual session');
        
        try {
            this.isSessionActive = false;
            
            // Reset data
            this.speakers = [];
            this.userPosition = null;
            
            // Update UI
            this.elements.startButton.textContent = 'Start Manual Mode';
            if (this.elements.calibrateButton) {
                this.elements.calibrateButton.disabled = true;
            }
            
            this.updateStatus('Ready - Manual speaker positioning mode');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Not Set');
            this.updateTriangleQuality('-');
            this.updateInstructionStep(1);
            
            this.debugSuccess('✅ Manual session stopped');
            
        } catch (error) {
            this.debugError(`Failed to stop manual session: ${error.message}`);
            this.showError('Failed to stop manual session');
        }
    }

    /**
     * Start camera session
     */
    async startCameraSession() {
        this.debugInfo('🚀 Starting camera session');
        
        try {
            // Check if camera session is available
            if (!this.cameraSession) {
                this.debugError('Camera session not initialized');
                this.showError('Camera session not available. Please refresh and try again.');
                return;
            }

            // Initialize camera session with container
            await this.cameraSession.initialize(this.elements.arContainer);
            this.debugSuccess('✅ Camera session initialized');

            // Start the camera
            await this.cameraSession.start();
            this.debugSuccess('✅ Camera started successfully');

            this.isSessionActive = true;
            
            // Update UI
            this.elements.startButton.textContent = 'Stop Camera Session';
            if (this.elements.calibrateButton) {
                this.elements.calibrateButton.disabled = false;
            }
            
            // Reset data
            this.speakers = [];
            this.userPosition = null;
            
            this.updateStatus('Camera Active - Point camera at speakers');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Not Set');
            this.updateTriangleQuality('-');
            this.updateInstructionStep(2);
            
            this.debugSuccess('✅ Camera session started successfully');
            
        } catch (error) {
            this.debugError(`Failed to start camera session: ${error.message}`);
            
            // Ensure camera session is properly cleaned up on failure
            if (this.cameraSession) {
                try {
                    this.cameraSession.stop();
                } catch (stopError) {
                    this.debugError(`Error during camera cleanup: ${stopError.message}`);
                }
            }
            
            // Check if error is due to camera not being available
            if (error.message.includes('No camera found') || 
                error.message.includes('Camera access was denied') ||
                error.message.includes('Camera access not supported')) {
                
                this.debugInfo('📱 Camera not available, offering manual mode...');
                
                // Offer manual mode as fallback
                if (confirm(`Camera is not available: ${error.message}\n\nWould you like to continue in manual mode? You can click to place speakers and set your listening position.`)) {
                    this.startManualSession();
                    return;
                }
            }
            
            this.showError(`Camera session failed: ${error.message}`);
            
            // Reset UI on failure
            this.isSessionActive = false;
            this.elements.startButton.textContent = 'Start Camera Session';
            if (this.elements.calibrateButton) {
                this.elements.calibrateButton.disabled = true;
            }
        }
    }

    /**
     * Stop camera session
     */
    async stopCameraSession() {
        this.debugInfo('🛑 Stopping camera session');
        
        try {
            // Stop the camera session
            if (this.cameraSession) {
                this.cameraSession.stop();
                this.debugSuccess('✅ Camera session stopped');
            }

            this.isSessionActive = false;
            
            // Reset data
            this.speakers = [];
            this.userPosition = null;
            
            // Update UI
            this.elements.startButton.textContent = 'Start Camera Session';
            if (this.elements.calibrateButton) {
                this.elements.calibrateButton.disabled = true;
            }
            
            this.updateStatus('Ready - Click to start camera session');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Not Set');
            this.updateTriangleQuality('-');
            this.updateInstructionStep(1);
            
            this.debugSuccess('✅ Camera session stopped successfully');
            
        } catch (error) {
            this.debugError(`Failed to stop camera session: ${error.message}`);
            this.showError('Failed to stop camera session');
        }
    }

    /**
     * Handle container clicks to set positions
     */
    handleContainerClick(event) {
        this.debugInfo('👆 Container clicked');
        
        if (!this.userPosition) {
            // First click sets listener position
            this.userPosition = { x: 0, y: 0, z: 0 };
            this.updatePositionStatus('Set by click');
            this.updateStatus('Manual Mode - Listener position set. Click to add speakers.');
            this.debugInfo('👤 User position set');
        } else {
            // Subsequent clicks add speakers
            const speakerId = `speaker_${this.speakers.length + 1}`;
            const newSpeaker = {
                id: speakerId,
                type: 'speaker',
                position: {
                    x: (Math.random() - 0.5) * 4,
                    y: 0,
                    z: -2 - Math.random() * 2
                }
            };
            
            this.speakers.push(newSpeaker);
            this.updateSpeakerCount(this.speakers.length);
            
            if (this.speakers.length >= 2) {
                this.calculateOptimalTriangle();
                this.updateStatus(`Manual Mode - ${this.speakers.length} speakers placed. Triangle calculated.`);
                this.updateInstructionStep(4);
            } else {
                this.updateStatus(`Manual Mode - ${this.speakers.length} speaker placed. Click to add more.`);
                this.updateInstructionStep(3);
            }
            
            this.debugInfo(`🔊 Added speaker ${this.speakers.length}`);
        }
    }

    /**
     * Calibrate position
     */
    calibratePosition() {
        if (!this.isSessionActive) {
            this.showError('Please start manual mode first');
            return;
        }

        this.userPosition = { x: 0, y: 0, z: 0 };
        this.updatePositionStatus('Calibrated');
        this.updateStatus('Manual Mode - Position calibrated');
        
        if (this.speakers.length >= 2) {
            this.calculateOptimalTriangle();
        }
        
        this.debugInfo('🎯 Position calibrated');
    }

    /**
     * Calculate optimal triangle
     */
    calculateOptimalTriangle() {
        if (!this.triangleCalculator || this.speakers.length < 2 || !this.userPosition) {
            return;
        }

        this.debugInfo('📐 Calculating optimal triangle');
        
        // Use triangle calculator
        this.triangleCalculator.setSpeakers(this.speakers);
        this.triangleCalculator.setListenerPosition(this.userPosition);
        
        const quality = this.triangleCalculator.getTriangleQuality();
        this.updateTriangleQuality(`${quality}%`);
        
        this.debugInfo(`📐 Triangle quality: ${quality}%`);
    }

    /**
     * Reset session
     */
    async resetSession() {
        this.debugInfo('🔄 Resetting session');
        
        if (this.isSessionActive) {
            this.stopManualSession();
        }
        
        // Clear all data
        this.speakers = [];
        this.userPosition = null;
        
        // Reset UI
        this.updateInstructionStep(1);
        this.updateStatus('Ready - Manual speaker positioning mode');
        this.updateSpeakerCount(0);
        this.updatePositionStatus('Not Set');
        this.updateTriangleQuality('-');
        
        this.debugSuccess('✅ Session reset complete');
    }

    /**
     * Update instruction step
     */
    updateInstructionStep(step) {
        this.currentStep = step;
        this.debugInfo(`📋 Instruction step: ${step}`);
    }

    /**
     * Toggle instructions
     */
    toggleInstructions() {
        if (this.elements.instructions) {
            this.elements.instructions.classList.toggle('hidden');
        }
    }

    // UI Update Methods
    updateStatus(status) {
        if (this.elements.arStatus) {
            this.elements.arStatus.textContent = status;
        }
        this.debugInfo(`📊 Status: ${status}`);
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

    updateTriangleQuality(quality) {
        if (this.elements.triangleQuality) {
            this.elements.triangleQuality.textContent = quality;
        }
    }

    // Error handling
    showError(message) {
        if (this.elements.errorModal && this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorModal.classList.remove('hidden');
        }
        this.debugError(`🚨 Error: ${message}`);
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

    /**
     * Expose debug functions
     */
    exposeDebugFunctions() {
        window.debugApp = () => {
            this.debugInfo('🔍 App Debug Info:');
            this.debugInfo(`  - Session active: ${this.isSessionActive}`);
            this.debugInfo(`  - Triangle calculator: ${this.triangleCalculator}`);
            this.debugInfo(`  - Speakers: ${this.speakers.length}`);
            this.debugInfo(`  - User position: ${this.userPosition ? 'Set' : 'Not set'}`);
            this.debugInfo(`  - Current step: ${this.currentStep}`);
            this.debugInfo(`  - Camera session: ${this.cameraSession ? 'Available' : 'Not available'}`);
        };
        
        window.addTestSpeaker = () => {
            if (this.isSessionActive) {
                this.handleContainerClick(null);
            } else {
                this.debugWarning('Start manual mode first');
            }
        };
        
        this.debugSuccess('Debug functions exposed to window object');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.arSpeakerApp = new ARSpeakerApp();
});

export default ARSpeakerApp;
