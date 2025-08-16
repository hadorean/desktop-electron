# Simplify settings storage

I want to simplify the settings local storage.

We should store and reload only one data structure for the all settings, and initialize the store base on this complete settings structure.

## Current structure

settings.complete : all the settings
settings.shared : shared settings
settings.local : local settings

## New structure

settings: all the settings

## Relevant files

- pkg/shared/src/services/localStorage.ts
  In particular: loadInitialState()

- pkg/shared/src/stores/settingsStore.ts
- pkg/shared/src/types/settings.ts
