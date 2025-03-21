# Shelfo 3D Furniture Configurator

This repository contains the specifications for the Shelfo 3D Furniture Configurator, a web application that allows users to customize furniture products in real-time with 3D visualization.

## Project Overview

The Shelfo configurator is a web-based application that enables users to:

- Customize furniture dimensions, materials, and components
- Visualize changes in real-time with 3D rendering
- Select from predefined presets as starting points
- Save and retrieve custom configurations
- Calculate pricing based on selected options
- Add configurations to cart for purchase

The project uses a component-based architecture with a flexible type system to support multiple furniture types while maintaining a clean, modern user interface.

## Specification Structure

This repository follows Glen Huntley's specs approach for AI agent development, organizing specifications into logical domains:

```
/specs
  SPECS.md                         # Master specification overview
  business-requirements.specs.md   # Business requirements and constraints
  frontend-architecture.specs.md   # Frontend architecture specifications
  backend-architecture.specs.md    # Backend architecture specifications
  /architecture
    product-definition.specs.md    # Product type system and definitions
    product-type-system.specs.md   # Type system for product configuration
    component-based-architecture.specs.md # Component architecture
  /configurator
    3d-visualization-specs.md      # 3D visualization system
  /integration
    backend-integration.specs.md   # Backend integration
  /state-management
    valtio-state.specs.md          # State management with Valtio
  /ui
    ui-components.specs.md         # UI components and layout
```

## Core Technologies

### Frontend
- Next.js 15 with App Router
- React Three Fiber (R3F) for 3D rendering
- Valtio for state management
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn UI components

### Backend
- Simple RESTful API
- JSON-based data storage
- JWT authentication
- Pricing calculation system

## Getting Started

To understand the project specifications:

1. Start with [SPECS.md](specs/SPECS.md) for a high-level overview
2. Review [business-requirements.specs.md](specs/business-requirements.specs.md) to understand the project goals
3. Explore the architecture specifications to understand the system design
4. Dive into specific domains based on your area of interest

## Key Features

### Product Type System
The configurator uses a flexible type system to support multiple furniture types:
- Bookcase/Cabinet with customizable shelves, dividers, doors, and drawers
- Tables with customizable dimensions, legs, and tabletops
- Extensible to additional furniture types

### Component-Based Architecture
Furniture is constructed from reusable components:
- Components have properties like position, dimensions, material, and color
- Components can be grouped by material for efficient rendering
- Component interactions allow for intuitive user manipulation

### 3D Visualization
Real-time 3D rendering provides immediate visual feedback:
- React Three Fiber integration with Three.js
- Material system for realistic rendering
- Camera controls for viewing from different angles
- Performance optimizations for mobile devices

### State Management
Valtio provides reactive state management:
- Type-safe state with TypeScript
- Efficient updates with proxy-based reactivity
- History tracking for undo/redo functionality
- Serialization for saving and loading configurations

### Backend Integration
Simple backend provides essential services:
- Configuration storage and retrieval
- User authentication and profiles
- Pricing calculation based on configuration
- Order management for purchases

## Development Approach

This project follows a specification-first approach, where detailed specifications guide the implementation. The specifications are designed to be:

- Comprehensive but not overly complex
- Accessible for junior developers
- Focused on the MVP requirements
- Extensible for future enhancements

## Next Steps

After reviewing these specifications, the next steps would be:

1. Set up the development environment
2. Implement the core product type system
3. Create the basic 3D visualization components
4. Develop the UI for configuration controls
5. Integrate the backend services
6. Test and refine the user experience
