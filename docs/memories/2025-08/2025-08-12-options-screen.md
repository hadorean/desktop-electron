# Options Screen Implementation

Date: 2025-08-12

## Overview
Implementing a two-page navigation system with smooth transitions between the main settings panel and a new options screen for the HeyKetsu Electron app.

## Requirements
- Add options button (cog icon) at bottom-right of main screen
- Create options page with placeholder "options" content
- Implement smooth transitions: fade out/in + slide left/right
- Use shadcn carousel for navigation with custom controls
- Maintain Svelte 5 patterns (`{@render children?.()}`, `$state`, `$derived`)
- Preserve draggable window functionality

## Technical Approach
1. Install shadcn carousel component with modern Svelte 5 syntax
2. Create PageContainer component to handle navigation and transitions
3. Create OptionsScreen with placeholder content
4. Create custom navigation buttons (OptionsButton + BackButton)
5. Integrate into App.svelte replacing static SettingsPanel

## Components Structure
- **Page 1**: SettingsPanel + OptionsButton (bottom-right)
- **Page 2**: OptionsScreen + BackButton (top area)
- **Navigation**: Custom carousel with fade + slide animations (~300ms)

## Implementation Notes
- Follow existing component patterns from button.svelte
- Ensure navigation buttons are in non-draggable zones
- Maintain existing design tokens and styling
- Use proper TypeScript interfaces throughout