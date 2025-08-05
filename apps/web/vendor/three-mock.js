/**
 * Minimal THREE.js mock for ARSpeakerPositionHelper
 * Provides basic classes needed for camera session functionality
 */
window.THREE = {
    Scene: function() {
        this.children = [];
        this.add = function(object) {
            this.children.push(object);
        };
        this.remove = function(object) {
            const index = this.children.indexOf(object);
            if (index > -1) {
                this.children.splice(index, 1);
            }
        };
    },
    
    PerspectiveCamera: function(fov, aspect, near, far) {
        this.fov = fov || 75;
        this.aspect = aspect || 1;
        this.near = near || 0.1;
        this.far = far || 1000;
        this.position = { x: 0, y: 0, z: 0, set: function(x, y, z) { this.x = x; this.y = y; this.z = z; } };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.updateProjectionMatrix = function() {};
    },
    
    WebGLRenderer: function(options) {
        options = options || {};
        this.domElement = document.createElement('canvas');
        this.domElement.style.position = 'absolute';
        this.domElement.style.top = '0';
        this.domElement.style.left = '0';
        this.domElement.style.zIndex = '2';
        
        this.setPixelRatio = function(ratio) {};
        this.setSize = function(width, height) {
            this.domElement.width = width;
            this.domElement.height = height;
            this.domElement.style.width = width + 'px';
            this.domElement.style.height = height + 'px';
        };
        this.setClearColor = function(color, alpha) {};
        this.render = function(scene, camera) {
            // Mock render - just clear the canvas
            const ctx = this.domElement.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, this.domElement.width, this.domElement.height);
                // Draw a simple crosshair for targeting
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const centerX = this.domElement.width / 2;
                const centerY = this.domElement.height / 2;
                const size = 20;
                ctx.moveTo(centerX - size, centerY);
                ctx.lineTo(centerX + size, centerY);
                ctx.moveTo(centerX, centerY - size);
                ctx.lineTo(centerX, centerY + size);
                ctx.stroke();
            }
        };
    },
    
    AmbientLight: function(color, intensity) {
        this.color = color || 0xffffff;
        this.intensity = intensity || 1;
    },
    
    DirectionalLight: function(color, intensity) {
        this.color = color || 0xffffff;
        this.intensity = intensity || 1;
        this.position = { x: 0, y: 0, z: 0, set: function(x, y, z) { this.x = x; this.y = y; this.z = z; } };
    },
    
    RingGeometry: function(innerRadius, outerRadius, thetaSegments) {
        this.innerRadius = innerRadius || 0;
        this.outerRadius = outerRadius || 1;
        this.thetaSegments = thetaSegments || 8;
    },
    
    MeshBasicMaterial: function(options) {
        options = options || {};
        this.color = options.color || 0xffffff;
        this.transparent = options.transparent || false;
        this.opacity = options.opacity || 1;
    },
    
    Mesh: function(geometry, material) {
        this.geometry = geometry;
        this.material = material;
        this.position = { x: 0, y: 0, z: 0, set: function(x, y, z) { this.x = x; this.y = y; this.z = z; } };
        this.rotation = { x: 0, y: 0, z: 0 };
    },
    
    Vector2: function(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    },
    
    Vector3: function(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.clone = function() {
            return new window.THREE.Vector3(this.x, this.y, this.z);
        };
        this.add = function(vector) {
            this.x += vector.x;
            this.y += vector.y;
            this.z += vector.z;
            return this;
        };
        this.multiplyScalar = function(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            this.z *= scalar;
            return this;
        };
    },
    
    Raycaster: function() {
        this.ray = {
            direction: new window.THREE.Vector3(0, 0, -1)
        };
        this.setFromCamera = function(mouse, camera) {
            // Simplified raycasting calculation
            this.ray.direction.x = mouse.x;
            this.ray.direction.y = -mouse.y;
            this.ray.direction.z = -1;
        };
        this.intersectObjects = function(objects) {
            // Mock intersection results
            return [{
                point: new window.THREE.Vector3(0, 0, -2),
                distance: 2
            }];
        };
    },
    
    Group: function() {
        this.children = [];
        this.position = { x: 0, y: 0, z: 0, set: function(x, y, z) { this.x = x; this.y = y; this.z = z; } };
        this.rotation = { x: 0, y: 0, z: 0, set: function(x, y, z) { this.x = x; this.y = y; this.z = z; } };
        this.scale = { x: 1, y: 1, z: 1, set: function(x, y, z) { this.x = x; this.y = y; this.z = z; } };
        this.add = function(object) {
            this.children.push(object);
        };
        this.remove = function(object) {
            const index = this.children.indexOf(object);
            if (index > -1) this.children.splice(index, 1);
        };
    },
    
    PlaneGeometry: function(width, height) {
        this.width = width || 1;
        this.height = height || 1;
        this.dispose = function() {};
    },
    
    SphereGeometry: function(radius, widthSegments, heightSegments) {
        this.radius = radius || 1;
        this.widthSegments = widthSegments || 8;
        this.heightSegments = heightSegments || 6;
        this.dispose = function() {};
    },
    
    LineBasicMaterial: function(options) {
        options = options || {};
        this.color = options.color || 0xffffff;
        this.linewidth = options.linewidth || 1;
        this.transparent = options.transparent || false;
        this.opacity = options.opacity || 1;
        this.dispose = function() {};
    },
    
    BufferGeometry: function() {
        this.setAttribute = function(name, attribute) {};
        this.dispose = function() {};
    },
    
    Float32BufferAttribute: function(array, itemSize) {
        this.array = array;
        this.itemSize = itemSize;
    },
    
    Line: function(geometry, material) {
        this.geometry = geometry;
        this.material = material;
        this.position = { x: 0, y: 0, z: 0, set: function(x, y, z) { this.x = x; this.y = y; this.z = z; } };
    }
};

console.log('✅ THREE.js mock loaded successfully');