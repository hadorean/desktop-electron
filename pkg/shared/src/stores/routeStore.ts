import { writable, readable } from 'svelte/store';

export const defaultScreenId = 'default';

// Define the route parameters interface
export interface RouteParams {
	screenId: string; // A string identifier for the screen
}

// Create a writable store for route parameters
export const routeParams = writable<RouteParams>({
	screenId: defaultScreenId
});

// Create a derived store to check if both params are valid
export const hasValidParams = readable<boolean>(false, (set) => {
	const unsubscribe = routeParams.subscribe((params) => {
		// Check if screenId is not empty
		const isValidScreenId = Boolean(params.screenId && params.screenId.trim().length > 0);

		set(isValidScreenId);
	});

	return unsubscribe;
});

// Function to parse and set route parameters from URL
export function parseRouteParams(path: string): void {
	console.log('Parsing route params: ', path);

	// Route format: /app/:userId/:screenId or /:userId/:screenId
	const parts = path.replace(/^\/+/, '').split('/');

	// Handle /app/userId/screenId format
	if (parts.length >= 2 && parts[0] === 'app') {
		routeParams.set({
			screenId: parts[1] || ''
		});
	}
	// Handle /userId/screenId format
	else if (parts.length >= 1) {
		routeParams.set({
			screenId: parts[1] || ''
		});
	}
	// Handle single parameter case (unlikely but included for completeness)
	else if (parts.length === 1 && parts[0]) {
		routeParams.update((params) => ({
			...params,
			userId: parts[0]
		}));
	}
}

// Function to get URL from params
export function getRouteUrl(params: RouteParams): string {
	return `/app/${params.screenId}`;
}
