# Component-Based Architecture Specification

## Overview
The component-based architecture provides a flexible foundation for the Shelfo configurator by treating furniture as compositions of reusable components. This approach enables greater modularity, improves code reuse, and simplifies support for multiple product types.

## Business Purpose
- Enable creation of complex furniture from simple components
- Allow sharing of common elements across different product types
- Simplify addition of new furniture components
- Improve maintainability and testability of the codebase
- Support manufacturing processes that assemble furniture from components

## Core Components

### Base Component Interface

All components in the system inherit from a common `ProductComponent` interface:

```typescript
// Common Base Component Interface
export interface ProductComponent {
  id: string;
  type: string;
  position: Position3D;
  dimensions: Dimensions;
  material: Material;
  color: Color;
  visible: boolean;
}
```

### Component Types

The system includes specialized component types for different furniture elements:

#### Structural Components
- **Dividers**: Vertical panels that divide the furniture
- **Shelves**: Horizontal surfaces for storage
- **Supports**: Structural elements that provide stability
- **Tops**: Upper surfaces for tables, desks, etc.

#### Functional Components
- **Doors**: Hinged panels for enclosed storage
- **Drawers**: Sliding storage compartments
- **Legs**: Support elements that elevate furniture
- **Accessories**: Additional elements like lights, hooks, etc.

### Component Registry

Components are registered in a central registry for discovery and instantiation:

```typescript
interface ComponentDefinition {
  name: string;
  factory: (props: any) => ProductComponent;
  defaultProps: Record<string, any>;
  constraints: {
    compatibleWith: string[];
    minDimensions?: Partial<Dimensions>;
    maxDimensions?: Partial<Dimensions>;
    allowedMaterials?: Material[];
    allowedColors?: Color[];
  };
  renderComponent: React.FC<any>;
}

// Component registry
const componentRegistry: Record<string, ComponentDefinition> = {
  divider: {
    name: 'Divider',
    factory: createDivider,
    defaultProps: { /* defaults */ },
    constraints: { /* constraints */ },
    renderComponent: DividerComponent
  },
  // Additional components...
};
```

## Implementation Details

### Component Creation and Management

Components are instantiated through factory functions that ensure proper initialization:

```typescript
function createDivider(props: Partial<Divider>): Divider {
  return {
    id: props.id || generateId(),
    type: 'divider',
    position: props.position || { x: 0, y: 0, z: 0 },
    dimensions: {
      width: props.dimensions?.width || 2,
      height: props.dimensions?.height || 30,
      depth: props.dimensions?.depth || 30
    },
    material: props.material || 'wood',
    color: props.color || 'white',
    visible: props.visible !== undefined ? props.visible : true
  };
}
```

### Component Composition

Products are composed by combining multiple components:

```typescript
interface ProductComposition {
  id: string;
  productType: ProductTypeName;
  components: ProductComponent[];
  materialGroups: MaterialGroup[];
}

function createBookcase(config: BookcaseConfig): ProductComposition {
  // Create basic structure
  const structure = createBookcaseStructure(config);
  
  // Add shelves
  const shelves = createShelves(config, structure);
  
  // Add dividers
  const dividers = createDividers(config, structure);
  
  // Add accessories
  const accessories = createAccessories(config);
  
  // Group by material
  const materialGroups = groupByMaterial([...structure, ...shelves, ...dividers, ...accessories]);
  
  return {
    id: generateId(),
    productType: 'bookcase',
    components: [...structure, ...shelves, ...dividers, ...accessories],
    materialGroups
  };
}
```

### Component Interaction

Components may need to interact with or reference other components:

```typescript
interface ComponentRelation {
  sourceId: string;
  targetId: string;
  type: 'supports' | 'connects' | 'contains' | 'attaches';
  metadata?: Record<string, any>;
}

// Example: Shelf supported by dividers
const relations: ComponentRelation[] = [
  { sourceId: 'divider1', targetId: 'shelf1', type: 'supports' },
  { sourceId: 'divider2', targetId: 'shelf1', type: 'supports' }
];
```

## 3D Rendering

Components are rendered in the 3D scene using React Three Fiber:

```jsx
// Component rendering in React Three Fiber
function ComponentRenderer({ component }: { component: ProductComponent }) {
  const renderMap = {
    'divider': DividerMesh,
    'shelf': ShelfMesh,
    'leg': LegMesh,
    'tabletop': TabletopMesh,
    'door': DoorMesh,
    'drawer': DrawerMesh
  };
  
  const ComponentMesh = renderMap[component.type];
  
  if (!ComponentMesh) {
    console.warn(`No renderer found for component type: ${component.type}`);
    return null;
  }
  
  return <ComponentMesh component={component} />;
}

// Product renderer composes all components
function ProductRenderer({ components }: { components: ProductComponent[] }) {
  return (
    <group>
      {components.map(component => (
        <ComponentRenderer key={component.id} component={component} />
      ))}
    </group>
  );
}
```

## Material Groups

Components can be grouped by material to optimize rendering and track material usage:

```typescript
interface MaterialGroup {
  id: string;
  name: string;
  components: string[]; // IDs of components in this group
  material: Material;
  color: Color;
}

function groupByMaterial(components: ProductComponent[]): MaterialGroup[] {
  const groups: Record<string, MaterialGroup> = {};
  
  components.forEach(component => {
    const key = `${component.material}-${component.color}`;
    
    if (!groups[key]) {
      groups[key] = {
        id: generateId(),
        name: `${component.color} ${component.material}`,
        components: [],
        material: component.material,
        color: component.color
      };
    }
    
    groups[key].components.push(component.id);
  });
  
  return Object.values(groups);
}
```

## State Management

The Valtio state store manages components with reactive updates:

```typescript
const componentStore = proxy({
  components: {} as Record<string, ProductComponent>,
  
  // Add a component to the store
  addComponent(component: ProductComponent) {
    componentStore.components[component.id] = component;
  },
  
  // Update a component
  updateComponent(id: string, updates: Partial<ProductComponent>) {
    if (componentStore.components[id]) {
      Object.assign(componentStore.components[id], updates);
    }
  },
  
  // Remove a component
  removeComponent(id: string) {
    delete componentStore.components[id];
  }
});
```

## Configuration Persistence

Component-based configurations are serialized for storage and sharing:

```typescript
interface SerializedConfiguration {
  id: string;
  productType: ProductTypeName;
  components: SerializedComponent[];
  materialGroups: MaterialGroup[];
  metadata: Record<string, any>;
}

type SerializedComponent = Omit<ProductComponent, 'id'> & { id: string };

function serializeConfiguration(config: ProductConfiguration): SerializedConfiguration {
  return {
    id: config.id,
    productType: config.productTypeId as ProductTypeName,
    components: config.components.map(component => ({
      ...component,
      id: component.id
    })),
    materialGroups: config.materialGroups,
    metadata: config.metadata
  };
}

function deserializeConfiguration(serialized: SerializedConfiguration): ProductConfiguration {
  // Reconstruct configuration from serialized data
}
```

## Interaction Model

User interactions target specific components:

```typescript
interface ComponentInteraction {
  type: 'select' | 'hover' | 'drag' | 'resize' | 'modify';
  componentId: string;
  position?: Position3D;
  value?: any;
}

function handleComponentInteraction(interaction: ComponentInteraction) {
  const component = componentStore.components[interaction.componentId];
  
  if (!component) return;
  
  switch (interaction.type) {
    case 'select':
      selectComponent(component);
      break;
    case 'hover':
      highlightComponent(component);
      break;
    case 'drag':
      if (interaction.position) {
        moveComponent(component, interaction.position);
      }
      break;
    // Handle other interaction types
  }
}
```

## Manufacturing Output

Component data is structured for manufacturing:

```typescript
interface ManufacturingSpec {
  componentType: string;
  material: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  quantity: number;
  finishing: string[];
  assemblyInstructions: string[];
}

function generateManufacturingSpecs(components: ProductComponent[]): ManufacturingSpec[] {
  // Group similar components and generate manufacturing specs
}
```

## Integration Points

### Product Type System
- Components are used to construct different product types
- Product types define which components are valid for their construction
- Construction rules determine component positioning and relationships

### Pricing System
- Component-based pricing calculation
- Material usage computed from components
- Component complexity factors into pricing

### 3D Visualization
- Component-based rendering in React Three Fiber
- Optimization through instanced meshes for similar components
- Dedicated renderers for each component type

## Success Criteria
- [ ] All furniture types can be represented as compositions of components
- [ ] Components are reusable across different product types
- [ ] New component types can be added without significant code changes
- [ ] 3D rendering accurately represents all component types
- [ ] Component interactions (selection, modification) work correctly
- [ ] Material groups correctly track material usage
- [ ] Configurations can be serialized and deserialized without data loss 