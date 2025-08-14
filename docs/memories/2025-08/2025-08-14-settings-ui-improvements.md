# Settings UI Improvements

Date: 2025-08-14

## Overview
Redesign the settings UI components to have a cleaner, more intuitive interface with better override handling and screen-specific theming.

## Phase 1: Icon Infrastructure
- Create revert.svg icon for reset functionality
- Update Icon.svelte component to support the new revert icon
- Add the icon to the index.ts exports

## Phase 2: SliderControl Redesign
- **Layout Changes**:
  - Move slider and label to the same line
  - Add revert button between label and slider (icon only, no text)
  - Remove "Override" text label in override mode
- **Revert Button Logic**:
  - Disabled when slider is at default value
  - Reset slider to default with smooth transition animation
  - In override mode: turns off the override instead of resetting to default
- **Override Visual Enhancement**:
  - Make slider track/thumb more visible in override mode
  - Apply current screen's color to slider when override is active
- **State Management**:
  - Add logic to detect if value equals default
  - Add smooth transition animations for value changes

## Phase 3: ToggleControl (Switch) Redesign  
- **Layout Changes**:
  - Remove "Override" text label in override mode
  - Add revert button to the left of toggle in override mode
- **Revert Button Logic**:
  - In override mode: turns off the override
  - Shows only when override is active
- **Override Visual Enhancement**:
  - Make toggle track/thumb more visible in override mode
  - Apply current screen's color to toggle when override is active

## Phase 4: ImageGrid Enhancement
- **Revert Button Placement**:
  - Add revert button next to "Background image" title
  - Show only in override mode
  - Disabled if selected image equals default image
- **Integration**:
  - Connect to existing override logic
  - Maintain current image selection and favorites functionality

## Phase 5: Screen Color Integration
- **Create Color Store**:
  - Add derived store to get current screen's color
  - Export function to access screen color from settings
- **Apply Screen Colors**:
  - Update slider progress/thumb colors based on current screen
  - Update toggle colors based on current screen  
  - Use white (#ffffff) for shared/home screen

## Phase 6: Enhanced Override States
- **Visual Feedback**:
  - Improve override mode visibility without being too prominent
  - Add subtle color transitions when switching modes
  - Ensure consistent behavior across all controls
- **Animation System**:
  - Add smooth transitions for revert actions
  - Animate slider value changes
  - Add hover states for revert buttons

## Files to Modify
- `pkg/shared/src/assets/icons/revert.svg` (new)
- `pkg/shared/src/assets/icons/index.ts`
- `pkg/shared/src/components/ui/Icon.svelte`
- `pkg/shared/src/components/settings/SliderControl.svelte`
- `pkg/shared/src/components/settings/ToggleControl.svelte`
- `pkg/shared/src/components/settings/ImageGrid.svelte`
- `pkg/shared/src/stores/settingsStore.ts` (add screen color access)

## Technical Implementation Notes
- Maintain existing override logic and data flow
- Use current screen color from the new screen selection system
- Add smooth CSS transitions for all value changes
- Ensure accessibility with proper ARIA labels for icon buttons
- Test with different screen configurations and override states