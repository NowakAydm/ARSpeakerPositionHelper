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
            }
        }, 20000); // 20 second emergency timeout
    }

    /**
     * Initialize the application with comprehensive error handling
     * Ensures proper user feedback even when components fail to load
     */
    async init() {
        console.log('🚀 Initializing Camera AR Speaker Position Helper');
        
        try {
            // Initialize UI elements first - this should always work
            this.initializeUI();
            this.updateLoadingProgress('ui', 'completed');
            
            // Initialize triangle calculator (lightweight, should always work)
            this.triangleCalculator = new TriangleCalculator();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('🔘 Button state after init:');
            console.log('  - Disabled:', this.elements.startButton.disabled);
            console.log('  - Text:', this.elements.startButton.textContent);
            console.log('  - Element:', this.elements.startButton);
            console.log('  - Style display:', getComputedStyle(this.elements.startButton).display);
            console.log('  - Style visibility:', getComputedStyle(this.elements.startButton).visibility);
            console.log('  - Style pointer-events:', getComputedStyle(this.elements.startButton).pointerEvents);
            console.log('  - Offset dimensions:', {
                width: this.elements.startButton.offsetWidth,
                height: this.elements.startButton.offsetHeight,
                top: this.elements.startButton.offsetTop,
                left: this.elements.startButton.offsetLeft
            });
            
            console.log('✅ Application initialized successfully');
            
            // Expose debug function to global scope
            window.debugApp = () => {
                console.log('🔍 App Debug Info:');
                console.log('  - Camera supported:', this.isCameraSupported);
                console.log('  - Camera session:', this.cameraSession);
                console.log('  - Object detection:', this.objectDetection);
                console.log('  - Start button:', this.elements.startButton);
                console.log('  - Start button disabled:', this.elements.startButton?.disabled);
                console.log('  - Start button text:', this.elements.startButton?.textContent);
                console.log('  - Current step:', this.currentStep);
                console.log('  - Elements:', this.elements);
                
                // Try clicking the button programmatically
                if (this.elements.startButton) {
                    console.log('🧪 Simulating button click...');
                    this.elements.startButton.click();
                } else {
                    console.error('❌ Start button not available for click simulation');
                }
            };
            
            // Manual button enabler for debugging
            window.enableButton = () => {
                console.log('🔧 Manually enabling start button...');
                if (this.elements.startButton) {
                    this.elements.startButton.disabled = false;
                    this.elements.startButton.textContent = 'Start Camera Session';
                    console.log('✅ Button enabled');
                } else {
                    console.error('❌ Start button not found');
                }
            };
            
            // Manual camera starter for debugging
            window.startCamera = () => {
                console.log('🎥 Manually starting camera...');
                this.startCameraSession();
            };
            
            // Initialize object detection in background with timeout
            // Don't let this block the main initialization
            this.updateLoadingProgress('detection', 'active');
            this.initializeDetectionInBackground();
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            // Show user-friendly error message instead of technical details
            const userMessage = this.getUserFriendlyErrorMessage(error);
            this.showError(userMessage);
        } finally {
            // Always hide loading overlay, regardless of success or failure
            setTimeout(() => {
                this.hideLoading();
                
                // Enable start button and set initial status after loading completes
                if (this.elements.startButton) {
                    this.elements.startButton.disabled = false;
                    this.elements.startButton.textContent = 'Start Camera Session';
                    this.updateStatus('Ready - Click Start Camera Session');
                    console.log('✅ App ready - button enabled');
                }
            }, 1000); // Small delay to show completed state
        }
    }
    
    /**
     * Update loading progress indicators
     */
    updateLoadingProgress(step, status) {
        const stepElement = document.getElementById(`step-${step}`);
        if (stepElement) {
            stepElement.classList.remove('active', 'completed');
            if (status) {
                stepElement.classList.add(status);
            }
            
            // Update step text based on status
            const stepTexts = {
                'ui': {
                    'active': '⏳ Setting up UI...',
                    'completed': '✓ UI Ready'
                },
                'detection': {
                    'active': '⏳ Loading AI models...',
                    'completed': '✓ AI Models Ready'
                }
            };
            
            if (stepTexts[step] && stepTexts[step][status]) {
                stepElement.textContent = stepTexts[step][status];
            }
        }
    }
    
    /**
     * Initialize object detection in background with timeout
     * This prevents the loading screen from hanging on TensorFlow.js issues
     */
    async initializeDetectionInBackground() {
        try {
            console.log('🔄 Loading object detection in background...');
            
            // Add timeout to prevent hanging
            const detectionPromise = new Promise(async (resolve, reject) => {
                try {
                    this.objectDetection = new ObjectDetection();
                    await this.objectDetection.loadModel();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Detection model loading timeout')), 15000);
            });
            
            await Promise.race([detectionPromise, timeoutPromise]);
            console.log('✅ Object detection initialized');
            this.updateLoadingProgress('detection', 'completed');
            
        } catch (detectionError) {
            console.warn('⚠️ Object detection failed to initialize:', detectionError);
            this.objectDetection = null;
            
            // Update progress to show it's done (even if failed)
            this.updateLoadingProgress('detection', 'completed');
            const stepElement = document.getElementById('step-detection');
            if (stepElement) {
                stepElement.textContent = '⚠️ AI models unavailable';
                stepElement.style.color = '#ff9500';
            }
            
            // Update UI to inform user
            this.updateStatus('Camera ready (manual mode)');
            
            // Show non-blocking notification
            this.showNotification('Object detection unavailable. You can still use manual speaker placement.', 'warning');
        }
    }
    
    /**
     * Convert technical errors to user-friendly messages
     */
    getUserFriendlyErrorMessage(error) {
        if (error.message.includes('Camera') || error.message.includes('camera')) {
            return 'Camera access is required for this app. Please allow camera permissions and try again.';
        } else if (error.message.includes('TensorFlow') || error.message.includes('detection')) {
            return 'Unable to load object detection capabilities. The app may still work for basic functionality with manual speaker placement.';
        } else if (error.message.includes('connection') || error.message.includes('network')) {
            return 'Network connection issue. Please check your internet connection and try again.';
        } else if (error.message.includes('HTTPS') || error.message.includes('secure')) {
            return 'Camera access requires a secure connection (HTTPS). Please access this app over HTTPS.';
        } else {
            return 'Failed to initialize camera capabilities. Please ensure you\'re using a compatible browser with camera access and try again.';
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
    /**
     * Check camera support and request access when user clicks start
     * This actually requests camera permissions instead of just checking availability
     */
    async checkCameraSupport() {
        this.updateStatus('Requesting camera access...');
        
        try {
            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.isCameraSupported = false;
                this.updateStatus('Camera not supported');
                this.showCameraUnsupportedMessage('Camera API not available in this browser');
                return;
            }

            // Actually request camera access
            let stream = null;
            try {
                console.log('📷 Requesting camera access...');
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment', // Prefer back camera
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } 
                });
                
                // Stop the stream immediately - we just wanted to check permissions
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                
                this.isCameraSupported = true;
                this.updateStatus('Camera access granted');
                console.log('✅ Camera access granted');
                
            } catch (mediaError) {
                console.warn('❌ Camera access failed:', mediaError);
                this.isCameraSupported = false;
                
                if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
                    this.updateStatus('Camera access denied');
                    this.showCameraUnsupportedMessage('Camera access was denied by the user');
                } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
                    this.updateStatus('No camera found');
                    this.showCameraUnsupportedMessage('No camera found on this device');
                } else if (mediaError.name === 'NotSupportedError') {
                    this.updateStatus('Camera not supported');
                    this.showCameraUnsupportedMessage('Camera is not supported in this browser');
                } else {
                    this.updateStatus('Camera error');
                    this.showCameraUnsupportedMessage(`Camera error: ${mediaError.message}`);
                }
                return;
            }
            
        } catch (error) {
            console.error('❌ Camera support check failed:', error);
            this.isCameraSupported = false;
            this.updateStatus('Camera support unknown');
            this.showCameraUnsupportedMessage('Failed to check camera capabilities');
        }
    }
    
    /**
     * Show user-friendly message when camera is not supported
     */
    showCameraUnsupportedMessage(reason) {
        const browserInfo = this.detectBrowser();
        let message = `Camera functionality is not available.\n\nReason: ${reason}`;
        
        // Add browser-specific guidance
        if (browserInfo.isFirefox) {
            message += '\n\nFor Firefox users:\n• Camera access should work on modern versions\n• Check camera permissions in browser settings';
        } else if (browserInfo.isSafari) {
            message += '\n\nFor Safari users:\n• Camera access is supported\n• Check privacy settings and allow camera access';
        } else if (browserInfo.isChrome) {
            message += '\n\nFor Chrome users:\n• Ensure camera permissions are granted\n• Check that no other app is using the camera';
        } else {
            message += '\n\nGeneral troubleshooting:\n• Ensure camera permissions are granted\n• Try refreshing the page\n• Use HTTPS connection';
        }
        
        let suggestions = 'Try using a different device or browser that supports camera access.';
        if (browserInfo.isMobile) {
            suggestions = 'Check your camera permissions and try again.';
        }
        
        message += `\n\n${suggestions}`;
        
        this.elements.startButton.textContent = 'Camera Not Available';
        this.elements.startButton.disabled = true;
        this.showError(message);
    }
    
    /**
     * Detect browser type for providing specific guidance
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        return {
            isFirefox: userAgent.includes('Firefox'),
            isChrome: userAgent.includes('Chrome') && !userAgent.includes('Edge'),
            isEdge: userAgent.includes('Edge'),
            isSafari: userAgent.includes('Safari') && !userAgent.includes('Chrome'),
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
        };
    }

    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // Start Camera button
        if (this.elements.startButton) {
            console.log('✅ Start button found, adding click listener');
            this.elements.startButton.addEventListener('click', () => {
                console.log('🔘 Start button clicked!');
                console.log('📊 Current camera session state:', this.cameraSession ? 'exists' : 'null');
                console.log('📊 Button disabled state:', this.elements.startButton.disabled);
                console.log('📊 Button text:', this.elements.startButton.textContent);
                
                if (this.cameraSession) {
                    console.log('🛑 Stopping camera session...');
                    this.stopCameraSession();
                } else {
                    console.log('▶️ Starting camera session...');
                    this.startCameraSession();
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
     * Show camera loading overlay when user requests camera access
     */
    showCameraLoading() {
        // Create camera loading overlay
        let cameraLoading = document.getElementById('camera-loading');
        if (!cameraLoading) {
            cameraLoading = document.createElement('div');
            cameraLoading.id = 'camera-loading';
            cameraLoading.className = 'loading-overlay';
            cameraLoading.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Requesting camera access...</p>
                <p class="loading-hint">Please allow camera permissions when prompted</p>
            `;
            document.body.appendChild(cameraLoading);
        }
        cameraLoading.style.display = 'flex';
    }
    
    /**
     * Hide camera loading overlay
     */
    hideCameraLoading() {
        const cameraLoading = document.getElementById('camera-loading');
        if (cameraLoading) {
            cameraLoading.style.display = 'none';
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