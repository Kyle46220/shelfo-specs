# Configurator Cart Integration Specification

## Overview
The cart integration feature enables custom product configurations to be added to the shopping cart, preserving all customization details for checkout and order processing.

## User Interface Requirements
- "Add to Cart" button in configurator
- Configuration summary in cart line item
- Visual thumbnail of configured product in cart
- Option to edit configuration from cart
- Price calculation reflecting configuration options
- Confirmation feedback when configuration is added to cart

## Technical Requirements
- Reference: `.cursor/rules/technologies/medusa-integration.mdc`
- Reference: `.cursor/rules/technologies/state-management.mdc` (Note: Now using Valtio instead of Zustand)

## Functional Requirements

### Configuration to Cart Process
1. Capture complete configuration state when adding to cart
2. Validate configuration against manufacturing constraints
3. Generate configuration summary for cart display
4. Create or update line item with configuration metadata
5. Store reference to base preset if applicable
6. Calculate final price based on configuration options

### Cart Line Item Display
1. Show product name with "Custom" indicator
2. Display configuration summary (key attributes)
3. Show thumbnail representing the configuration
4. Display calculated price based on configuration
5. Provide "Edit" button to return to configurator with settings

### Metadata Structure
1. Full configuration data stored in line item metadata
2. Preset ID reference maintained if applicable
3. Human-readable summary generated for order processing
4. Manufacturing specifications included for production
5. Version information to support future schema changes

## Data Flow

### Adding to Cart
```
User Action       -> System Response           -> Data Storage
─────────────────────────────────────────────────────────────
Click "Add to     -> Validate configuration    -> Create configuration
Cart"             -> Calculate final price     -> metadata
                  -> Generate summary          -> Add line item to cart
                  -> Create thumbnail          -> Store in session
                  -> Provide confirmation      -> Update cart count
```

### Editing from Cart
```
User Action       -> System Response           -> Data Storage
─────────────────────────────────────────────────────────────
Click "Edit"      -> Load configuration        -> Retrieve metadata
in cart           -> Initialize configurator   -> Restore state
                  -> Position at edit view     -> Set editing mode
                  -> Restore 3D model          -> Flag cart item as
                                                 being edited
```

## Data Structure

### Cart Metadata
```typescript
interface LineItemConfiguratorMetadata {
  // Complete configuration data
  configuration: ProductConfiguration;
  
  // Reference to preset if derived from one
  presetId?: string;
  
  // Flag indicating if configuration was modified from preset
  isCustomized: boolean;
  
  // Human-readable summary for order display
  configurationSummary: {
    dimensions: string;      // e.g. "120×200×30cm"
    color: string;           // e.g. "Oak"
    style: string;           // e.g. "Grid"
    additionalFeatures: string[]; // e.g. ["Back panel", "2 drawers"]
  };
  
  // Version info for schema evolution
  configuratorSnapshot: {
    productType: string;
    version: string;
    timestamp: string;
  };
  
  // Additional metadata for manufacturing
  manufacturingSpecs?: {
    materialCode: string;
    shelfPositions: number[];
    dividerPositions: number[][];
    componentCodes: Record<string, string>;
  };
}
```

### Medusa Integration

```javascript
// Example function to add configured product to cart
async function addConfigurationToCart(variantId, configuration, presetId) {
  // Validate configuration
  if (!validateConfiguration(configuration)) {
    throw new Error("Invalid configuration");
  }
  
  // Generate metadata
  const metadata = {
    configuration,
    presetId,
    isCustomized: !!presetId && isConfigurationModified(configuration),
    configurationSummary: generateSummary(configuration),
    configuratorSnapshot: {
      productType: configuration.productType,
      version: "1.0",
      timestamp: new Date().toISOString()
    },
    manufacturingSpecs: generateManufacturingSpecs(configuration)
  };
  
  // Add to cart using Medusa SDK
  return await sdk.client.carts.addLineItem({
    cart_id: cartId,
    variant_id: variantId,
    quantity: 1,
    metadata
  });
}
```

## User Experience Flow

1. **Configuration Completion**:
   - User finalizes product configuration
   - "Add to Cart" button becomes prominent
   - Price calculation shows final amount

2. **Adding to Cart**:
   - User clicks "Add to Cart" button
   - System validates configuration
   - Visual confirmation animation/message
   - Cart count updates
   - Option to continue shopping or go to cart

3. **Cart Review**:
   - Cart shows custom product line item
   - Configuration summary visible
   - Accurate price based on customizations
   - Thumbnail shows custom configuration

4. **Configuration Editing**:
   - User clicks "Edit" on cart line item
   - Redirected to configurator
   - Previous configuration loaded
   - After editing, updates existing cart item

5. **Checkout Process**:
   - Configuration details preserved through checkout
   - Order confirmation includes configuration details
   - Manufacturing specifications included in order

## Thumbnail Generation

For MVP, thumbnails will use preset images with adjustments for color:

1. Select base image for product type and style
2. Apply color overlay or swap to match configuration
3. Add basic dimension indicators
4. Store as cart line item image
5. Future enhancement: Generate actual rendering of configuration

## Pricing Calculation

```javascript
// Calculate price based on configuration
function calculatePrice(basePrice, configuration) {
  let price = basePrice;
  
  // Add dimension-based price
  const volume = configuration.dimensions.width * 
                 configuration.dimensions.height * 
                 configuration.dimensions.depth / 1000000; // cubic meters
  price += volume * PRICE_PER_CUBIC_METER;
  
  // Add material price adjustment
  const materialMultiplier = MATERIAL_PRICE_FACTORS[configuration.color] || 1;
  price *= materialMultiplier;
  
  // Add feature-based prices
  if (configuration.backPanel) {
    price += BACK_PANEL_PRICE;
  }
  
  // Add component prices
  configuration.components.forEach(component => {
    price += COMPONENT_PRICES[component.type] || 0;
  });
  
  return Math.round(price * 100) / 100; // Round to 2 decimal places
}
```

## Error Handling

1. Invalid configuration detection before adding to cart
2. Network failure handling during cart operations
3. Version mismatch detection for edited configurations
4. Recovery options if configuration cannot be loaded
5. Validation before checkout to ensure manufacturability

## Acceptance Criteria
- [ ] User can add custom configuration to cart
- [ ] Configuration details are preserved in cart
- [ ] Cart displays accurate price based on configuration
- [ ] Cart shows appropriate thumbnail for configuration
- [ ] User can edit configuration from cart
- [ ] Edited configuration updates existing cart item
- [ ] Configuration details are preserved through checkout
- [ ] Order metadata includes all manufacturing details
- [ ] System prevents adding invalid configurations to cart
- [ ] Price calculations are accurate for all configuration options

## Future Enhancements
1. Dynamic thumbnail generation from 3D model
2. Configuration comparison in cart
3. "Duplicate and modify" option for cart items
4. Saved configurations library for repeat purchasing
5. Quantity selection for identical configured items