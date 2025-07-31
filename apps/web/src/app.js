/**
 * AR Speaker Position Helper
 * Main application entry point
 */

import { ARSession } from './modules/ar-session.js';
import { ObjectDetection } from './modules/detection.js';
import { UserInteraction } from './modules/interaction.js';
import { TriangleCalculator } from './modules/triangle.js';

class ARSpeakerApp {
    constructor() {
        this.isARSupported = false;
        this.arSession = null;
        this.objectDetection = null;
        this.userInteraction = null;
        this.triangleCalculator = null;
        this.speakers = [];
        this.userPosition = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing AR Speaker Position Helper');
        
        try {
            // Initialize UI elements
            this.initializeUI();
            
            // Initialize object detection
            this.objectDetection = new ObjectDetection();
            await this.objectDetection.loadModel();
            
            // Initialize triangle calculator
            this.triangleCalculator = new TriangleCalculator();
            
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
            helpButton: document.getElementById('help-toggle'),
            performanceMonitor: document.getElementById('performance'),
            fpsCounter: document.getElementById('fps-counter'),
            memoryUsage: document.getElementById('memory-usage')
        };

        // Validate required elements
        const requiredElements = ['startButton', 'arContainer', 'arStatus'];
        for (const elementKey of requiredElements) {
            if (!this.elements[elementKey]) {
                throw new Error(`Required UI element not found: ${elementKey}`);
            }
        }

        // Initialize UI state
        this.currentStep = 1;
        this.instructionsVisible = true;
        this.performanceMonitorEnabled = false;
        
        // Setup UI interactions
        this.setupUIInteractions();
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

        // Reset button
        this.elements.resetButton?.addEventListener('click', () => {
            this.resetSession();
        });

        // Error modal close
        this.elements.errorClose?.addEventListener('click', () => {
            this.hideError();
        });

        // Help toggle
        this.elements.helpButton?.addEventListener('click', () => {
            this.toggleInstructions();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });

        // Handle page visibility for performance optimization
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Double-tap to toggle performance monitor
        let tapCount = 0;
        this.elements.helpButton?.addEventListener('click', () => {
            tapCount++;
            setTimeout(() => {
                if (tapCount === 2) {
                    this.togglePerformanceMonitor();
                }
                tapCount = 0;
            }, 300);
        });
    }

    async startARSession() {
        if (!this.isARSupported) {
            this.showError('AR is not supported on this device or browser.');
            return;
        }

        try {
            this.updateStatus('Starting AR session...');
            this.updateInstructionStep(2);
            this.elements.startButton.disabled = true;
            
            // Initialize AR session if not already done
            if (!this.arSession) {
                this.arSession = new ARSession();
                await this.arSession.initialize(this.elements.arContainer);
            }
            
            // Start the AR session
            await this.arSession.start();
            
            // Initialize triangle calculator with AR session
            this.triangleCalculator.initialize(this.arSession);
            
            // Setup triangle guidance callbacks
            this.setupTriangleGuidance();
            
            // Setup user interaction
            this.setupUserInteraction();
            
            // Setup object detection integration
            this.setupObjectDetection();
            
            // Start performance monitoring if enabled
            if (this.performanceMonitorEnabled) {
                this.startPerformanceMonitoring();
            }
            
            // Update UI for active session
            this.elements.startButton.textContent = 'Stop AR Session';
            this.elements.startButton.disabled = false;
            this.elements.calibrateButton.disabled = false;
            this.elements.resetButton.disabled = false;
            
            this.updateStatus('AR Active - Looking for speakers...');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Tap screen to set');
            this.updateTriangleQuality('-');
            
            console.log('✅ AR session started');
            
        } catch (error) {
            console.error('❌ Failed to start AR session:', error);
            this.handleARError(error);
            this.elements.startButton.disabled = false;
            this.updateInstructionStep(1);
            this.arSession = null;
        }
    }

    async stopARSession() {
        try {
            this.updateStatus('Stopping AR session...');
            
            // Stop performance monitoring
            this.stopPerformanceMonitoring();
            
            // Stop object detection
            if (this.objectDetection) {
                this.objectDetection.stopDetection();
            }
            
            // Cleanup triangle calculator
            if (this.triangleCalculator) {
                this.triangleCalculator.reset();
            }
            
            // Cleanup user interaction
            if (this.userInteraction) {
                this.userInteraction.destroy();
                this.userInteraction = null;
            }
            
            // Cleanup AR session
            if (this.arSession) {
                await this.arSession.stop();
                this.arSession = null;
            }
            
            // Clear detected speakers
            this.speakers = [];
            this.userPosition = null;
            
            // Reset UI
            this.elements.startButton.textContent = 'Start AR Session';
            this.elements.calibrateButton.disabled = true;
            this.elements.resetButton.disabled = true;
            
            this.updateStatus('AR Ready');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Not Set');
            this.updateTriangleQuality('-');
            this.updateInstructionStep(1);
            
            console.log('🛑 AR session stopped');
            
        } catch (error) {
            console.error('❌ Failed to stop AR session:', error);
            this.showError('Failed to stop AR session properly. Please refresh the page if issues persist.');
        }
    }

