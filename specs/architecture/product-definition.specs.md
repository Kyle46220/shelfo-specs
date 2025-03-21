# Product Definition Specifications

## Overview
This document specifies the product definition system for the Shelfo furniture configurator. The product definition system provides a structured way to define different furniture products, their components, and customization options.

## Core Product Types

### Bookcase/Cabinet
The bookcase/cabinet product type represents shelving units with customizable compartments:

```typescript
// Bookcase/Cabinet product type
export interface CabinetProductType extends ProductTypeBase {
  type: 'cabinet';
  maxRows: number;
  maxColumns: number;
  availableDividerPositions: DividerPosition[];
  availableDoorTypes: DoorType[];
  availableDrawerTypes: DrawerType[];
  shelfThickness: number;
  dividerThickness: number;
  backPanelOptions: BackPanelOption[];
  footOptions: FootOption[];
}

// Door type options
export type DoorType = 'hinged' | 'sliding' | 'flip-up' | 'none';

// Drawer type options
export type DrawerType = 'standard' | 'deep' | 'file' | 'none';

// Back panel options
export interface BackPanelOption {
  id: string;
  name: string;
  material: Material;
  thickness: number;
}

// Foot options
export interface FootOption {
  id: string;
  name: string;
  height: number;
  material: Material;
  style: 'round' | 'square' | 'angled' | 'none';
}
```

#### Cabinet Configuration Rules
- Minimum width: 300mm, Maximum width: 2400mm
- Minimum height: 400mm, Maximum height: 2400mm
- Minimum depth: 200mm, Maximum depth: 600mm
- Vertical dividers must be placed at least 250mm apart
- Horizontal dividers (shelves) must be placed at least 200mm apart
- When spans are wider than 600mm, additional support is required
- Cabinet feet must be positioned at corners and under vertical dividers
- When spans are wider than 600mm, additional feet must be added in the middle

### Table
The table product type represents customizable tables:

```typescript
// Table product type
export interface TableProductType extends ProductTypeBase {
  type: 'table';
  availableLegs: LegType[];
  availableEdgeStyles: EdgeStyle[];
  maxSupportSpan: number; // Maximum unsupported span in mm
  tabletopThickness: number;
  legDimensions: {
    minHeight: number;
    maxHeight: number;
    thickness: number;
  };
  supportBeamOptions: SupportBeamOption[];
}

// Leg type options
export type LegType = 'straight' | 'angled' | 'hairpin' | 'pedestal';

// Edge style options
export type EdgeStyle = 'straight' | 'beveled' | 'rounded' | 'live-edge';

// Support beam options
export interface SupportBeamOption {
  id: string;
  name: string;
  material: Material;
  thickness: number;
  style: 'x-frame' | 'h-frame' | 'apron';
}
```

#### Table Configuration Rules
- Minimum width: 600mm, Maximum width: 2400mm
- Minimum length: 600mm, Maximum length: 3000mm
- Minimum height: 400mm, Maximum height: 1100mm
- Tabletop thickness must be between 18mm and 40mm
- Legs must be positioned at corners for stability
- When table length exceeds 1800mm, additional support is required
- When table width exceeds 900mm, additional support is required
- Leg height must be adjusted based on tabletop thickness to maintain overall height

## Materials and Finishes

### Material Types
Available materials for furniture components:

```typescript
// Material types
export type Material = 'wood' | 'metal' | 'glass' | 'laminate' | 'veneer';

// Wood types (subset of materials)
export type WoodType = 'oak' | 'walnut' | 'pine' | 'maple' | 'birch';

// Metal types (subset of materials)
export type MetalType = 'steel' | 'aluminum' | 'brass';

// Material properties
export interface MaterialProperties {
  name: string;
  type: Material;
  subtype?: WoodType | MetalType;
  density: number; // kg/m³
  costPerUnit: number; // Cost per cubic meter
  finishOptions: FinishOption[];
  sustainabilityRating: 1 | 2 | 3 | 4 | 5; // 1 = least sustainable, 5 = most sustainable
}
```

