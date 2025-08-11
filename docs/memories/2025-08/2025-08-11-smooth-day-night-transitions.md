# Smooth Day/Night Transitions Implementation Plan
Date: 2025-08-11

## Overview
Implement smooth transitions when switching between day and night themes, affecting both background images and settings panel controls. The transition should use the `transitionTime` duration from settings and provide a polished user experience.

## Current State Analysis
- **BackgroundImage**: Already uses Tween.js with `transitionTime` and `Quadratic.Out` easing ✅
- **Theme switching**: Currently instantaneous via `toggleDayNightMode()`
- **Settings properties**: Mix of numbers (opacity, blur, saturation, transitionTime) and non-numbers (booleans, strings, arrays)
- **SliderControl/ToggleControl**: Need `disabled` prop to prevent changes during transition

## Architecture Decision: Store-Level Transitions
Implementing transitions at the store level provides:
- **Centralized control**: All UI components get consistent transition behavior
- **Clean separation**: Store handles timing/interpolation, UI just consumes values  
- **Scalable**: Easy to add new transitioning components
- **Socket sync compatibility**: Can handle incoming updates during transitions

## Implementation Plan

### 1. Store Level - Transition State (settingsStore.ts)
- Add `transitionSettings` writable store (holds interpolated values)
- Add `inTransition` writable boolean
- Add transition timing stores (`transitionStartTime`, `transitionDuration`)
- Create `startThemeTransition()` function with requestAnimationFrame loop
- Modify `screenSettings` and `editingSettings` to return `transitionSettings` during transitions

### 2. Enhanced toggleDayNightMode()
- Instead of immediate theme switch, call `startThemeTransition()`
- Calculate transition duration from current screen's `transitionTime`
- Interpolate numeric values (opacity, blur, saturation, transitionTime) using lerp
- Handle non-numeric values (immediate switch for booleans/strings/arrays)
- Use `Quadratic.Out` easing for consistency with BackgroundImage

### 3. UI Level - Component Updates
- **SliderControl**: Add `disabled?: boolean` prop, dim/disable when locked
- **ToggleControl**: Add `disabled?: boolean` prop
- **ScreenSwitcher**: Keep theme toggle enabled (allow canceling current transition)
- **SettingsPanel**: Pass `$inTransition` to all controls to lock during transition

### 4. Transition Management
- **Socket sync**: Cancel transition on incoming settings updates (external changes take priority)
- **User changes**: Cancel transition if user modifies individual settings during transition
- **Multiple transitions**: Cancel current transition if theme switched again (allow rapid switching)
- **Duration source**: Use current screen's `transitionTime` setting

### 5. BackgroundImage Integration
- Should work automatically (already uses `transitionTime` from `screenSettings`)
- Coordinate `selectedImage` changes with transition timing
- Ensure smooth handoff between theme transition and image transition

### 6. Property Handling Strategy
- **Numbers** (opacity, blur, saturation, transitionTime): Linear interpolation
- **Booleans** (hideButton, showTimeDate, etc.): Immediate switch at transition start
- **selectedImage**: Change immediately, let BackgroundImage handle its own transition
- **Arrays** (favorites): Immediate switch

### 7. Export New Functions
- Add `inTransition`, `transitionSettings` to store exports
- Export `startThemeTransition` for external use if needed

## Technical Details

### Interpolation Function
```typescript
function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress
}

function easeQuadraticOut(t: number): number {
  return 1 - (1 - t) * (1 - t)
}
```

### Transition Loop Structure
```typescript
function startThemeTransition(fromTheme: DayNightMode, toTheme: DayNightMode) {
  // 1. Set inTransition = true
  // 2. Get transition duration from transitionTime
  // 3. Calculate start/end values for numeric properties
  // 4. Start requestAnimationFrame loop
  // 5. On completion: set inTransition = false, update currentTheme
}
```

### Store Structure During Transition
- `screenSettings` and `editingSettings` return `transitionSettings` when `inTransition` is true
- `transitionSettings` contains interpolated values for numeric properties
- Non-numeric properties come from target theme immediately

## Expected Behavior
1. User clicks day/night toggle in ScreenSwitcher
2. Settings panel controls become disabled (dimmed)
3. All numeric values smoothly interpolate over `transitionTime` duration
4. Background image transitions smoothly (existing behavior)
5. Boolean/string values change immediately
6. Controls re-enable when transition completes
7. Multiple rapid theme switches cancel previous transitions and start new ones
8. Socket updates during transition cancel transition and apply immediately

## Benefits
- **Professional UX**: Smooth, polished transitions
- **Consistent timing**: All transitions use the same `transitionTime` setting
- **Non-disruptive**: Settings remain editable except during brief transition
- **Performant**: Store-level implementation avoids component re-render issues
- **Maintainable**: Centralized transition logic, easy to extend