    calibratePosition() {
        if (!this.arSession || !this.arSession.isActive) {
            this.showError('Please start AR session first.');
            return;
        }

        console.log('🎯 Calibrating user position...');
        
        // Get current reticle position for user calibration
        const reticlePosition = this.arSession.getReticlePosition();
        
        if (reticlePosition) {
            this.userPosition = reticlePosition;
            this.updatePositionStatus('Calibrated');
            console.log('📍 User position set:', this.userPosition);
        } else {
            this.userPosition = this.arSession.getCameraPose().position;
            this.updatePositionStatus('Camera Position');
            console.log('📱 Using camera position as fallback:', this.userPosition);
        }
        
        // Enable triangle calculation if we have speakers
        if (this.speakers.length >= 2) {
            this.calculateOptimalTriangle();
        }
    }

    /**
     * Setup user interaction for touch controls
     */
    setupUserInteraction() {
        if (!this.userInteraction) {
            this.userInteraction = new UserInteraction();
        }
        
        // Initialize with AR container and session
        this.userInteraction.initialize(this.elements.arContainer, this.arSession);
        
        // Listen for tap events to set user position
        this.userInteraction.on('tap', (tapData) => {
            this.handleUserTap(tapData);
        });
        
        console.log('👆 User interaction setup complete');
    }

    /**
     * Handle user tap for position setting
     */
    handleUserTap(tapData) {
        const { world, hasValidTarget, marker } = tapData;
        
        if (hasValidTarget && world) {
            // Set user position from tap
            this.userPosition = world;
            this.updatePositionStatus('Set by tap');
            this.updateInstructionStep(4); // Move to optimization step
            
            // Update triangle calculator
            if (this.triangleCalculator) {
                this.triangleCalculator.setListenerPosition(this.userPosition);
            }
            
            console.log('👤 User position set by tap:', this.userPosition);
            
            // Update status with guidance
            if (this.speakers.length >= 2) {
                this.calculateOptimalTriangle();
            } else if (this.speakers.length === 1) {
                this.updateStatus('AR Active - Need 1 more speaker');
            } else {
                this.updateStatus('AR Active - Looking for speakers...');
            }
            
        } else {
            console.log('❌ Invalid tap target - no surface detected');
            this.updateStatus('AR Active - Tap on a surface');
        }
    }

    calculateOptimalTriangle() {
        console.log('📐 Calculating optimal listening triangle...');
        
        if (this.triangleCalculator && this.speakers.length >= 2 && this.userPosition) {
            // Set speakers and listener position
            this.triangleCalculator.setSpeakers(this.speakers);
            this.triangleCalculator.setListenerPosition(this.userPosition);
            
            // Get triangle quality for UI update
            const quality = this.triangleCalculator.getTriangleQuality();
            const guidance = this.triangleCalculator.getPositioningGuidance();
            
            console.log(`📐 Triangle quality: ${quality}%`);
            console.log('🧭 Guidance:', guidance.message);
        }
    }

    /**
     * Setup triangle guidance callbacks
     */
    setupTriangleGuidance() {
        if (!this.triangleCalculator) return;
        
        this.triangleCalculator.onGuidanceUpdate((updateData) => {
            this.handleTriangleGuidanceUpdate(updateData);
        });
        
        console.log('📐 Triangle guidance setup complete');
    }

    /**
     * Handle triangle guidance updates
     */
    handleTriangleGuidanceUpdate(updateData) {
        const { guidance, quality, isOptimal } = updateData;
        
        // Update status with guidance
        if (guidance.type === 'success') {
            this.updateStatus(`AR Active - ${guidance.message} Quality: ${quality}%`);
            this.updateInstructionStep(4); // Mark as completed
        } else if (guidance.type === 'guidance') {
            this.updateStatus(`AR Active - ${guidance.message}`);
        }
        
        // Update position status with quality indicator
        if (isOptimal) {
            this.updatePositionStatus(`Optimal! (${quality}%)`);
        } else if (quality > 0) {
            this.updatePositionStatus(`${quality}% optimal`);
        }
        
        // Update triangle quality display
        this.updateTriangleQuality(quality > 0 ? `${quality}%` : '-');
        
        console.log(`📐 Triangle guidance: ${guidance.message} (Quality: ${quality}%)`);
    }

