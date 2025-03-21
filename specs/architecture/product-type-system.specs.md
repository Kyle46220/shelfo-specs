# Product Type System Specification

## Overview
The product type system provides a flexible, extensible architecture for defining different furniture products in the Shelfo configurator. Using TypeScript's discriminated union pattern, it enables a clean separation of concerns while maintaining type safety and providing a unified API for the configurator's core functionality.

## Business Purpose
- Enable the configurator to support multiple furniture types (cabinets, tables, desks, consoles)
- Allow non-technical staff to define new product types without code changes
- Ensure type safety throughout the application
- Simplify the addition of new product features and options

## Architecture

### Base Types and Common Interfaces

```typescript
// Basic types for product configuration
export type Material = 'wood' | 'plywood' | 'matte' | 'gloss' | 'veneer';
export type Color = 'white' | 'black' | 'grey' | 'blue' | 'red' | 'green' | 'oak' | 'walnut' | 'beige' | 'navy' | 'burgundy' | 'sage' | 'pink';
export type ProductTypeName = 'cabinet' | 'table' | 'desk' | 'bookcase' | 'console';

// Common interfaces for positioning and dimensions
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}
```

### Component-Based Architecture

The core of the system is a component-based architecture where each product is composed of various components:

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

// Specific Component Types
export interface Divider extends ProductComponent {
  type: 'divider';
}

export interface Shelf extends ProductComponent {
  type: 'shelf';
  hasVoid: boolean;
  voidPosition?: Position2D;
  voidSize?: { width: number; depth: number };
}

export interface Leg extends ProductComponent {
  type: 'leg';
  style: LegStyle;
  diameter?: number; // For round legs
}

export interface Tabletop extends ProductComponent {
  type: 'tabletop';
  shape: 'rectangular' | 'round' | 'oval';
  thickness: number;
}

// Additional component types as needed
```

### Product Type System

The product type system uses a base interface with type-specific extensions:

```typescript
// Generic Product Type Base
export interface ProductTypeBase {
  id: string;
  name: string;
  typeName: ProductTypeName;
  modelPath: string;
  defaultDimensions: Dimensions;
  minDimensions: Dimensions;
  maxDimensions: Dimensions;
  availableMaterials: Material[];
  availableColors: Color[];
  availableAccessories: string[];
  defaultMaterialGroups: MaterialGroup[];
}

// Cabinet/Bookcase Product Type
export interface CabinetProductType extends ProductTypeBase {
  typeName: 'cabinet' | 'bookcase';
  orientation: 'row' | 'column';
  availableStyles: StyleType[];
  availableBases: BaseType[];
  defaultRowHeight: number;
  rowHeightOptions: number[];
  defaultDividerDensity: number;
  
  // Cabinet-specific construction rules
  cabinetConstructionRules: {
    increaseHeight: (currentHeight: number, rowHeight: number) => number;
    increaseWidth: (currentWidth: number, increment: number) => number;
    positionDividers: (width: number, height: number, density: number, style: StyleType) => Divider[];
    positionShelves: (width: number, height: number, rowHeight: number) => Shelf[];
    createCompartments: (dividers: Divider[], shelves: Shelf[]) => Compartment[];
    positionBase: (width: number, depth: number, baseType: BaseType, dividers: Divider[]) => ProductComponent[];
  };
}

// Table Product Type
export interface TableProductType extends ProductTypeBase {
  typeName: 'table' | 'desk';
  availableLegStyles: LegStyle[];
  defaultTableTopThickness: number;
  tableTopThicknessOptions: number[];
  
  // Table-specific construction rules
  tableConstructionRules: {
    createTabletop: (width: number, depth: number, thickness: number) => Tabletop;
    positionLegs: (width: number, depth: number, style: LegStyle) => Leg[];
    addBracing: (legs: Leg[], tabletop: Tabletop) => ProductComponent[];
  };
}

// Union type for all product types
export type ProductType = 
  | { type: 'cabinet'; config: CabinetProductType }
  | { type: 'table'; config: TableProductType }
  | { type: 'console'; config: ConsoleProductType };
```

### Presets System

Presets work with the type system to provide pre-configured product instances:

```typescript
// Base preset interface with common properties
export interface PresetBase {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  collectionId?: string;
  collectionName?: string;
  previewImagePath: string;
  productTypeName: ProductTypeName;
  baseDimensions: Dimensions;
  materialGroups: MaterialGroup[];
  accessories: Accessory[];
}

// Product-specific preset configurations using discriminated union
export type ProductPreset = 
  | (PresetBase & { productTypeName: 'cabinet' | 'bookcase'; configuration: CabinetPresetConfig })
  | (PresetBase & { productTypeName: 'table' | 'desk'; configuration: TablePresetConfig })
  | (PresetBase & { productTypeName: 'console'; configuration: ConsolePresetConfig });
