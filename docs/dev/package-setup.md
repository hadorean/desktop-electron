# Package Setup

## For Development (Clean Imports + Hot Reload):

Aliases in both packages:

- $shared → ../shared/src (for clean imports)

## Build process:

- pkg/shared: npm run build (creates proper module structure)
- pkg/app: npm run copy-shared (copies to node_modules)

Both packages use clean $shared/types syntax
