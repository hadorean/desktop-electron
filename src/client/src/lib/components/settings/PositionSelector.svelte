<script lang="ts">
    import {
        settings,
        sharedSettings,
        updateSharedSettings,
        localSettings,
        isLocalMode,
        updateLocalSettings,
    } from "../../stores/settingsStore";
    import type {
        Settings,
        SettingsButtonPosition,
    } from "../../stores/settingsStore";

    const props = $props<{
        disabled?: boolean;
        isOverride?: boolean;
        overrideValue?: string | null;
        onOverride?: (newPosition: SettingsButtonPosition) => void;
    }>();

    const {
        disabled = false,
        isOverride = false,
        overrideValue,
        onOverride,
    } = props;

    const positions = [
        { value: "top-left", label: "Top Left" },
        { value: "top-right", label: "Top Right" },
        { value: "bottom-left", label: "Bottom Left" },
        { value: "bottom-right", label: "Bottom Right" },
    ] as const;

    const isOverridden = $derived(isOverride && overrideValue !== null);
    const effectivePosition = $derived(
        isOverridden ? overrideValue : $settings.settingsButtonPosition,
    );

    function handlePositionChange(position: string) {
        if (isOverride && !isOverridden) {
            // When enabling override in local mode, use the current value
            updateLocalSettings((current) => ({
                ...current,
                settingsButtonPosition: position as SettingsButtonPosition,
            }));
        } else {
            updateSharedSettings((current) => ({
                settingsButtonPosition: position as SettingsButtonPosition,
            }));
        }
    }

    function handleOverride() {
        if (onOverride) {
            onOverride();
        }
    }
</script>

<div class="form-control w-full">
    <div class="flex justify-between items-center mb-2">
        <label class="label" for="position-selector">
            <span class="label-text">Settings Button Position</span>
        </label>
        {#if isOverride}
            <button
                class="btn btn-xs {isOverridden
                    ? 'btn-primary'
                    : 'btn-ghost'} ml-auto"
                onclick={handleOverride}
            >
                {isOverridden ? "Clear" : "Override"}
            </button>
        {/if}
    </div>
    <div
        class="grid grid-cols-2 gap-2 bg-base-200 bg-opacity-30 p-2 rounded-lg"
        class:ghost={isOverride && !isOverridden}
    >
        {#each positions as position}
            <button
                class="btn btn-sm {effectivePosition === position.value
                    ? 'btn-primary'
                    : 'btn-ghost'}"
                onclick={() => handlePositionChange(position.value)}
                disabled={disabled && !isOverridden}
            >
                {position.label}
            </button>
        {/each}
    </div>
</div>

<style>
    .ghost {
        opacity: 0.7;
    }

    .ghost:hover {
        opacity: 0.9;
    }
</style>
