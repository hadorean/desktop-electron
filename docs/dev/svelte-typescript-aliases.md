# Svelte TypeScript Aliases Configuration

Quick reference for setting up import aliases in Svelte + TypeScript projects to work in both build and VS Code.

## Required Configuration

### 1. Vite Config (`vite.config.ts`)

```typescript
resolve: {
  alias: {
    '@heyketsu/shared': path.resolve(__dirname, '../shared/src'),
    $stores: path.resolve(__dirname, './src/lib/stores')
  }
}
```

### 2. TypeScript Config (`tsconfig.app.json`)

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@heyketsu/shared": ["../shared/src"], // Direct import: from '@heyketsu/shared'
			"@heyketsu/shared/*": ["../shared/src/*"], // Subpath: from '@heyketsu/shared/components'
			"$stores/*": ["./src/lib/stores/*"]
		}
	},
	"include": [
		"src/**/*.ts",
		"src/**/*.svelte",
		"../shared/src/**/*.ts", // Include shared package files
		"../shared/src/**/*.svelte"
	]
}
```

## Key Points

- **Vite alias**: Handles build-time resolution
- **TypeScript paths**: Both direct (`@heyketsu/shared`) and wildcard (`@heyketsu/shared/*`) patterns needed
- **Include pattern**: Must include shared package files for TypeScript to recognize them
- **VS Code**: Restart TypeScript server after changes (`Ctrl+Shift+P` → "TypeScript: Restart TS Server")

## Usage

```typescript
// Direct import from alias root
import { SliderControl, ToggleControl } from '@heyketsu/shared'

// Subpath import
import { apiService } from '@heyketsu/shared/services'
import { settingsStore } from '$stores/settingsStore'
```
