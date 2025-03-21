# Product Registry System Specification

## Business Purpose
The product registry system enables non-technical staff to define, update, and manage configurable products without developer intervention. It serves as a "single source of truth" for product configuration options, manufacturing constraints, and visual styling.

## System Overview
The product registry is a structured configuration system that defines:
1. Available product types (bookcase, table, etc.)
2. Configuration options for each product type
3. UI constraints and validation rules
4. Style definitions and visual appearance
5. Manufacturing constraints and business rules

## Architecture

### Core Components

#### Product Registry
The central registry defining all available product types and their default configurations:

```
productRegistry: {
  bookcase: {
    defaultConfig: {...},
    uiOptions: {...},
    layoutFormula: (config) => {...}
  },
  table: {
    defaultConfig: {...},
    uiOptions: {...},
    layoutFormula: (config) => {...}
  }
}
```

#### Style Configuration
A separate configuration system defining the visual styles and layout calculations:

```
styleDefinitions: {
  grid: {
    label: "Grid",
    spacingParams: {...},
    calculateDividers: (width, sectionCount, dividerCount) => {...}
  },
  asymmetric: {
    label: "Asymmetric",
    spacingParams: {...},
    calculateDividers: (width, sectionCount, dividerCount) => {...}
  }
}
```

### Data Flow

1. **Product Definition**: Marketing/product team updates the product registry configuration
2. **Application Loading**: System loads product definitions on startup
3. **UI Generation**: Configuration UI dynamically generated based on product definitions
4. **User Interaction**: User selects options within defined constraints
5. **Visual Rendering**: 3D model and UI updated based on selected options
6. **Validation**: Selections validated against manufacturing constraints
7. **Persistence**: Final configuration saved as variant or order metadata

## Key Features

### Product Definition Schema

Each product type is defined with:

1. **Default Configuration**: Starting values for all configurable properties
2. **UI Options**: Available choices, ranges, and steps for each property
3. **Layout Formula**: Function to calculate layout based on configuration
4. **Manufacturing Constraints**: Min/max values and validation rules
5. **Material Options**: Available materials and finishes

Example:
```javascript
bookcase: {
  defaultConfig: {
    dimensions: { width: 103, height: 250, depth: 24 },
    color: "white",
    style: { pattern: "grid" },
    density: { level: "medium" },
    // Additional properties...
  },
  uiOptions: {
    dimensions: {
      width: { min: 50, max: 200, step: 1, unit: "cm" },
      height: { min: 100, max: 300, step: 25, unit: "cm" },
      depth: { options: [24, 32, 40], unit: "cm" },
    },
    colors: ["white", "black", "oak", "walnut", "pine"],
    // Additional UI options...
  }
}
```

### Style System

Styles are defined with:

1. **Visual Properties**: Names, labels, and descriptions
2. **Spacing Parameters**: Min, target, and max spacing values
3. **Layout Calculations**: Functions for determining positioning
4. **Visualization Hints**: How to render the style in 3D

### Manufacturing Constraints

Constraints are encoded as:

1. **Dimensional Limits**: Minimum and maximum sizes
2. **Material Compatibility**: Valid combinations of options
3. **Structural Rules**: Stability and support requirements
4. **Production Limitations**: Manufacturability constraints

## Technical Implementation

### State Management

- Primary storage in Valtio state (migrated from Zustand)
- Note: The previous implementation used Zustand and has been deprecated in favor of Valtio
- State structure follows the product registry schema
- Proxy-based reactivity for efficient updates

### Data Storage

- Product definitions stored in JavaScript modules
- Future enhancement: Move to database or CMS for admin UI
- Presets stored as Medusa variant metadata
- User configurations stored in session, local storage and order metadata

### Extensibility

- New product types can be added by extending the registry
- New configuration options require minimal code changes
- Style system can be extended with new visual patterns
- Manufacturing constraints can be updated independently

## Integration Points

### Medusa Backend Integration

- Product types map to Medusa product categories
- Presets map to Medusa product variants
- Custom configurations stored in line item metadata
- Manufacturing details transmitted through order metadata

### 3D Visualization Integration

- Registry provides parameters for 3D model generation
- Style system influences visual appearance of models
- Manufacturing constraints ensure accurate representation

### UI Component Integration

- Registry defines available UI controls
- UI options determine ranges, steps, and choices
- Dynamic form generation based on product type

## Phase 1 MVP Implementation

For the MVP, the product registry will be implemented as JavaScript modules:

1. `productRegistry.js`: Defines product types and their configurations
2. `styleConfig.js`: Defines visual styles and layout calculations

This approach provides the flexibility needed while minimizing development complexity. In future phases, these can be migrated to a database-backed admin interface.

## Future Enhancements

1. **Admin Interface**: Web-based UI for managing product definitions
2. **Database Storage**: Move from JS modules to database records
3. **Version Control**: Track changes to product definitions
4. **Analytics Integration**: Track popular configurations
5. **Configuration Rules Engine**: More complex interdependent constraints

## Success Criteria

The product registry system will be successful when:

1. Marketing team can update product options without developer assistance
2. New product types can be added within 1 day by non-technical staff
3. Manufacturing constraints are consistently enforced
4. System maintains performance with 20+ product types
5. UI dynamically reflects all configuration options