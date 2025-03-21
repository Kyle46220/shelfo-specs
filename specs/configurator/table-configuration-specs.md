# Table Configuration Specification

## Overview
The table configurator allows customers to customize tables and desks with various dimensions, leg styles, materials, and accessories before purchase. This interactive 3D tool provides real-time visualization and configuration options specific to table-type furniture.

## User Interface Requirements
- 3D visualization area showing the current table configuration
- Configuration panel with organized sections for different customization options
- Responsive design that works on both desktop and mobile devices
- Preset gallery for quick selection of predefined designs
- Save/load functionality for custom configurations
- Clear visual feedback when configuration changes

## Technical Requirements
- Reference: `.cursor/rules/technologies/3d-components.mdc`
- Reference: `.cursor/rules/technologies/valtio-patterns.mdc`

## Configuration Options

### Dimensions
- Width: 60-240cm (5cm increments)
- Length: 60-240cm (5cm increments, for rectangular tables)
- Diameter: 60-180cm (5cm increments, for round tables)
- Height: 40-100cm (5cm increments)
- Thickness: 2-8cm (1cm increments)
- Constraints: Structural stability based on size/weight ratios

### Table Top
- Shape: Rectangular, Round, Oval
- Edge style: Straight, Beveled, Rounded, Live Edge
- Thickness options: Thin (2-3cm), Standard (4-5cm), Thick (6-8cm)
- Visual preview for each option

### Leg Style
- Design options:
  - Straight: Clean, minimal design
  - Angled: Modern, angled outward
  - Tapered: Gradually narrowing toward the floor
  - Hairpin: Thin metal legs with industrial aesthetic
  - Pedestal: Central support for round tables
- Material matching or contrasting with tabletop
- Position adjustment for certain leg styles

### Materials
- Wood options: Oak, Walnut, Pine, Maple, Cherry, Mahogany
- Metal options: Black Steel, Chrome, Brass
- Glass option for tabletop
- Color selection via swatches with visual feedback
- Finish options: Matt, Satin, Gloss, Oiled

### Accessories
- Cable management solutions
- Integrated outlets/USB ports
- Under-table storage
- Extensions/leaves for expandable tables
- Configurable arrangement of accessories

## Functional Requirements

### 3D Visualization
1. Real-time rendering of table with all configuration changes
2. Smooth transitions when dimensions or features change
3. Interactive camera controls (rotate, zoom, pan)
4. Proper lighting and materials for realistic appearance
5. Mobile-optimized performance with reduced polygon count

### State Management
1. Central configuration store using Valtio
2. State persistence between sessions
3. Undo/redo functionality for configuration changes
4. Preset management with loading/saving
5. Dynamic recalculation of pricing

### Medusa Integration
1. Custom variant metadata for storing configurations
2. Line item customization in cart
3. Order metadata for manufacturing specifications
4. Configuration thumbnails for order history
5. Unique configuration IDs for reference

## Implementation Details

### Table Component Structure
```typescript
interface TableConfiguration {
  dimensions: {
    width: number;
    length?: number;
    diameter?: number;
    height: number;
    thickness: number;
  };
  tabletop: {
    shape: 'rectangular' | 'round' | 'oval';
    edgeStyle: 'straight' | 'beveled' | 'rounded' | 'live';
    material: Material;
    color: Color;
    finish: 'matt' | 'satin' | 'gloss' | 'oiled';
  };
  legs: {
    style: LegStyle;
    material: Material;
    color: Color;
    position: 'standard' | 'inset' | 'outset';
    customPositions?: Position2D[];
  };
  accessories: {
    cableManagement: boolean;
    outlets: boolean;
    storage: boolean;
    extensions: boolean;
  };
}
```

### Component Creation
```typescript
function createTable(config: TableConfiguration): ProductComposition {
  // Create tabletop component
  const tabletop = createTabletop(config);
  
  // Create legs
  const legs = createLegs(config);
  
  // Create accessories
  const accessories = createAccessories(config);
  
  // Group by material
  const materialGroups = groupByMaterial([tabletop, ...legs, ...accessories]);
  
  return {
    id: generateId(),
    productType: 'table',
    components: [tabletop, ...legs, ...accessories],
    materialGroups
  };
}
```