### Color and Finish Options
Available colors and finishes for materials:

```typescript
// Color options
export type Color = 'natural' | 'white' | 'black' | 'gray' | 'brown' | 'blue' | 'green' | 'custom';

// Finish options
export interface FinishOption {
  id: string;
  name: string;
  type: 'matte' | 'satin' | 'gloss' | 'textured';
  durabilityRating: 1 | 2 | 3 | 4 | 5; // 1 = least durable, 5 = most durable
}

// Material-color compatibility
export const materialColorCompatibility: Record<Material, Color[]> = {
  'wood': ['natural', 'white', 'black', 'gray', 'brown', 'custom'],
  'metal': ['natural', 'white', 'black', 'gray', 'custom'],
  'glass': ['natural', 'white', 'black', 'gray', 'blue', 'green', 'custom'],
  'laminate': ['white', 'black', 'gray', 'brown', 'blue', 'green', 'custom'],
  'veneer': ['natural', 'brown', 'custom'],
};
```

## Component Definitions

### Shelf Component
Shelf components for cabinets:

```typescript
// Shelf component definition
export interface ShelfComponentDefinition {
  type: 'shelf';
  defaultThickness: number;
  minWidth: number;
  maxWidth: number;
  minDepth: number;
  maxDepth: number;
  availableMaterials: Material[];
  edgeOptions: EdgeOption[];
  supportRules: {
    maxUnsupportedSpan: number; // Maximum span without support in mm
    supportTypes: SupportType[];
  };
}

// Edge options
export interface EdgeOption {
  id: string;
  name: string;
  style: 'straight' | 'beveled' | 'rounded' | 'decorative';
  material?: Material; // Optional different material for edge
}

// Support types
export type SupportType = 'divider' | 'bracket' | 'none';
```

### Divider Component
Divider components for cabinets:

```typescript
// Divider component definition
export interface DividerComponentDefinition {
  type: 'divider';
  defaultThickness: number;
  minHeight: number;
  maxHeight: number;
  minDepth: number;
  maxDepth: number;
  availableMaterials: Material[];
  placementRules: {
    minDistanceFromEdge: number; // Minimum distance from cabinet edge in mm
    minDistanceBetweenDividers: number; // Minimum distance between dividers in mm
  };
}
```

### Door Component
Door components for cabinets:

```typescript
// Door component definition
export interface DoorComponentDefinition {
  type: 'door';
  defaultThickness: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  availableMaterials: Material[];
  hingeOptions: HingeOption[];
  handleOptions: HandleOption[];
  openingAngle: number; // Maximum opening angle in degrees
}

// Hinge options
export interface HingeOption {
  id: string;
  name: string;
  type: 'standard' | 'soft-close' | 'push-to-open';
  material: 'steel' | 'brass' | 'black';
  maxWeight: number; // Maximum supported weight in kg
}

// Handle options
export interface HandleOption {
  id: string;
  name: string;
  style: 'knob' | 'bar' | 'recessed' | 'none';
  material: 'steel' | 'brass' | 'wood' | 'plastic';
  length?: number; // Length in mm (for bar style)
}
```

### Drawer Component
Drawer components for cabinets:

```typescript
// Drawer component definition
export interface DrawerComponentDefinition {
  type: 'drawer';
  defaultFrontThickness: number;
  defaultSideThickness: number;
  defaultBottomThickness: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minDepth: number;
  maxDepth: number;
  availableMaterials: Material[];
  slideOptions: SlideOption[];
  handleOptions: HandleOption[];
}

// Slide options
export interface SlideOption {
  id: string;
  name: string;
  type: 'standard' | 'soft-close' | 'push-to-open' | 'full-extension';
  maxWeight: number; // Maximum supported weight in kg
  extensionPercentage: number; // How far the drawer extends, as percentage
}
```

