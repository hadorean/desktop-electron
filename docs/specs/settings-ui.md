
# Improvements to the settings UI

## Sliders

- Slider and label are on the same line
- Between the label and the slider, there is a "revert" button (icon, no label)
- The revert button is disabled if the slider is at the default value
- The revert button reset the slider to the default value with a transition
- In Override mode, we don't display the "Override" label
- In override mode, the revert button turn off the override
- In override mode, the slider lines are slightly more visible that what they are at the moment, same for the thumb.
- If the override is active, the slider color use the colors of the current screen

## Switch 

- In Override mode, we don't display the "Override" label
- In override mode, the revert button shows at the left of the toggle and turn off the override
- In override mode, the toggle is slightly more visible that what they are at the moment, same for the thumb.
- If the override is active, the toggle color use the colors of the current screen

## Image grid

- The revert button is next to the "Background image" title, only visible in override mode
- The revert button is visible only in override mode and disabled if the image is the default one


## Technical notes

- Relevant files:
  - `pkg/shared/src/components/settings/SliderControl.svelte`
  - `pkg/shared/src/components/settings/SwitchControl.svelte`
  - `pkg/shared/src/components/settings/ImageGrid.svelte`
