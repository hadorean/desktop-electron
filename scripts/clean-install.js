#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧹 Starting clean installation...')

try {
	// Remove node_modules and lockfile
	console.log('📁 Removing node_modules...')
	if (fs.existsSync('node_modules')) {
		fs.rmSync('node_modules', { recursive: true, force: true })
	}

	// Remove lockfile to force fresh resolution
	console.log('🔒 Removing lockfile...')
	if (fs.existsSync('pnpm-lock.yaml')) {
		fs.unlinkSync('pnpm-lock.yaml')
	}

	// Fresh install with build scripts enabled
	console.log('📦 Installing dependencies...')
	execSync('pnpm install --ignore-scripts=false', { stdio: 'inherit' })

	// Force build native modules manually
	console.log('🔨 Building native modules...')

	// Build Electron
	try {
		execSync('cd node_modules/.pnpm/electron@*/node_modules/electron && npm run postinstall', {
			stdio: 'inherit',
			shell: true
		})
		console.log('✅ Electron built successfully')
	} catch (error) {
		console.log('⚠️  Electron build failed, you may need to run it manually')
	}

	// Build electron-as-wallpaper
	try {
		execSync('cd node_modules/.pnpm/electron-as-wallpaper@*/node_modules/electron-as-wallpaper && npm run install', {
			stdio: 'inherit',
			shell: true
		})
		console.log('✅ electron-as-wallpaper built successfully')
	} catch (error) {
		console.log('⚠️  electron-as-wallpaper build failed, you may need to run it manually')
	}

	console.log('✅ Clean installation complete!')
} catch (error) {
	console.error('❌ Clean installation failed:', error.message)
	process.exit(1)
}
