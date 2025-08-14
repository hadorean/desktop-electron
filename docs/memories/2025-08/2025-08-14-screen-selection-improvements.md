# Screen Selection UI Improvements

Date: 2025-08-14

## Overview
Transform the current tab-based screen switcher into an icon-driven interface with color-coded underlines and proper screen type identification.

## Phase 1: Icon and Type Infrastructure
- Add `home.svg` icon for shared settings to the icons collection
- Update Icon.svelte component to support the new home icon
- Enhance screen type detection logic in settings store to auto-assign types based on context
- Implement color assignment logic for screens that don't have colors

## Phase 2: ScreenSwitcher Component Redesign
- Replace text-based tabs with icon + name layout:
  - Home icon (white) for shared settings
  - Monitor icon (white) for static screens (Monitor 1, Monitor 2, etc.)
  - Browser icon (white) for interactive screens (Browser)
- Add muted color names below icons (except shared which remains unnamed)
- Remove edit mode functionality and edit button entirely

## Phase 3: Color-coded Selection Animation
- Implement animated underline that slides between selections
- Underline color matches each screen's assigned color (white for shared)
- Smooth transitions using CSS animations

## Phase 4: Screen Type and Color Management
- Auto-assign screen types when settings are loaded/created:
  - Background windows → 'static' type
  - Browser contexts → 'interactive' type
- Auto-assign colors from the predefined palette to screens without colors
- Ensure shared settings always use white color

## Phase 5: CSS Styling Updates
- Replace current tab styling with new icon-based layout
- Implement sliding underline animation
- Ensure proper spacing and visual hierarchy
- Maintain existing backdrop blur and transparency effects

## Files to Modify
- `pkg/shared/src/assets/icons/` (add home.svg)
- `pkg/shared/src/assets/icons/index.ts`
- `pkg/shared/src/components/ui/Icon.svelte`
- `pkg/shared/src/components/settings/ScreenSwitcher.svelte`
- `pkg/shared/src/stores/settingsStore.ts` (enhance type/color assignment)

## Technical Implementation Notes
- Use existing color palette from settings types
- Maintain keyboard navigation support
- Preserve day/night toggle functionality
- Keep screen switching logic intact
- Ensure proper screen naming format (Monitor 1, Browser, etc.)