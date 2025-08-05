/**
 * AR Speaker Position Helper - Mobile Optimized Version
 * Simplified "click twice" interaction with mobile-first design
 */

import { TriangleCalculator } from './modules/triangle.js';
import { CameraSession } from './modules/camera-session.js';

class MobileARApp {
    constructor() {
        this.triangleCalculator = null;
        this.cameraSession = null;
        this.points = [];
        this.currentStep = 'inactive'; // 'inactive', 'active', 'measuring'
        this.isSessionActive = false;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.gizmo = null;
        this.measurementLine = null;
        this.measurementPoints = [];
        
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
        console.log(message);
        
        const debugContent = document.getElementById('debug-content');
        if (debugContent) {
            const messageElement = document.createElement('div');
            messageElement.className = `debug-message ${type}`;
            messageElement.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            debugContent.appendChild(messageElement);
            
            debugContent.scrollTop = debugContent.scrollHeight;
            
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
     * Initialize the mobile-optimized application
     */
    async init() {
        this.debugInfo('🚀 Initializing Mobile AR Speaker Helper');
        
        try {
            // Initialize mobile UI
            this.initializeMobileUI();
            this.debugSuccess('Mobile UI initialized');
            
            // Initialize triangle calculator
            this.triangleCalculator = new TriangleCalculator();
            this.debugSuccess('Triangle calculator initialized');
            
            // Initialize camera session for AR mode
            await this.initializeCameraSession();
            
            // Setup event listeners
            this.setupEventListeners();
            this.debugSuccess('Event listeners setup');
            
            // Hide loading and show start button
            this.hideLoading();
            this.showStartButton();
            
            this.debugSuccess('Mobile AR app initialized successfully');
            
        } catch (error) {
            this.debugError(`Failed to initialize application: ${error.message}`);
            this.hideLoading();
            this.showError('Failed to initialize the application. Please refresh and try again.');
        }
    }

    /**
     * Initialize mobile-optimized UI elements
     */
    initializeMobileUI() {
        this.elements = {
            startButton: document.getElementById('mobile-start-btn'),
            arContainer: document.getElementById('ar-container'),
            statusText: document.getElementById('mobile-status'),
            coordinatesDisplay: document.getElementById('coordinates-display'),
            distanceDisplay: document.getElementById('distance-display'),
            debugToggle: document.getElementById('debug-toggle'),
            debugConsole: document.getElementById('debug-console'),
            loading: document.getElementById('loading'),
            errorModal: document.getElementById('error-modal'),
            errorMessage: document.getElementById('error-message'),
            errorClose: document.getElementById('error-close')
        };

        // Validate required elements
        const requiredElements = ['startButton', 'arContainer'];
        for (const elementKey of requiredElements) {
            if (!this.elements[elementKey]) {
                this.debugError(`Required UI element not found: ${elementKey}`);
                throw new Error(`Required UI element not found: ${elementKey}`);
            }
        }

        this.debugInfo('📱 Mobile UI elements validated successfully');
    }

    /**
     * Initialize camera session for AR functionality
     */
    async initializeCameraSession() {
        this.debugInfo('Initializing camera session...');
        
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.debugWarning('Camera access not supported in this browser');
                return;
            }
            
            this.cameraSession = new CameraSession();
            this.debugSuccess('Camera session object created');
            
        } catch (error) {
            this.debugError(`Camera session initialization failed: ${error.message}`);
        }
    }

    /**
     * Setup event listeners for mobile interaction
     */
    setupEventListeners() {
        // Start/Stop button
        if (this.elements.startButton) {
            this.elements.startButton.addEventListener('click', async () => {
                this.debugInfo('🔘 Start button clicked');
                
                if (this.isSessionActive) {
                    this.stopSession();
                } else {
                    await this.startSession();
                }
            });
        }

        // Error modal close
        if (this.elements.errorClose) {
            this.elements.errorClose.addEventListener('click', () => {
                this.hideError();
            });
        }

        // Debug toggle
        if (this.elements.debugToggle) {
            this.elements.debugToggle.addEventListener('click', () => {
                if (this.elements.debugConsole) {
                    this.elements.debugConsole.classList.toggle('hidden');
                }
            });
        }

        // AR Container clicks for "click twice" measurement
        if (this.elements.arContainer) {
            this.elements.arContainer.addEventListener('click', (event) => {
                if (this.isSessionActive && this.currentStep === 'measuring') {
                    this.handleMeasurementClick(event);
                }
            });
        }
    }

