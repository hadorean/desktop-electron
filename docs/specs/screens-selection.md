
# Improvements to the screen selection UI

Each screen will be identified by a icon, name and color code, and have a type (static or interactive).

## Icon

- Icons are drawned in white
- Monitor icon for static screens
- Browser icon for interactive screens
- Home icon for the shared settings

## Name

- The name appear below the icon
- The name of the screen is formated (Browser, Monitor 1)
- The name color is slightly muted
- The shared screen is not named

## Selection

- The selected screen is underlined with a line matching its color
- The line slides between each tab and change color as it moves to match the newly selected screen

## Screen types

- The background windows we create for each monitor are static
- The browser windows are interactive
- The type is not mentionned explicitely to the user, it's implicitely defined by the icon
- We need to assign a type to a screen settings if it doesn't have one, based on where we load that settings (background or browser)

## Colors

- Colors are defined in the settings
- Each screen is assigned a color from the list
- Home (shared settings is white)
- The colors is used to underline the selected screen
- We need to assign a color to a screen settings if it doesn't have one

## Other changes

- Remove the edit button

## Technical notes

- I created icons and colors in the shared package, as well as types for the screen settings.
- Relevant files:
  - `pkg/shared/src/assets/icons/index.ts`
  - `pkg/shared/src/types/settings.ts`
  - `pkg/shared/src/components/ui/Icon.svelte`
  - `pkg/shared/src/components/settings/ScreenSwitcher.svelte`
  - `pkg/app/src/main/windows/backgrounds.ts`
  - `pkg/client/src/App.svelte`
