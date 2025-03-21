# Bookcase Configuration Specification

## Overview
The bookcase configurator allows customers to customize a bookcase with various dimensions, styles, materials, and accessories before purchase. This interactive 3D tool provides real-time visualization and configuration options.

## User Interface Requirements
- 3D visualization area showing the current bookcase configuration
- Configuration panel with organized sections for different customization options
- Responsive design that works on both desktop and mobile devices
- Preset gallery for quick selection of predefined designs
- Save/load functionality for custom configurations
- Clear visual feedback when configuration changes

## Technical Requirements
- Reference: `.cursor/rules/technologies/3d-components.mdc`
- Reference: `.cursor/rules/technologies/state-management.mdc`

## Configuration Options

### Dimensions
- Width: 50-200cm (1cm increments)
- Height: 100-300cm (25cm increments, shelf height intervals)
- Depth: 24, 32, or 40cm (fixed options)
- Constraints: Total height must not exceed 300cm for stability

### Style
- Grid: Even grid with consistent spacing
- Asymmetric: Varied compartment sizes for visual interest
- Staggered: Offset shelves for a dynamic look
- Minimal: Clean design with fewer dividers
- Visual preview for each style option

### Materials
- Color options: White, Black, Oak, Walnut, Pine, Cherry, Maple, Mahogany
- Color selection via swatches with visual feedback
- Optional back panel: On/Off toggle

### Density
- Low: Fewer dividers, wider spacing between shelves
- Medium: Balanced shelf distribution (default)
- High: More dividers, compact storage
- Visual description and example for each density level

### Row Configuration
- Individual row height adjustment: Small (25cm), Medium (35cm), Large (45cm)
- Accessed through contextual menu when hovering over a row
- Real-time updates to the 3D model when adjustments are made

### Compartment Configuration
- Type selection: Open (default), Door, Drawer
- Configuration through dedicated modal interface
- Contextual constraints (e.g., drawers require minimum depth)

## Functional Requirements

### 3D Visualization
1. Real-time rendering of bookcase with all configuration changes
2. Smooth transitions when dimensions or features change
3. Interactive camera controls (rotate, zoom, pan)
4. Proper lighting and materials for realistic appearance
5. Mobile-optimized performance with reduced polygon count

### State Management
1. Central configuration store using Zustand
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

## Calculations and Derived Values
- Total price calculation based on dimensions, materials, and compartments
- Volume and weight calculations for shipping estimates
- Material quantities for inventory management
- Divider positions calculated based on style and density

## Acceptance Criteria
- [ ] User can adjust all dimensions within allowed ranges
- [ ] All style options correctly transform the 3D model
- [ ] Material/color changes update in real-time
- [ ] Back panel can be toggled on/off
- [ ] Density settings correctly adjust the number of dividers
- [ ] Row heights can be individually customized
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
- Combination validation: Prevent invalid combinations of options

## Performance Targets
- Initial load time: < 3 seconds on desktop, < 5 seconds on mobile
- Interaction response time: < 100ms for UI changes
- 3D update latency: < 200ms after configuration change
- Target frame rate: 60fps on desktop, 30fps on mobile
- Memory usage: < 200MB on desktop, < 100MB on mobile
