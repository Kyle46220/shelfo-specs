# Valtio State Management Specifications

## Overview
This document specifies the state management system for the Shelfo furniture configurator using Valtio. Valtio provides a simple, reactive state management solution that integrates well with React and TypeScript.

## Core Concepts

### Store Structure
The main configurator store is organized into logical sections:

```typescript
import { proxy } from 'valtio';

// Main configurator store
export const configuratorStore = proxy({
  // Core state
  activeProductType: null as ProductType | null,
  activeConfiguration: null as ProductConfiguration | null,
  
  // Active components (rendered in 3D)
  components: [] as ProductComponent[],
  
  // Material groups
  materialGroups: [] as MaterialGroup[],
  
  // UI state
  ui: {
    activeTab: 'dimensions' as TabName,
    hoveredComponent: null as string | null,
    selectedComponent: null as string | null,
    viewMode: '3d' as ViewMode,
    showMeasurements: false,
    zoomLevel: 1,
  },
  
  // Type-specific state containers
  cabinetState: {
    rowHeights: [] as number[],
    columnWidths: [] as number[],
    doorConfiguration: {} as Record<string, DoorConfig>,
    drawerConfiguration: {} as Record<string, DrawerConfig>,
  },
  
  tableState: {
    legType: 'straight' as LegType,
    edgeStyle: 'straight' as EdgeStyle,
    supportBeams: [] as SupportBeam[],
  },
  
  // Pricing state
  pricing: {
    basePrice: 0,
    materialPrice: 0,
    componentPrices: {} as Record<string, number>,
    totalPrice: 0,
    pricingRules: null as PricingRules | null,
  },
  
  // History for undo/redo
  history: {
    past: [] as ConfiguratorSnapshot[],
    future: [] as ConfiguratorSnapshot[],
  },
  
  // Metadata
  metadata: {
    lastSaved: null as string | null,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
});
```

### Actions
Actions are defined as methods that modify the store:

