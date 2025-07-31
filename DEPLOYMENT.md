# Production Deployment Guide

## HTTPS Requirements

AR functionality requires HTTPS. For deployment:

### Local Development with HTTPS
```bash
# Option 1: Use mkcert for local SSL certificates
npm install -g mkcert
mkcert create-ca
mkcert create-cert localhost 127.0.0.1

# Option 2: Use http-server with SSL
npm install -g http-server
http-server -S -C cert.pem -K key.pem -p 8443

# Option 3: Use live-server with SSL
npm install -g live-server
live-server --https=path/to/cert --https-module=spdy
```

### Production Hosting

Recommended platforms that provide HTTPS by default:
- **Render.com**: Modern platform with free tier and automatic HTTPS ⭐ **RECOMMENDED**
- **Netlify**: Drag and drop deployment with automatic HTTPS  
- **Vercel**: Git-based deployment with edge network
- **GitHub Pages**: With custom domain and SSL
- **Firebase Hosting**: Google's hosting with global CDN
- **AWS S3 + CloudFront**: Enterprise-grade with custom configuration

## Render.com Deployment (Recommended)

Render.com offers the best free tier for static sites with automatic HTTPS, global CDN, and excellent performance.

### Quick Start with Render.com

1. **Fork this repository** to your GitHub account

2. **Connect to Render.com**:
   - Visit [render.com](https://render.com) and sign up
   - Click "New +" → "Static Site"
   - Connect your GitHub account
   - Select your forked repository

3. **Configure deployment**:
   | Setting | Value |
   |---------|-------|
   | **Name** | ar-speaker-position-helper |
   | **Branch** | main |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `apps/web/dist` |
   | **Node Version** | 18 |

4. **Deploy**: Click "Create Static Site"

### Using render.yaml (Advanced)

For advanced configuration, this repository includes a `render.yaml` file:

```yaml
services:
  - type: web
    name: ar-speaker-position-helper
    runtime: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./apps/web/dist
```

### Environment Variables for Render.com

No environment variables are required for basic functionality. For advanced features:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `SKIP_PREFLIGHT_CHECK` | Skip build checks | `true` |

### Render.com Benefits

- ✅ **Free SSL/HTTPS** - Required for AR functionality
- ✅ **Global CDN** - Fast loading worldwide
- ✅ **Automatic deploys** - Deploy on git push
- ✅ **Build caching** - Faster subsequent builds
- ✅ **Custom domains** - Free SSL for custom domains
- ✅ **Performance monitoring** - Built-in analytics

### Deployment Steps

1. **Build Optimization**
   ```bash
   npm run build
   ```

2. **Test HTTPS locally**
   ```bash
   npm run start:https
   ```

3. **Deploy files**
   - Upload all files to your hosting provider
   - Ensure service worker (`sw.js`) is in the root directory
   - Verify manifest.json is accessible
   - Test PWA installation on mobile device

4. **Performance Verification**
   - Run Lighthouse audit
   - Test on multiple devices
   - Verify AR functionality on target devices

### Environment Variables

For production, set these environment variables:
```bash
NODE_ENV=production
HTTPS=true
```

### Browser Compatibility

Tested on:
- Chrome 90+ (Android/iOS)
- Safari 14+ (iOS)
- Firefox 85+ (Android)
- Edge 90+ (Android)

### Performance Monitoring

The app includes built-in performance monitoring. For production analytics, consider integrating:
- Google Analytics
- Firebase Analytics
- Custom performance tracking

## Security Headers

Add these security headers for production:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https:; media-src 'self' blob:; worker-src 'self'; frame-src 'none';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```