    /**
     * Start AR session (camera or manual mode)
     */
    async startSession() {
        this.debugInfo('🚀 Starting AR session');
        
        try {
            // Try camera session first
            if (this.cameraSession) {
                try {
                    await this.startCameraSession();
                    return;
                } catch (error) {
                    this.debugWarning('Camera session failed, starting manual mode');
                }
            }
            
            // Fallback to manual mode
            this.startManualMode();
            
        } catch (error) {
            this.debugError(`Failed to start session: ${error.message}`);
            this.showError(`Session failed: ${error.message}`);
        }
    }

    /**
     * Start camera session
     */
    async startCameraSession() {
        this.debugInfo('📹 Starting camera session');
        
        await this.cameraSession.initialize(this.elements.arContainer);
        await this.cameraSession.start();
        
        this.isSessionActive = true;
        this.currentStep = 'measuring';
        this.scene = this.cameraSession.scene;
        this.camera = this.cameraSession.camera;
        this.renderer = this.cameraSession.renderer;
        
        // Create XYZ gizmo
        this.createXYZGizmo();
        
        this.updateUI();
        this.debugSuccess('Camera session started successfully');
    }

    /**
     * Start manual mode
     */
    startManualMode() {
        this.debugInfo('📱 Starting manual mode');
        
        this.createManualModeScene();
        
        this.isSessionActive = true;
        this.currentStep = 'measuring';
        
        // Create XYZ gizmo
        this.createXYZGizmo();
        
        this.updateUI();
        this.debugSuccess('Manual mode started successfully');
    }

