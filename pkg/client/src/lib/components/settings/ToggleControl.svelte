<script lang="ts">
  const { label, checked, onChange, defaultValue = null, isOverride = false, overrideValue = null } = $props<{
    label: string;
    checked: boolean | null;
    onChange: (value: boolean | null) => void;
    defaultValue?: boolean | null;
    isOverride?: boolean;
    overrideValue?: boolean | null;
  }>();

  const isOverridden = $derived(isOverride && overrideValue !== null);

  let inputRef: HTMLInputElement | null = null; 

  function handleOverride() {
    // console.log(`[ToggleControl ${label}] handleOverride called:`, {
    //   isOverridden,
    //   overrideValue
    // });
    if (!isOverridden) {
      // When enabling override, use either the defaultValue or the current shared value
      const newValue = defaultValue ?? checked ?? false;
      onChange(newValue);
    } else {
      // When disabling override, set to null to use shared value
      onChange(null);
    }
  }

  function handleChange(e: Event) {
    const newValue = inputRef?.checked;
    // console.log(`[ToggleControl ${label}] handleChange called:`, {
    //   newValue,
    //   previous: checked,
    //   isOverride,
    //   isOverridden
    // });
    onChange(newValue);
  }

</script>

<div class="toggle-control form-control">
  <label class="label cursor-pointer justify-start gap-4" for={`toggle-${label}`}>
    <span class="label-text">{label}</span>
  </label>
  {#if isOverride}
      <button
        class="btn btn-xs {isOverridden ? 'btn-primary' : 'btn-ghost'} ml-auto mr-2"
        onclick={handleOverride}
      >
        {isOverridden ? 'Clear' : 'Override'}
      </button>
    {/if}
  <input
      bind:this={inputRef}
      id={`toggle-${label}`}
      type="checkbox"
      class="toggle toggle-primary"
      class:ghost={isOverride && !isOverridden}
      checked={isOverridden ? overrideValue : (checked ?? false)}
      onchange={handleChange}
    />
</div>

<style>
  .toggle-control {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .label {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
  }

  .btn-ghost {
    display: none;
  }

  .toggle.ghost {
  --tw-border-opacity: 1;
  border-color: hsl(var(--bc) / var(--tw-border-opacity));
  background-color: transparent;
  opacity: 0.3;
  --togglehandleborder: 0 0 0 3px hsl(var(--bc)) inset,
      var(--handleoffsetcalculator) 0 0 3px hsl(var(--bc)) inset;
}
</style>


