/**
 * AR Speaker Position Helper
 * Main application entry point
 * Updated to use camera-based AR for broader device compatibility
 */

import { CameraSession } from './modules/camera-session.js';
import { ObjectDetection } from './modules/detection.js';
import { UserInteraction } from './modules/interaction.js';
import { TriangleCalculator } from './modules/triangle.js';

class ARSpeakerApp {
    constructor() {
        this.isCameraSupported = false;
        this.cameraSession = null;
        this.objectDetection = null;
        this.userInteraction = null;
        this.triangleCalculator = null;
        this.speakers = [];
        this.userPosition = null;
        
        // Set up emergency fallback to prevent infinite loading
        this.setupEmergencyFallback();
        
        this.init();
    }

    /**
     * Emergency fallback to ensure loading screen never hangs indefinitely
     */
    setupEmergencyFallback() {
        setTimeout(() => {
            const loadingElement = document.getElementById('loading');
            if (loadingElement && loadingElement.style.display !== 'none') {
                console.warn('⚠️ Emergency fallback triggered - forcing app to load');
                this.hideLoading();
                this.showNotification('App loaded with limited functionality. Some features may be unavailable.', 'warning', 8000);
                
                // Enable basic functionality
                const startButton = document.getElementById('start-ar');
                if (startButton && startButton.disabled) {
                    startButton.disabled = false;
                    startButton.textContent = 'Start Camera Session';
                }
                
                // Enable reset button as well
                const resetButton = document.getElementById('reset');
                if (resetButton && resetButton.disabled) {
                    resetButton.disabled = false;
                }
                
                console.log('🆘 Emergency fallback - all buttons enabled');
            }
        }, 20000); // 20 second emergency timeout
    }

    /**
     * Enable essential buttons immediately to prevent user lockout
     * This runs before any initialization that might fail
     */
    enableEssentialButtonsImmediate() {
        console.log('🚨 Enabling essential buttons immediately...');
        
        const startButton = document.getElementById('start-ar');
        const resetButton = document.getElementById('reset');
        
        if (startButton) {
            startButton.disabled = false;
            startButton.textContent = 'Start Camera Session';
            console.log('✅ Start button enabled immediately');
        }
        
        if (resetButton) {
            resetButton.disabled = false;
            console.log('✅ Reset button enabled immediately');
        }
        
        // Update status if element exists
        const statusElement = document.getElementById('ar-status');
        if (statusElement) {
            statusElement.textContent = 'Initializing...';
        }
    }

    /**
     * Initialize the application with simplified flow (no camera required)
     */
    async init() {
        console.log('🚀 Initializing Speaker Position Helper');
        
        try {
            // Initialize UI elements first - this should always work
            this.initializeUI();
            console.log('✅ UI initialized');
            
            // Initialize triangle calculator (lightweight, should always work)
            this.triangleCalculator = new TriangleCalculator();
            console.log('✅ Triangle calculator initialized');
            
            // Setup event listeners
            this.setupEventListeners();
            console.log('✅ Event listeners setup');
            
            // Hide loading immediately since we're not loading heavy resources
            this.hideLoading();
            
            // Enable all essential buttons
            this.enableInitialButtons();
            
            console.log('✅ Application initialized successfully (simplified mode)');
            
            // Expose debug functions to global scope
            this.exposeDebugFunctions();
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.hideLoading();
            this.showError('Failed to initialize the application. Please refresh and try again.');
        }
    }
    /**
     * Expose debug functions to global scope for testing
     */
    exposeDebugFunctions() {
        // Debug app state
        window.debugApp = () => {
            console.log('🔍 App Debug Info:');
            console.log('  - Triangle calculator:', this.triangleCalculator);
            console.log('  - Start button:', this.elements.startButton);
            console.log('  - Start button disabled:', this.elements.startButton?.disabled);
            console.log('  - Start button text:', this.elements.startButton?.textContent);
            console.log('  - Current step:', this.currentStep);
            console.log('  - Elements:', this.elements);
        };
        
        // Manual button enabler for debugging
        window.enableButton = () => {
            console.log('🔧 Manually enabling start button...');
            if (this.elements.startButton) {
                this.elements.startButton.disabled = false;
                this.elements.startButton.textContent = 'Start Manual Mode';
                console.log('✅ Button enabled');
            } else {
                console.error('❌ Start button not found');
            }
        };
        
        // Global button enabler for all buttons
        window.enableAllButtons = () => {
            console.log('🔧 Enabling all buttons...');
            const buttons = ['start-ar', 'calibrate', 'reset'];
            buttons.forEach(buttonId => {
                const button = document.getElementById(buttonId);
                if (button) {
                    button.disabled = false;
                    console.log(`✅ ${buttonId} enabled`);
                }
            });
        };
    }
    
