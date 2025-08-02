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
        // Use global debug logger if available, fallback to console
        const log = window.appDebugInfo || console.log;
        const error = window.appDebugError || console.error;
        
        log('🔄 Initializing camera session...');
        
        this.container = container;
        
        // Check camera support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            error('Camera access not supported in this browser');
            throw new Error('Camera access not supported in this browser');
        }

        // Setup Three.js scene
        try {
            this.setupThreeJS();
        } catch (threeError) {
            error(`3D graphics initialization failed: ${threeError.message}`);
            throw new Error(`3D graphics initialization failed: ${threeError.message}`);
        }
        
        const success = window.appDebugSuccess || console.log;
        success('✅ Camera session initialized');
        return true;
    }

    /**
     * Setup Three.js scene for camera overlay
     */
    setupThreeJS() {
        const log = window.appDebugInfo || console.log;
        const error = window.appDebugError || console.error;
        const success = window.appDebugSuccess || console.log;
        
        try {
            // Check if THREE.js is available
            if (!window.THREE) {
                error('THREE.js library not loaded');
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
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = '1';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.objectFit = 'cover';
            
            // 3D renderer goes on top
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
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
                // Add camera-active class for proper styling
                this.container.classList.add('camera-active');
            } else {
                throw new Error('Camera container element not found');
            }

            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize());
            
            // Setup device orientation controls if available
            this.setupOrientationControls();
            
            success('✅ Three.js scene setup complete');
            
        } catch (error) {
            error(`❌ Three.js setup failed: ${error.message}`);
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
        const log = window.appDebugInfo || console.log;
        const error = window.appDebugError || console.error;
        const success = window.appDebugSuccess || console.log;
        
        log('▶️ Starting camera session...');
        
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
            this.showStatusMessage('📹 Camera access granted!');

            // Create video element
            this.video = document.createElement('video');
            this.video.srcObject = this.stream;
            this.video.autoplay = true;
            this.video.playsInline = true;
            this.video.muted = true;
            this.video.style.display = 'none'; // Hide the video element since we draw to canvas

            // Wait for video to load and be ready to play
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Video loading timeout')), 10000);
                
                const handleSuccess = () => {
                    clearTimeout(timeout);
                    this.video.removeEventListener('loadedmetadata', handleSuccess);
                    this.video.removeEventListener('canplay', handleSuccess);
                    this.video.removeEventListener('error', handleError);
                    console.log(`📹 Video ready: ${this.video.videoWidth}x${this.video.videoHeight}`);
                    this.showStatusMessage(`📱 Video loaded: ${this.video.videoWidth}x${this.video.videoHeight}`);
                    resolve();
                };
                
                const handleError = (error) => {
                    clearTimeout(timeout);
                    this.video.removeEventListener('loadedmetadata', handleSuccess);
                    this.video.removeEventListener('canplay', handleSuccess);
                    this.video.removeEventListener('error', handleError);
                    reject(error);
                };
                
                this.video.addEventListener('loadedmetadata', handleSuccess);
                this.video.addEventListener('canplay', handleSuccess);
                this.video.addEventListener('error', handleError);
            });

            // Setup camera background rendering
            this.setupCameraBackground();

            // Add debug info
            log('📹 Video element created:', {
                videoWidth: this.video.videoWidth,
                videoHeight: this.video.videoHeight,
                readyState: this.video.readyState
            });

            // Request device orientation permission on iOS
            await this.requestOrientationPermission();

            // Start render loop
            this.startRenderLoop();

            this.isActive = true;
            this.showStatusMessage('✅ Camera session ready!');
            success('✅ Camera session started successfully');
            
        } catch (error) {
            error(`❌ Failed to start camera session: ${error.message}`);
            this.showStatusMessage(`❌ Camera error: ${error.message}`, 'error');
            
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
        
        // Wait for video metadata to load before setting canvas dimensions
        const setupCanvas = () => {
            if (this.video.videoWidth && this.video.videoHeight) {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                
                // Resize canvas to match container
                this.canvas.style.width = '100%';
                this.canvas.style.height = '100%';
                this.canvas.style.objectFit = 'cover';
                this.canvas.style.display = 'block';
                
                console.log(`📐 Canvas setup: ${this.canvas.width}x${this.canvas.height}`);
            } else {
                // Fallback dimensions
                this.canvas.width = 1280;
                this.canvas.height = 720;
                this.canvas.style.width = '100%';
                this.canvas.style.height = '100%';
                this.canvas.style.objectFit = 'cover';
                this.canvas.style.display = 'block';
                
                console.warn('⚠️ Using fallback canvas dimensions');
            }
        };

        // Setup canvas dimensions
        setupCanvas();
        
        // Listen for video resize events
        this.video.addEventListener('resize', setupCanvas);

        const drawFrame = () => {
            if (this.video && this.video.readyState >= 2 && this.canvas.width > 0 && this.canvas.height > 0) {
                try {
                    ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                } catch (error) {
                    console.warn('⚠️ Frame drawing error:', error);
                }
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
        const log = window.appDebugInfo || console.log;
        const success = window.appDebugSuccess || console.log;
        
        log('⏹️ Stopping camera session...');
        
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

        // Remove camera-active class and restore placeholder
        if (this.container) {
            this.container.classList.remove('camera-active');
            // Restore placeholder content
            this.container.innerHTML = `
                <div class="ar-placeholder">
                    <div class="placeholder-content">
                        <div class="placeholder-icon">📱</div>
                        <h2>Camera View</h2>
                        <p>Click "Start Camera Session" to begin detecting speakers</p>
                    </div>
                </div>
            `;
        }

        success('✅ Camera session stopped');
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
     * Get the element that should receive touch/click events
     */
    getInteractionTarget() {
        // Return the renderer's DOM element since it's on top and has pointer events enabled
        return this.renderer ? this.renderer.domElement : this.container;
    }

    /**
     * Set frame callback for render loop
     */
    setFrameCallback(callback) {
        this.frameCallback = callback;
    }

    /**
     * Debug method to check camera preview status
     */
    debugCameraStatus() {
        const status = {
            isActive: this.isActive,
            hasStream: !!this.stream,
            hasVideo: !!this.video,
            videoReady: this.video ? this.video.readyState >= 2 : false,
            videoDimensions: this.video ? `${this.video.videoWidth}x${this.video.videoHeight}` : 'N/A',
            hasCanvas: !!this.canvas,
            canvasDimensions: this.canvas ? `${this.canvas.width}x${this.canvas.height}` : 'N/A',
            hasRenderer: !!this.renderer,
            containerHasElements: this.container ? this.container.children.length : 0,
            containerClasses: this.container ? this.container.className : 'N/A'
        };
        
        console.log('🔍 Camera Session Debug Status:', status);
        
        // Also show visual debug info on screen
        this.showDebugPanel(status);
        return status;
    }

    /**
     * Show debug information visually on the screen
     */
    showDebugPanel(status) {
        // Remove existing debug panel
        const existingPanel = document.getElementById('camera-debug-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        // Create debug panel
        const debugPanel = document.createElement('div');
        debugPanel.id = 'camera-debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            max-width: 300px;
            line-height: 1.4;
            border: 1px solid #333;
        `;

        const statusText = Object.entries(status)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

        debugPanel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; color: #00ff00;">📱 Camera Debug Info</div>
            <pre style="margin: 0; white-space: pre-wrap;">${statusText}</pre>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 5px;
                background: #ff4444;
                color: white;
                border: none;
                padding: 2px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
            ">Close</button>
        `;

        document.body.appendChild(debugPanel);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (debugPanel.parentElement) {
                debugPanel.remove();
            }
        }, 10000);
    }

    /**
     * Show a simple status message on screen
     */
    showStatusMessage(message, type = 'info') {
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 100, 255, 0.9)'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            text-align: center;
            max-width: 80%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        statusDiv.textContent = message;
        document.body.appendChild(statusDiv);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (statusDiv.parentElement) {
                statusDiv.remove();
            }
        }, 3000);
    }
}