    /**
     * Setup object detection integration with AR session
     */
    setupObjectDetection() {
        if (!this.objectDetection || !this.arSession) {
            console.warn('⚠️ Object detection or AR session not available');
            return;
        }

        // Set up detection callback
        this.objectDetection.onDetection((detectionData) => {
            this.handleDetectionResults(detectionData);
        });

        // Get video element from AR session (if available)
        // For now, we'll simulate detection without actual video
        console.log('🔍 Object detection setup complete');
        
        // Start simulated detection for demo purposes
        this.startSimulatedDetection();
    }

    /**
     * Handle detection results from TensorFlow.js
     */
    handleDetectionResults(detectionData) {
        const { speakers, speakerCount } = detectionData;
        
        // Update speaker list
        this.speakers = speakers;
        
        // Update triangle calculator with new speakers
        if (this.triangleCalculator && speakerCount >= 2) {
            this.triangleCalculator.setSpeakers(this.speakers);
        }
        
        // Update UI
        this.updateSpeakerCount(speakerCount);
        
        if (speakerCount > 0) {
            const statusMsg = this.userPosition 
                ? `AR Active - ${speakerCount} speaker(s), position set`
                : `AR Active - ${speakerCount} speaker(s), tap to set position`;
            this.updateStatus(statusMsg);
            
            // If we have user position and at least 2 speakers, calculate triangle
            if (this.userPosition && speakerCount >= 2) {
                this.calculateOptimalTriangle();
            }
        } else {
            const statusMsg = this.userPosition 
                ? 'AR Active - Position set, looking for speakers...'
                : 'AR Active - Tap to set position, looking for speakers...';
            this.updateStatus(statusMsg);
        }
        
        console.log(`🔊 Detected ${speakerCount} speakers:`, speakers);
    }

    /**
     * Simulate object detection for demo purposes
     * TODO: Remove when actual video detection is implemented
     */
    startSimulatedDetection() {
        let detectionCount = 0;
        
        const simulate = () => {
            if (!this.arSession || !this.arSession.isActive) return;
            
            // Simulate finding speakers after a few seconds
            detectionCount++;
            
            if (detectionCount === 30) { // After ~3 seconds at 60fps
                // Simulate detecting first speaker
                const mockSpeaker1 = {
                    id: 'speaker_sim_1',
                    type: 'speaker',
                    class: 'laptop',
                    confidence: 0.85,
                    position: { x: -1.5, y: 0, z: -2 },
                    size: { width: 0.3, height: 0.2, depth: 0.2 }
                };
                
                this.handleDetectionResults({
                    speakers: [mockSpeaker1],
                    speakerCount: 1,
                    timestamp: Date.now()
                });
                
            } else if (detectionCount === 90) { // After ~9 seconds
                // Simulate detecting second speaker
                const mockSpeakers = [
                    {
                        id: 'speaker_sim_1',
                        type: 'speaker',
                        class: 'laptop',
                        confidence: 0.85,
                        position: { x: -1.5, y: 0, z: -2 },
                        size: { width: 0.3, height: 0.2, depth: 0.2 }
                    },
                    {
                        id: 'speaker_sim_2',
                        type: 'speaker',
                        class: 'book',
                        confidence: 0.78,
                        position: { x: 1.5, y: 0, z: -2 },
                        size: { width: 0.3, height: 0.2, depth: 0.2 }
                    }
                ];
                
                this.handleDetectionResults({
                    speakers: mockSpeakers,
                    speakerCount: 2,
                    timestamp: Date.now()
                });
            }
            
            // Continue simulation
            if (this.arSession && this.arSession.isActive) {
                requestAnimationFrame(simulate);
            }
        };
        
        requestAnimationFrame(simulate);
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
        
        // Update instruction step based on detection
        if (count >= 2 && this.currentStep === 2) {
            this.updateInstructionStep(3);
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
            
            // Color coding based on quality
            if (typeof quality === 'number') {
                const element = this.elements.triangleQuality;
                if (quality >= 80) {
                    element.style.color = '#28a745'; // Green
                } else if (quality >= 50) {
                    element.style.color = '#ffc107'; // Yellow
                } else {
                    element.style.color = '#dc3545'; // Red
                }
            } else {
                this.elements.triangleQuality.style.color = '#fff';
            }
        }
    }

    /**
     * Update instruction step UI
     */
    updateInstructionStep(step) {
        this.currentStep = step;
        
        // Update instruction steps visual state
        const steps = document.querySelectorAll('.instruction-step');
        steps.forEach((stepElement, index) => {
            const stepNumber = index + 1;
            stepElement.classList.remove('active', 'completed');
            
            if (stepNumber < step) {
                stepElement.classList.add('completed');
            } else if (stepNumber === step) {
                stepElement.classList.add('active');
            }
        });
        
        console.log(`📋 Instruction step: ${step}`);
    }

