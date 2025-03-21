// Base Types and Common Interfaces
// ---------------------------

// Basic types for product configuration
export type Material = 'wood' | 'plywood' | 'matte' | 'gloss' | 'veneer';
export type Color = 'white' | 'black' | 'grey' | 'blue' | 'red' | 'green' | 'oak' | 'walnut' | 'beige' | 'navy' | 'burgundy' | 'sage' | 'pink';
export type BaseType = 'cabinet' | 'feet' | 'plinth' | 'none';
export type StyleType = 'grid' | 'pattern' | 'slant' | 'mosaic' | 'gradient';
export type CompartmentType = 'open' | 'drawer' | 'door-left' | 'door-right';
export type LightingType = 'none' | 'ambient' | 'shelf' | 'both';
export type LegStyle = 'straight' | 'angled' | 'tapered' | 'hairpin' | 'pedestal';
export type ProductTypeName = 'cabinet' | 'table' | 'desk' | 'bookcase' | 'console';
export type OrientationType = 'row' | 'column';

// Position and Dimension interfaces
export interface Position2D {
  x: number;
  y: number;
}

export interface Position3D extends Position2D {
  z: number;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

// Common Base Component Interface
// ---------------------------
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
// ---------------------------

// Divider component
export interface Divider extends ProductComponent {
  type: 'divider';
}

// Shelf component
export interface Shelf extends ProductComponent {
  type: 'shelf';
  hasVoid: boolean;
  voidPosition?: Position2D;
  voidSize?: { width: number; depth: number };
}

// Leg component for tables
export interface Leg extends ProductComponent {
  type: 'leg';
  style: LegStyle;
  diameter?: number; // For round legs
}

// Tabletop component
export interface Tabletop extends ProductComponent {
  type: 'tabletop';
  shape: 'rectangular' | 'round' | 'oval';
  thickness: number;
}

// Door/Drawer components
export interface Door extends ProductComponent {
  type: 'door';
  hingePosition: 'left' | 'right';
  openAngle: number; // Maximum opening angle
}

export interface Drawer extends ProductComponent {
  type: 'drawer';
  depth: number; // How far the drawer extends
  handleType: string;
  handlePosition: Position3D;
}

// Compartment definition
export interface Compartment {
  id: string;
  position: Position2D; // Grid position
  type: CompartmentType;
  material: Material;
  color: Color;
  backPanel: boolean;
  bracingSupport: boolean;
  components: ProductComponent[]; // Components in this compartment
}

// Accessory component
export interface Accessory extends ProductComponent {
  type: 'accessory';
  accessoryType: 'light' | 'cableOpening' | 'hanger' | 'hook';
  compartmentId?: string; // Optional reference to a specific compartment
}

// Material group definition
export interface MaterialGroup {
  id: string;
  name: string;
  components: string[]; // IDs of components in this group
  material: Material;
  color: Color;
}

// Generic Product Type Base
// ---------------------------
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

// Specific Product Types
// ---------------------------

// Cabinet/Bookcase Product Type
export interface CabinetProductType extends ProductTypeBase {
  typeName: 'cabinet' | 'bookcase';
  orientation: OrientationType;
  availableStyles: StyleType[];
  availableBases: BaseType[];
  defaultRowHeight: number;
  rowHeightOptions: number[];
  defaultDividerDensity: number; // 0-100%
  
  // Style presets for this product type
  stylePresets: {
    id: string;
    name: string;
    type: StyleType;
    dividerPositioningAlgorithm: (width: number, height: number, density: number) => Position3D[];
    defaultCompartmentConfig: CompartmentType[][];
  }[];
  
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

// Console Product Type
export interface ConsoleProductType extends ProductTypeBase {
  typeName: 'console';
  availableStyles: StyleType[];
  availableLegStyles: LegStyle[];
  defaultHeight: number;
  shelves: number;
  
  // Console-specific construction rules
  consoleConstructionRules: {
    createTop: (width: number, depth: number, thickness: number) => ProductComponent;
    positionLegs: (width: number, depth: number, style: LegStyle) => Leg[];
    positionShelves: (width: number, height: number, depth: number, count: number) => Shelf[];
  };
}

// Union type for all product types
export type ProductType = 
  | { type: 'cabinet'; config: CabinetProductType }
  | { type: 'table'; config: TableProductType }
  | { type: 'console'; config: ConsoleProductType };

// Product Category
// ---------------------------
export interface FixedParameters {
  [key: string]: any; // Parameters that can't be changed
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  productTypeName: ProductTypeName;
  productTypeId: string;
  constraints: {
    maxWidth: number;
    maxHeight: number;
    availableDepths: number[];
    maxSpanWidth?: number; // Maximum width between dividers (for cabinets)
    minLegDistance?: number; // Minimum distance between legs (for tables)
  };
  
  // Style definitions specific to this category
  styleDefinitions: {
    styleId: string;
    dividerRules?: string; // For cabinets
    voidRules?: string;
    legRules?: string; // For tables
  }[];
  
  compartmentGrouping?: 'row' | 'column' | 'individual'; // For cabinets
  editableParameters: string[]; // List of parameters that can be edited by the user
  fixedParameters: FixedParameters; // Parameters that are fixed for this category
  uiComponents: string[]; // List of UI components to use for this category
}

// Presets
// ---------------------------

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

// Cabinet-specific preset configuration
export interface CabinetPresetConfig {
  style: StyleType;
  dividerDensity: number;
  rowHeights: number[];
  baseType: BaseType;
  compartments: Compartment[];
}

// Table-specific preset configuration
export interface TablePresetConfig {
  tableTopThickness: number;
  legStyle: LegStyle;
  legPositions: Position3D[];
}

// Console-specific preset configuration
export interface ConsolePresetConfig {
  style: StyleType;
  shelfCount: number;
  shelfPositions: Position3D[];
  legStyle: LegStyle;
}

// Combined preset types using discriminated union
export type ProductPreset = 
  | (PresetBase & { productTypeName: 'cabinet' | 'bookcase'; configuration: CabinetPresetConfig })
  | (PresetBase & { productTypeName: 'table' | 'desk'; configuration: TablePresetConfig })
  | (PresetBase & { productTypeName: 'console'; configuration: ConsolePresetConfig });

// Collections
// ---------------------------
export interface Collection {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  presetIds: string[]; // References to presets in this collection
}

// Helper Types and Functions
// ---------------------------

// Type guard to check if a product type is a cabinet
export function isCabinetType(product: ProductType): product is { type: 'cabinet'; config: CabinetProductType } {
  return product.type === 'cabinet';
}

// Type guard to check if a product type is a table
export function isTableType(product: ProductType): product is { type: 'table'; config: TableProductType } {
  return product.type === 'table';
}

// Type guard to check if a preset is for a cabinet
export function isCabinetPreset(preset: ProductPreset): preset is (PresetBase & { productTypeName: 'cabinet' | 'bookcase'; configuration: CabinetPresetConfig }) {
  return preset.productTypeName === 'cabinet' || preset.productTypeName === 'bookcase';
}

// Type guard to check if a preset is for a table
export function isTablePreset(preset: ProductPreset): preset is (PresetBase & { productTypeName: 'table' | 'desk'; configuration: TablePresetConfig }) {
  return preset.productTypeName === 'table' || preset.productTypeName === 'desk';
}

// Product Configuration
// ---------------------------
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
