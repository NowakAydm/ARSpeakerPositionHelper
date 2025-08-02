/**
 * Camera Session Management Module
 * Replaces WebXR with camera-based AR simulation for broader device compatibility
 */

// Use global THREE object loaded from CDN
/* global THREE */

export class CameraSession {
    constructor() {
        this.stream = null;
        this.video = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.isActive = false;
        this.container = null;
        this.controls = null;
        this.reticle = null;
        this.canvas = null;
        this.backgroundTexture = null;
        this.frameCallback = null;
    }

    /**
     * Initialize camera session with getUserMedia
     */
    async initialize(container) {
        console.log('🔄 Initializing camera session...');
        
        this.container = container;
        
        // Check camera support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera access not supported in this browser');
        }

        // Setup Three.js scene
        try {
            this.setupThreeJS();
        } catch (threeError) {
            throw new Error(`3D graphics initialization failed: ${threeError.message}`);
        }
        
        console.log('✅ Camera session initialized');
        return true;
    }

    /**
     * Setup Three.js scene for camera overlay
     */
    setupThreeJS() {
        try {
            // Check if THREE.js is available
            if (!window.THREE) {
                throw new Error('THREE.js library not loaded');
            }

            // Create scene
            this.scene = new window.THREE.Scene();

            // Create camera with field of view optimized for mobile
            this.camera = new window.THREE.PerspectiveCamera(
                70, 
                window.innerWidth / window.innerHeight, 
                0.01, 
                1000
            );
            this.camera.position.set(0, 1.6, 0); // Eye-level height

            // Create WebGL renderer with transparent background
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
            this.renderer.setClearColor(0x000000, 0); // Transparent background

            // Create canvas for camera background
            this.canvas = document.createElement('canvas');
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.zIndex = '1';
            this.canvas.style.pointerEvents = 'none';
            
            // 3D renderer goes on top
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.zIndex = '2';
            this.renderer.domElement.style.pointerEvents = 'auto';

            // Add basic lighting
            const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);

            const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            this.scene.add(directionalLight);

            // Create reticle (targeting cursor)
            this.createReticle();

            // Add to container
            if (this.container) {
                this.container.innerHTML = '';
                this.container.appendChild(this.canvas);
                this.container.appendChild(this.renderer.domElement);
            } else {
                throw new Error('Camera container element not found');
            }

            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize());
            
            // Setup device orientation controls if available
            this.setupOrientationControls();
            
            console.log('✅ Three.js scene setup complete');
            
        } catch (error) {
            console.error('❌ Three.js setup failed:', error);
            throw error;
        }
    }

    /**
     * Setup device orientation controls for basic tracking
     */
    setupOrientationControls() {
        try {
            // Check if device orientation is available
            if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
                // iOS 13+ requires permission request
                console.log('📱 iOS device orientation detected');
            } else if (window.DeviceOrientationEvent) {
                // Android and older iOS
                console.log('📱 Device orientation detected');
                this.enableOrientationControls();
            } else {
                console.log('📱 Device orientation not available, using manual controls');
            }
        } catch (error) {
            console.warn('⚠️ Device orientation setup failed:', error);
        }
    }

    /**
     * Enable device orientation controls
     */
    enableOrientationControls() {
        let alpha = 0, beta = 0, gamma = 0;

        const handleOrientation = (event) => {
            alpha = event.alpha || 0; // Z axis
            beta = event.beta || 0;   // X axis
            gamma = event.gamma || 0; // Y axis

            // Apply rotation to camera (simplified)
            if (this.camera) {
                this.camera.rotation.x = beta * Math.PI / 180;
                this.camera.rotation.y = alpha * Math.PI / 180;
                this.camera.rotation.z = gamma * Math.PI / 180;
            }
        };

        window.addEventListener('deviceorientation', handleOrientation);
        
        // Store reference for cleanup
        this.orientationHandler = handleOrientation;
    }

    /**
     * Create targeting reticle
     */
    createReticle() {
        const geometry = new window.THREE.RingGeometry(0.05, 0.1, 32);
        const material = new window.THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8 
        });
        this.reticle = new window.THREE.Mesh(geometry, material);
        this.reticle.position.set(0, 0, -2); // 2 meters in front
        this.scene.add(this.reticle);
    }

    /**
     * Start camera session
     */
    async start() {
        console.log('▶️ Starting camera session...');
        
        try {
            // Request camera access
            const constraints = {
                video: {
                    facingMode: 'environment', // Back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Create video element
            this.video = document.createElement('video');
            this.video.srcObject = this.stream;
            this.video.autoplay = true;
            this.video.playsInline = true;
            this.video.muted = true;

            // Wait for video to load
            await new Promise((resolve, reject) => {
                this.video.addEventListener('loadedmetadata', resolve);
                this.video.addEventListener('error', reject);
                setTimeout(reject, 5000); // Timeout after 5 seconds
            });

            // Setup camera background rendering
            this.setupCameraBackground();

            // Request device orientation permission on iOS
            await this.requestOrientationPermission();

            // Start render loop
            this.startRenderLoop();

            this.isActive = true;
            console.log('✅ Camera session started successfully');
            
        } catch (error) {
            console.error('❌ Failed to start camera session:', error);
            
            // Provide specific error messages
            if (error.name === 'NotAllowedError') {
                throw new Error('Camera access was denied. Please allow camera permissions and try again.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No camera found on this device.');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('Camera access not supported on this device or browser.');
            } else {
                throw new Error(`Camera session failed: ${error.message}`);
            }
        }
    }

    /**
     * Setup camera background rendering
     */
    setupCameraBackground() {
        const ctx = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth || 1280;
        this.canvas.height = this.video.videoHeight || 720;
        
        // Resize canvas to match container
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.objectFit = 'cover';

        const drawFrame = () => {
            if (this.video && this.video.readyState >= 2) {
                ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            }
        };

        this.backgroundRenderLoop = drawFrame;
    }

    /**
     * Request device orientation permission on iOS
     */
    async requestOrientationPermission() {
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    this.enableOrientationControls();
                    console.log('✅ Device orientation permission granted');
                } else {
                    console.log('⚠️ Device orientation permission denied');
                }
            } catch (error) {
                console.warn('⚠️ Could not request device orientation permission:', error);
            }
        }
    }

    /**
     * Start render loop
     */
    startRenderLoop() {
        const animate = () => {
            if (this.isActive) {
                requestAnimationFrame(animate);
                
                // Render camera background
                if (this.backgroundRenderLoop) {
                    this.backgroundRenderLoop();
                }
                
                // Render 3D scene
                this.renderer.render(this.scene, this.camera);
                
                // Call frame callback if set
                if (this.frameCallback) {
                    this.frameCallback();
                }
            }
        };
        animate();
    }

    /**
     * Stop camera session
     */
    stop() {
        console.log('⏹️ Stopping camera session...');
        
        this.isActive = false;

        // Stop camera stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Clean up video element
        if (this.video) {
            this.video.srcObject = null;
            this.video = null;
        }

        // Remove orientation listener
        if (this.orientationHandler) {
            window.removeEventListener('deviceorientation', this.orientationHandler);
            this.orientationHandler = null;
        }

        console.log('✅ Camera session stopped');
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            // Resize canvas
            if (this.canvas) {
                this.canvas.style.width = window.innerWidth + 'px';
                this.canvas.style.height = window.innerHeight + 'px';
            }
        }
    }

    /**
     * Add 3D object to scene
     */
    addToScene(object) {
        if (this.scene) {
            this.scene.add(object);
        }
    }

    /**
     * Remove 3D object from scene
     */
    removeFromScene(object) {
        if (this.scene) {
            this.scene.remove(object);
        }
    }

    /**
     * Convert screen coordinates to 3D world position
     * Simulates AR hit-testing with a fixed distance
     */
    screenToWorld(screenX, screenY, distance = 2) {
        const mouse = new window.THREE.Vector2();
        mouse.x = (screenX / window.innerWidth) * 2 - 1;
        mouse.y = -(screenY / window.innerHeight) * 2 + 1;

        const raycaster = new window.THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        // Calculate point at fixed distance
        const direction = raycaster.ray.direction.clone();
        direction.multiplyScalar(distance);
        const worldPosition = this.camera.position.clone().add(direction);
        
        return worldPosition;
    }

    /**
     * Set frame callback for render loop
     */
    setFrameCallback(callback) {
        this.frameCallback = callback;
    }
}