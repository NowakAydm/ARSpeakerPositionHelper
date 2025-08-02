/**
 * WebXR AR Session Management Module
 * Handles AR session lifecycle and camera feed integration with robust error handling
 */

// Use global THREE object loaded from CDN
/* global THREE */

export class ARSession {
    constructor() {
        this.session = null;
        this.referenceSpace = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.isActive = false;
        this.container = null;
        this.hitTestSource = null;
        this.frameCallback = null;
        this.reticle = null;
    }

    /**
     * Initialize AR session with WebXR and comprehensive error handling
     */
    async initialize(container) {
        console.log('🔄 Initializing AR session...');
        
        this.container = container;
        
        // Check WebXR support with detailed error messages
        if (!navigator.xr) {
            throw new Error('WebXR not supported - this browser does not have AR capabilities');
        }

        // Check if immersive AR is supported with timeout protection
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('AR support check timed out')), 5000)
            );
            
            const supportCheckPromise = navigator.xr.isSessionSupported('immersive-ar');
            const isSupported = await Promise.race([supportCheckPromise, timeoutPromise]);
            
            if (!isSupported) {
                throw new Error('Immersive AR not supported on this device');
            }
        } catch (supportError) {
            if (supportError.message.includes('timeout')) {
                throw new Error('AR support check timed out - device may not support AR');
            }
            throw new Error(`AR support check failed: ${supportError.message}`);
        }

        // Setup Three.js scene with error handling
        try {
            this.setupThreeJS();
        } catch (threeError) {
            throw new Error(`3D graphics initialization failed: ${threeError.message}`);
        }
        
        console.log('✅ AR session initialized');
        return true;
    }

    /**
     * Setup Three.js scene for AR with comprehensive error handling
     */
    setupThreeJS() {
        try {
            // Check if THREE.js is available
            if (!window.THREE) {
                throw new Error('THREE.js library not loaded');
            }

            // Create scene
            this.scene = new window.THREE.Scene();

            // Create camera
            this.camera = new window.THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

            // Create WebGL renderer with AR context
            try {
                this.renderer = new window.THREE.WebGLRenderer({ 
                    antialias: true, 
                    alpha: true,
                    preserveDrawingBuffer: true
                });
            } catch (rendererError) {
                throw new Error(`WebGL renderer creation failed: ${rendererError.message}`);
            }

            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.xr.enabled = true;
            this.renderer.xr.setReferenceSpaceType('local');

            // Add basic lighting
            const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);

            const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            this.scene.add(directionalLight);

            // Create reticle (targeting cursor)
            this.createReticle();

            // Add renderer to container
            if (this.container) {
                this.container.innerHTML = '';
                this.container.appendChild(this.renderer.domElement);
            } else {
                throw new Error('AR container element not found');
            }

            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize());
            
            console.log('✅ Three.js scene setup complete');
            
        } catch (error) {
            console.error('❌ Three.js setup failed:', error);
            throw error;
        }
    }

    /**
     * Create targeting reticle
     */
    createReticle() {
        const geometry = new window.THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
        const material = new window.THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8 
        });
        this.reticle = new window.THREE.Mesh(geometry, material);
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);
    }

    /**
     * Start AR session with robust error handling and user guidance
     */
    async start() {
        console.log('▶️ Starting AR session...');
        
        try {
            // Request AR session with required features and timeout protection
            const sessionRequestPromise = navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test']
            });
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('AR session request timed out - user may have denied camera access')), 10000)
            );
            
            this.session = await Promise.race([sessionRequestPromise, timeoutPromise]);

            // Set up session with the renderer
            await this.renderer.xr.setSession(this.session);
            
            // Get reference space
            try {
                this.referenceSpace = await this.session.requestReferenceSpace('local');
            } catch (refSpaceError) {
                console.warn('Local reference space failed, trying viewer space:', refSpaceError);
                this.referenceSpace = await this.session.requestReferenceSpace('viewer');
            }

            // Set up hit testing with error handling
            try {
                await this.setupHitTesting();
            } catch (hitTestError) {
                console.warn('Hit testing setup failed:', hitTestError);
                // Continue without hit testing - some features will be limited
            }

            // Start render loop
            this.renderer.setAnimationLoop((timestamp, frame) => {
                this.onXRFrame(timestamp, frame);
            });

            this.isActive = true;
            console.log('✅ AR session started successfully');
            
        } catch (error) {
            console.error('❌ Failed to start AR session:', error);
            
            // Provide specific error messages based on error type
            if (error.message.includes('timeout') || error.message.includes('denied')) {
                throw new Error('Camera access required for AR. Please allow camera permissions and try again.');
            } else if (error.message.includes('NotAllowedError')) {
                throw new Error('Camera access was denied. Please enable camera permissions in your browser settings.');
            } else if (error.message.includes('NotFoundError')) {
                throw new Error('No camera found on this device. AR requires a camera to function.');
            } else if (error.message.includes('NotSupportedError')) {
                throw new Error('AR features not supported on this device or browser.');
            } else {
                throw new Error(`AR session failed to start: ${error.message}`);
            }
        }
    }

    /**
     * Setup hit testing for surface detection with error handling
     */
    async setupHitTesting() {
        try {
            const viewerSpace = await this.session.requestReferenceSpace('viewer');
            this.hitTestSource = await this.session.requestHitTestSource({ space: viewerSpace });
            console.log('✅ Hit testing initialized');
        } catch (error) {
            console.warn('⚠️ Hit testing setup failed:', error);
            // Hit testing is optional - app can work without it
            this.hitTestSource = null;
        }
    }

    /**
     * XR frame render loop
     */
    onXRFrame(timestamp, frame) {
        if (!frame || !this.isActive) return;

        const pose = frame.getViewerPose(this.referenceSpace);
        if (!pose) return;

        // Perform hit testing
        if (this.hitTestSource) {
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);
            
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const hitPose = hit.getPose(this.referenceSpace);
                
                if (hitPose) {
                    this.reticle.visible = true;
                    this.reticle.matrix.fromArray(hitPose.transform.matrix);
                } else {
                    this.reticle.visible = false;
                }
            } else {
                this.reticle.visible = false;
            }
        }

        // Render the scene
        this.renderer.render(this.scene, this.camera);
        
        // Call frame callback if set
        if (this.frameCallback) {
            this.frameCallback(timestamp, frame);
        }
    }

    /**
     * Stop AR session
     */
    async stop() {
        console.log('⏹️ Stopping AR session...');
        
        try {
            if (this.session) {
                await this.session.end();
                this.session = null;
            }
            
            this.renderer.setAnimationLoop(null);
            this.isActive = false;
            
            // Hide reticle
            if (this.reticle) {
                this.reticle.visible = false;
            }
            
            console.log('✅ AR session stopped');
            
        } catch (error) {
            console.error('❌ Failed to stop AR session:', error);
        }
    }

    /**
     * Get current camera pose
     */
    getCameraPose() {
        if (!this.camera) {
            return {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0, w: 1 }
            };
        }

        return {
            position: {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z
            },
            rotation: {
                x: this.camera.quaternion.x,
                y: this.camera.quaternion.y,
                z: this.camera.quaternion.z,
                w: this.camera.quaternion.w
            }
        };
    }

    /**
     * Convert screen coordinates to AR world coordinates using hit testing
     */
    async screenToWorld(screenX, screenY, frame) {
        if (!frame || !this.hitTestSource) {
            return { x: 0, y: 0, z: 0 };
        }

        try {
            // Normalize screen coordinates
            const normalizedX = (screenX / window.innerWidth) * 2 - 1;
            const normalizedY = -(screenY / window.innerHeight) * 2 + 1;

            // Create ray for hit testing
            const ray = new window.THREE.Ray();
            ray.origin.setFromMatrixPosition(this.camera.matrixWorld);
            ray.direction.set(normalizedX, normalizedY, 0.5).unproject(this.camera).sub(ray.origin).normalize();

            // Perform hit test (simplified - in real AR this would use XR hit testing)
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);
            
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const hitPose = hit.getPose(this.referenceSpace);
                
                if (hitPose) {
                    const matrix = new window.THREE.Matrix4().fromArray(hitPose.transform.matrix);
                    const position = new window.THREE.Vector3();
                    position.setFromMatrixPosition(matrix);
                    
                    return {
                        x: position.x,
                        y: position.y,
                        z: position.z
                    };
                }
            }
            
            // Fallback to camera-relative position
            const distance = 2.0;
            const worldPosition = ray.origin.clone().add(ray.direction.multiplyScalar(distance));
            
            return {
                x: worldPosition.x,
                y: worldPosition.y,
                z: worldPosition.z
            };
            
        } catch (error) {
            console.error('❌ Screen to world conversion failed:', error);
            return { x: 0, y: 0, z: 0 };
        }
    }

    /**
     * Add object to AR scene
     */
    addToScene(object) {
        if (this.scene) {
            this.scene.add(object);
        }
    }

    /**
     * Remove object from AR scene
     */
    removeFromScene(object) {
        if (this.scene) {
            this.scene.remove(object);
        }
    }

    /**
     * Set frame callback for custom rendering
     */
    setFrameCallback(callback) {
        this.frameCallback = callback;
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    /**
     * Get reticle position (for placing objects)
     */
    getReticlePosition() {
        if (!this.reticle || !this.reticle.visible) {
            return null;
        }

        const position = new window.THREE.Vector3();
        position.setFromMatrixPosition(this.reticle.matrix);
        
        return {
            x: position.x,
            y: position.y,
            z: position.z
        };
    }

    /**
     * Check if hit test target is available
     */
    hasHitTestTarget() {
        return this.reticle && this.reticle.visible;
    }
}

export default ARSession;