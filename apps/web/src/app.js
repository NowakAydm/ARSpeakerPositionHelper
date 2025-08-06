/**
 * Simple 3D Measurement Tool Application
 * A minimal interface for placing two points in 3D space and measuring distance
 */

import { SimpleMeasurementTool } from './modules/measurement.js';

class MeasurementApp {
    constructor() {
        this.measurementTool = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.isSessionActive = false;
        this.animationId = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Initializing 3D Measurement Tool');
        
        try {
            // Initialize UI elements
            this.initializeUI();
            console.log('✅ UI initialized');
            
            // Initialize measurement tool
            this.measurementTool = new SimpleMeasurementTool();
            console.log('✅ Measurement tool created');
            
            // Setup event listeners
            this.setupEventListeners();
            console.log('✅ Event listeners setup');
            
            // Hide loading
            this.hideLoading();
            
            console.log('✅ Application initialized successfully');
            
        } catch (error) {
            console.error(`Failed to initialize application: ${error.message}`);
            this.showError('Failed to initialize the application. Please refresh and try again.');
            this.hideLoading();
        }
    }

    /**
     * Initialize UI elements
     */
    initializeUI() {
        this.elements = {
            container: document.getElementById('measurement-container'),
            startButton: document.getElementById('start-session'),
            clearButton: document.getElementById('clear-measurement'),
            resetButton: document.getElementById('reset-session'),
            distanceDisplay: document.getElementById('distance-display'),
            distanceValue: document.getElementById('distance-value'),
            instructionText: document.getElementById('instruction-text'),
            loading: document.getElementById('loading'),
            errorModal: document.getElementById('error-modal'),
            errorMessage: document.getElementById('error-message'),
            errorClose: document.getElementById('error-close')
        };

        // Validate required elements
        const requiredElements = ['container', 'startButton', 'distanceValue', 'instructionText'];
        for (const elementKey of requiredElements) {
            if (!this.elements[elementKey]) {
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
                if (this.isSessionActive) {
                    this.stopSession();
                } else {
                    this.startSession();
                }
            });
        }

