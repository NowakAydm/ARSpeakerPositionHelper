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
        this.renderLoopActive = false;
        this.container = null;
        this.controls = null;
        this.reticle = null;
        this.canvas = null;
        this.backgroundTexture = null;
        this.backgroundRenderLoop = null;
        this.frameCallback = null;
        this.onPermissionGranted = null;
        this.videoResizeHandler = null;
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

        // Setup Three.js scene but don't modify container yet
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
            this.canvas.style.display = 'block';
            this.canvas.style.backgroundColor = 'transparent';
            
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
            
            // Create gyroscope gizmo
            this.createGyroscopeGizmo();

            // Store elements for later use but don't add to container yet
            // Container will be modified only when camera successfully starts
            if (!this.container) {
                throw new Error('Camera container element not found');
            }

            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize());
            
            // Setup device orientation controls if available
            this.setupOrientationControls();
            
            success('✅ Three.js scene setup complete');
            
        } catch (threeError) {
            error(`❌ Three.js setup failed: ${threeError.message}`);
            throw threeError;
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
                // Still enable orientation controls for fallback animation
                this.enableOrientationControls();
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

            // Store gyro data
            if (this.gyroData) {
                this.gyroData.alpha = alpha;
                this.gyroData.beta = beta;
                this.gyroData.gamma = gamma;
            }

            // Update gyroscope gizmo rotation
            if (this.gyroGizmo) {
                this.gyroGizmo.rotation.x = beta * Math.PI / 180;
                this.gyroGizmo.rotation.y = alpha * Math.PI / 180;
                this.gyroGizmo.rotation.z = gamma * Math.PI / 180;
            }

            // Update debug panel
            if (this.gyroDebugDiv) {
                this.gyroDebugDiv.innerHTML = `
                    <div>🧭 GYROSCOPE GIZMO</div>
                    <div>Status: Live Device Data</div>
                    <div>Alpha (Z): ${alpha.toFixed(1)}°</div>
                    <div>Beta (X): ${beta.toFixed(1)}°</div>
                    <div>Gamma (Y): ${gamma.toFixed(1)}°</div>
                `;
            }

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
     * Create gyroscope gizmo to visualize device orientation
     */
    createGyroscopeGizmo() {
        // Create a coordinate system gizmo
        this.gyroGizmo = new window.THREE.Group();
        
        // Create X, Y, Z axes with different colors
        const axisLength = 0.5;
        const axisWidth = 0.02;
        
        // X axis (red)
        const xGeometry = new window.THREE.CylinderGeometry(axisWidth, axisWidth, axisLength, 8);
        const xMaterial = new window.THREE.MeshBasicMaterial({ color: 0xff0000 });
        const xAxis = new window.THREE.Mesh(xGeometry, xMaterial);
        xAxis.rotation.z = Math.PI / 2;
        xAxis.position.x = axisLength / 2;
        this.gyroGizmo.add(xAxis);
        
        // Y axis (green)
        const yGeometry = new window.THREE.CylinderGeometry(axisWidth, axisWidth, axisLength, 8);
        const yMaterial = new window.THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const yAxis = new window.THREE.Mesh(yGeometry, yMaterial);
        yAxis.position.y = axisLength / 2;
        this.gyroGizmo.add(yAxis);
        
        // Z axis (blue)
        const zGeometry = new window.THREE.CylinderGeometry(axisWidth, axisWidth, axisLength, 8);
        const zMaterial = new window.THREE.MeshBasicMaterial({ color: 0x0000ff });
        const zAxis = new window.THREE.Mesh(zGeometry, zMaterial);
        zAxis.rotation.x = Math.PI / 2;
        zAxis.position.z = axisLength / 2;
        this.gyroGizmo.add(zAxis);
        
        // Add arrow heads for each axis
        const arrowGeometry = new window.THREE.ConeGeometry(axisWidth * 2, axisWidth * 4, 8);
        
        // X arrow (red)
        const xArrow = new window.THREE.Mesh(arrowGeometry, xMaterial);
        xArrow.rotation.z = -Math.PI / 2;
        xArrow.position.x = axisLength;
        this.gyroGizmo.add(xArrow);
        
        // Y arrow (green)
        const yArrow = new window.THREE.Mesh(arrowGeometry, yMaterial);
        yArrow.position.y = axisLength;
        this.gyroGizmo.add(yArrow);
        
        // Z arrow (blue)
        const zArrow = new window.THREE.Mesh(arrowGeometry, zMaterial);
        zArrow.rotation.x = Math.PI / 2;
        zArrow.position.z = axisLength;
        this.gyroGizmo.add(zArrow);
        
        // Add a center sphere
        const centerGeometry = new window.THREE.SphereGeometry(axisWidth * 2, 16, 16);
        const centerMaterial = new window.THREE.MeshBasicMaterial({ color: 0xffffff });
        const centerSphere = new window.THREE.Mesh(centerGeometry, centerMaterial);
        this.gyroGizmo.add(centerSphere);
        
        // Add text labels for debugging
        this.createGyroDebugPanel();
        
        // Position the gizmo in the top-right corner of the view
        this.gyroGizmo.position.set(1.5, 1, -3);
        this.gyroGizmo.scale.set(0.5, 0.5, 0.5);
        
        // Add to scene
        this.scene.add(this.gyroGizmo);
        
        // Store initial orientation values
        this.gyroData = {
            alpha: 0,
            beta: 0,
            gamma: 0
        };
        
        console.log('🧭 Gyroscope gizmo created');
    }

    /**
     * Create debug panel for gyroscope data
     */
    createGyroDebugPanel() {
        // Create HTML overlay for gyro data
        this.gyroDebugDiv = document.createElement('div');
        this.gyroDebugDiv.style.position = 'absolute';
        this.gyroDebugDiv.style.top = '10px';
        this.gyroDebugDiv.style.right = '10px';
        this.gyroDebugDiv.style.background = 'rgba(0, 0, 0, 0.8)';
        this.gyroDebugDiv.style.color = '#00ff00';
        this.gyroDebugDiv.style.padding = '10px';
        this.gyroDebugDiv.style.fontFamily = 'monospace';
        this.gyroDebugDiv.style.fontSize = '12px';
        this.gyroDebugDiv.style.borderRadius = '5px';
        this.gyroDebugDiv.style.zIndex = '1000';
        this.gyroDebugDiv.style.pointerEvents = 'none';
        this.gyroDebugDiv.innerHTML = `
            <div>🧭 GYROSCOPE GIZMO</div>
            <div>Status: Initializing...</div>
            <div>Alpha (Z): 0°</div>
            <div>Beta (X): 0°</div>
            <div>Gamma (Y): 0°</div>
        `;
        
        // Add to container when camera starts
        this.shouldAddGyroDebug = true;
    }

    /**
     * Request camera access with progressive fallback constraints
     */
    async requestCameraWithFallback() {
        const log = window.appDebugInfo || console.log;
        const error = window.appDebugError || console.error;
        
        // Define camera constraint configurations in order of preference
        const constraintConfigs = [
            {
                name: 'High-quality rear camera',
                constraints: {
                    video: {
                        facingMode: { ideal: 'environment' },
                        width: { ideal: 1280, min: 640 },
                        height: { ideal: 720, min: 480 }
                    },
                    audio: false
                }
            },
            {
                name: 'Any rear camera',
                constraints: {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                }
            },
            {
                name: 'Front camera',
                constraints: {
                    video: {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                }
            },
            {
                name: 'Any camera (flexible quality)',
                constraints: {
                    video: {
                        width: { ideal: 1280, min: 320 },
                        height: { ideal: 720, min: 240 }
                    },
                    audio: false
                }
            },
            {
                name: 'Basic camera',
                constraints: {
                    video: true,
                    audio: false
                }
            }
        ];

        // Try each configuration
        for (let i = 0; i < constraintConfigs.length; i++) {
            const config = constraintConfigs[i];
            log(`📹 Attempting camera access: ${config.name}`);
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia(config.constraints);
                log(`✅ Camera access successful with: ${config.name}`);
                
                // Log actual camera capabilities
                const videoTrack = stream.getVideoTracks()[0];
                if (videoTrack) {
                    const settings = videoTrack.getSettings();
                    log(`📹 Camera settings: ${settings.width}x${settings.height}, facing: ${settings.facingMode || 'unknown'}`);
                }
                
                return stream;
                
            } catch (constraintError) {
                error(`❌ Failed ${config.name}: ${constraintError.name} - ${constraintError.message}`);
                
                // Continue to next configuration unless this is the last one
                if (i === constraintConfigs.length - 1) {
                    throw constraintError;
                }
            }
        }
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
            // Try multiple camera configurations with progressive fallback
            this.stream = await this.requestCameraWithFallback();
            this.showStatusMessage('📹 Camera access granted!');

            // Call the permission granted callback immediately after permission is granted
            if (this.onPermissionGranted) {
                this.onPermissionGranted();
            }

            // Create video element
            this.video = document.createElement('video');
            this.video.srcObject = this.stream;
            this.video.autoplay = true;
            this.video.playsInline = true;
            this.video.muted = true;
            this.video.style.display = 'none'; // Hide the video element since we draw to canvas

            // Setup camera container immediately to show that camera is active
            this.setupCameraContainer();

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

            // NOW setup camera background after video is confirmed ready
            // This ensures the canvas can properly draw video frames
            this.setupCameraBackground();

            // Ensure video is playing for canvas drawing
            try {
                await this.video.play();
                log('📹 Video playback started');
            } catch (playError) {
                console.warn('⚠️ Video play failed:', playError);
                // Video might already be playing or autoplay might be blocked
                // This is not critical as the video may start playing later
            }

            // Add debug info
            log('📹 Video element created:', {
                videoWidth: this.video.videoWidth,
                videoHeight: this.video.videoHeight,
                readyState: this.video.readyState,
                playing: !this.video.paused
            });

            // Request device orientation permission on iOS
            await this.requestOrientationPermission();

            // Start render loop
            this.startRenderLoop();

            this.isActive = true;
            this.showStatusMessage('✅ Camera session ready!');
            success('✅ Camera session started successfully');
            
        } catch (cameraError) {
            error(`❌ Failed to start camera session: ${cameraError.message}`);
            this.showStatusMessage(`❌ Camera error: ${cameraError.message}`, 'error');
            
            // Provide specific error messages
            if (cameraError.name === 'NotAllowedError') {
                throw new Error('Camera access was denied. Please allow camera permissions and try again.');
            } else if (cameraError.name === 'NotFoundError') {
                throw new Error('No camera found on this device.');
            } else if (cameraError.name === 'NotSupportedError') {
                throw new Error('Camera access not supported on this device or browser.');
            } else {
                throw new Error(`Camera session failed: ${cameraError.message}`);
            }
        }
    }

    /**
     * Setup camera container with canvas and renderer elements
     * Only called when camera successfully starts
     */
    setupCameraContainer() {
        const log = window.appDebugInfo || console.log;
        
        if (this.container && this.canvas && this.renderer) {
            // Clear the placeholder content and add camera elements
            this.container.innerHTML = '';
            
            // Add video element (hidden) - needed for canvas drawing
            if (this.video) {
                this.container.appendChild(this.video);
            }
            
            // Add canvas for camera background
            this.container.appendChild(this.canvas);
            
            // Add 3D renderer on top
            this.container.appendChild(this.renderer.domElement);
            
            // Add gyro debug panel if created
            if (this.shouldAddGyroDebug && this.gyroDebugDiv) {
                this.container.appendChild(this.gyroDebugDiv);
                this.shouldAddGyroDebug = false;
                log('🧭 Gyro debug panel added to container');
            }
            
            // Add camera-active class for proper styling
            this.container.classList.add('camera-active');
            
            log('📱 Camera container setup complete');
        } else {
            console.error('❌ Missing elements for camera container setup');
        }
    }

    /**
     * Setup camera background rendering
     * This should only be called after video is ready and has metadata
     */
    setupCameraBackground() {
        const log = window.appDebugInfo || console.log;
        const ctx = this.canvas.getContext('2d');
        
        if (!ctx) {
            console.error('❌ Failed to get 2D canvas context');
            return;
        }
        
        // Ensure canvas has proper dimensions matching video
        const setCanvasDimensions = () => {
            if (this.video && this.video.videoWidth && this.video.videoHeight) {
                // Set intrinsic canvas dimensions to match video
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                
                log(`📐 Canvas dimensions set: ${this.canvas.width}x${this.canvas.height} (video: ${this.video.videoWidth}x${this.video.videoHeight})`);
                return true;
            } else {
                // Use reasonable fallback dimensions
                this.canvas.width = 1280;
                this.canvas.height = 720;
                console.warn('⚠️ Using fallback canvas dimensions - video not ready');
                return false;
            }
        };
        
        // Set initial dimensions
        setCanvasDimensions();
        
        // Ensure proper CSS styling for visibility
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.objectFit = 'cover';
        this.canvas.style.display = 'block';
        this.canvas.style.backgroundColor = 'black'; // Fallback background
        
        // Listen for video resize events and metadata changes
        const handleVideoResize = () => {
            if (setCanvasDimensions()) {
                log(`📐 Canvas resized: ${this.canvas.width}x${this.canvas.height}`);
            }
        };
        
        this.video.addEventListener('resize', handleVideoResize);
        this.video.addEventListener('loadedmetadata', handleVideoResize);
        
        // Store event handler for cleanup
        this.videoResizeHandler = handleVideoResize;

        // Frame counter for debugging
        let frameCount = 0;

        // Create robust frame drawing function with better error handling
        const drawFrame = () => {
            frameCount++;
            if (!this.video || !this.canvas || !ctx) {
                console.warn('🎨 Draw frame: Missing components', {
                    hasVideo: !!this.video,
                    hasCanvas: !!this.canvas,
                    hasCtx: !!ctx
                });
                return;
            }
            
            // Check if video is ready for drawing
            if (this.video.readyState < 2) {
                console.warn('🎨 Draw frame: Video not ready', {
                    readyState: this.video.readyState
                });
                return; // Video not ready yet
            }
            
            // Check if video has valid dimensions
            if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
                console.warn('🎨 Draw frame: Invalid video dimensions', {
                    width: this.video.videoWidth,
                    height: this.video.videoHeight
                });
                return; // Video dimensions not available
            }
            
            try {
                // Ensure canvas has proper dimensions before drawing
                if (this.canvas.width <= 0 || this.canvas.height <= 0) {
                    setCanvasDimensions();
                }
                
                // Only draw if we have valid dimensions
                if (this.canvas.width > 0 && this.canvas.height > 0) {
                    // Save context state
                    ctx.save();
                    
                    // Clear canvas with a black background
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    // Debug: Draw a test pattern first to verify canvas is working
                    if (frameCount % 600 === 0) { // Every 10 seconds at 60fps
                        console.log('🎨 Drawing test pattern to verify canvas...');
                        ctx.fillStyle = '#FF0000';
                        ctx.fillRect(10, 10, 100, 100);
                        ctx.fillStyle = '#00FF00';
                        ctx.fillRect(120, 10, 100, 100);
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '16px Arial';
                        ctx.fillText(`Frame ${frameCount}`, 10, 140);
                    }
                    
                    // Try to draw the video frame
                    try {
                        ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                        
                        // Debug log success occasionally
                        if (frameCount % 600 === 0) {
                            console.log('🎨 Video frame drawn successfully');
                        }
                    } catch (videoDrawError) {
                        console.warn('🎨 Video draw failed, drawing fallback pattern:', videoDrawError);
                        // Draw a fallback pattern to show the canvas is working
                        ctx.fillStyle = '#FF0000';
                        ctx.fillRect(10, 10, 100, 100);
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '16px Arial';
                        ctx.fillText('Video Draw Error', 10, 140);
                        ctx.fillText(videoDrawError.message, 10, 160);
                    }
                    
                    // Restore context state
                    ctx.restore();
                }
            } catch (error) {
                console.warn('⚠️ Frame drawing error:', error);
                // Draw a fallback pattern to show the canvas is working
                try {
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(10, 10, 100, 100);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '16px Arial';
                    ctx.fillText('Canvas Error', 10, 140);
                } catch (fallbackError) {
                    console.error('❌ Even fallback drawing failed:', fallbackError);
                }
            }
        };

        this.backgroundRenderLoop = drawFrame;
        
        // Test draw immediately to verify canvas is working
        log('🎨 Testing initial canvas draw...');
        try {
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(0, 0, 50, 50);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.fillText('Canvas Ready', 60, 30);
            log('✅ Canvas test draw successful');
        } catch (testError) {
            console.error('❌ Canvas test draw failed:', testError);
        }
        
        // Immediately call the draw function once to verify it works
        log('🎨 Testing initial video draw...');
        try {
            drawFrame();
            log('✅ Initial video draw test successful');
        } catch (drawError) {
            console.error('❌ Initial video draw test failed:', drawError);
        }
        
        // Start a simple direct animation loop for background rendering
        log('🎬 Starting direct background render loop...');
        const startBackgroundLoop = () => {
            let backgroundFrameCount = 0;
            let isRunning = true;
            
            const backgroundAnimate = () => {
                if (isRunning && this.video && this.canvas) {
                    backgroundFrameCount++;
                    
                    // Call the draw function
                    try {
                        drawFrame();
                        
                        // Log every 300 frames (every 5 seconds at 60fps)
                        if (backgroundFrameCount % 300 === 0) {
                            log(`🎨 Direct background frame ${backgroundFrameCount} rendered`);
                        }
                    } catch (error) {
                        console.warn('⚠️ Direct background render error:', error);
                    }
                    
                    // Continue the loop
                    requestAnimationFrame(backgroundAnimate);
                } else if (!isRunning) {
                    log('🛑 Direct background render loop stopped');
                } else if (!this.video || !this.canvas) {
                    console.warn('⚠️ Direct background render: missing video or canvas');
                }
            };
            
            // Store the stop function for cleanup
            this.stopBackgroundLoop = () => {
                isRunning = false;
            };
            
            // Start the background loop
            backgroundAnimate();
            log('✅ Direct background render loop started');
        };
        
        // Start the background loop immediately
        startBackgroundLoop();
        
        log('✅ Camera background setup complete');
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
        if (this.renderLoopActive) {
            console.warn('⚠️ Render loop already active');
            return;
        }
        
        this.renderLoopActive = true;
        let renderFrameCount = 0;
        
        const animate = () => {
            if (this.isActive && this.renderLoopActive) {
                requestAnimationFrame(animate);
                renderFrameCount++;
                
                // Render camera background first (if available)
                if (this.backgroundRenderLoop) {
                    try {
                        this.backgroundRenderLoop();
                        
                        // Log every 60 frames to verify background rendering is working
                        if (renderFrameCount % 60 === 0) {
                            const log = window.appDebugInfo || console.log;
                            log(`🎨 Background rendered frame ${renderFrameCount}`);
                        }
                    } catch (renderError) {
                        console.warn('⚠️ Background render error:', renderError);
                    }
                } else {
                    // Log if backgroundRenderLoop is missing
                    if (renderFrameCount % 60 === 0) {
                        console.warn('⚠️ No backgroundRenderLoop function available at frame', renderFrameCount);
                    }
                }
                
                // Then render 3D scene on top
                if (this.renderer && this.scene && this.camera) {
                    try {
                        // Update gyroscope gizmo with fallback animation if no device orientation
                        if (this.gyroGizmo && this.gyroData) {
                            // If no real gyro data is coming in, provide a gentle animation
                            if (this.gyroData.alpha === 0 && this.gyroData.beta === 0 && this.gyroData.gamma === 0) {
                                const time = Date.now() * 0.001;
                                this.gyroGizmo.rotation.y = Math.sin(time) * 0.3;
                                this.gyroGizmo.rotation.x = Math.cos(time * 0.7) * 0.2;
                                
                                // Update debug panel for fallback mode
                                if (this.gyroDebugDiv && renderFrameCount % 30 === 0) {
                                    this.gyroDebugDiv.innerHTML = `
                                        <div>🧭 GYROSCOPE GIZMO</div>
                                        <div style="color: #ffaa00;">Status: Demo Mode</div>
                                        <div>Alpha (Z): ${(Math.sin(time) * 30).toFixed(1)}°</div>
                                        <div>Beta (X): ${(Math.cos(time * 0.7) * 20).toFixed(1)}°</div>
                                        <div>Gamma (Y): 0.0°</div>
                                        <div style="font-size: 10px; color: #888;">No device motion detected</div>
                                    `;
                                }
                            }
                        }
                        
                        this.renderer.render(this.scene, this.camera);
                        
                        // Log Three.js scene info occasionally
                        if (renderFrameCount % 300 === 0) {
                            const log = window.appDebugInfo || console.log;
                            log(`🎬 Three.js scene rendered (frame ${renderFrameCount}), objects: ${this.scene.children.length}`);
                        }
                    } catch (threeError) {
                        console.warn('⚠️ Three.js render error:', threeError);
                    }
                }
                
                // Call frame callback if set
                if (this.frameCallback) {
                    try {
                        this.frameCallback();
                    } catch (callbackError) {
                        console.warn('⚠️ Frame callback error:', callbackError);
                    }
                }
            }
        };
        
        // Start the animation loop
        animate();
        
        const log = window.appDebugInfo || console.log;
        log('🎬 Render loop started');
    }

    /**
     * Stop camera session
     */
    stop() {
        const log = window.appDebugInfo || console.log;
        const success = window.appDebugSuccess || console.log;
        
        log('⏹️ Stopping camera session...');
        
        // Stop render loop
        this.renderLoopActive = false;
        this.isActive = false;

        // Stop camera stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Clean up video element and event listeners
        if (this.video) {
            // Remove video event listeners
            if (this.videoResizeHandler) {
                this.video.removeEventListener('resize', this.videoResizeHandler);
                this.video.removeEventListener('loadedmetadata', this.videoResizeHandler);
                this.videoResizeHandler = null;
            }
            
            this.video.srcObject = null;
            this.video = null;
        }
        
        // Clear background render loop
        this.backgroundRenderLoop = null;
        
        // Stop direct background loop if it exists
        if (this.stopBackgroundLoop) {
            this.stopBackgroundLoop();
            this.stopBackgroundLoop = null;
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
     * Run comprehensive camera diagnostics
     */
    async debugCameraCapabilities() {
        const log = window.appDebugInfo || console.log;
        const error = window.appDebugError || console.error;
        
        log('🔍 === CAMERA DIAGNOSTICS START ===');
        
        // Check basic browser support
        log(`📱 Navigator.mediaDevices available: ${!!navigator.mediaDevices}`);
        log(`📱 getUserMedia available: ${!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)}`);
        log(`📱 User agent: ${navigator.userAgent}`);
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            error('❌ Camera API not supported in this browser');
            return { supported: false, reason: 'Camera API not supported' };
        }
        
        // Try to enumerate devices
        try {
            if (navigator.mediaDevices.enumerateDevices) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === 'videoinput');
                
                log(`📹 Total devices found: ${devices.length}`);
                log(`📹 Video input devices: ${videoDevices.length}`);
                
                videoDevices.forEach((device, index) => {
                    log(`📹 Device ${index + 1}: ${device.label || 'Unknown'} (${device.deviceId.substring(0, 8)}...)`);
                });
                
                if (videoDevices.length === 0) {
                    error('❌ No video input devices found');
                    return { supported: false, reason: 'No camera devices detected' };
                }
            } else {
                log('⚠️ Device enumeration not supported');
            }
        } catch (enumError) {
            error(`❌ Device enumeration failed: ${enumError.message}`);
        }
        
        // Skip camera access test to avoid duplicate permission requests
        // The actual camera test will happen when start() is called
        log('📹 Skipping camera access test to avoid duplicate permission requests');
        log('📹 Camera support will be tested when session starts');
        
        log('🔍 === CAMERA DIAGNOSTICS END ===');
        return { supported: true };
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
     * Set callback function to be called when camera permission is granted
     */
    setPermissionGrantedCallback(callback) {
        this.onPermissionGranted = callback;
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