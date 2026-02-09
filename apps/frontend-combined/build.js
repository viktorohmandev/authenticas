const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(__dirname, 'dist');

// Clean dist folder
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true });
}
fs.mkdirSync(DIST, { recursive: true });

// Install shared dependencies first
console.log('📦 Installing shared dependencies...');
execSync('npm install', { cwd: path.join(ROOT, 'shared'), stdio: 'inherit' });

// Build Admin
console.log('🔨 Building Admin dashboard...');
execSync('npm install', { cwd: path.join(ROOT, 'admin'), stdio: 'inherit' });
execSync('npm run build', { cwd: path.join(ROOT, 'admin'), stdio: 'inherit' });

// Build Retailer
console.log('🔨 Building Retailer dashboard...');
execSync('npm install', { cwd: path.join(ROOT, 'retailer'), stdio: 'inherit' });
execSync('npm run build', { cwd: path.join(ROOT, 'retailer'), stdio: 'inherit' });

// Build Company
console.log('🔨 Building Company dashboard...');
execSync('npm install', { cwd: path.join(ROOT, 'company'), stdio: 'inherit' });
execSync('npm run build', { cwd: path.join(ROOT, 'company'), stdio: 'inherit' });

// Copy builds to combined dist
console.log('📦 Combining builds...');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy each app to its path
copyDir(path.join(ROOT, 'admin', 'dist'), path.join(DIST, 'admin-login'));
copyDir(path.join(ROOT, 'retailer', 'dist'), path.join(DIST, 'retailer-login'));
copyDir(path.join(ROOT, 'company', 'dist'), path.join(DIST, 'company-login'));

// Copy landing page and config files
fs.copyFileSync(
  path.join(__dirname, 'public', 'index.html'),
  path.join(DIST, 'index.html')
);

// Copy _redirects for Netlify
fs.copyFileSync(
  path.join(__dirname, 'public', '_redirects'),
  path.join(DIST, '_redirects')
);

// Copy favicon files
fs.copyFileSync(
  path.join(__dirname, 'public', 'favicon.ico'),
  path.join(DIST, 'favicon.ico')
);
fs.copyFileSync(
  path.join(__dirname, 'public', 'favicon-32x32.png'),
  path.join(DIST, 'favicon-32x32.png')
);
fs.copyFileSync(
  path.join(__dirname, 'public', 'apple-touch-icon.png'),
  path.join(DIST, 'apple-touch-icon.png')
);

// Note: vercel.json stays at project root, not in dist

console.log('✅ Build complete! Output in apps/frontend-combined/dist/');
console.log('');
console.log('Structure:');
console.log('  dist/');
console.log('  ├── index.html (landing page)');
console.log('  ├── admin-login/');
console.log('  ├── retailer-login/');
console.log('  └── company-login/');
