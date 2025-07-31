/**
 * Object Detection Module using TensorFlow.js
 * Detects speakers and box-like objects in AR camera feed
 */

import * as tf from '@tensorflow/tfjs';

export class ObjectDetection {
    constructor() {
        this.model = null;
        this.isLoaded = false;
        this.detectionThreshold = 0.5;
        this.videoElement = null;
        this.isDetecting = false;
        this.detectionCallbacks = [];
    }

    /**
     * Load TensorFlow.js object detection model
     */
    async loadModel() {
        try {
            console.log('🤖 Loading TensorFlow.js model...');
            
            // Set backend to webgl for better performance
            await tf.setBackend('webgl');
            await tf.ready();
            
            // Load COCO-SSD model for object detection
            const cocoSsd = await import('@tensorflow-models/coco-ssd');
            this.model = await cocoSsd.load({
                base: 'mobilenet_v2' // Optimized for mobile devices
            });
            
            this.isLoaded = true;
            console.log('✅ Object detection model loaded');
            console.log('📊 TensorFlow.js backend:', tf.getBackend());
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to load detection model:', error);
            throw error;
        }
    }

    /**
     * Initialize detection with video element
     */
    async initializeDetection(videoElement) {
        if (!this.isLoaded) {
            await this.loadModel();
        }
        
        this.videoElement = videoElement;
        console.log('📹 Detection initialized with video element');
    }

    /**
     * Start continuous object detection
     */
    startDetection() {
        if (!this.isLoaded || !this.videoElement || this.isDetecting) {
            console.warn('⚠️ Cannot start detection - model not loaded or already detecting');
            return;
        }

        this.isDetecting = true;
        console.log('🔍 Starting object detection...');
        this.detectLoop();
    }

    /**
     * Stop object detection
     */
    stopDetection() {
        this.isDetecting = false;
        console.log('⏹️ Object detection stopped');
    }

    /**
     * Continuous detection loop
     */
    async detectLoop() {
        if (!this.isDetecting || !this.videoElement) return;

        try {
            const predictions = await this.detectObjects(this.videoElement);
            const speakers = this.filterSpeakers(predictions);
            
            // Emit detection results to callbacks
            this.emitDetection(speakers, predictions);
            
        } catch (error) {
            console.error('❌ Detection loop error:', error);
        }

        // Continue detection loop
        if (this.isDetecting) {
            requestAnimationFrame(() => this.detectLoop());
        }
    }

    /**
     * Detect objects in video frame
     */
    async detectObjects(videoElement) {
        if (!this.isLoaded || !this.model) {
            console.warn('⚠️ Model not loaded yet');
            return [];
        }

        try {
            // Perform object detection
            const predictions = await this.model.detect(videoElement);
            
            // Filter predictions by confidence threshold
            return predictions.filter(prediction => 
                prediction.score >= this.detectionThreshold
            );
            
        } catch (error) {
            console.error('❌ Object detection failed:', error);
            return [];
        }
    }

    /**
     * Filter predictions to find speaker-like objects
     */
    filterSpeakers(predictions) {
        const speakerClasses = [
            'book',           // Rectangular objects that could be speakers
            'laptop',         // Electronic devices
            'tv',            // Large electronics/monitors
            'microwave',     // Box-like appliances
            'refrigerator',  // Large box-like objects
            'cell phone',    // Small electronics
            'clock',         // Small rectangular objects
            'vase'           // Cylindrical objects that could be speakers
        ];

        const speakers = predictions.filter(prediction => {
            const className = prediction.class.toLowerCase();
            return speakerClasses.some(speakerClass => 
                className.includes(speakerClass)
            );
        });

        // Sort by confidence score
        return speakers.sort((a, b) => b.score - a.score);
    }

    /**
     * Convert detection bounding box to 3D AR coordinates
     */
    boundingBoxToAR(bbox, videoWidth, videoHeight, cameraDistance = 2.0) {
        // Calculate center of bounding box
        const centerX = bbox[0] + bbox[2] / 2;
        const centerY = bbox[1] + bbox[3] / 2;
        
        // Normalize to -1 to 1 range
        const normalizedX = (centerX / videoWidth) * 2 - 1;
        const normalizedY = 1 - (centerY / videoHeight) * 2; // Flip Y axis
        
        // Estimate depth based on bounding box size
        const boxArea = bbox[2] * bbox[3];
        const normalizedArea = boxArea / (videoWidth * videoHeight);
        const estimatedDistance = Math.max(1.0, 5.0 - (normalizedArea * 10));
        
        return {
            position: {
                x: normalizedX * cameraDistance * 0.8, // Scale factor for AR space
                y: normalizedY * cameraDistance * 0.6,
                z: -estimatedDistance
            },
            size: {
                width: (bbox[2] / videoWidth) * 2,
                height: (bbox[3] / videoHeight) * 2,
                depth: 0.3  // Estimated depth
            },
            confidence: 0 // Will be set by caller
        };
    }

    /**
     * Convert detection to AR object with position and metadata
     */
    detectionsToARObjects(detections, videoWidth, videoHeight) {
        return detections.map((detection, index) => {
            const arData = this.boundingBoxToAR(
                detection.bbox, 
                videoWidth, 
                videoHeight
            );
            
            return {
                id: `speaker_${Date.now()}_${index}`,
                type: 'speaker',
                class: detection.class,
                confidence: detection.score,
                bbox: detection.bbox,
                position: arData.position,
                size: arData.size,
                timestamp: Date.now()
            };
        });
    }

    /**
     * Add detection callback
     */
    onDetection(callback) {
        this.detectionCallbacks.push(callback);
    }

    /**
     * Remove detection callback
     */
    removeDetectionCallback(callback) {
        const index = this.detectionCallbacks.indexOf(callback);
        if (index > -1) {
            this.detectionCallbacks.splice(index, 1);
        }
    }

    /**
     * Emit detection results to callbacks
     */
    emitDetection(speakers, allDetections) {
        const detectionData = {
            speakers,
            allDetections,
            speakerCount: speakers.length,
            timestamp: Date.now()
        };

        this.detectionCallbacks.forEach(callback => {
            try {
                callback(detectionData);
            } catch (error) {
                console.error('❌ Error in detection callback:', error);
            }
        });
    }

    /**
     * Set detection sensitivity
     */
    setThreshold(threshold) {
        this.detectionThreshold = Math.max(0.1, Math.min(1.0, threshold));
        console.log(`🎯 Detection threshold set to: ${this.detectionThreshold}`);
    }

    /**
     * Get detection statistics
     */
    getStats() {
        return {
            isLoaded: this.isLoaded,
            isDetecting: this.isDetecting,
            threshold: this.detectionThreshold,
            backend: tf.getBackend(),
            memory: tf.memory()
        };
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.stopDetection();
        
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
        
        this.detectionCallbacks = [];
        this.isLoaded = false;
        
        console.log('🧹 Object detection disposed');
    }
}

export default ObjectDetection;