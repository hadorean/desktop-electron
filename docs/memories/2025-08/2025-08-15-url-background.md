# URL Background Feature Implementation

Date: 2025-08-15

## Overview
Add URL background support to allow users to display web content as backgrounds instead of just images, following the existing architecture patterns.

## Phase 1: Settings Type System Updates
1. **Extend ScreenProfile interface** in `pkg/shared/src/types/settings.ts`:
   - Add `mode: 'image' | 'url'` field (default: 'image')
   - Add `url: string` field for URL storage
   - Update DefaultScreenProfile with new fields

2. **Update settings store** in `pkg/shared/src/stores/settingsStore.ts`:
   - Add handling for new mode and url fields
   - Ensure proper serialization/deserialization

## Phase 2: Settings UI Components
1. **Create BackgroundModeSelector component**:
   - Dropdown component to switch between "Image" and "URL" modes
   - Replace static "Background image" title in SettingsPanel
   - Handle mode changes and state transitions

2. **Create UrlInput component**:
   - Input field for URL entry with validation
   - Show when mode is 'url'
   - Similar styling to existing form controls

3. **Update SettingsPanel.svelte**:
   - Replace ImageGrid section with conditional rendering
   - Show BackgroundModeSelector header
   - Conditionally render ImageGrid (image mode) or UrlInput (url mode)
   - Maintain existing filter controls (work for both modes)

## Phase 3: Background Rendering System
1. **Update BackgroundImage.svelte**:
   - Add support for iframe rendering when mode is 'url'
   - Apply same filter system to iframe container
   - Maintain smooth transitions between modes
   - Handle loading states and error cases

## Phase 4: Integration and Testing
1. **Update API types** if needed for URL validation
2. **Test filter application** on iframe content
3. **Ensure transitions work** between image and URL modes
4. **Test day/night theme** transitions with URL backgrounds
5. **Validate screen-specific overrides** work properly

## Key Implementation Notes
- Use `mode` instead of `backgroundMode` and `url` instead of `backgroundUrl`
- Maintain existing filter system compatibility
- Follow established component patterns (shadcn-svelte, semantic CSS)
- Preserve day/night theme functionality
- Keep screen override system intact
- Use existing settings store patterns and validation