    /**
     * Setup additional UI interactions
     */
    setupUIInteractions() {
        // Auto-hide instructions after a delay
        setTimeout(() => {
            if (this.instructionsVisible && this.currentStep === 1) {
                this.toggleInstructions();
            }
        }, 10000); // Hide after 10 seconds if still on step 1
    }

    /**
     * Toggle instructions panel visibility
     */
    toggleInstructions() {
        if (!this.elements.instructions) return;
        
        this.instructionsVisible = !this.instructionsVisible;
        
        if (this.instructionsVisible) {
            this.elements.instructions.classList.remove('hidden');
        } else {
            this.elements.instructions.classList.add('hidden');
        }
        
        console.log(`📋 Instructions ${this.instructionsVisible ? 'shown' : 'hidden'}`);
    }

    /**
     * Reset session completely
     */
    async resetSession() {
        try {
            // Stop current session if active
            if (this.arSession) {
                await this.stopARSession();
            }
            
            // Clear all data
            this.speakers = [];
            this.userPosition = null;
            
            // Reset UI completely
            this.updateInstructionStep(1);
            this.updateStatus('AR Ready');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Not Set');
            this.updateTriangleQuality('-');
            
            // Show instructions again
            if (!this.instructionsVisible) {
                this.toggleInstructions();
            }
            
            console.log('🔄 Session reset complete');
            
        } catch (error) {
            console.error('❌ Failed to reset session:', error);
            this.showError('Failed to reset session. Please refresh the page.');
        }
    }

    /**
     * Enhanced error handling with user-friendly messages
     */
    handleARError(error) {
        let userMessage = 'An error occurred while starting AR.';
        let suggestions = '';
        
        if (error.message.includes('not supported')) {
            userMessage = 'AR is not supported on this device or browser.';
            suggestions = 'Try using Chrome, Firefox, or Edge on a mobile device with camera access.';
        } else if (error.message.includes('camera') || error.message.includes('permission')) {
            userMessage = 'Camera access is required for AR functionality.';
            suggestions = 'Please allow camera access and try again. Check your browser settings if needed.';
        } else if (error.message.includes('https') || error.message.includes('secure')) {
            userMessage = 'AR requires a secure connection (HTTPS).';
            suggestions = 'Please access this app over HTTPS or use a development server with SSL.';
        } else if (error.message.includes('immersive-ar')) {
            userMessage = 'This device does not support immersive AR features.';
            suggestions = 'Try using a different device or browser that supports WebXR AR.';
        }
        
        const fullMessage = suggestions ? `${userMessage}\n\n${suggestions}` : userMessage;
        this.showError(fullMessage);
    }

    /**
     * Handle visibility change for performance optimization
     */
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('⏸️ Page hidden - optimizing performance');
            if (this.objectDetection) {
                this.objectDetection.stopDetection();
            }
            this.stopPerformanceMonitoring();
        } else {
            console.log('▶️ Page visible - resuming operations');
            if (this.arSession && this.arSession.isActive && this.objectDetection) {
                this.objectDetection.startDetection();
            }
            if (this.performanceMonitorEnabled) {
                this.startPerformanceMonitoring();
            }
        }
    }

    /**
     * Toggle performance monitor
     */
    togglePerformanceMonitor() {
        this.performanceMonitorEnabled = !this.performanceMonitorEnabled;
        
        if (this.performanceMonitorEnabled) {
            this.elements.performanceMonitor?.classList.remove('hidden');
            this.startPerformanceMonitoring();
        } else {
            this.elements.performanceMonitor?.classList.add('hidden');
            this.stopPerformanceMonitoring();
        }
        
        console.log(`📊 Performance monitor ${this.performanceMonitorEnabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        if (this.performanceInterval) return;
        
        let frameCount = 0;
        let lastTime = performance.now();
        
        this.performanceInterval = setInterval(() => {
            frameCount++;
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime >= 1000) { // Update every second
                const fps = Math.round((frameCount * 1000) / deltaTime);
                frameCount = 0;
                lastTime = currentTime;
                
                // Update FPS counter
                if (this.elements.fpsCounter) {
                    this.elements.fpsCounter.textContent = fps.toString();
                }
                
                // Update memory usage
                if (this.elements.memoryUsage && performance.memory) {
                    const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                    this.elements.memoryUsage.textContent = `${memoryMB} MB`;
                }
            }
        }, 100);
    }

    /**
     * Stop performance monitoring
     */
    stopPerformanceMonitoring() {
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
            this.performanceInterval = null;
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