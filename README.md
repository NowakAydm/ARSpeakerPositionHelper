# AR Speaker Position Helper

A production-ready mobile web app that leverages AR to detect speaker outlines automatically, allows user interaction via tapping, and helps create an equilateral triangle for optimal listening positioning.

## Features

- **AR Object Detection**: Automatically detect speaker outlines using TensorFlow.js
- **Interactive Positioning**: Allow users to tap and set their listening position in AR space
- **Optimal Triangle Guidance**: Calculate and visualize an equilateral triangle for ideal listening position
- **Mobile-First Design**: Responsive web app optimized for mobile AR experiences
- **WebXR Integration**: Modern AR capabilities using WebXR and three.js

## Architecture

### Technology Stack
- **AR Framework**: WebXR + three.js for AR scene rendering
- **Object Detection**: TensorFlow.js with pre-trained COCO SSD model
- **Build System**: Modern ES modules with development scripts
- **UI/UX**: Mobile-first responsive design with touch interactions

### Project Structure
```
├── src/
│   ├── app.js              # Main application entry point
│   ├── styles.css          # Mobile-responsive styles
│   ├── modules/
│   │   ├── ar-session.js   # WebXR AR session management
│   │   ├── detection.js    # TensorFlow.js object detection
│   │   ├── interaction.js  # User input and touch handling
│   │   └── triangle.js     # Equilateral triangle calculations
├── index.html              # Main HTML entry point
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## Development Roadmap

### Phase 1: Foundation (Current)
- [x] Project scaffolding and structure
- [x] README with roadmap and architecture
- [x] Basic HTML, JS, and CSS setup
- [x] package.json with dependencies

### Phase 2: AR Foundation
- [x] WebXR AR session boilerplate
- [x] Basic AR camera feed with three.js scene rendering
- [x] AR coordinate system setup

### Phase 3: Object Detection
- [x] TensorFlow.js integration
- [x] Speaker detection using pre-trained models
- [x] AR space mapping for detected objects

### Phase 4: User Interaction
- [x] Touch interaction in AR space
- [x] Visual feedback for marker placement
- [x] Listening position setting

### Phase 5: Triangle Guidance
- [x] Equilateral triangle calculation
- [x] Visual triangle overlay in AR
- [x] Real-time position adjustment feedback

### Phase 6: UX Enhancement
- [x] Intuitive UI controls and instructions
- [x] Error handling and fallbacks
- [x] Performance optimization for mobile

### Phase 7: Production Ready
- [x] PWA setup for offline capability
- [x] HTTPS deployment preparation
- [x] Cross-device testing and optimization

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Start with HTTPS (required for AR)**:
   ```bash
   npm run start:https
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Deploy to production**:
   ```bash
   # Netlify
   npm run deploy:netlify
   
   # Vercel
   npm run deploy:vercel
   ```

## Testing & Validation

- **Lighthouse audit**: `npm run test:lighthouse`
- **PWA validation**: `npm run validate`
- **Cross-device testing**: Use browser dev tools device emulation
- **AR testing**: Requires HTTPS and physical device with camera

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions including:
- HTTPS setup requirements
- Hosting platform recommendations
- Security headers configuration
- Performance optimization tips

## Requirements

- **HTTPS**: Required for WebXR and camera access
- **Modern Browser**: Chrome/Edge/Firefox with WebXR support
- **Mobile Device**: Optimized for mobile AR experiences
- **Camera Permission**: Required for AR functionality

## Browser Support

| Browser | Android | iOS | Desktop |
|---------|---------|-----|---------|
| Chrome 90+ | ✅ | ❌ | ⚠️ (Limited AR) |
| Safari 14+ | ❌ | ✅ | ❌ |
| Firefox 85+ | ⚠️ (Experimental) | ❌ | ❌ |
| Edge 90+ | ✅ | ❌ | ⚠️ (Limited AR) |

## Features

### Core Functionality
- ✅ **WebXR AR Sessions**: Full immersive AR with hit testing
- ✅ **Object Detection**: TensorFlow.js-powered speaker detection
- ✅ **Interactive Positioning**: Touch-to-place position setting
- ✅ **Triangle Calculation**: Real-time optimal positioning guidance
- ✅ **Visual Feedback**: AR overlays with quality indicators

### Progressive Web App
- ✅ **Offline Support**: Service worker with intelligent caching
- ✅ **Installable**: Add to home screen functionality
- ✅ **Responsive Design**: Mobile-first with tablet/desktop support
- ✅ **Performance Monitoring**: Built-in FPS and memory tracking
- ✅ **Error Handling**: Graceful fallbacks and user guidance

### Developer Experience
- ✅ **Modular Architecture**: Clean separation of concerns
- ✅ **ES6 Modules**: Modern JavaScript with import/export
- ✅ **Build Tools**: Linting, minification, and deployment scripts
- ✅ **Testing**: Lighthouse integration and validation tools

## Contributing

This project follows a modular architecture for maintainability. Each feature is isolated in its own module with clear interfaces.

## License

GNU General Public License v3.0 - see [LICENSE](LICENSE) file for details.