    /**
     * Update loading progress indicators (simplified)
     */
    updateLoadingProgress(step, status) {
        // Simplified - just log progress
        console.log(`📊 Progress: ${step} -> ${status}`);
    }

    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // Start Manual Mode button
        if (this.elements.startButton) {
            console.log('✅ Start button found, adding click listener');
            this.elements.startButton.addEventListener('click', () => {
                console.log('🔘 Start button clicked!');
                console.log('📊 Button disabled state:', this.elements.startButton.disabled);
                console.log('📊 Button text:', this.elements.startButton.textContent);
                
                if (this.elements.startButton.textContent.includes('Stop')) {
                    console.log('🛑 Stopping manual session...');
                    this.stopManualSession();
                } else {
                    console.log('▶️ Starting manual session...');
                    this.startManualSession();
                }
            });
        } else {
            console.error('❌ Start button not found!');
        }

        // Calibrate button
        this.elements.calibrateButton?.addEventListener('click', () => {
            console.log('🎯 Calibrate button clicked');
            this.calibratePosition();
        });

        // Reset button
        this.elements.resetButton?.addEventListener('click', () => {
            console.log('🔄 Reset button clicked');
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

        // Debug console toggle
        this.elements.debugToggle?.addEventListener('click', () => {
            this.toggleDebugConsole();
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
            loadingMessage: document.getElementById('loading-message'),
            errorModal: document.getElementById('error-modal'),
            errorMessage: document.getElementById('error-message'),
            errorClose: document.getElementById('error-close'),
            instructions: document.getElementById('instructions'),
            helpButton: document.getElementById('help-toggle'),
            debugToggle: document.getElementById('debug-toggle'),
            debugConsole: document.getElementById('debug-console'),
            debugContent: document.getElementById('debug-content'),
            performanceMonitor: document.getElementById('performance'),
            fpsCounter: document.getElementById('fps-counter'),
            memoryUsage: document.getElementById('memory-usage')
        };

        // Validate required elements
        const requiredElements = ['startButton', 'arContainer', 'arStatus'];
        for (const elementKey of requiredElements) {
            if (!this.elements[elementKey]) {
                console.error(`❌ Required UI element not found: ${elementKey}`);
                throw new Error(`Required UI element not found: ${elementKey}`);
            } else {
                console.log(`✅ Found element: ${elementKey}`, this.elements[elementKey]);
            }
        }

        // Log all elements for debugging
        console.log('📋 All UI elements found:');
        Object.keys(this.elements).forEach(key => {
            console.log(`  - ${key}:`, this.elements[key] ? '✅ Found' : '❌ Missing');
        });

        // Initialize UI state
        this.currentStep = 1;
        this.instructionsVisible = true;
        this.performanceMonitorEnabled = false;
        this.debugConsoleVisible = false;
        
        // Setup debug console
        this.setupDebugConsole();
        
        // Setup UI interactions
        this.setupUIInteractions();
    }

    /**
     * Setup debug console functionality
     */
    setupDebugConsole() {
        // Store original console methods
        this.originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
        };
        
        // Override console methods to also log to debug console
        const self = this;
        
        console.log = function(...args) {
            self.originalConsole.log.apply(console, args);
            self.addDebugMessage(args.join(' '), 'info');
        };
        
        console.warn = function(...args) {
            self.originalConsole.warn.apply(console, args);
            self.addDebugMessage(args.join(' '), 'warning');
        };
        
        console.error = function(...args) {
            self.originalConsole.error.apply(console, args);
            self.addDebugMessage(args.join(' '), 'error');
        };
        
        console.info = function(...args) {
            self.originalConsole.info.apply(console, args);
            self.addDebugMessage(args.join(' '), 'info');
        };
        
        // Show debug console initially for development
        this.showDebugConsole();
    }
    
    /**
     * Add message to debug console
     */
    addDebugMessage(message, type = 'info') {
        if (!this.elements.debugContent) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const messageElement = document.createElement('div');
        messageElement.className = `debug-message ${type}`;
        messageElement.textContent = `[${timestamp}] ${message}`;
        
        this.elements.debugContent.appendChild(messageElement);
        
        // Auto-scroll to bottom
        this.elements.debugContent.scrollTop = this.elements.debugContent.scrollHeight;
        
        // Limit to last 100 messages
        const messages = this.elements.debugContent.children;
        if (messages.length > 100) {
            this.elements.debugContent.removeChild(messages[0]);
        }
    }
    
    /**
     * Toggle debug console visibility
     */
    toggleDebugConsole() {
        this.debugConsoleVisible = !this.debugConsoleVisible;
        
        if (this.debugConsoleVisible) {
            this.showDebugConsole();
        } else {
            this.hideDebugConsole();
        }
    }
    
    /**
     * Show debug console
     */
    showDebugConsole() {
        this.debugConsoleVisible = true;
        if (this.elements.debugConsole) {
            this.elements.debugConsole.classList.remove('hidden');
        }
    }
    
    /**
     * Hide debug console
     */
    hideDebugConsole() {
        this.debugConsoleVisible = false;
        if (this.elements.debugConsole) {
            this.elements.debugConsole.classList.add('hidden');
        }
    }
        
        // Start Manual Mode button
        if (this.elements.startButton) {
            console.log('✅ Start button found, adding click listener');
            this.elements.startButton.addEventListener('click', () => {
                console.log('🔘 Start button clicked!');
                console.log('📊 Button disabled state:', this.elements.startButton.disabled);
                console.log('📊 Button text:', this.elements.startButton.textContent);
                
                if (this.elements.startButton.textContent.includes('Stop')) {
                    console.log('🛑 Stopping manual session...');
                    this.stopManualSession();
                } else {
                    console.log('▶️ Starting manual session...');
                    this.startManualSession();
                }
            });
        } else {
            console.error('❌ Start button not found!');
        }

        // Calibrate button
        this.elements.calibrateButton?.addEventListener('click', () => {
            console.log('🎯 Calibrate button clicked');
            this.calibratePosition();
        });

        // Reset button
        this.elements.resetButton?.addEventListener('click', () => {
            console.log('🔄 Reset button clicked');
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

        // Debug console toggle
        this.elements.debugToggle?.addEventListener('click', () => {
            this.toggleDebugConsole();
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

    /**
     * Start manual session (simplified mode without camera)
     */
    startManualSession() {
        console.log('🚀 Starting manual session');
        
        try {
            // Update UI for active session
            this.elements.startButton.textContent = 'Stop Manual Mode';
            this.elements.calibrateButton.disabled = false;
            this.elements.resetButton.disabled = false;
            
            this.updateStatus('Manual Mode Active - Click to set speaker positions');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Tap screen to set');
            this.updateTriangleQuality('-');
            this.updateInstructionStep(2);
            
            // Setup basic triangle calculator
            if (this.triangleCalculator) {
                this.triangleCalculator.reset();
            }
            
            // Setup manual interaction (without camera)
            this.setupManualInteraction();
            
            console.log('✅ Manual session started');
            
        } catch (error) {
            console.error('❌ Failed to start manual session:', error);
            this.showError('Failed to start manual session. Please try again.');
            this.elements.startButton.disabled = false;
        }
    }

    /**
     * Stop manual session
     */
    stopManualSession() {
        try {
            this.updateStatus('Stopping manual session...');
            
            // Cleanup triangle calculator
            if (this.triangleCalculator) {
                this.triangleCalculator.reset();
            }
            
            // Cleanup user interaction
            if (this.userInteraction) {
                this.userInteraction.destroy();
                this.userInteraction = null;
            }
            
            // Clear detected speakers
            this.speakers = [];
            this.userPosition = null;
            
            // Reset UI
            this.elements.startButton.textContent = 'Start Manual Mode';
            this.elements.calibrateButton.disabled = true;
            this.elements.resetButton.disabled = true;
            
            this.updateStatus('Ready - Manual speaker positioning mode');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Not Set');
            this.updateTriangleQuality('-');
            this.updateInstructionStep(1);
            
            console.log('🛑 Manual session stopped');
            
        } catch (error) {
            console.error('❌ Failed to stop manual session:', error);
            this.showError('Failed to stop manual session properly. Please refresh the page if issues persist.');
        }
    }

    /**
     * Setup manual interaction for click-based controls
     */
    setupManualInteraction() {
        if (!this.userInteraction) {
            this.userInteraction = new UserInteraction();
        }
        
        // Initialize with AR container (no camera session needed)
        this.userInteraction.initialize(this.elements.arContainer, null);
        
        // Listen for tap events to set speaker positions
        this.userInteraction.on('tap', (tapData) => {
            this.handleManualTap(tapData);
        });
        
        console.log('👆 Manual interaction setup complete');
    }

    /**
     * Handle manual tap for setting speaker positions
     */
    handleManualTap(tapData) {
        console.log('👆 Manual tap detected:', tapData);
        
        // In manual mode, each tap adds a speaker or sets listener position
        if (!this.userPosition) {
            // First tap sets listener position
            this.userPosition = { x: 0, y: 0, z: 0 };
            this.updatePositionStatus('Set by tap');
            this.updateStatus('Manual Mode - Listener position set. Tap to add speakers.');
            console.log('👤 User position set by tap');
        } else {
            // Subsequent taps add speakers
            const speakerId = `speaker_manual_${this.speakers.length + 1}`;
            const newSpeaker = {
                id: speakerId,
                type: 'speaker',
                class: 'manual',
                confidence: 1.0,
                position: {
                    x: (Math.random() - 0.5) * 4, // Random position for demo
                    y: 0,
                    z: -2 - Math.random() * 2
                },
                size: { width: 0.3, height: 0.2, depth: 0.2 }
            };
            
            this.speakers.push(newSpeaker);
            this.updateSpeakerCount(this.speakers.length);
            
            if (this.speakers.length >= 2) {
                this.calculateOptimalTriangle();
                this.updateStatus(`Manual Mode - ${this.speakers.length} speakers placed. Triangle calculation active.`);
                this.updateInstructionStep(4);
            } else {
                this.updateStatus(`Manual Mode - ${this.speakers.length} speaker placed. Tap to add more.`);
                this.updateInstructionStep(3);
            }
            
            console.log(`🔊 Added speaker ${this.speakers.length}:`, newSpeaker);
        }
    }
    
    /**
     * Start camera session with comprehensive error handling and user feedback
     */
    async startCameraSession() {
        console.log('🚀 startCameraSession called');
        console.log('📊 Initial state check:');
        console.log('  - Elements available:', !!this.elements);
        console.log('  - Start button:', this.elements?.startButton);
        console.log('  - Camera supported:', this.isCameraSupported);
        
        try {
            console.log('🔄 Showing camera loading...');
            this.showCameraLoading();
            
            console.log('🔒 Disabling start button...');
            this.elements.startButton.disabled = true;
            
            // Check camera support when user actually wants to use it
            console.log('📷 Calling checkCameraSupport...');
            await this.checkCameraSupport();
            
            console.log('📊 After camera check - supported:', this.isCameraSupported);
            
            if (!this.isCameraSupported) {
                console.warn('❌ Camera not supported, re-enabling button and returning');
                // Camera support check will show appropriate error message
                this.elements.startButton.disabled = false;
                this.hideCameraLoading();
                return;
            }

            console.log('✅ Camera supported, continuing with session start...');
            this.hideCameraLoading();
            this.updateStatus('Starting camera session...');
            this.updateInstructionStep(2);
            
            // Initialize camera session if not already done
            if (!this.cameraSession) {
                this.cameraSession = new CameraSession();
                await this.cameraSession.initialize(this.elements.arContainer);
            }
            
            // Start the camera session
            await this.cameraSession.start();
            
            // Initialize triangle calculator with camera session
            this.triangleCalculator.initialize(this.cameraSession);
            
            // Setup triangle guidance callbacks
            this.setupTriangleGuidance();
            
            // Setup user interaction
            this.setupUserInteraction();
            
            // Setup object detection integration (only if available)
            if (this.objectDetection) {
                this.setupObjectDetection();
            } else {
                console.log('ℹ️ Object detection not available - manual speaker placement only');
            }
            
            // Start performance monitoring if enabled
            if (this.performanceMonitorEnabled) {
                this.startPerformanceMonitoring();
            }
            
            // Update UI for active session
            this.elements.startButton.textContent = 'Stop Camera Session';
            this.elements.startButton.disabled = false;
            this.elements.calibrateButton.disabled = false;
            this.elements.resetButton.disabled = false;
            
            this.updateStatus('Camera Active - Looking for speakers...');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Tap screen to set');
            this.updateTriangleQuality('-');
            
            console.log('✅ Camera session started');
            
            // Expose debug method to global scope for testing
            window.debugCamera = () => {
                if (this.cameraSession) {
                    this.cameraSession.debugCameraStatus();
                } else {
                    console.log('❌ No camera session active');
                }
            };
            
        } catch (error) {
            console.error('❌ Failed to start camera session:', error);
            this.hideCameraLoading();
            this.handleCameraError(error);
            this.elements.startButton.disabled = false;
            this.updateInstructionStep(1);
            this.cameraSession = null;
        }
    }

    async stopCameraSession() {
        try {
            this.updateStatus('Stopping camera session...');
            
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
            
            // Cleanup camera session
            if (this.cameraSession) {
                this.cameraSession.stop();
                this.cameraSession = null;
            }
            
            // Clear detected speakers
            this.speakers = [];
            this.userPosition = null;
            
            // Reset UI
            this.elements.startButton.textContent = 'Start Camera Session';
            this.elements.calibrateButton.disabled = true;
            this.elements.resetButton.disabled = true;
            
            this.updateStatus('Camera Ready');
            this.updateSpeakerCount(0);
            this.updatePositionStatus('Not Set');
            this.updateTriangleQuality('-');
            this.updateInstructionStep(1);
            
            console.log('🛑 Camera session stopped');
            
        } catch (error) {
            console.error('❌ Failed to stop camera session:', error);
            this.showError('Failed to stop camera session properly. Please refresh the page if issues persist.');
        }
    }

    calibratePosition() {
        if (!this.cameraSession || !this.cameraSession.isActive) {
            this.showError('Please start camera session first.');
            return;
        }

        console.log('🎯 Calibrating user position...');
        
        // Use camera position as the user position
        this.userPosition = {
            x: 0,
            y: 0, 
            z: 0
        };
        
        this.updatePositionStatus('Set at camera');
        console.log('📱 User position set at camera position');
        
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
        this.userInteraction.initialize(this.elements.arContainer, this.cameraSession);
        
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
        if (!this.objectDetection || !this.cameraSession) {
            console.warn('⚠️ Object detection or camera session not available');
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
            if (!this.cameraSession || !this.cameraSession.isActive) return;
            
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
            if (this.cameraSession && this.cameraSession.isActive) {
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
            if (this.cameraSession) {
                await this.stopCameraSession();
            }
            
            // Clear all data
            this.speakers = [];
            this.userPosition = null;
            
            // Reset UI completely
            this.updateInstructionStep(1);
            this.updateStatus('Camera Ready');
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
    handleCameraError(error) {
        let userMessage = 'An error occurred while starting camera.';
        let suggestions = '';
        
        if (error.message.includes('not supported')) {
            userMessage = 'Camera is not supported on this device or browser.';
            suggestions = 'Try using a modern browser like Chrome, Firefox, or Edge on a device with camera access.';
        } else if (error.message.includes('denied') || error.message.includes('permission')) {
            userMessage = 'Camera access was denied.';
            suggestions = 'Please allow camera access and try again. Check your browser settings if needed.';
        } else if (error.message.includes('https') || error.message.includes('secure')) {
            userMessage = 'Camera access requires a secure connection (HTTPS).';
            suggestions = 'Please access this app over HTTPS or use a development server with SSL.';
        } else if (error.message.includes('NotFoundError') || error.message.includes('camera found')) {
            userMessage = 'No camera was found on this device.';
            suggestions = 'Please ensure your device has a working camera and try again.';
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
            if (this.cameraSession && this.cameraSession.isActive && this.objectDetection) {
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

    /**
     * Show a non-blocking notification to the user
     */
    showNotification(message, type = 'info', duration = 5000) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.style.cssText = `
                position: fixed;
                top: 1rem;
                right: 1rem;
                background: #333;
                color: white;
                padding: 1rem;
                border-radius: 0.5rem;
                z-index: 1000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                transform: translateX(100%);
                transition: transform 0.3s ease-out;
                font-size: 0.9rem;
                line-height: 1.4;
            `;
            document.body.appendChild(notification);
        }
        
        // Set notification style based on type
        const colors = {
            info: '#007bff',
            warning: '#ff9500',
            error: '#dc3545',
            success: '#28a745'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        // Show notification
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Auto-hide after duration
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
        }, duration);
        
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
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