# Plan: Move Settings Panel to Shared Package (Incremental Approach)

Milestone-Based Implementation

## Milestone 1: Verify Direct Shared Package Reference Works

Goal: Test if we can use file:../shared reference in app without breaking anything
Steps:

1. Temporarily test app with "@heyketsu/shared": "file:../shared" in package.json
2. Keep copy-shared.js as backup (don't delete yet)
3. Test build and runtime - ensure app still works
4. Verify imports - check all @heyketsu/shared imports resolve correctly
   Success Criteria: App builds and runs normally with direct shared reference

## Milestone 2: Create Basic Communication Adapter Interface

Goal: Establish the foundation for flexible settings communication
Steps:

1. Create shared/src/adapters/settings-communication.ts with base interface
2. Add minimal types for settings operations
3. Update shared package exports to include adapters
4. Test import from both client and app
   Success Criteria: Both packages can import the adapter interface

## Milestone 3: Implement HTTP Settings Adapter

Goal: Create adapter for client-side API communication
Steps:

1. Implement HttpSettingsAdapter using existing client API patterns
2. Test integration with current client settings store
3. Verify settings operations still work in client
   Success Criteria: Client settings work through adapter layer

## Milestone 4: Implement IPC Settings Adapter + Main Process Handlers

Goal: Create IPC-based communication for app
Steps:

1. Add IPC handlers in app main process for settings operations
2. Implement IpcSettingsAdapter in shared package
3. Update app preload to expose settings IPC methods
4. Test basic IPC settings communication
   Success Criteria: Can read/write settings via IPC in app

## Milestone 5: Move One Settings Component to Shared

Goal: Test moving Svelte components to shared package
Steps:

1. Choose simple component (e.g., ToggleControl.svelte)
2. Move to shared/src/components/settings/
3. Update shared tsconfig/build to handle Svelte components
4. Update imports in client to use shared component
5. Test component works in client
   Success Criteria: One shared component works in client

## Milestone 6: Integrate Adapter in App Settings

Goal: Use IPC adapter for app settings operations
Steps:

1. Create simple settings component in app using shared component
2. Use IPC adapter for settings operations
3. Test settings work in app main window
   Success Criteria: App can use shared settings component with IPC

## Milestone 7: Move Remaining Components

Goal: Complete the component migration
Steps:

1. Move remaining components one by one to shared
2. Update all imports in client
3. Test each component after moving
   Success Criteria: All settings components work from shared package

## Milestone 8: Move Settings Store to Shared

Goal: Share the settings store logic
Steps:

1. Adapt settings store to use communication adapters
2. Move store to shared package
3. Update client and app to use shared store
4. Test complete settings functionality in both environments
   Success Criteria: Both client and app use shared settings store

## Milestone 9: Cleanup and Optimization

Goal: Remove redundant code and optimize setup
Steps:

1. Verify everything works with direct shared reference
2. Remove copy-shared.js and related scripts (only after verification!)
3. Clean up duplicate code
4. Performance testing to ensure no regressions

Safety Measures

- Keep backups: Don't delete copy-shared.js until final milestone
- Git commits: Commit after each successful milestone
- Rollback plan: Can revert to copy mechanism if issues arise
- Test both environments: After each milestone, verify client AND app work
- Incremental testing: Test each change before proceeding

First Step

Start with ## Milestone 1: Test direct shared package reference in app while keeping existing copy mechanism as backup.
