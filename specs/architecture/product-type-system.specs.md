# Product Type System Specifications

## Overview
This document specifies the type system for the Shelfo furniture configurator. The product type system provides a flexible, extensible foundation for defining different furniture products while maintaining type safety and enabling shared functionality.

## Core Concepts

### Product Type Hierarchy
The product type system uses TypeScript's discriminated union pattern to create a type-safe hierarchy of product types:

```typescript
// Base product type interface
export interface ProductTypeBase {
  id: string;
  name: string;
  type: ProductTypeName;
  description: string;
  thumbnail: string;
  defaultDimensions: Dimensions;
  minDimensions: Dimensions;
  maxDimensions: Dimensions;
  availableMaterials: Material[];
  availableColors: Color[];
}

// Product type discriminated union
export type ProductType = 
  | { type: 'cabinet'; config: CabinetProductType }
  | { type: 'table'; config: TableProductType }
  | { type: 'desk'; config: DeskProductType }
  | { type: 'console'; config: ConsoleProductType };

// Type name enumeration
export type ProductTypeName = 'cabinet' | 'table' | 'desk' | 'console';
```

### Type-Specific Configurations
Each product type has its own configuration interface that extends the base type:

```typescript
// Cabinet product type
export interface CabinetProductType extends ProductTypeBase {
  type: 'cabinet';
  maxRows: number;
  maxColumns: number;
  availableDividerPositions: DividerPosition[];
  availableDoorTypes: DoorType[];
  availableDrawerTypes: DrawerType[];
}

// Table product type
export interface TableProductType extends ProductTypeBase {
  type: 'table';
  availableLegs: LegType[];
  availableEdgeStyles: EdgeStyle[];
  maxSupportSpan: number; // Maximum unsupported span in mm
}

// Additional product types follow the same pattern
```

### Factory Functions
Factory functions create instances of product types with appropriate defaults:

```typescript
// Create a product type instance
export function createProductType(type: ProductTypeName, config: any): ProductType {
  switch (type) {
    case 'cabinet':
      return { 
        type: 'cabinet', 
        config: createCabinetType(config) 
      };
    case 'table':
      return { 
        type: 'table', 
        config: createTableType(config) 
      };
    // Additional cases for other product types
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
