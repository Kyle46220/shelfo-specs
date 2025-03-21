# Preset Selection Specification

## Overview
The preset selection feature allows customers to browse and select from pre-designed product configurations, providing a starting point for customization and reducing the complexity of the configuration process.

## User Interface Requirements
- Gallery view of available presets with visual thumbnails
- Featured/highlighted presets section for marketing promotions
- Clear categorization of preset designs
- Visual indicator for currently selected preset
- Ability to filter presets by attributes (style, color, size)
- Responsive design that works on desktop and mobile
- Preview of preset in 3D before selection
- Seamless transition to configurator when preset is selected

## Technical Requirements
- Reference: `.cursor/rules/technologies/medusa-integration.mdc`
- Reference: `.cursor/rules/technologies/state-management.mdc` (Note: Now using Valtio instead of Zustand)

## Functional Requirements

### Preset Loading
1. Load available presets based on product type
2. Extract preset data from Medusa product variants
3. Parse and validate preset configurations
4. Group and categorize presets by attributes
5. Identify and highlight featured presets

### Preset Selection
1. User can browse presets in gallery view
2. Selecting a preset loads its configuration into the configurator
3. 3D model updates to show the selected preset
4. All configuration controls update to match preset values
5. User can modify the preset after selection
6. "Reset to preset" function reverts changes back to original preset

### Preset Data Management
1. Preset configurations stored in Medusa variant metadata
2. Thumbnail images generated for each preset
3. Preset IDs tracked for order attribution
4. Featured flag for marketing-selected designs
5. Original configurations cached for "reset to preset" functionality

## Data Structure

### Preset Definition
```typescript
interface PresetSummary {
  id: string;           // Unique identifier (typically variant ID)
  name: string;         // Display name
  description: string;  // Description text
  thumbnail: string;    // Path to thumbnail image
  featured?: boolean;   // Whether to highlight this preset
}

interface ConfigurationPreset extends PresetSummary {
  configuration: ProductConfiguration;  // Complete configuration data
}
```

### State Management
```javascript
// In Valtio state (previously Zustand)
{
  // Preset-related state
  presets: [], // Array of available presets
  selectedPresetId: null, // Currently selected preset ID
  originalPresetConfigs: {}, // Cache of original preset configurations
  isModified: false, // Whether current config differs from selected preset
  
  // Actions
  loadPresets: (productType) => { /* Loads presets for product type */ },
  applyPreset: (presetId) => { /* Applies preset configuration */ },
  resetToPreset: () => { /* Resets to original preset configuration */ }
}
```

## User Experience Flow

1. **Initial Entry**:
   - User navigates to product page
   - System detects configurable product
   - User is redirected to preset gallery view
   - Featured presets displayed prominently

2. **Preset Browsing**:
   - User scrolls through available presets
   - Thumbnails provide visual preview of each design
   - Hover states show additional information
   - Optional filters help narrow selection

3. **Preset Selection**:
   - User clicks on desired preset
   - System loads preset configuration
   - Transition to configurator view with 3D model
   - All configuration controls reflect preset settings

4. **Customization**:
   - User modifies preset configuration
   - System tracks changes from original preset
   - "Modified" indicator shows configuration has changed
   - "Reset" option available to revert to original preset

5. **Adding to Cart**:
   - User finalizes configuration
   - System records preset ID and modifications
   - Original preset referenced in order for analytics

## Integration with Medusa

### Variant Mapping
- Each preset corresponds to a Medusa product variant
- Variant metadata contains complete preset configuration
- Variant options can be used for preset categorization
- Variant pricing provides base price for the preset

### Data Extraction
```javascript
// Example of extracting preset from Medusa variant
function extractPresetFromVariant(variant) {
  return {
    id: variant.id,
    name: variant.metadata.preset_name || variant.title,
    description: variant.metadata.preset_description || '',
    thumbnail: variant.metadata.configurator_thumbnail || '',
    featured: variant.metadata.featured || false,
    configuration: variant.metadata.configuration
  };
}
```

### Cart Integration
- When adding to cart, include:
  - Original preset ID for reference
  - Complete modified configuration if customized
  - Flag indicating if configuration was modified

## Acceptance Criteria
- [ ] Preset gallery displays all available presets with thumbnails
- [ ] Featured presets are highlighted and shown prominently
- [ ] Selecting a preset loads its configuration accurately
- [ ] 3D model updates to match the selected preset
- [ ] All configuration controls reflect preset values
- [ ] User can modify preset after selection
- [ ] System tracks whether configuration has been modified
- [ ] "Reset to preset" button restores original configuration
- [ ] Preset selection works on both desktop and mobile
- [ ] Adding to cart includes preset information
- [ ] Pricing updates correctly based on preset and modifications

## Performance Considerations
- Preset gallery should load within 1 second
- Thumbnail images should be optimized for quick loading
- Preset application should complete within 500ms
- Configuration state updates should be batched for efficiency
- Cache original preset configurations to avoid redundant API calls