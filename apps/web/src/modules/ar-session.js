/**
 * WebXR AR Session Management Module
 * Handles AR session lifecycle and camera feed integration
 */

import * as THREE from 'three';

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
     * Initialize AR session with WebXR
     */
    async initialize(container) {
        console.log('🔄 Initializing AR session...');
        
        this.container = container;
        
        // Check WebXR support
        if (!navigator.xr) {
            throw new Error('WebXR not supported');
        }

        // Check if immersive AR is supported
        const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!isSupported) {
            throw new Error('Immersive AR not supported');
        }

        // Setup Three.js scene
        this.setupThreeJS();
        
        console.log('✅ AR session initialized');
        return true;
    }

    /**
     * Setup Three.js scene for AR
     */
    setupThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();

        // Create camera
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

        // Create WebGL renderer with AR context
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        this.renderer.xr.setReferenceSpaceType('local');

        // Add basic lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Create reticle (targeting cursor)
        this.createReticle();

        // Add renderer to container
        if (this.container) {
            this.container.innerHTML = '';
            this.container.appendChild(this.renderer.domElement);
        }

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Create targeting reticle
     */
    createReticle() {
        const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8 
        });
        this.reticle = new THREE.Mesh(geometry, material);
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);
    }

    /**
     * Start AR session
     */
    async start() {
        console.log('▶️ Starting AR session...');
        
        try {
            // Request AR session with required features
            this.session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test']
            });

            // Set up session
            await this.renderer.xr.setSession(this.session);
            
            // Get reference space
            this.referenceSpace = await this.session.requestReferenceSpace('local');

            // Set up hit testing
            this.setupHitTesting();

            // Start render loop
            this.renderer.setAnimationLoop((timestamp, frame) => {
                this.onXRFrame(timestamp, frame);
            });

            this.isActive = true;
            console.log('✅ AR session started');
            
        } catch (error) {
            console.error('❌ Failed to start AR session:', error);
            throw error;
        }
    }

    /**
     * Setup hit testing for surface detection
     */
    async setupHitTesting() {
        const viewerSpace = await this.session.requestReferenceSpace('viewer');
        this.hitTestSource = await this.session.requestHitTestSource({ space: viewerSpace });
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
            const ray = new THREE.Ray();
            ray.origin.setFromMatrixPosition(this.camera.matrixWorld);
            ray.direction.set(normalizedX, normalizedY, 0.5).unproject(this.camera).sub(ray.origin).normalize();

            // Perform hit test (simplified - in real AR this would use XR hit testing)
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);
            
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const hitPose = hit.getPose(this.referenceSpace);
                
                if (hitPose) {
                    const matrix = new THREE.Matrix4().fromArray(hitPose.transform.matrix);
                    const position = new THREE.Vector3();
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

        const position = new THREE.Vector3();
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