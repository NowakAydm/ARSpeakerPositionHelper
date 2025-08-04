/**
 * AR Speaker Position Helper - Simplified Version
 * Main application entry point without camera functionality
 */

import { TriangleCalculator } from './modules/triangle.js';
import { CameraSession } from './modules/camera-session.js';
import { MeasurementTool } from './modules/measurement.js';

class ARSpeakerApp {
    constructor() {
        this.triangleCalculator = null;
        this.cameraSession = null;
        this.measurementTool = null;
        this.speakers = [];
        this.userPosition = null;
        this.currentStep = 1;
        this.isSessionActive = false;
        this.currentMode = 'positioning'; // 'positioning' or 'measuring'
        
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
            
            // Initialize measurement tool
            this.measurementTool = new MeasurementTool();
            this.debugSuccess('Measurement tool initialized');
            
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
            
            // Set up callback to be called immediately when camera permission is granted
            this.cameraSession.setPermissionGrantedCallback(() => {
                this.onCameraPermissionGranted();
            });
            
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
            // Measurement controls
            measureModeButton: document.getElementById('measure-mode'),
            clearMeasurementsButton: document.getElementById('clear-measurements'),
            undoLastPointButton: document.getElementById('undo-last-point'),
            toggleUnitsButton: document.getElementById('toggle-units'),
            // Existing elements
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

        // Measurement controls
        if (this.elements.measureModeButton) {
            this.elements.measureModeButton.addEventListener('click', () => {
                this.toggleMeasurementMode();
            });
        }

        if (this.elements.clearMeasurementsButton) {
            this.elements.clearMeasurementsButton.addEventListener('click', () => {
                this.clearAllMeasurements();
            });
        }

        if (this.elements.undoLastPointButton) {
            this.elements.undoLastPointButton.addEventListener('click', () => {
                this.undoLastMeasurementPoint();
            });
        }

        if (this.elements.toggleUnitsButton) {
            this.elements.toggleUnitsButton.addEventListener('click', () => {
                this.toggleMeasurementUnits();
            });
        }

        // Container clicks to add speakers/position or measurement points
        if (this.elements.arContainer) {
            this.elements.arContainer.addEventListener('click', (event) => {
                if (this.isSessionActive) {
                    if (this.currentMode === 'measuring') {
                        // Measurement tool will handle its own clicks when active
                        return;
                    } else {
                        this.handleContainerClick(event);
                    }
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
     * Offer alternative modes when camera fails
     */
    offerAlternativeMode(reason) {
        this.debugInfo('📱 Camera not available, offering alternatives...');
        
        // Create a more informative dialog
        const message = `Camera is not available: ${reason}\n\nAvailable options:\n1. Manual Mode - Click to place speakers and set position\n2. Retry Camera - Try camera access again\n3. Help - View troubleshooting tips\n\nWould you like to continue in manual mode?`;
        
        if (confirm(message)) {
            this.startManualSession();
            return;
        }
        
        // User declined manual mode, offer help
        this.showCameraHelp(reason);
    }

    /**
     * Show camera troubleshooting help
     */
    showCameraHelp(reason) {
        const helpMessage = `Camera Access Help\n\nIssue: ${reason}\n\nTroubleshooting steps:\n• Ensure you're using HTTPS (camera requires secure connection)\n• Check browser permissions for camera access\n• Try a different browser (Chrome, Firefox, Safari)\n• Make sure no other apps are using the camera\n• Restart your browser\n• Check if your device has a camera\n\nSupported browsers:\n• Chrome 90+\n• Firefox 85+\n• Safari 14+\n• Edge 90+`;
        
        alert(helpMessage);
        this.debugInfo('📚 Camera help shown to user');
    }

    /**
     * Called immediately when camera permission is granted (before full session setup)
     */
    onCameraPermissionGranted() {
        this.debugSuccess('🎉 Camera permission granted! Enabling calibration and showing preview...');
        
        // Enable calibration button immediately
        if (this.elements.calibrateButton) {
            this.elements.calibrateButton.disabled = false;
        }
        
        // Enable measurement controls if they exist
        this.enableMeasurementControls();
        
        // Update status to show camera is active and ready
        this.updateStatus('Camera Active - Preview loading, calibration unlocked');
        this.updateInstructionStep(2);
        
        // Mark session as active for UI purposes
        this.isSessionActive = true;
        this.elements.startButton.textContent = 'Stop Camera Session';
        
        this.debugInfo('✅ Camera preview should now be visible and calibration enabled');
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

            // Run comprehensive camera diagnostics first
            this.debugInfo('🔍 Running camera diagnostics...');
            this.addCameraFeedIndicator('loading', 'Checking camera...');
            
            const diagnostics = await this.cameraSession.debugCameraCapabilities();
            
            if (!diagnostics.supported) {
                this.debugError(`Camera diagnostics failed: ${diagnostics.reason}`);
                this.addCameraFeedIndicator('error', 'Camera unavailable');
                this.offerAlternativeMode(diagnostics.reason);
                return;
            }

            this.addCameraFeedIndicator('loading', 'Initializing camera...');

            // Initialize camera session with container
            await this.cameraSession.initialize(this.elements.arContainer);
            this.debugSuccess('✅ Camera session initialized');

            this.addCameraFeedIndicator('loading', 'Starting camera feed...');

            // Start the camera
            await this.cameraSession.start();
            this.debugSuccess('✅ Camera started successfully');

            this.addCameraFeedIndicator('active', 'Camera feed active');

            // Reset data for new session
            this.speakers = [];
            this.userPosition = null;
            
            // Update final status
            this.updateStatus('Camera Active - Point camera at speakers');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Not Set');
            this.updateTriangleQuality('-');
            
            this.debugSuccess('✅ Camera session started successfully');
            
        } catch (error) {
            this.debugError(`Failed to start camera session: ${error.message}`);
            this.addCameraFeedIndicator('error', 'Camera failed');
            
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
                this.offerAlternativeMode(error.message);
                return;
            }
            
            this.showError(`Camera session failed: ${error.message}`);
            
            // Reset UI on failure
            this.isSessionActive = false;
            this.elements.startButton.textContent = 'Start Camera Session';
            if (this.elements.calibrateButton) {
                this.elements.calibrateButton.disabled = true;
            }
            this.disableMeasurementControls();
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
            this.disableMeasurementControls();
            
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

    /**
     * Add camera feed status indicator to container
     */
    addCameraFeedIndicator(status, message) {
        // Remove any existing indicator
        const existingIndicator = this.elements.arContainer.querySelector('.camera-feed-status');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create status indicator
        const indicator = document.createElement('div');
        indicator.className = `camera-feed-status camera-feed-${status}`;
        indicator.innerHTML = `
            <div class="feed-status-icon">${status === 'active' ? '📹' : status === 'error' ? '❌' : '⏳'}</div>
            <div class="feed-status-text">${message}</div>
        `;
        
        // Add CSS if not already present
        if (!document.getElementById('camera-feed-status-styles')) {
            const style = document.createElement('style');
            style.id = 'camera-feed-status-styles';
            style.textContent = `
                .camera-feed-status {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    z-index: 10;
                    backdrop-filter: blur(5px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .camera-feed-active {
                    background: rgba(0, 150, 0, 0.8);
                    border-color: rgba(0, 255, 0, 0.3);
                }
                .camera-feed-error {
                    background: rgba(150, 0, 0, 0.8);
                    border-color: rgba(255, 0, 0, 0.3);
                }
                .camera-feed-loading {
                    background: rgba(0, 100, 150, 0.8);
                    border-color: rgba(0, 150, 255, 0.3);
                }
                .feed-status-icon {
                    font-size: 14px;
                }
                .feed-status-text {
                    font-weight: 500;
                }
            `;
            document.head.appendChild(style);
        }
        
        this.elements.arContainer.appendChild(indicator);
        this.debugInfo(`📊 Camera feed indicator: ${status} - ${message}`);
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
     * Enable measurement controls when camera session is active
     */
    enableMeasurementControls() {
        const buttons = [
            'measureModeButton',
            'clearMeasurementsButton', 
            'undoLastPointButton',
            'toggleUnitsButton'
        ];
        
        buttons.forEach(buttonKey => {
            if (this.elements[buttonKey]) {
                this.elements[buttonKey].disabled = false;
            }
        });
        
        // Initialize measurement tool with camera session's Three.js components
        if (this.measurementTool && this.cameraSession) {
            const scene = this.cameraSession.scene;
            const camera = this.cameraSession.camera;
            const container = this.elements.arContainer;
            
            if (scene && camera && container) {
                this.measurementTool.initialize(scene, camera, container);
                this.debugSuccess('✅ Measurement tool connected to camera session');
            }
        }
    }

    /**
     * Disable measurement controls when camera session is inactive
     */
    disableMeasurementControls() {
        const buttons = [
            'measureModeButton',
            'clearMeasurementsButton',
            'undoLastPointButton', 
            'toggleUnitsButton'
        ];
        
        buttons.forEach(buttonKey => {
            if (this.elements[buttonKey]) {
                this.elements[buttonKey].disabled = true;
            }
        });

        // Deactivate measurement tool
        if (this.measurementTool) {
            this.measurementTool.deactivate();
        }

        // Reset to positioning mode
        this.currentMode = 'positioning';
        this.updateMeasureModeButton();
    }

    /**
     * Toggle between positioning and measuring modes
     */
    toggleMeasurementMode() {
        if (!this.isSessionActive) {
            this.showError('Please start a camera session first');
            return;
        }

        if (this.currentMode === 'positioning') {
            this.currentMode = 'measuring';
            this.measurementTool.activate();
            this.updateStatus('Measuring Mode - Tap to place measurement points');
            this.debugInfo('📏 Switched to measuring mode');
        } else {
            this.currentMode = 'positioning';
            this.measurementTool.deactivate();
            this.updateStatus('Positioning Mode - Tap to set speaker/listener positions');
            this.debugInfo('📍 Switched to positioning mode');
        }

        this.updateMeasureModeButton();
    }

    /**
     * Update measure mode button text based on current mode
     */
    updateMeasureModeButton() {
        if (this.elements.measureModeButton) {
            if (this.currentMode === 'measuring') {
                this.elements.measureModeButton.textContent = 'Exit Measuring';
                this.elements.measureModeButton.classList.add('active');
            } else {
                this.elements.measureModeButton.textContent = 'Start Measuring';
                this.elements.measureModeButton.classList.remove('active');
            }
        }
    }

    /**
     * Clear all measurement points and lines
     */
    clearAllMeasurements() {
        if (!this.measurementTool) {
            this.showError('Measurement tool not available');
            return;
        }

        this.measurementTool.clearAll();
        this.debugSuccess('🧹 All measurements cleared');
        
        // Update status
        const stats = this.measurementTool.getStatistics();
        this.updateMeasurementStats(stats);
    }

    /**
     * Undo the last measurement point
     */
    undoLastMeasurementPoint() {
        if (!this.measurementTool) {
            this.showError('Measurement tool not available');
            return;
        }

        this.measurementTool.undoLastPoint();
        this.debugSuccess('🔙 Last measurement point removed');
        
        // Update stats
        const stats = this.measurementTool.getStatistics();
        this.updateMeasurementStats(stats);
    }

    /**
     * Toggle between metric and imperial units
     */
    toggleMeasurementUnits() {
        if (!this.measurementTool) {
            this.showError('Measurement tool not available');
            return;
        }

        this.measurementTool.toggleUnits();
        
        // Update button text
        if (this.elements.toggleUnitsButton) {
            const units = this.measurementTool.units;
            this.elements.toggleUnitsButton.textContent = units === 'metric' ? 'Switch to Imperial' : 'Switch to Metric';
        }
        
        this.debugSuccess(`📏 Units switched to ${this.measurementTool.units}`);
    }

    /**
     * Update measurement statistics display
     */
    updateMeasurementStats(stats) {
        // For now, log to debug console - we can add UI elements later
        this.debugInfo(`📊 Measurement Stats: ${stats.pointCount} points, ${stats.lineCount} lines, Total: ${stats.formattedTotalDistance}`);
        
        // Update the existing status display to show measurement info when in measuring mode
        if (this.currentMode === 'measuring') {
            this.updateStatus(`Measuring Mode - ${stats.pointCount} points, Total: ${stats.formattedTotalDistance}`);
        }
    }
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
        
        window.runCameraDiagnostics = async () => {
            this.debugInfo('🔍 Manual camera diagnostics requested');
            if (this.cameraSession) {
                return await this.cameraSession.debugCameraCapabilities();
            } else {
                this.debugError('Camera session not available');
                return { supported: false, reason: 'Camera session not initialized' };
            }
        };
        
        window.testCameraFallback = async () => {
            this.debugInfo('🧪 Testing camera fallback constraints');
            if (this.cameraSession) {
                try {
                    const stream = await this.cameraSession.requestCameraWithFallback();
                    this.debugSuccess('✅ Camera fallback test successful');
                    // Clean up test stream
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                    }
                    return { success: true };
                } catch (error) {
                    this.debugError(`❌ Camera fallback test failed: ${error.message}`);
                    return { success: false, error: error.message };
                }
            } else {
                this.debugError('Camera session not available');
                return { success: false, error: 'Camera session not initialized' };
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
