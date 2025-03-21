

## Responsive Design
1. Mobile-specific camera controls with touch support
2. Simplified model for low-end devices
3. UI adaptations for small screens
4. Performance monitoring and throttling
5. Viewport-aware positioning of overlays and modals

## Error Handling and Fallbacks
1. WebGL detection and fallback messaging
2. Error recovery for lost WebGL context
3. Placeholder images for fallback mode
4. Loading error handling and retries
5. Memory leak prevention with proper disposal

## Accessibility Considerations
1. Keyboard navigation for camera controls
2. Alternative text descriptions for 3D elements
3. ARIA labels for interactive components
4. Color contrast compliance for overlays
5. Non-3D alternative for screen readers

## Integration with Configurator UI
1. Synchronized state between 3D view and configuration panel
2. Bidirectional updates when changes occur
3. Highlighted components match active configuration section
4. Camera positioning adjusts to focus on configured area
5. Screenshot capability for order confirmation

## Acceptance Criteria
- [ ] 3D model renders correctly for all product types
- [ ] Camera controls allow rotation, zoom, and pan with appropriate limits
- [ ] Interactive elements highlight on hover
- [ ] Configuration changes update 3D model in real-time
- [ ] Model maintains performance benchmark of 30+ FPS on mid-range devices
- [ ] Mobile view provides appropriate controls and performance
- [ ] All materials and colors render correctly
- [ ] Model dimensions accurately reflect configuration values
- [ ] Compartment hover detection works correctly
- [ ] System degrades gracefully on unsupported browsers
- [ ] Memory usage remains within acceptable limits during extended sessions

## Performance Targets
- Initial load: < 3s on desktop, < 5s on mobile
- Interaction response: < 100ms
- Frame rate: 60fps on desktop, 30fps on mobile
- Memory usage: < 200MB on desktop, < 100MB on mobile
- Model complexity: < 50k polygons for main view

## Future Enhancements
1. AR view for mobile devices
2. Animation sequences for assembly visualization
3. Exploded view for component details
4. Higher resolution textures for zoom views
5. Environment customization (room context)# 3D Visualization Specification

## Overview
The 3D visualization system provides an interactive, real-time representation of configurable products. It allows customers to see their customizations immediately and gives them confidence in their purchase decisions.

## User Interface Requirements
- Interactive 3D model that responds to user input
- Camera controls for rotation, pan, and zoom
- Visual indicators for interactive elements
- Hover states for configurable components
- Loading states during model initialization
- Fallback for browsers without WebGL support
- Responsive scaling for different device sizes
- Visual feedback when configuration changes

## Technical Requirements
- Reference: `.cursor/rules/technologies/3d-components.mdc`
- Reference: `.cursor/rules/technologies/performance.mdc`

## Functional Requirements

### 3D Rendering
1. Real-time rendering of product based on configuration
2. Accurate materials and textures for all product options
3. Physically-based rendering for realistic appearance
4. Optimized models for web performance
5. Level of detail (LOD) adjustments for mobile
6. Proper lighting to showcase product features

### Interactive Elements
1. Camera controls with appropriate limits
   - Rotation around product
   - Zoom in/out with constraints
   - Optional pan for larger products
2. Highlighting of interactive components on hover
3. Selection of components for configuration
4. Visual feedback for selected/active components
5. Transition animations when configuration changes

### Component Interactions
1. Hover over compartment to show configuration modal
2. Click on materials to open material selection
3. Drag handles to adjust dimensions (future enhancement)
4. Visual indicators for manufacturing constraints
5. Highlight invalid configurations with visual cues

## Technical Architecture

### Component Structure
```
3D Scene
├── Camera Setup
├── Lighting
├── Product Model
│   ├── Product-specific Component (BookcaseModel, TableModel)
│   ├── Materials
│   ├── Interactive Elements
│   └── Animation Controllers
└── Environment
```

### Technology Stack
- React Three Fiber for React integration
- Three.js for WebGL rendering
- Drei for common Three.js utilities
- Valtio for state management (migrated from Zustand)
- WebGL for hardware-accelerated rendering

## 3D Models and Assets

### Model Requirements
1. Optimized mesh geometry for web (<50k polygons)
2. Proper UV mapping for textures
3. Named components for interactive selection
4. LOD versions for performance optimization
5. Separate meshes for configurable components

### Material Requirements
1. PBR materials with appropriate properties
2. Material variants for all color options
3. Optimized textures for web loading
4. Fallback materials for lower-end devices
5. Consistent material application across models

## Performance Optimization

### Loading Optimization
1. Progressive loading of 3D assets
2. Loading screen or placeholder during initialization
3. Prioritize essential components first
4. Lazy-load textures and secondary models
5. Asset preloading for common configurations

### Runtime Optimization
1. Frustum culling for off-screen components
2. Instancing for repeated elements
3. Frame rate throttling on mobile devices
4. Memory cleanup for removed components
5. WebGL context management for SPA navigation

## Interaction System

### Camera Controls
```javascript
// Camera constraints
const cameraConstraints = {
  minPolarAngle: Math.PI / 6,   // Limit how high user can orbit
  maxPolarAngle: Math.PI / 2,   // Limit how low user can orbit
  minDistance: 1,               // Limit how close user can zoom
  maxDistance: 4,               // Limit how far user can zoom
  enablePan: true,              // Allow panning
  enableZoom: true              // Allow zooming
};
```

### Hover Detection
```javascript
// Ray-casting for hover detection
function handlePointerMove(event) {
  // Convert mouse position to normalized device coordinates
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Set up raycaster
  raycaster.setFromCamera(mouse, camera);
  
  // Find intersections
  const intersects = raycaster.intersectObjects(interactiveObjects);
  
  if (intersects.length > 0) {
    const hoveredObject = intersects[0].object;
    handleObjectHover(hoveredObject);
  } else {
    clearHoverState();
  }
}
```

## Component Specification: BookcaseModel

### Structure
```javascript
// Logical structure of bookcase model
const bookcaseComponents = {
  frame: {
    leftSide: mesh,
    rightSide: mesh,
    top: mesh,
    bottom: mesh,
    backPanel: mesh
  },
  shelves: [
    { id: 'shelf-1', mesh: mesh, position: [0, y1, 0] },
    { id: 'shelf-2', mesh: mesh, position: [0, y2, 0] },
    // ...additional shelves
  ],
  dividers: [
    { id: 'divider-1', mesh: mesh, position: [x1, y1, 0] },
    // ...additional dividers
  ],
  compartments: [
    { 
      id: 'compartment-1-1', 
      rowIndex: 0, 
      columnIndex: 0,
      mesh: mesh,
      bounds: { width, height, depth },
      position: [x, y, z]
    },
    // ...additional compartments
  ]
};
```

### Interaction Handling
```javascript
// Handle hovering over a bookcase compartment
function handleCompartmentHover(compartment) {
  // Update state
  state.hoveredRow = compartment.rowIndex;
  state.hoveredRowPosition = {
    x: event.clientX,
    y: event.clientY,
    worldPosition: compartment.position
  };
  
  // Highlight the compartment
  compartment.mesh.material.opacity = 0.3;
  
  // Position the configuration modal
  positionConfigModal(event.clientX, event.clientY);
}

// Clear hover state
function clearHoverState() {
  if (state.hoveredRow !== null) {
    // Reset highlight
    const previousRow = findRowByIndex(state.hoveredRow);
    if (previousRow) {
      previousRow.mesh.material.opacity = 0;
    }
    
    // Clear state
    state.hoveredRow = null;
    state.hoveredRowPosition = null;
  }
}