    /**
     * Create Three.js scene for manual mode
     */
    createManualModeScene() {
        if (!window.THREE) {
            this.debugWarning('THREE.js not available for manual mode scene');
            return;
        }

        try {
            // Create scene
            this.scene = new window.THREE.Scene();
            
            // Create camera
            this.camera = new window.THREE.PerspectiveCamera(
                70,
                this.elements.arContainer.clientWidth / this.elements.arContainer.clientHeight,
                0.01,
                1000
            );
            this.camera.position.set(0, 1.6, 0);
            
            // Create renderer
            this.renderer = new window.THREE.WebGLRenderer({ 
                antialias: true, 
                alpha: true,
                preserveDrawingBuffer: true
            });
            
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(
                this.elements.arContainer.clientWidth,
                this.elements.arContainer.clientHeight
            );
            this.renderer.setClearColor(0x000000, 0);
            
            // Style the renderer canvas with proper z-index
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            this.renderer.domElement.style.zIndex = '5'; // AR elements layer
            this.renderer.domElement.style.pointerEvents = 'auto';
            
            // Add lighting
            const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);
            
            const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            this.scene.add(directionalLight);
            
            // Add canvas to container
            this.elements.arContainer.appendChild(this.renderer.domElement);
            this.elements.arContainer.classList.add('camera-active');
            
            // Start render loop
            this.startRenderLoop();
            
            this.debugSuccess('Manual mode Three.js scene created');
            
        } catch (error) {
            this.debugError(`Failed to create manual mode scene: ${error.message}`);
        }
    }

    /**
     * Create XYZ Gizmo for orientation reference
     */
    createXYZGizmo() {
        if (!this.scene || !window.THREE) return;

        try {
            // Create gizmo group
            this.gizmo = new window.THREE.Group();
            
            // Create axes
            const axisLength = 0.1;
            const axisWidth = 0.005;
            
            // X axis (red)
            const xGeometry = new window.THREE.BoxGeometry(axisLength, axisWidth, axisWidth);
            const xMaterial = new window.THREE.MeshBasicMaterial({ color: 0xff0000 });
            const xAxis = new window.THREE.Mesh(xGeometry, xMaterial);
            xAxis.position.x = axisLength / 2;
            this.gizmo.add(xAxis);
            
            // Y axis (green)
            const yGeometry = new window.THREE.BoxGeometry(axisWidth, axisLength, axisWidth);
            const yMaterial = new window.THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const yAxis = new window.THREE.Mesh(yGeometry, yMaterial);
            yAxis.position.y = axisLength / 2;
            this.gizmo.add(yAxis);
            
            // Z axis (blue)
            const zGeometry = new window.THREE.BoxGeometry(axisWidth, axisWidth, axisLength);
            const zMaterial = new window.THREE.MeshBasicMaterial({ color: 0x0000ff });
            const zAxis = new window.THREE.Mesh(zGeometry, zMaterial);
            zAxis.position.z = axisLength / 2;
            this.gizmo.add(zAxis);
            
            // Position gizmo in bottom-left corner of screen
            this.gizmo.position.set(-0.3, -0.2, -0.5);
            this.gizmo.scale.set(2, 2, 2);
            
            this.scene.add(this.gizmo);
            
            this.debugSuccess('XYZ Gizmo created and positioned');
            
        } catch (error) {
            this.debugError(`Failed to create XYZ gizmo: ${error.message}`);
        }
    }

    /**
     * Handle "click twice" measurement interaction
     */
    handleMeasurementClick(event) {
        this.debugInfo('👆 Measurement click detected');
        
        // Calculate 3D coordinates from screen coordinates
        const rect = this.elements.arContainer.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Convert to world coordinates (simplified for demo)
        const worldPoint = {
            x: x * 2,
            y: y * 2,
            z: -2 - Math.random() * 2 // Add some depth variation
        };
        
        this.addMeasurementPoint(worldPoint);
        
        // Log coordinates
        this.logCoordinates(worldPoint, this.measurementPoints.length);
        
        // If this is the second point, draw line and calculate distance
        if (this.measurementPoints.length === 2) {
            this.createMeasurementLine();
            this.calculateAndDisplayDistance();
            this.resetForNewMeasurement();
        }
    }

    /**
     * Add a measurement point to the scene
     */
    addMeasurementPoint(worldPoint) {
        if (!this.scene || !window.THREE) return;

        try {
            // Create point geometry
            const geometry = new window.THREE.SphereGeometry(0.02, 8, 6);
            const material = new window.THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                transparent: true,
                opacity: 0.9
            });
            const point = new window.THREE.Mesh(geometry, material);
            
            point.position.set(worldPoint.x, worldPoint.y, worldPoint.z);
            this.scene.add(point);
            
            // Store point data
            this.measurementPoints.push({
                position: worldPoint,
                mesh: point
            });
            
            this.debugSuccess(`Measurement point ${this.measurementPoints.length} added at (${worldPoint.x.toFixed(2)}, ${worldPoint.y.toFixed(2)}, ${worldPoint.z.toFixed(2)})`);
            
        } catch (error) {
            this.debugError(`Failed to add measurement point: ${error.message}`);
        }
    }

    /**
     * Create line between two measurement points
     */
    createMeasurementLine() {
        if (!this.scene || !window.THREE || this.measurementPoints.length !== 2) return;

        try {
            const point1 = this.measurementPoints[0].position;
            const point2 = this.measurementPoints[1].position;
            
            // Create line geometry
            const geometry = new window.THREE.BufferGeometry();
            const positions = new Float32Array([
                point1.x, point1.y, point1.z,
                point2.x, point2.y, point2.z
            ]);
            
            geometry.setAttribute('position', new window.THREE.BufferAttribute(positions, 3));
            
            const material = new window.THREE.LineBasicMaterial({ 
                color: 0xffff00,
                linewidth: 3,
                transparent: true,
                opacity: 0.8
            });
            
            this.measurementLine = new window.THREE.Line(geometry, material);
            this.scene.add(this.measurementLine);
            
            this.debugSuccess('Measurement line created between points');
            
        } catch (error) {
            this.debugError(`Failed to create measurement line: ${error.message}`);
        }
    }

    /**
     * Calculate and display distance between points
     */
    calculateAndDisplayDistance() {
        if (this.measurementPoints.length !== 2) return;

        const point1 = this.measurementPoints[0].position;
        const point2 = this.measurementPoints[1].position;
        
        const distance = Math.sqrt(
            Math.pow(point2.x - point1.x, 2) +
            Math.pow(point2.y - point1.y, 2) +
            Math.pow(point2.z - point1.z, 2)
        );
        
        // Update UI with distance
        this.updateDistanceDisplay(distance);
        
        // Log distance
        this.debugSuccess(`Distance calculated: ${distance.toFixed(3)} units`);
        
        // Log relationship between points
        this.logPointRelationship(point1, point2, distance);
    }

    /**
     * Log 3D coordinates to console and UI
     */
    logCoordinates(point, pointNumber) {
        const coordText = `Point ${pointNumber}: X=${point.x.toFixed(3)}, Y=${point.y.toFixed(3)}, Z=${point.z.toFixed(3)}`;
        
        // Log to console
        console.log(`🎯 ${coordText}`);
        
        // Log to debug console
        this.debugInfo(`🎯 ${coordText}`);
        
        // Update coordinates display if available
        if (this.elements.coordinatesDisplay) {
            const coordDiv = document.createElement('div');
            coordDiv.className = 'coordinate-entry';
            coordDiv.textContent = coordText;
            this.elements.coordinatesDisplay.appendChild(coordDiv);
        }
    }

    /**
     * Log relationship between points
     */
    logPointRelationship(point1, point2, distance) {
        const relationshipText = `Distance between points: ${distance.toFixed(3)} units`;
        const vectorText = `Vector: Δx=${(point2.x - point1.x).toFixed(3)}, Δy=${(point2.y - point1.y).toFixed(3)}, Δz=${(point2.z - point1.z).toFixed(3)}`;
        
        console.log(`📏 ${relationshipText}`);
        console.log(`📐 ${vectorText}`);
        
        this.debugInfo(`📏 ${relationshipText}`);
        this.debugInfo(`📐 ${vectorText}`);
    }

    /**
     * Reset for new measurement after completing a measurement
     */
    resetForNewMeasurement() {
        setTimeout(() => {
            // Clear previous measurement
            this.clearMeasurement();
            
            // Update status
            this.updateStatus('Tap twice on screen to measure distance');
            
            this.debugInfo('🔄 Ready for new measurement');
        }, 3000); // Show result for 3 seconds
    }

    /**
     * Clear current measurement
     */
    clearMeasurement() {
        if (!this.scene) return;

        // Remove measurement points
        this.measurementPoints.forEach(pointData => {
            this.scene.remove(pointData.mesh);
            if (pointData.mesh.geometry) pointData.mesh.geometry.dispose();
            if (pointData.mesh.material) pointData.mesh.material.dispose();
        });
        
        // Remove measurement line
        if (this.measurementLine) {
            this.scene.remove(this.measurementLine);
            if (this.measurementLine.geometry) this.measurementLine.geometry.dispose();
            if (this.measurementLine.material) this.measurementLine.material.dispose();
            this.measurementLine = null;
        }
        
        this.measurementPoints = [];
        
        if (this.elements.distanceDisplay) {
            this.elements.distanceDisplay.textContent = '';
        }
    }

    /**
     * Stop AR session
     */
    stopSession() {
        this.debugInfo('🛑 Stopping AR session');
        
        try {
            this.isSessionActive = false;
            this.currentStep = 'inactive';
            
            // Clear measurements
            this.clearMeasurement();
            
            // Stop camera session if active
            if (this.cameraSession) {
                this.cameraSession.stop();
            }
            
            // Clean up manual mode scene
            this.cleanupScene();
            
            this.updateUI();
            
            this.debugSuccess('AR session stopped successfully');
            
        } catch (error) {
            this.debugError(`Failed to stop session: ${error.message}`);
        }
    }

    /**
     * Clean up Three.js scene
     */
    cleanupScene() {
        try {
            // Remove renderer canvas
            if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            
            // Dispose of Three.js objects
            if (this.renderer) {
                this.renderer.dispose();
                this.renderer = null;
            }
            
            if (this.scene) {
                this.scene.traverse((object) => {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                });
                this.scene = null;
            }
            
            this.camera = null;
            this.gizmo = null;
            
            // Remove camera-active class
            if (this.elements.arContainer) {
                this.elements.arContainer.classList.remove('camera-active');
            }
            
            this.debugSuccess('Scene cleaned up');
            
        } catch (error) {
            this.debugError(`Error cleaning up scene: ${error.message}`);
        }
    }

    /**
     * Start render loop
     */
    startRenderLoop() {
        if (!this.renderer || !this.scene || !this.camera) return;
        
        const animate = () => {
            if (this.isSessionActive && this.renderer) {
                requestAnimationFrame(animate);
                
                // Rotate gizmo slightly for visual feedback
                if (this.gizmo) {
                    this.gizmo.rotation.y += 0.01;
                }
                
                this.renderer.render(this.scene, this.camera);
            }
        };
        animate();
    }

    /**
     * Update UI based on current state
     */
    updateUI() {
        if (this.isSessionActive) {
            this.updateStatus('Tap twice on screen to measure distance');
            this.updateStartButton('Stop Session');
        } else {
            this.updateStatus('Tap "Start Session" to begin measuring');
            this.updateStartButton('Start Session');
        }
    }

    /**
     * Update status text
     */
    updateStatus(text) {
        if (this.elements.statusText) {
            this.elements.statusText.textContent = text;
        }
        this.debugInfo(`📊 Status: ${text}`);
    }

    /**
     * Update start button text
     */
    updateStartButton(text) {
        if (this.elements.startButton) {
            this.elements.startButton.textContent = text;
        }
    }

    /**
     * Update distance display
     */
    updateDistanceDisplay(distance) {
        if (this.elements.distanceDisplay) {
            this.elements.distanceDisplay.textContent = `Distance: ${distance.toFixed(3)} units`;
        }
    }

    /**
     * Show start button
     */
    showStartButton() {
        if (this.elements.startButton) {
            this.elements.startButton.disabled = false;
        }
    }

    // Error handling and utility methods
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileArApp = new MobileARApp();
});

export default MobileARApp;