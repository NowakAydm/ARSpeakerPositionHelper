# Camera Speaker Position Helper

A production-ready mobile web app that leverages camera-based tracking to detect speaker outlines automatically, allows user interaction via tapping, and helps create an equilateral triangle for optimal listening positioning.

## Features

- **Camera Object Detection**: Automatically detect speaker outlines using TensorFlow.js
- **Interactive Positioning**: Allow users to tap and set their listening position in camera space
- **Optimal Triangle Guidance**: Calculate and visualize an equilateral triangle for ideal listening position
- **Mobile-First Design**: Responsive web app optimized for mobile camera experiences
- **Camera Integration**: Modern camera capabilities using getUserMedia and three.js

## Architecture

### Technology Stack
- **Camera Framework**: getUserMedia + three.js for camera overlay rendering
- **Object Detection**: TensorFlow.js with pre-trained COCO SSD model
- **Build System**: Modern ES modules with development scripts
- **UI/UX**: Mobile-first responsive design with touch interactions

### Project Structure
```
├── apps/
│   └── web/                 # Main camera web application
│       ├── src/
│       │   ├── app.js       # Main application entry point
│       │   ├── styles.css   # Mobile-responsive styles
│       │   └── modules/
│       │       ├── camera-session.js   # Camera session management
│       │       ├── detection.js        # TensorFlow.js object detection
│       │       ├── interaction.js  # User input and touch handling
│       │       └── triangle.js     # Equilateral triangle calculations
│       ├── index.html       # Main HTML entry point
│       ├── manifest.json    # PWA manifest
│       └── package.json     # App dependencies
├── packages/                # Shared packages (future expansion)
├── turbo.json              # Turborepo configuration
├── package.json            # Root workspace configuration
└── README.md               # This file
```

## Development Roadmap

### Phase 1: Foundation (Current)
- [x] Project scaffolding and structure
- [x] README with roadmap and architecture
- [x] Basic HTML, JS, and CSS setup
- [x] package.json with dependencies

### Phase 2: Camera Foundation
- [x] Camera session boilerplate using getUserMedia
- [x] Basic camera feed with three.js scene overlay
- [x] Camera coordinate system setup

### Phase 3: Object Detection
- [x] TensorFlow.js integration
- [x] Speaker detection using pre-trained models
- [x] Camera space mapping for detected objects

### Phase 4: User Interaction
- [x] Touch interaction in camera space
- [x] Visual feedback for marker placement
- [x] Listening position setting

### Phase 5: Triangle Guidance
- [x] Equilateral triangle calculation
- [x] Visual triangle overlay in camera view
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

3. **Start with HTTPS (required for camera access)**:
   ```bash
   cd apps/web && npm run start:https
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Deploy to production**:
   ```bash
   # Render.com (recommended)
   npm run deploy:render
   
   # Netlify
   npm run deploy:netlify
   
   # Vercel
   npm run deploy:vercel
   ```

## Render.com Deployment

This project is optimized for deployment on Render.com's free tier. Follow these steps for deployment:

### Render.com Static Site Configuration

1. **Connect your GitHub repository** to Render.com
2. **Create a new Static Site** with the following configuration:

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `apps/web/dist` |
| **Node Version** | `18` |

### Environment Variables

No environment variables are required for basic functionality. All configuration is handled client-side.

### Advanced Configuration (Optional)

For custom domain and enhanced features:

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (for static sites, this is handled by Render) | `8080` |

### Deployment Steps

1. **Fork or clone** this repository to your GitHub account
2. **Connect to Render.com**:
   - Go to [Render.com](https://render.com)
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
3. **Configure the deployment**:
   - **Repository**: Select your forked repository
   - **Branch**: `main` (or your deployment branch)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `apps/web/dist`
4. **Deploy**: Click "Create Static Site"

### Automatic Deployments

Render.com will automatically deploy when you push to your connected branch. The build process:

1. Installs dependencies using `npm install`
2. Runs the build command via Turborepo: `npm run build`
3. Copies built files to the publish directory: `apps/web/dist`
4. Serves the static files with HTTPS (required for AR functionality)

### Troubleshooting Render.com Deployment

- **Build fails**: Ensure Node.js version is set to 18 or higher
- **AR not working**: Verify the site is served over HTTPS (Render provides this automatically)
- **Performance issues**: Enable caching headers in Render dashboard settings
- **Assets not loading**: Check that all paths are relative in the built files

## Turborepo Integration

This project uses [Turborepo](https://turbo.build/) for optimized builds and task execution:

### Benefits
- **Parallel task execution**: Build, lint, and test tasks run in parallel when possible
- **Intelligent caching**: Turbo caches task outputs and skips work when inputs haven't changed
- **Optimized for CI/CD**: Faster builds in deployment environments like Render.com

### Commands
- `npm run dev` - Start development servers for all apps
- `npm run build` - Build all apps for production
- `npm run lint` - Lint all code
- `npm run test` - Run all tests
- `npm run clean` - Clean all build artifacts

### Monorepo Structure
```
├── apps/
│   └── web/                 # Main AR web application
│       ├── src/             # Application source code
│       ├── dist/            # Built files (generated)
│       └── package.json     # App-specific dependencies
├── packages/                # Shared packages (future expansion)
├── turbo.json              # Turborepo configuration
└── package.json            # Root workspace configuration
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

- **HTTPS**: Required for camera access
- **Modern Browser**: Chrome/Edge/Firefox/Safari with camera support
- **Mobile Device**: Optimized for mobile camera experiences
- **Camera Permission**: Required for camera functionality

## Browser Support

| Browser | Android | iOS | Desktop |
|---------|---------|-----|---------|
| Chrome 90+ | ✅ | ✅ | ✅ |
| Safari 14+ | ✅ | ✅ | ✅ |
| Firefox 85+ | ✅ | ✅ | ✅ |
| Edge 90+ | ✅ | ✅ | ✅ |

## Features

### Core Functionality
- ✅ **Camera Sessions**: Full camera access with overlay rendering
- ✅ **Object Detection**: TensorFlow.js-powered speaker detection
- ✅ **Interactive Positioning**: Touch-to-place position setting
- ✅ **Triangle Calculation**: Real-time optimal positioning guidance
- ✅ **Visual Feedback**: Camera overlays with quality indicators

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