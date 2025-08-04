import { writable, readable } from "svelte/store";

export const defaultScreenId = "default";

// Define the route parameters interface
export interface RouteParams {
  userId: string; // A string identifying the user
  screenId: string; // A string identifier for the screen
}

// Create a writable store for route parameters
export const routeParams = writable<RouteParams>({
  userId: "",
  screenId: defaultScreenId,
});

// Create a derived store to check if both params are valid
export const hasValidParams = readable<boolean>(false, (set) => {
  const unsubscribe = routeParams.subscribe((params) => {
    // Check if userId is not empty
    const isValidUserId = Boolean(
      params.userId && params.userId.trim().length > 0,
    );
    // Check if screenId is not empty
    const isValidScreenId = Boolean(
      params.screenId && params.screenId.trim().length > 0,
    );

    set(isValidUserId && isValidScreenId);
  });

  return unsubscribe;
});

// Function to parse and set route parameters from URL
export function parseRouteParams(path: string): void {
  console.log("Parsing route params: ", path);

  // Route format: /app/:userId/:screenId or /:userId/:screenId
  const parts = path.replace(/^\/+/, "").split("/");

  // Handle /app/userId/screenId format
  if (parts.length >= 3 && parts[0] === "app") {
    routeParams.set({
      userId: parts[1] || "",
      screenId: parts[2] || "",
    });
  }
  // Handle /userId/screenId format
  else if (parts.length >= 2) {
    routeParams.set({
      userId: parts[0] || "",
      screenId: parts[1] || "",
    });
  }
  // Handle single parameter case (unlikely but included for completeness)
  else if (parts.length === 1 && parts[0]) {
    routeParams.update((params) => ({
      ...params,
      userId: parts[0],
    }));
  }
}

// Function to get URL from params
export function getRouteUrl(params: RouteParams): string {
  return `/app/${params.userId}/${params.screenId}`;
}