### Tabletop Component
Tabletop components for tables:

```typescript
// Tabletop component definition
export interface TabletopComponentDefinition {
  type: 'tabletop';
  defaultThickness: number;
  minWidth: number;
  maxWidth: number;
  minLength: number;
  maxLength: number;
  availableMaterials: Material[];
  edgeOptions: EdgeOption[];
  shapeOptions: ShapeOption[];
}

// Shape options
export interface ShapeOption {
  id: string;
  name: string;
  shape: 'rectangle' | 'round' | 'oval' | 'custom';
  cornerStyle?: 'square' | 'rounded' | 'chamfered'; // For rectangle shapes
}
```

### Leg Component
Leg components for tables:

```typescript
// Leg component definition
export interface LegComponentDefinition {
  type: 'leg';
  defaultThickness: number;
  minHeight: number;
  maxHeight: number;
  availableMaterials: Material[];
  styleOptions: LegStyleOption[];
  adjustabilityOptions: AdjustabilityOption[];
}

// Leg style options
export interface LegStyleOption {
  id: string;
  name: string;
  style: 'straight' | 'tapered' | 'hairpin' | 'pedestal';
  material: Material;
}

// Adjustability options
export interface AdjustabilityOption {
  id: string;
  name: string;
  type: 'fixed' | 'adjustable' | 'leveler';
  adjustmentRange?: number; // Range of adjustment in mm
}
```

## Preset Definitions

### Preset Structure
Presets provide pre-configured furniture options:

```typescript
// Preset base interface
export interface PresetBase {
  id: string;
  name: string;
  description: string;
  productTypeName: ProductTypeName;
  thumbnail: string;
  tags: string[];
  popularity: number; // 1-100 rating for sorting
}

// Cabinet preset configuration
export interface CabinetPresetConfig {
  dimensions: Dimensions;
  rowHeights: number[];
  columnWidths: number[];
  dividerPositions: DividerPosition[];
  doorPositions: DoorPosition[];
  drawerPositions: DrawerPosition[];
  material: Material;
  color: Color;
  backPanelOption: string; // ID of back panel option
  footOption: string; // ID of foot option
}

// Table preset configuration
export interface TablePresetConfig {
  dimensions: Dimensions;
  legType: LegType;
  legPositions: Position3D[];
  edgeStyle: EdgeStyle;
  material: Material;
  color: Color;
  supportBeamOption: string; // ID of support beam option
}

// Combined preset type
export type ProductPreset = 
  | (PresetBase & { productTypeName: 'cabinet' | 'bookcase'; configuration: CabinetPresetConfig })
  | (PresetBase & { productTypeName: 'table'; configuration: TablePresetConfig });
```

### Preset Categories
Presets are organized into categories:

```typescript
// Preset category
export interface PresetCategory {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  presetIds: string[]; // IDs of presets in this category
}

// Example categories
export const presetCategories: PresetCategory[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean lines and minimalist design for contemporary spaces',
    thumbnail: '/images/categories/modern.jpg',
    presetIds: ['modern-bookcase-1', 'modern-table-1']
  },
  {
    id: 'traditional',
    name: 'Traditional',
    description: 'Classic designs with timeless appeal',
    thumbnail: '/images/categories/traditional.jpg',
    presetIds: ['traditional-bookcase-1', 'traditional-table-1']
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Raw materials and utilitarian design',
    thumbnail: '/images/categories/industrial.jpg',
    presetIds: ['industrial-bookcase-1', 'industrial-table-1']
  }
];
```

## Manufacturing Constraints

### Dimension Constraints
Constraints on product dimensions:

