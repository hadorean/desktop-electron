# Package Setup

## For Development (Clean Imports + Hot Reload):

Aliases in both packages:

- @heyketsu/shared → ../shared/src (for clean imports)
- $shared → ../shared/src (alternative syntax)

## Build process:

- pkg/shared: npm run build (creates proper module structure)
- pkg/app: npm run copy-shared (copies to node_modules)

Both packages use clean @heyketsu/shared/types syntax
