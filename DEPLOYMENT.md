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
- **Netlify**: Drag and drop deployment with automatic HTTPS
- **Vercel**: Git-based deployment with edge network
- **GitHub Pages**: With custom domain and SSL
- **Firebase Hosting**: Google's hosting with global CDN
- **AWS S3 + CloudFront**: Enterprise-grade with custom configuration

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