```typescript
// Dimension constraints
export interface DimensionConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minDepth: number;
  maxDepth: number;
  widthIncrement: number; // Increment size for width adjustments
  heightIncrement: number; // Increment size for height adjustments
  depthIncrement: number; // Increment size for depth adjustments
}

// Cabinet dimension constraints
export const cabinetDimensionConstraints: DimensionConstraints = {
  minWidth: 300,
  maxWidth: 2400,
  minHeight: 400,
  maxHeight: 2400,
  minDepth: 200,
  maxDepth: 600,
  widthIncrement: 50,
  heightIncrement: 50,
  depthIncrement: 50
};

// Table dimension constraints
export const tableDimensionConstraints: DimensionConstraints = {
  minWidth: 600,
  maxWidth: 2400,
  minHeight: 400,
  maxHeight: 1100,
  minDepth: 600, // Depth is length for tables
  maxDepth: 3000,
  widthIncrement: 50,
  heightIncrement: 10,
  depthIncrement: 50
};
```

### Structural Constraints
Constraints for structural integrity:

```typescript
// Structural constraints
export interface StructuralConstraints {
  maxUnsupportedSpan: number; // Maximum span without support in mm
  minDividerSpacing: number; // Minimum space between dividers in mm
  minShelfSpacing: number; // Minimum space between shelves in mm
  maxShelfLoad: number; // Maximum load per shelf in kg
  maxDrawerWidth: number; // Maximum width for drawers in mm
  maxDoorWidth: number; // Maximum width for doors in mm
}

// Cabinet structural constraints
export const cabinetStructuralConstraints: StructuralConstraints = {
  maxUnsupportedSpan: 600,
  minDividerSpacing: 250,
  minShelfSpacing: 200,
  maxShelfLoad: 30,
  maxDrawerWidth: 900,
  maxDoorWidth: 600
};
```

## Product Registry

### Registry Structure
The product registry manages available product types:

```typescript
// Product registry
export interface ProductRegistry {
  productTypes: Record<ProductTypeName, ProductTypeBase>;
  components: Record<string, ComponentDefinition>;
  presets: Record<string, ProductPreset>;
  categories: Record<string, PresetCategory>;
  materials: Record<Material, MaterialProperties>;
}

// Component definition type
export type ComponentDefinition = 
  | ShelfComponentDefinition
  | DividerComponentDefinition
  | DoorComponentDefinition
  | DrawerComponentDefinition
  | TabletopComponentDefinition
  | LegComponentDefinition;
```

### Registry Operations
Functions for working with the product registry:

```typescript
// Get product type by name
export function getProductType(name: ProductTypeName): ProductTypeBase | null {
  return productRegistry.productTypes[name] || null;
}

// Get component definition by type
export function getComponentDefinition(type: string): ComponentDefinition | null {
  return productRegistry.components[type] || null;
}

// Get preset by ID
export function getPreset(id: string): ProductPreset | null {
  return productRegistry.presets[id] || null;
}

// Get presets by category
export function getPresetsByCategory(categoryId: string): ProductPreset[] {
  const category = productRegistry.categories[categoryId];
  if (!category) return [];
  
  return category.presetIds
    .map(id => productRegistry.presets[id])
    .filter(Boolean);
}

// Get material properties
export function getMaterialProperties(material: Material): MaterialProperties | null {
  return productRegistry.materials[material] || null;
}
```

## Integration Points

### Configurator Component
- Product definitions drive available options in UI
- Manufacturing constraints enforce valid configurations
- Presets provide starting points for customization

### 3D Visualization
- Component definitions specify rendering properties
- Material definitions drive appearance
- Preset configurations determine initial 3D state

### Pricing System
- Material properties include cost information
- Component definitions specify material usage
- Manufacturing constraints impact pricing calculations

## Success Criteria
- [ ] All product types are fully defined with appropriate constraints
- [ ] Component definitions cover all required furniture parts
- [ ] Material and finish options provide sufficient customization
- [ ] Presets offer diverse starting points for different styles
- [ ] Manufacturing constraints prevent invalid configurations
- [ ] Product registry provides efficient access to definitions
- [ ] New product types can be added with minimal code changes