```typescript
// Actions object with methods to modify the store
export const actions = {
  // Set active product type
  setProductType(type: ProductTypeName, config: any) {
    const productType = createProductType(type, config);
    configuratorStore.activeProductType = productType;
    
    // Save current state to history
    saveToHistory();
    
    // Initialize type-specific state
    if (isCabinetType(productType)) {
      initializeCabinetState(productType.config);
    } else if (isTableType(productType)) {
      initializeTableState(productType.config);
    }
    
    // Generate initial components
    generateComponents();
    
    // Calculate initial price
    calculatePrice();
    
    // Update metadata
    updateMetadata();
  },
  
  // Update dimensions
  updateDimensions(dimensions: Partial<Dimensions>) {
    if (!configuratorStore.activeProductType) return;
    
    // Save current state to history
    saveToHistory();
    
    const productType = configuratorStore.activeProductType;
    
    // Type-specific dimension updates
    if (isCabinetType(productType)) {
      updateCabinetDimensions(dimensions);
    } else if (isTableType(productType)) {
      updateTableDimensions(dimensions);
    }
    
    // Regenerate components after dimension change
    generateComponents();
    
    // Recalculate price
    calculatePrice();
    
    // Update metadata
    updateMetadata();
  },
  
  // Update material
  updateMaterial(material: Material, color: Color) {
    // Save current state to history
    saveToHistory();
    
    // Update material for all components or selected component
    if (configuratorStore.ui.selectedComponent) {
      // Update just the selected component
      const componentId = configuratorStore.ui.selectedComponent;
      const component = configuratorStore.components.find(c => c.id === componentId);
      
      if (component) {
        component.material = material;
        component.color = color;
      }
    } else {
      // Update all components
      configuratorStore.components.forEach(component => {
        component.material = material;
        component.color = color;
      });
    }
    
    // Update material groups
    updateMaterialGroups();
    
    // Recalculate price
    calculatePrice();
    
    // Update metadata
    updateMetadata();
  },
  
  // Add component
  addComponent(componentType: string, position: Position3D) {
    // Save current state to history
    saveToHistory();
    
    // Create component based on type
    const component = createComponent(componentType, position);
    
    // Add to components array
    configuratorStore.components.push(component);
    
    // Update material groups
    updateMaterialGroups();
    
    // Recalculate price
    calculatePrice();
    
    // Update metadata
    updateMetadata();
  },
  
  // Remove component
  removeComponent(componentId: string) {
    // Save current state to history
    saveToHistory();
    
    // Remove component
    configuratorStore.components = configuratorStore.components.filter(
      component => component.id !== componentId
    );
    
    // Update material groups
    updateMaterialGroups();
    
    // Recalculate price
    calculatePrice();
    
    // Update metadata
    updateMetadata();
  },
  
  // Undo last action
  undo() {
    if (configuratorStore.history.past.length === 0) return;
    
    // Get last state from history
    const previousState = configuratorStore.history.past.pop();
    
    // Save current state to future
    const currentState = createSnapshot();
    configuratorStore.history.future.push(currentState);
    
    // Restore previous state
    restoreSnapshot(previousState);
  },
  
  // Redo last undone action
  redo() {
    if (configuratorStore.history.future.length === 0) return;
    
    // Get next state from future
    const nextState = configuratorStore.history.future.pop();
    
    // Save current state to past
    const currentState = createSnapshot();
    configuratorStore.history.past.push(currentState);
    
    // Restore next state
    restoreSnapshot(nextState);
  },
  
  // Load configuration
  loadConfiguration(configuration: ProductConfiguration) {
    // Save current state to history
    saveToHistory();
    
    // Set active product type
    const productType = getProductTypeById(configuration.productTypeId);
    if (!productType) return;
    
    configuratorStore.activeProductType = productType;
    configuratorStore.activeConfiguration = configuration;
    
    // Load components
    configuratorStore.components = [...configuration.components];
    
    // Load material groups
    configuratorStore.materialGroups = [...configuration.materialGroups];
    
    // Initialize type-specific state
    if (isCabinetType(productType)) {
      initializeCabinetState(productType.config, configuration.metadata);
    } else if (isTableType(productType)) {
      initializeTableState(productType.config, configuration.metadata);
    }
    
    // Calculate price
    calculatePrice();
    
    // Update metadata
    configuratorStore.metadata.lastSaved = configuration.metadata.lastSaved;
    configuratorStore.metadata.createdAt = configuration.metadata.createdAt;
    updateMetadata();
  },
  
  // Save configuration
  saveConfiguration(name: string): ProductConfiguration {
    const configuration: ProductConfiguration = {
      id: configuratorStore.activeConfiguration?.id || generateId(),
      name,
      productTypeId: configuratorStore.activeProductType?.id || '',
      categoryId: configuratorStore.activeProductType?.config.categoryId || '',
      presetId: configuratorStore.activeConfiguration?.presetId,
      dimensions: getCurrentDimensions(),
      components: [...configuratorStore.components],
      materialGroups: [...configuratorStore.materialGroups],
      accessories: [],
      metadata: {
        ...configuratorStore.metadata,
        lastSaved: new Date().toISOString(),
      }
    };
    
    // Update store
    configuratorStore.activeConfiguration = configuration;
    configuratorStore.metadata.lastSaved = configuration.metadata.lastSaved;
    
    return configuration;
  },
};

// Attach actions to the store
Object.assign(configuratorStore, { actions });
```

### Helper Functions
Helper functions support the state management system:

```typescript
// Create a snapshot of the current state
function createSnapshot(): ConfiguratorSnapshot {
  return {
    activeProductType: configuratorStore.activeProductType,
    components: [...configuratorStore.components],
    materialGroups: [...configuratorStore.materialGroups],
    cabinetState: { ...configuratorStore.cabinetState },
    tableState: { ...configuratorStore.tableState },
    pricing: { ...configuratorStore.pricing },
    metadata: { ...configuratorStore.metadata },
  };
}

// Restore state from a snapshot
function restoreSnapshot(snapshot: ConfiguratorSnapshot) {
  configuratorStore.activeProductType = snapshot.activeProductType;
  configuratorStore.components = [...snapshot.components];
  configuratorStore.materialGroups = [...snapshot.materialGroups];
  configuratorStore.cabinetState = { ...snapshot.cabinetState };
  configuratorStore.tableState = { ...snapshot.tableState };
  configuratorStore.pricing = { ...snapshot.pricing };
  configuratorStore.metadata = { ...snapshot.metadata };
}

// Save current state to history
function saveToHistory() {
  const currentState = createSnapshot();
  configuratorStore.history.past.push(currentState);
  configuratorStore.history.future = []; // Clear redo stack
}

// Update material groups based on components
function updateMaterialGroups() {
  configuratorStore.materialGroups = groupByMaterial(configuratorStore.components);
}

// Update metadata
function updateMetadata() {
  configuratorStore.metadata.modifiedAt = new Date().toISOString();
}
```

### React Integration
Valtio integrates with React components:

