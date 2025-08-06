/**
 * Simple 3D Measurement Tool
 * Places two points in 3D space and measures distance between them
 */

export class SimpleMeasurementTool {
    constructor() {
        this.points = [];
        this.line = null;
        this.isActive = false;
        this.scene = null;
        this.camera = null;
        this.container = null;
        this.raycaster = null;
        this.plane = null;
        this.onMeasurementComplete = null;
        
        // Visual settings
        this.pointSize = 0.05;
        this.pointColor = 0x00ff00; // Green points
        this.lineColor = 0xffff00; // Yellow line
        
        this.setupRaycaster();
    }

    /**
     * Initialize the measurement tool with Three.js scene
     */
    initialize(scene, camera, container) {
        console.log('📏 Initializing simple measurement tool...');
        
        this.scene = scene;
        this.camera = camera;
        this.container = container;
        
        // Create reference plane for point placement
        this.createReferencePlane();
        
        console.log('✅ Simple measurement tool initialized');
    }

    /**
     * Setup raycaster for screen-to-world coordinate conversion
     */
    setupRaycaster() {
        if (window.THREE) {
            this.raycaster = new window.THREE.Raycaster();
        }
    }

    /**
     * Create invisible reference plane for point placement
     */
    createReferencePlane() {
        if (!window.THREE || !this.scene) return;
        
        // Create a large invisible plane at ground level
        const planeGeometry = new window.THREE.PlaneGeometry(20, 20);
        const planeMaterial = new window.THREE.MeshBasicMaterial({ 
            visible: false,
            transparent: true,
            opacity: 0 
        });
        
        this.plane = new window.THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        this.plane.position.y = 0; // Ground level
        
        this.scene.add(this.plane);
    }

    /**
     * Activate measurement mode
     */
    activate() {
        this.isActive = true;
        console.log('📏 Measurement tool activated');
        
        // Add click event listener
        if (this.container) {
            this.container.addEventListener('click', this.handleClick.bind(this));
            this.container.style.cursor = 'crosshair';
        }
    }

    /**
     * Deactivate measurement mode
     */
    deactivate() {
        this.isActive = false;
        console.log('📏 Measurement tool deactivated');
        
        // Remove click event listener
        if (this.container) {
            this.container.removeEventListener('click', this.handleClick.bind(this));
            this.container.style.cursor = 'default';
        }
    }

    /**
     * Handle click events for point placement
     */
    handleClick(event) {
        if (!this.isActive || !this.raycaster || !this.camera || !this.plane) return;
        if (this.points.length >= 2) return; // Only allow 2 points
        
        // Calculate mouse position in normalized device coordinates
        const rect = this.container.getBoundingClientRect();
        const mouse = new window.THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Cast ray from camera through mouse position
        this.raycaster.setFromCamera(mouse, this.camera);
        
        // Find intersection with reference plane
        const intersects = this.raycaster.intersectObject(this.plane);
        
        if (intersects.length > 0) {
            const worldPosition = intersects[0].point;
            this.placePoint(worldPosition);
            
            console.log(`📍 Point ${this.points.length} placed at: (${worldPosition.x.toFixed(2)}, ${worldPosition.y.toFixed(2)}, ${worldPosition.z.toFixed(2)})`);
            
            // If we have 2 points, create line and calculate distance
            if (this.points.length === 2) {
                this.createLine();
                this.calculateDistance();
                this.deactivate(); // Auto-deactivate after measurement complete
            }
        }
    }

    /**
     * Place a measurement point at the given world position
     */
    placePoint(position) {
        if (!window.THREE || !this.scene) return;
        
        // Create point geometry and mesh
        const pointGeometry = new window.THREE.SphereGeometry(this.pointSize, 16, 16);
        const pointMaterial = new window.THREE.MeshBasicMaterial({ 
            color: this.pointColor,
            transparent: true,
            opacity: 0.9
        });
        const pointMesh = new window.THREE.Mesh(pointGeometry, pointMaterial);
        pointMesh.position.copy(position);
        
        // Store point data
        const pointData = {
            position: position.clone(),
            mesh: pointMesh
        };
        
        this.points.push(pointData);
        this.scene.add(pointMesh);
        
        console.log(`✅ Point ${this.points.length} placed successfully`);
    }

    /**
     * Create a line between the two points
     */
    createLine() {
        if (!window.THREE || !this.scene || this.points.length !== 2) return;

        const point1 = this.points[0].position;
        const point2 = this.points[1].position;
        
        // Create line geometry
        const lineGeometry = new window.THREE.BufferGeometry().setFromPoints([point1, point2]);
        const lineMaterial = new window.THREE.LineBasicMaterial({ 
            color: this.lineColor,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        
        this.line = new window.THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(this.line);
        
        console.log('📏 Line created between points');
    }

    /**
     * Calculate and return distance between the two points
     */
    calculateDistance() {
        if (this.points.length !== 2) return 0;

        const point1 = this.points[0].position;
        const point2 = this.points[1].position;
        
        const distance = point1.distanceTo(point2);
        
        console.log(`📏 Distance calculated: ${distance.toFixed(3)} units`);
        
        // Trigger callback if set
        if (this.onMeasurementComplete) {
            this.onMeasurementComplete(distance);
        }
        
        return distance;
    }

    /**
     * Format distance for display
     */
    formatDistance(distance) {
        if (distance < 1) {
            return `${(distance * 100).toFixed(1)} cm`;
        } else {
            return `${distance.toFixed(2)} m`;
        }
    }

    /**
     * Clear all measurement points and line
     */
    clear() {
        if (!this.scene) return;
        
        // Remove points
        this.points.forEach(pointData => {
            this.scene.remove(pointData.mesh);
            if (pointData.mesh.geometry) pointData.mesh.geometry.dispose();
            if (pointData.mesh.material) pointData.mesh.material.dispose();
        });
        
        // Remove line
        if (this.line) {
            this.scene.remove(this.line);
            if (this.line.geometry) this.line.geometry.dispose();
            if (this.line.material) this.line.material.dispose();
            this.line = null;
        }
        
        this.points = [];
        console.log('🧹 Measurement cleared');
    }

    /**
     * Get current measurement data
     */
    getMeasurement() {
        if (this.points.length !== 2) {
            return null;
        }
        
        const distance = this.calculateDistance();
        return {
            point1: this.points[0].position,
            point2: this.points[1].position,
            distance: distance,
            formattedDistance: this.formatDistance(distance)
        };
    }
}