/**
 * Check if localStorage is available and working
 * @returns true if localStorage is available, false otherwise
 */
export function checkStorageAvailability(): boolean {
	try {
		const testKey = '__storage_test__'
		localStorage.setItem(testKey, testKey)
		const result = localStorage.getItem(testKey)
		localStorage.removeItem(testKey)
		return result === testKey
	} catch (error) {
		console.error('localStorage availability check failed:', error)
		return false
	}
}
