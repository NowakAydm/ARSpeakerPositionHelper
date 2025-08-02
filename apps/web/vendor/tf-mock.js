/**
 * Minimal TensorFlow.js mock for ARSpeakerPositionHelper
 * Provides basic detection functionality without actual AI models
 */
window.tf = {
    ready: function() {
        return Promise.resolve();
    },
    loadLayersModel: function(url) {
        return Promise.resolve({
            predict: function(tensor) {
                // Mock prediction - return empty array
                return [];
            }
        });
    },
    browser: {
        fromPixels: function(imageElement) {
            return {
                expandDims: function() {
                    return {
                        dispose: function() {}
                    };
                }
            };
        }
    }
};

window.cocoSsd = {
    load: function() {
        return Promise.resolve({
            detect: function(imageElement) {
                // Mock detection - return empty array (no objects detected)
                return Promise.resolve([]);
            }
        });
    }
};

console.log('✅ TensorFlow.js mock loaded successfully');