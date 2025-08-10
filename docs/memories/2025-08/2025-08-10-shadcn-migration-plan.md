# shadcn-svelte Migration Plan

Date: 2025-08-10

## Overview

Migration from DaisyUI + Tailwind CSS to shadcn-svelte component library while preserving critical "ghost mode" functionality for settings controls.

## Current State

### UI Framework
- **DaisyUI + Tailwind CSS**: Using DaisyUI components with Tailwind styling
- **Packages with DaisyUI**: 
  - `pkg/client/package.json` - daisyui: "^3.9.4"
  - `pkg/app/package.json` - daisyui: "^3.9.4"

### Critical Ghost Mode Functionality

The application has a sophisticated settings override system where:
- **Shared Settings**: Apply to all screens by default
- **Local Settings**: Override shared settings per screen
- **Ghost Mode**: When in override mode but not actually overriding, controls appear "ghosted"

#### Ghost Mode Visual Behavior
- **Reduced Opacity**: Controls show at ~70% opacity, ~90% on hover
- **Custom Styling**: Sliders have custom track/thumb colors, toggles have transparent backgrounds
- **Visual Cue**: Users can see the shared value but know it's not being overridden

#### Current Ghost Mode Implementation
```css
/* SliderControl */
input[type='range'].ghost {
  --range-shdw: 0%;
  --ghost-color-bg: rgba(46, 46, 46, 0.2);
  --ghost-color-track-bg: rgba(127, 127, 127, 0);
  --ghost-border: 1px solid rgba(127, 127, 127, 0.288);
}

/* ToggleControl */
.toggle.ghost {
  --tw-border-opacity: 1;
  border-color: hsl(var(--bc) / var(--tw-border-opacity));
  background-color: transparent;
  opacity: 0.3;
}

/* ImageGrid */
.ghost {
  opacity: 0.7;
}
.ghost:hover {
  opacity: 0.9;
}
```

## Migration Strategy

### Component Mapping
| Current Component | Target shadcn Component | Ghost Mode Complexity |
|-------------------|------------------------|----------------------|
| SliderControl     | Slider                 | High - Custom CSS vars |
| ToggleControl     | Switch                 | Medium - Custom styling |
| ImageGrid         | Card (custom grid)     | Low - Opacity only |
| ScreenSwitcher    | Button (custom pills)  | N/A - No ghost mode |
| SettingsPanel     | Sheet/Dialog           | N/A - Layout only |

### Implementation Approach

#### 1. Enhanced Wrapper Components
Create wrapper components that extend shadcn components with ghost functionality:

```typescript
interface GhostableProps<T> {
  isOverride?: boolean;
  overrideValue?: T | null;
  defaultValue: T;
  value: T | null;
  onChange: (value: T | null) => void;
}

const GhostSlider = ({ isOverride, overrideValue, ...props }) => {
  const isGhost = isOverride && overrideValue === null;
  return (
    <Slider 
      {...props}
      data-ghost={isGhost}
      className={cn(props.className, { 'ghost-mode': isGhost })}
    />
  );
};
```

#### 2. CSS Strategy
Preserve ghost functionality with CSS variables and custom styling:

```css
.ghost-mode {
  opacity: var(--ghost-opacity, 0.7);
  transition: opacity 0.2s ease;
}

.ghost-mode:hover {
  opacity: var(--ghost-hover-opacity, 0.9);
}

/* Slider-specific ghost styling */
.ghost-mode[data-slider] {
  --slider-track-bg: var(--ghost-track-bg, transparent);
  --slider-thumb-bg: var(--ghost-thumb-bg, rgba(46, 46, 46, 0.2));
  --slider-thumb-border: var(--ghost-border, 1px solid rgba(127, 127, 127, 0.288));
}

/* Switch-specific ghost styling */
.ghost-mode[data-switch] {
  --switch-bg: transparent;
  --switch-border: 1px solid hsl(var(--border));
  opacity: 0.3;
}
```

## Implementation Plan

### Phase 1: Setup Infrastructure
1. **Install shadcn-svelte** in all packages
2. **Configure Tailwind** with shadcn-svelte preset
3. **Create component structure** in `pkg/shared/src/components/ui/`
4. **Setup CSS variables** for ghost mode

