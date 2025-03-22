# Shelfo 3D Furniture Configurator Specifications

## Overview
This document serves as the master specification for the Shelfo 3D furniture configurator. It provides a comprehensive overview of all features, technical requirements, and business constraints for the MVP.

## Core Features

### 1. 3D Product Configurator
- Interactive 3D visualization of configurable furniture products
- Real-time rendering of configuration changes
- Support for multiple product types (bookcase, table, desk, console) using a flexible type system
- Component-based architecture for product composition
- Style and material selection
- Dimension adjustments with manufacturing constraints
- Comprehensive debugging system for R3F components

### 2. Product Registry System
- Type-based product definition system using discriminated union pattern
- Style configuration through centralized definition files
- Manufacturing constraints encoded in product definitions
- Extensible to new product types without code changes

### 3. Preset Configuration System
- Pre-defined product configurations for quick selection
- Gallery view of available presets
- Ability to customize from preset starting points
- User-saved configurations
- Collection-based organization of presets

### 4. Backend Integration
- Frontend-based pricing calculation with product-type aware formulas
- Configurator state persistence
- User authentication and saved configurations
- Order history with configuration details

## Technical Architecture

### Frontend
- Next.js 15 App Router for routing and server components
- React Three Fiber for 3D visualization
- Valtio for state management
- TypeScript for type safety with discriminated union patterns
- Tailwind CSS for styling
- Shadcn components for UI elements
- R3F debugging tools for scene inspection and testing

### Backend
- Simple backend with RESTful API endpoints
- JSON-based pricing system with frontend calculation
- Persistent configuration storage
- User profiles and authentication

## Implementation Priorities

### MVP Phase (Current)
1. Flexible type system implementation
2. R3F debugging system implementation
3. Bookcase configurator core functionality 
4. Table configurator core functionality
5. Basic preset selection
6. Style and material configuration
7. Component-based customization
8. Frontend pricing calculation
9. Cart integration

### Phase 2
1. User configuration saving
2. Additional product types (desk, console)
3. Advanced compartment options
4. Admin interface for product definition and pricing
5. Order management for custom products

## Dependencies and Constraints

### Business Constraints
- Non-technical staff must be able to define products
- Manufacturing limitations must be enforced in UI
- Pricing must update in real-time with configuration changes
- Mobile performance must be acceptable

### Technical Constraints
- 3D model performance on mobile devices
- WebGL compatibility across browsers
- State management complexity with polymorphic product types
- Database structure for product configurations
- Debugging capabilities in production environments

## Performance Targets
- Initial load: < 3s on desktop, < 5s on mobile
- Interaction response: < 100ms
- 3D update latency: < 200ms
- Target frame rate: 60fps desktop, 30fps mobile

## References
- [Product Type System](./architecture/product-type-system.specs.md)
- [Component-Based Architecture](./architecture/component-based-architecture.specs.md)
- [Bookcase Configuration](./configurator/bookcase-configuration.specs.md)
- [Table Configuration](./configurator/table-configuration.specs.md)
- [Row Height Adjustment](./configurator/row-height-adjustment.specs.md)
- [Preset Selection](./configurator/preset-selection.specs.md)
- [3D Visualization](./configurator/3d-visualization.specs.md)
- [Cart Integration](./integration/cart-integration.specs.md)
- [Product Registry System](./architecture/product-registry-system.specs.md)
- [Backend Integration](./integration/backend-integration.specs.md)
- [Pricing System](./integration/pricing-system.specs.md)
- [Business Requirements](./business-requirements.specs.md)
- [State Management](./state-management/valtio-state.specs.md)
- [UI Components](./ui/ui-components.specs.md)
- [R3F Debugging System](./r3f-debugging.specs.md)

## Success Criteria
The MVP will be considered successful when:
1. Users can fully configure multiple product types using the flexible type system
2. Real-time pricing calculations accurately reflect configurations for all product types
3. Presets can be selected and customized for different product types
4. The system enforces all manufacturing constraints
5. The 3D visualization accurately represents the final product
6. Mobile users can use all configurator features
7. User configurations can be saved and retrieved
8. The debugging system enables effective troubleshooting of 3D components
9. AI agents can effectively debug and modify R3F components without direct visual feedback
10. Scene state can be captured and analyzed for testing and verification
