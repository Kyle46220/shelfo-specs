# Component-Based Architecture Specifications

## Overview
This document specifies the component-based architecture for the Shelfo furniture configurator. This architecture enables flexible, modular construction of furniture products from reusable components.

## Core Concepts

### Component Model
Components are the building blocks of furniture products:

```typescript
// Base component interface
export interface ProductComponent {
  id: string;
  type: string;
  position: Position3D;
  rotation: Rotation3D;
  dimensions: Dimensions;
  material: Material;
  color: Color;
  visible: boolean;
  metadata: Record<string, any>;
}

// Position in 3D space
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// Rotation in 3D space
export interface Rotation3D {
  x: number;
  y: number;
  z: number;
}

// Dimensions
export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}
```

### Component Types
Specific component types extend the base interface:

```typescript
// Shelf component
export interface ShelfComponent extends ProductComponent {
  type: 'shelf';
  thickness: number;
  edgeStyle: EdgeStyle;
}

// Divider component
export interface DividerComponent extends ProductComponent {
  type: 'divider';
  thickness: number;
}

// Door component
export interface DoorComponent extends ProductComponent {
  type: 'door';
  hingePosition: 'left' | 'right';
  handleType: HandleType;
  openAngle: number;
}

// Drawer component
export interface DrawerComponent extends ProductComponent {
  type: 'drawer';
  handleType: HandleType;
  openPosition: number; // 0 = closed, 1 = fully open
  depth: number;
}
```

### Component Factory
Factory functions create component instances:

```typescript
// Create a shelf component
export function createShelf(params: Partial<ShelfComponent>): ShelfComponent {
  return {
    id: generateId(),
    type: 'shelf',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { width: 800, height: 18, depth: 300 },
    material: 'wood',
    color: 'natural',
    visible: true,
    thickness: 18,
    edgeStyle: 'straight',
    metadata: {},
    ...params
  };
}

// Create a divider component
export function createDivider(params: Partial<DividerComponent>): DividerComponent {
  return {
    id: generateId(),
    type: 'divider',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { width: 18, height: 400, depth: 300 },
    material: 'wood',
    color: 'natural',
    visible: true,
    thickness: 18,
    metadata: {},
    ...params
  };
}
```

### Component Rendering
Components are rendered using React Three Fiber:

```jsx
// Component renderer
function ComponentRenderer({ component }: { component: ProductComponent }) {
  // Render based on component type
  switch(component.type) {
    case 'shelf':
      return <ShelfRenderer component={component as ShelfComponent} />;
    case 'divider':
      return <DividerRenderer component={component as DividerComponent} />;
    case 'door':
      return <DoorRenderer component={component as DoorComponent} />;
    case 'drawer':
      return <DrawerRenderer component={component as DrawerComponent} />;
    default:
      return null;
  }
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
  // Implementation details...
  return {
    // Configuration properties
  };
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
  // Implementation details...
  return [];
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