### Leg Positioning Algorithm
```typescript
function calculateLegPositions(config: TableConfiguration): Position3D[] {
  const positions: Position3D[] = [];
  const { width, length, diameter, height } = config.dimensions;
  const legStyle = config.legs.style;
  const legPosition = config.legs.position;
  
  // If round table with pedestal
  if (legStyle === 'pedestal' && config.tabletop.shape === 'round') {
    positions.push({ x: 0, y: -height/2, z: 0 });
    return positions;
  }
  
  // For rectangular tables
  if (config.tabletop.shape === 'rectangular' || config.tabletop.shape === 'oval') {
    const actualWidth = width;
    const actualLength = length || width;
    
    // Calculate inset values based on position setting
    const insetX = legPosition === 'inset' ? 15 : legPosition === 'outset' ? -15 : 5;
    const insetZ = legPosition === 'inset' ? 15 : legPosition === 'outset' ? -15 : 5;
    
    // Four corners
    positions.push({ x: actualWidth/2 - insetX, y: -height/2, z: actualLength/2 - insetZ });
    positions.push({ x: -actualWidth/2 + insetX, y: -height/2, z: actualLength/2 - insetZ });
    positions.push({ x: -actualWidth/2 + insetX, y: -height/2, z: -actualLength/2 + insetZ });
    positions.push({ x: actualWidth/2 - insetX, y: -height/2, z: -actualLength/2 + insetZ });
  } else {
    // For round tables with 4 legs
    const radius = diameter ? diameter/2 : width/2;
    const inset = legPosition === 'inset' ? 15 : legPosition === 'outset' ? -15 : 5;
    const effectiveRadius = radius - inset;
    
    // Four positions at 45, 135, 225, 315 degrees
    for (let angle = 45; angle < 360; angle += 90) {
      const radians = angle * Math.PI / 180;
      positions.push({
        x: Math.cos(radians) * effectiveRadius,
        y: -height/2,
        z: Math.sin(radians) * effectiveRadius
      });
    }
  }
  
  return positions;
}
```

## Calculations and Derived Values
- Total price calculation based on dimensions, materials, and accessories
- Volume and weight calculations for shipping estimates
- Material quantities for inventory management
- Structural integrity validation for configuration
- Center of gravity calculation for stability analysis

## Acceptance Criteria
- [ ] User can adjust all dimensions within allowed ranges
- [ ] Shape selection correctly transforms the table visualization
- [ ] All leg styles correctly render and position
- [ ] Material/color changes update in real-time
- [ ] Edge style changes reflect accurately in the model
- [ ] Accessories can be added and removed
- [ ] Preset designs load correctly with all parameters
- [ ] Custom configurations can be saved and reloaded
- [ ] All changes persist when returning to the configurator
- [ ] Mobile view provides appropriate controls and performance
- [ ] Pricing updates correctly with all configuration changes
- [ ] Configuration data correctly transfers to cart and order

## Edge Cases and Error Handling
- Unsupported browsers: Provide fallback to static images
- WebGL failures: Graceful degradation with 2D representation
- Memory limits: Progressive loading for complex configurations
- Touch interaction: Alternative controls for mobile users
- Invalid combinations: Prevent structurally unstable configurations
- Maximum size constraints based on material strength

## Performance Targets
- Initial load time: < 3 seconds on desktop, < 5 seconds on mobile
- Interaction response time: < 100ms for UI changes
- 3D update latency: < 200ms after configuration change
- Target frame rate: 60fps on desktop, 30fps on mobile
- Memory usage: < 200MB on desktop, < 100MB on mobile

## Integration with Other Products
- Coordinated style options with bookcase configurator
- Matching material options across product types
- Compatibility with desk accessories in future desk configurator
- Cohesive preset collections spanning multiple product types 