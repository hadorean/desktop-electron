# Fix Screen Color and Type Inference

Date: 2025-08-15

## Problem

According to the specs in `docs/specs/screens-selection.md`, there are issues with how screen colors and types are handled:

- Colors should be inferred in the UI from the screen index, not written in settings (as settings might get reset)
- Screen types also need to be inferred, but the implementation is unclear

Currently, both `color` and `type` are stored in the `ScreenSettings` interface and persisted, which goes against the specs.

## Analysis

From reviewing the codebase:

1. **Screen Context Detection**: URLs like `/app/monitor1`, `/app/browser` provide screen context
2. **Existing Inference Logic**: 
   - `assignScreenType()` correctly infers type from screenId (`monitor` → static, `browser` → interactive)  
   - `assignScreenColor()` correctly assigns colors by screen index using predefined palette
3. **Issue**: These computed values are currently stored in settings, but should be purely computed

## Solution

Remove `color` and `type` from being persisted in settings and make them fully computed from:
- Screen position/index (for colors)
- Screen ID patterns (for types)

## Implementation Plan

### Phase 1: Update Type Definitions
- **File**: `pkg/shared/src/types/settings.ts`
- Remove `color` from `ScreenSettings` interface
- Remove `type` from `ScreenSettings` interface  
- Update `DefaultScreenSettings` accordingly

### Phase 2: Update Settings Store Logic
- **File**: `pkg/shared/src/stores/settingsStore.ts`
- Modify `currentScreenColor` and `currentScreenType` derived stores to be purely computed
- Update `assignScreenColor()` to work with dynamic screen lists
- Remove color/type storage from `normalizeScreenSettings()`

### Phase 3: Update ScreenSwitcher Component
- **File**: `pkg/shared/src/components/settings/ScreenSwitcher.svelte`
- Update `allTabs` derived store to compute color/type on demand
- Ensure real-time updates when screen list changes

### Phase 4: Clean Up Persistence Layer
- **File**: `pkg/shared/src/services/localStorage.ts`
- Remove logic that saves/loads color and type
- Add migration to clean up existing stored values

### Phase 5: Testing & Validation
- Run quality checks: `pnpm typecheck`, `pnpm format`, `pnpm lint`
- Test color assignment with multiple screens
- Verify type inference for different screen contexts

## Expected Benefits

- ✅ Colors automatically assigned based on screen index
- ✅ Screen types automatically inferred from context  
- ✅ Settings remain clean without redundant computed values
- ✅ Follows specs: colors inferred from UI, types from context
- ✅ Maintains backward compatibility