```tsx
import { useSnapshot } from 'valtio';

// Component using the store
function ConfiguratorPanel() {
  // Get a reactive snapshot of the store
  const snap = useSnapshot(configuratorStore);
  
  // Handle dimension change
  const handleWidthChange = (width: number) => {
    configuratorStore.actions.updateDimensions({ width });
  };
  
  // Handle material change
  const handleMaterialChange = (material: Material, color: Color) => {
    configuratorStore.actions.updateMaterial(material, color);
  };
  
  return (
    <div>
      <h2>Configure {snap.activeProductType?.name}</h2>
      
      <div>
        <label>Width:</label>
        <input 
          type="range" 
          min={snap.activeProductType?.minDimensions.width || 0} 
          max={snap.activeProductType?.maxDimensions.width || 1000} 
          value={snap.activeProductType?.defaultDimensions.width || 0}
          onChange={(e) => handleWidthChange(Number(e.target.value))}
        />
      </div>
      
      <div>
        <label>Material:</label>
        <select onChange={(e) => handleMaterialChange(e.target.value as Material, snap.components[0]?.color || 'natural')}>
          {snap.activeProductType?.availableMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label>Color:</label>
        <select onChange={(e) => handleMaterialChange(snap.components[0]?.material || 'wood', e.target.value as Color)}>
          {snap.activeProductType?.availableColors.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </div>
      
      <div>
        <p>Total Price: ${snap.pricing.totalPrice}</p>
      </div>
    </div>
  );
}
```

### Persistence
State persistence for saving and loading configurations:

```typescript
// Serialize store for persistence
export function serializeStore(): SerializedStore {
  return {
    activeProductTypeId: configuratorStore.activeProductType?.id,
    components: configuratorStore.components.map(component => ({
      ...component,
      id: component.id
    })),
    materialGroups: configuratorStore.materialGroups,
    metadata: configuratorStore.metadata,
  };
}

// Deserialize store from saved data
export function deserializeStore(data: SerializedStore) {
  // Load product type
  const productType = getProductTypeById(data.activeProductTypeId);
  if (!productType) return;
  
  // Restore state
  configuratorStore.activeProductType = productType;
  configuratorStore.components = data.components;
  configuratorStore.materialGroups = data.materialGroups;
  configuratorStore.metadata = data.metadata;
  
  // Initialize type-specific state
  if (isCabinetType(productType)) {
    initializeCabinetState(productType.config, data.metadata);
  } else if (isTableType(productType)) {
    initializeTableState(productType.config, data.metadata);
  }
  
  // Calculate price
  calculatePrice();
}
```

## Integration Points

### Product Type System
- Type-specific state containers
- Type-aware actions
- Type guards for safe state manipulation

### Component System
- Component creation and management
- Material group organization
- Component interaction handling

### UI Components
- Reactive UI updates with useSnapshot
- Form controls bound to state
- Real-time feedback on state changes

### Backend Integration
- Serialization for API requests
- Deserialization of saved configurations
- Price calculation based on state

## Performance Considerations

### Proxy Optimization
Valtio uses proxies which need careful handling:

```typescript
// Avoid deep nesting of proxy objects
// Instead of:
const deeplyNested = proxy({
  level1: {
    level2: {
      level3: {
        value: 42
      }
    }
  }
});

// Prefer:
const betterStructure = proxy({
  level1Level2Level3Value: 42
});

// Or use separate proxies:
const level3 = proxy({ value: 42 });
const level2 = proxy({ level3 });
const level1 = proxy({ level2 });
```

### Snapshot Usage
Optimize snapshot usage to prevent unnecessary renders:

```tsx
// Instead of using the entire store snapshot
function InefficientComponent() {
  const snap = useSnapshot(configuratorStore);
  
  return <div>{snap.ui.activeTab}</div>;
}

// Use a more focused snapshot
function EfficientComponent() {
  const { activeTab } = useSnapshot(configuratorStore.ui);
  
  return <div>{activeTab}</div>;
}
```

### Batch Updates
Batch multiple state updates to reduce renders:

```typescript
// Instead of multiple separate updates
function inefficientUpdate() {
  configuratorStore.components[0].material = 'wood';
  configuratorStore.components[0].color = 'natural';
  configuratorStore.components[0].dimensions.width = 800;
}

// Batch updates
function efficientUpdate() {
  const updates = {
    material: 'wood',
    color: 'natural',
    dimensions: { ...configuratorStore.components[0].dimensions, width: 800 }
  };
  
  Object.assign(configuratorStore.components[0], updates);
}
```

## Success Criteria
- [ ] State management correctly handles all product types
- [ ] UI components update reactively when state changes
- [ ] History tracking enables undo/redo functionality
- [ ] Type safety is maintained throughout the application
- [ ] Performance remains optimal with complex state
- [ ] Configurations can be saved and loaded without data loss
- [ ] Actions properly maintain state consistency
