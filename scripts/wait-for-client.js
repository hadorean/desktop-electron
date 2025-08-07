#!/usr/bin/env node

/**
 * Wait for the Vite dev server to start
 *
 * This script waits for the Vite dev server to start on the specified ports.
 */

async function checkPort(port) {
	try {
		const response = await fetch(`http://localhost:${port}`);
		return response.ok;
	} catch {
		return false;
	}
}

async function waitForClient() {
	const ports = [5173, 5174, 5175, 5176, 5177, 5178];
	const maxAttempts = 60; // 30 seconds
	let attempts = 0;

	console.log('🔍 Waiting for Vite dev server...');

	while (attempts < maxAttempts) {
		for (const port of ports) {
			if (await checkPort(port)) {
				console.log(`✅ Found Vite dev server on port ${port}`);
				process.exit(0);
			}
		}

		attempts++;
		await new Promise((resolve) => setTimeout(resolve, 500));
		process.stdout.write('.');
	}

	console.log('\n❌ Timeout waiting for Vite dev server');
	process.exit(1);
}

waitForClient().catch(console.error);
