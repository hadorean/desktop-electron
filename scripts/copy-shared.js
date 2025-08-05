const fs = require('fs');
const path = require('path');

// Define source and target paths
const sharedDistPath = path.join(__dirname, '..', 'pkg', 'shared', 'dist');
const sharedPackageJsonPath = path.join(__dirname, '..', 'pkg', 'shared', 'package.json');
const targetDir = path.join(__dirname, '..', 'pkg', 'app', 'node_modules', '@heyketsu', 'shared');

// Create target directory
fs.mkdirSync(targetDir, { recursive: true });

// Copy dist directory
function copyDirectory(src, dest) {
    if (!fs.existsSync(src)) return;
    
    fs.mkdirSync(dest, { recursive: true });
    const items = fs.readdirSync(src);
    
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// Copy shared dist to target
copyDirectory(sharedDistPath, targetDir);

// Copy package.json
if (fs.existsSync(sharedPackageJsonPath)) {
    fs.copyFileSync(sharedPackageJsonPath, path.join(targetDir, 'package.json'));
}

console.log('✅ Shared package copied to node_modules');