/**
 * AR Speaker Position Helper - Simplified Version
 * Main application entry point without camera functionality
 */

import { TriangleCalculator } from './modules/triangle.js';

class ARSpeakerApp {
    constructor() {
        this.triangleCalculator = null;
        this.speakers = [];
        this.userPosition = null;
        this.currentStep = 1;
        this.isSessionActive = false;
        
        this.init();
    }

    /**
     * Initialize the application (simplified)
     */
    async init() {
        console.log('🚀 Initializing Speaker Position Helper (Simplified Mode)');
        
        try {
            // Initialize UI elements
            this.initializeUI();
            console.log('✅ UI initialized');
            
            // Initialize triangle calculator
            this.triangleCalculator = new TriangleCalculator();
            console.log('✅ Triangle calculator initialized');
            
            // Setup event listeners
            this.setupEventListeners();
            console.log('✅ Event listeners setup');
            
            // Hide loading and enable UI
            this.hideLoading();
            this.enableInitialButtons();
            
            console.log('✅ Application initialized successfully');
            
            // Expose debug functions
            this.exposeDebugFunctions();
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.hideLoading();
            this.showError('Failed to initialize the application. Please refresh and try again.');
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
                console.error(`❌ Required UI element not found: ${elementKey}`);
                throw new Error(`Required UI element not found: ${elementKey}`);
            }
        }

        console.log('📋 UI elements validated successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Start/Stop button
        if (this.elements.startButton) {
            this.elements.startButton.addEventListener('click', () => {
                console.log('🔘 Start button clicked');
                
                if (this.isSessionActive) {
                    this.stopManualSession();
                } else {
                    this.startManualSession();
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
            this.elements.startButton.textContent = 'Start Manual Mode';
        }
        
        if (this.elements.resetButton) {
            this.elements.resetButton.disabled = false;
        }
        
        this.updateStatus('Ready - Manual speaker positioning mode');
        console.log('✅ Initial buttons enabled');
    }

    /**
     * Start manual session
     */
    startManualSession() {
        console.log('🚀 Starting manual session');
        
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
            
            console.log('✅ Manual session started');
            
        } catch (error) {
            console.error('❌ Failed to start manual session:', error);
            this.showError('Failed to start manual session');
        }
    }

    /**
     * Stop manual session
     */
    stopManualSession() {
        console.log('🛑 Stopping manual session');
        
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
            
            console.log('✅ Manual session stopped');
            
        } catch (error) {
            console.error('❌ Failed to stop manual session:', error);
            this.showError('Failed to stop manual session');
        }
    }

    /**
     * Handle container clicks to set positions
     */
    handleContainerClick(event) {
        console.log('👆 Container clicked');
        
        if (!this.userPosition) {
            // First click sets listener position
            this.userPosition = { x: 0, y: 0, z: 0 };
            this.updatePositionStatus('Set by click');
            this.updateStatus('Manual Mode - Listener position set. Click to add speakers.');
            console.log('👤 User position set');
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
            
            console.log(`🔊 Added speaker ${this.speakers.length}`);
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
        
        console.log('🎯 Position calibrated');
    }

    /**
     * Calculate optimal triangle
     */
    calculateOptimalTriangle() {
        if (!this.triangleCalculator || this.speakers.length < 2 || !this.userPosition) {
            return;
        }

        console.log('📐 Calculating optimal triangle');
        
        // Use triangle calculator
        this.triangleCalculator.setSpeakers(this.speakers);
        this.triangleCalculator.setListenerPosition(this.userPosition);
        
        const quality = this.triangleCalculator.getTriangleQuality();
        this.updateTriangleQuality(`${quality}%`);
        
        console.log(`📐 Triangle quality: ${quality}%`);
    }

    /**
     * Reset session
     */
    async resetSession() {
        console.log('🔄 Resetting session');
        
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
        
        console.log('✅ Session reset complete');
    }

    /**
     * Update instruction step
     */
    updateInstructionStep(step) {
        this.currentStep = step;
        console.log(`📋 Instruction step: ${step}`);
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

    /**
     * Expose debug functions
     */
    exposeDebugFunctions() {
        window.debugApp = () => {
            console.log('🔍 App Debug Info:');
            console.log('  - Session active:', this.isSessionActive);
            console.log('  - Triangle calculator:', this.triangleCalculator);
            console.log('  - Speakers:', this.speakers);
            console.log('  - User position:', this.userPosition);
            console.log('  - Current step:', this.currentStep);
        };
        
        window.addTestSpeaker = () => {
            if (this.isSessionActive) {
                this.handleContainerClick(null);
            } else {
                console.log('Start manual mode first');
            }
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.arSpeakerApp = new ARSpeakerApp();
});

export default ARSpeakerApp;