        // Clear button
        if (this.elements.clearButton) {
            this.elements.clearButton.addEventListener('click', () => {
                this.clearMeasurement();
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

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.camera && this.renderer) {
                this.handleResize();
            }
        });
    }

    /**
     * Start the measurement session
     */
    startSession() {
        console.log('🚀 Starting measurement session');
        
        try {
            // Create Three.js scene
            this.createThreeJSScene();
            
            // Initialize measurement tool with scene
            this.measurementTool.initialize(this.scene, this.camera, this.elements.container);
            
            // Set up measurement completion callback
            this.measurementTool.onMeasurementComplete = (distance) => {
                this.onMeasurementComplete(distance);
            };
            
            // Activate measurement tool
            this.measurementTool.activate();
            
            // Update UI
            this.isSessionActive = true;
            this.elements.startButton.textContent = 'Stop';
            this.elements.startButton.className = 'btn btn-danger';
            if (this.elements.clearButton) this.elements.clearButton.disabled = false;
            
            this.updateInstructions('Click two points in the 3D space to measure distance');
            this.updateDistanceDisplay('-');
            
            // Start render loop
            this.startRenderLoop();
            
            console.log('✅ Measurement session started');
            
        } catch (error) {
            console.error(`Failed to start session: ${error.message}`);
            this.showError(`Failed to start session: ${error.message}`);
        }
    }

    /**
     * Stop the measurement session
     */
    stopSession() {
        console.log('🛑 Stopping measurement session');
        
        try {
            // Deactivate measurement tool
            if (this.measurementTool) {
                this.measurementTool.deactivate();
            }
            
            // Stop render loop
            this.stopRenderLoop();
            
            // Clean up Three.js scene
            this.cleanupThreeJSScene();
            
            // Update UI
            this.isSessionActive = false;
            this.elements.startButton.textContent = 'Start';
            this.elements.startButton.className = 'btn btn-primary';
            if (this.elements.clearButton) this.elements.clearButton.disabled = true;
            
            this.updateInstructions('Click "Start" to begin measuring distance between two points');
            this.updateDistanceDisplay('-');
            
            console.log('✅ Measurement session stopped');
            
        } catch (error) {
            console.error(`Failed to stop session: ${error.message}`);
            this.showError('Failed to stop session');
        }
    }

    /**
     * Reset the entire session
     */
    resetSession() {
        console.log('🔄 Resetting session');
        
        if (this.isSessionActive) {
            this.stopSession();
        }
        
        // Clear any remaining UI state
        this.updateInstructions('Click "Start" to begin measuring distance between two points');
        this.updateDistanceDisplay('-');
        
        console.log('✅ Session reset complete');
    }

    /**
     * Clear current measurement
     */
    clearMeasurement() {
        if (!this.measurementTool || !this.isSessionActive) return;
        
        console.log('🧹 Clearing measurement');
        
        // Clear measurement points and line
        this.measurementTool.clear();
        
        // Reactivate for new measurement
        this.measurementTool.activate();
        
        // Update UI
        this.updateInstructions('Click two points in the 3D space to measure distance');
        this.updateDistanceDisplay('-');
        
        console.log('✅ Measurement cleared');
    }

    /**
     * Create Three.js scene, camera, and renderer
     */
    createThreeJSScene() {
        if (!window.THREE) {
            throw new Error('THREE.js library not loaded');
        }

        console.log('🎬 Creating Three.js scene');

        // Create scene
        this.scene = new window.THREE.Scene();
        this.scene.background = new window.THREE.Color(0x222222); // Dark gray background

        // Create camera
        const aspect = this.elements.container.clientWidth / this.elements.container.clientHeight;
        this.camera = new window.THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 2, 5); // Position camera above and back from origin

        // Create renderer
        this.renderer = new window.THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false
        });
        
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(
            this.elements.container.clientWidth,
            this.elements.container.clientHeight
        );
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = window.THREE.PCFSoftShadowMap;

        // Style the canvas
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';

        // Add lighting
        this.addLighting();

        // Add a simple grid for reference
        this.addGrid();

        // Add canvas to container
        this.elements.container.innerHTML = ''; // Clear placeholder
        this.elements.container.appendChild(this.renderer.domElement);
        
        console.log('✅ Three.js scene created');
    }

    /**
     * Add lighting to the scene
     */
    addLighting() {
        // Ambient light for overall illumination
        const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light for shadows and depth
        const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    /**
     * Add a grid for visual reference
     */
    addGrid() {
        const gridHelper = new window.THREE.GridHelper(10, 10, 0x444444, 0x444444);
        this.scene.add(gridHelper);
    }

    /**
     * Start the render loop
     */
    startRenderLoop() {
        const animate = () => {
            if (this.isSessionActive && this.renderer && this.scene && this.camera) {
                this.animationId = requestAnimationFrame(animate);
                this.renderer.render(this.scene, this.camera);
            }
        };
        animate();
    }

    /**
     * Stop the render loop
     */
    stopRenderLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.camera || !this.renderer || !this.elements.container) return;

        const width = this.elements.container.clientWidth;
        const height = this.elements.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Clean up Three.js scene
     */
    cleanupThreeJSScene() {
        try {
            // Stop render loop
            this.stopRenderLoop();

            // Remove canvas from container
            if (this.renderer && this.renderer.domElement && this.elements.container) {
                this.elements.container.removeChild(this.renderer.domElement);
            }

            // Clean up Three.js objects
            if (this.renderer) {
                this.renderer.dispose();
                this.renderer = null;
            }

            if (this.scene) {
                // Dispose of all scene objects
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

            // Restore placeholder
            this.elements.container.innerHTML = `
                <div class="measurement-placeholder">
                    <div class="placeholder-content">
                        <div class="placeholder-icon">📏</div>
                        <h2>3D Measurement View</h2>
                        <p>Click "Start" to begin measuring</p>
                    </div>
                </div>
            `;

            console.log('✅ Three.js scene cleaned up');

        } catch (error) {
            console.error(`Error cleaning up scene: ${error.message}`);
        }
    }

    /**
     * Called when measurement is complete
     */
    onMeasurementComplete(distance) {
        console.log(`📏 Measurement complete: ${distance.toFixed(3)} units`);
        
        // Format and display distance
        const formattedDistance = this.measurementTool.formatDistance(distance);
        this.updateDistanceDisplay(formattedDistance);
        
        // Update instructions
        this.updateInstructions(`Measurement complete: ${formattedDistance}. Click "Clear" to measure again.`);
    }

    /**
     * Update the distance display
     */
    updateDistanceDisplay(distance) {
        if (this.elements.distanceValue) {
            this.elements.distanceValue.textContent = distance;
        }
    }

    /**
     * Update the instruction text
     */
    updateInstructions(text) {
        if (this.elements.instructionText) {
            this.elements.instructionText.textContent = text;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (this.elements.errorModal && this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorModal.classList.remove('hidden');
        }
        console.error(`🚨 Error: ${message}`);
    }

    /**
     * Hide error message
     */
    hideError() {
        if (this.elements.errorModal) {
            this.elements.errorModal.classList.add('hidden');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.classList.add('hidden');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.measurementApp = new MeasurementApp();
});

export default MeasurementApp;