### Phase 2: Core Component Migration
1. **SliderControl** (Highest Priority)
   - Most complex ghost styling with CSS variables
   - Preserve override button functionality
   - Maintain current range styling

2. **ToggleControl** (High Priority)
   - Ghost toggle styling with transparent background
   - Keep current label + button + toggle layout
   - Preserve accessibility attributes

3. **ImageGrid** (Medium Priority)
   - Convert to grid of shadcn Cards
   - Preserve ghost opacity on container
   - Maintain favorite star functionality

### Phase 3: Layout and Navigation
4. **ScreenSwitcher** (Medium Priority)
   - Custom pills using shadcn Button variants
   - Preserve edit mode functionality
   - Maintain current styling for shared vs screen pills

5. **SettingsPanel** (Lower Priority)
   - Convert to shadcn Sheet for better mobile support
   - Preserve backdrop blur and scroll behavior

### Phase 4: Cleanup
6. **Remove DaisyUI** from all packages
7. **Update imports** across all consuming files
8. **Standardize exports** from shared package

## Testing Requirements

### Ghost Mode Testing
- [ ] Verify ghost opacity on all controls when `isOverride && !overrideValue`
- [ ] Test hover states maintain proper opacity transitions
- [ ] Ensure override buttons work correctly in all states
- [ ] Check visual consistency with current implementation

### Functionality Testing
- [ ] Settings persistence across ghost/override state changes
- [ ] Visual indicators for local vs shared settings work
- [ ] Responsive behavior on different screen sizes
- [ ] Keyboard navigation and accessibility preserved

### Integration Testing
- [ ] Client package components work with new shared components
- [ ] App package renderer components integrate properly
- [ ] Socket updates still trigger proper re-renders

## Benefits

### Immediate Benefits
- **Better TypeScript Support**: shadcn-svelte has excellent TS integration
- **Enhanced Accessibility**: Better ARIA support than DaisyUI
- **Consistent Design System**: Modern, cohesive component library

### Long-term Benefits  
- **Better Tree Shaking**: Only import components that are used
- **More Flexible Styling**: Easier customization than DaisyUI constraints
- **Active Development**: More actively maintained than DaisyUI
- **Future-Proof**: Better aligned with modern Svelte patterns

## Risk Mitigation

### High Risk: Ghost Mode Regression
- **Mitigation**: Create comprehensive visual regression tests
- **Fallback**: Keep DaisyUI components available during migration
- **Testing**: Side-by-side comparison during development

### Medium Risk: Override Logic Breaks
- **Mitigation**: Maintain exact same prop interfaces
- **Testing**: Extensive testing of all override scenarios
- **Documentation**: Clear mapping of old vs new behavior

### Low Risk: Performance Impact
- **Mitigation**: Measure bundle size before/after
- **Optimization**: Tree shake unused components
- **Monitoring**: Watch for rendering performance changes

## Success Criteria

1. **Functional Parity**: All ghost mode behavior preserved exactly
2. **Visual Consistency**: UI looks identical to current implementation
3. **Performance**: No regression in bundle size or render performance
4. **Accessibility**: Maintain or improve current accessibility
5. **Developer Experience**: Improved TypeScript support and maintainability

## Timeline Estimate

- **Phase 1 (Setup)**: 1-2 days
- **Phase 2 (Core Components)**: 3-4 days  
- **Phase 3 (Layout)**: 2-3 days
- **Phase 4 (Cleanup)**: 1 day
- **Total**: 7-10 days

## Files to Modify

### Package Files
- `pkg/shared/package.json` - Add shadcn-svelte deps
- `pkg/client/package.json` - Add shadcn-svelte, remove daisyui
- `pkg/app/package.json` - Add shadcn-svelte, remove daisyui

### Component Files (~15 files)
- `pkg/shared/src/components/settings/*.svelte` - All settings components
- `pkg/client/src/lib/components/**/*.svelte` - Client components
- `pkg/app/src/renderer/src/components/*.svelte` - App renderer components

### Configuration Files
- Tailwind configs in all packages
- Component export files
- Import statements across consuming files

## Notes

This migration prioritizes preserving the sophisticated ghost mode functionality that provides visual feedback about settings override states. The wrapper component approach ensures we can maintain the current behavior while gaining the benefits of a modern component library.