```

## Implementation Details

### Factory Pattern

The system uses a factory pattern to create instances of different product types:

```typescript
function createProductType(type: ProductTypeName, config: any): ProductType {
  switch(type) {
    case 'cabinet':
    case 'bookcase':
      return { type: 'cabinet', config: createCabinetType(config) };
    case 'table':
    case 'desk':
      return { type: 'table', config: createTableType(config) };
    case 'console':
      return { type: 'console', config: createConsoleType(config) };
    default:
      throw new Error(`Unknown product type: ${type}`);
  }
}
```

### Type Guards

Type guards ensure type safety when working with the union types:

```typescript
// Type guard to check if a product type is a cabinet
export function isCabinetType(product: ProductType): product is { type: 'cabinet'; config: CabinetProductType } {
  return product.type === 'cabinet';
}

// Type guard to check if a product type is a table
export function isTableType(product: ProductType): product is { type: 'table'; config: TableProductType } {
  return product.type === 'table';
}

// Type guard for presets
export function isCabinetPreset(preset: ProductPreset): preset is (PresetBase & { productTypeName: 'cabinet' | 'bookcase'; configuration: CabinetPresetConfig }) {
  return preset.productTypeName === 'cabinet' || preset.productTypeName === 'bookcase';
}
```

### Component Registry

A component registry provides access to available components for each product type:

```typescript
const componentRegistry = {
  'cabinet': {
    'divider': DividerComponent,
    'shelf': ShelfComponent,
    'door': DoorComponent,
    'drawer': DrawerComponent
  },
  'table': {
    'tabletop': TabletopComponent,
    'leg': LegComponent,
    'support': SupportComponent
  },
  // Additional product types
};
```

## State Management

The Valtio state management system is organized to work with the product type system:

```typescript
// Main configurator store
const configuratorStore = proxy({
  // Core state
  activeProductType: null as ProductType | null,
  activeConfiguration: null as ProductConfiguration | null,
  
  // Active components (rendered in 3D)
  components: [] as ProductComponent[],
  
  // UI state
  ui: {
    activeTab: 'dimensions',
    hoveredComponent: null as string | null
  },
  
  // Type-specific state containers
  cabinetState: {},
  tableState: {},
  
  // Actions
  actions: {
    // Type-aware actions
    setProductType(type: ProductTypeName, config: any) {
      const productType = createProductType(type, config);
      configuratorStore.activeProductType = productType;
      
      // Initialize type-specific state
      if (isCabinetType(productType)) {
        initializeCabinetState(productType.config);
      } else if (isTableType(productType)) {
        initializeTableState(productType.config);
      }
      
      // Generate initial components
      generateComponents();
    },
    
    // Update dimensions based on product type
    updateDimensions(dimensions: Partial<Dimensions>) {
      if (!configuratorStore.activeProductType) return;
      
      const productType = configuratorStore.activeProductType;
      
      // Type-specific dimension updates
      if (isCabinetType(productType)) {
        updateCabinetDimensions(dimensions);
      } else if (isTableType(productType)) {
        updateTableDimensions(dimensions);
      }
      
      // Regenerate components after dimension change
      generateComponents();
    }
  }
});
```

## Rendering System

The 3D rendering system uses the component-based approach to render different product types:

```jsx
function ProductRenderer({ productType }) {
  // Render based on product type
  switch(productType.type) {
    case 'cabinet':
      return <CabinetRenderer config={productType.config} />;
    case 'table':
      return <TableRenderer config={productType.config} />;
    case 'console':
      return <ConsoleRenderer config={productType.config} />;
    default:
      return null;
  }
}
```

## Product Configuration

The resulting product configuration combines type-specific data with common attributes:

```typescript
export interface ProductConfiguration {
  id: string;
  name: string;
  productTypeId: string;
  categoryId: string;
  presetId?: string; // Optional reference to the preset this was based on
  dimensions: Dimensions;
  components: ProductComponent[];
  materialGroups: MaterialGroup[];
  accessories: Accessory[];
  metadata: Record<string, any>; // Additional configuration data specific to the product type
}
```

## Integration Points

### Configurator UI
- Dynamic UI components based on product type
- Type-specific configuration panels
- Unified 3D viewport for all product types

### Pricing System
- Type-specific pricing formulas
- Component-based price calculation
- Material and accessory pricing shared across types

### Cart Integration
- Product type stored with configuration in cart
- Type-aware rendering of cart items
- Manufacturing specifications based on product type

## Success Criteria
- [ ] Multiple product types can be configured using a single configurator interface
- [ ] Type-specific features and options correctly render and behave
- [ ] Adding a new product type requires minimal code changes
- [ ] 3D visualization correctly renders all product types
- [ ] Presets work correctly for all product types
- [ ] Type safety is maintained throughout the application
- [ ] Performance remains optimal when switching between product types 