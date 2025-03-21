# Frontend Pricing System Specifications

## Overview
This document outlines the frontend-based pricing calculation system for the Shelfo configurator. The system is designed to provide real-time price updates based on user configurations without requiring server-side calculations, supporting multiple product types through a component-based pricing model.

## Core Components

### 1. Pricing Data Structure
- Comprehensive JSON schema for all pricing rules
- Support for multiple product types and their specific pricing models
- Component-based pricing for modular calculation
- Extensible structure for future pricing components

### 2. Calculation Engine
- Pure JavaScript functions for deterministic price calculations
- Type-specific pricing calculators with shared core logic
- Support for dimension-based, material-based, and feature-based pricing
- Optimization for performance in client-side execution

### 3. Admin Management
- Interface for non-technical staff to update pricing rules
- Version history and audit trail for pricing changes
- Validation system to prevent invalid pricing configurations

## Technical Implementation

### Pricing Data Model

```typescript
interface PricingData {
  // Base pricing by product type
  basePrices: {
    [productType: string]: {
      basePrice: number;
      dimensionFactors: {
        [dimension: string]: number;
      };
    };
  };
  
  // Component-specific pricing
  componentPricing: {
    [componentType: string]: {
      basePrice: number;
      sizeFactor: number;
      complexityFactor: number;
    };
  };
  
  // Material pricing across all product types
  materialPricing: {
    [material: string]: {
      baseMultiplier: number;
      perUnitCost: number; // per square cm
    };
  };
  
  // Style and feature multipliers
  styleMultipliers: {
    [style: string]: number;
  };
  
  // Additional feature costs
  featureAdders: {
    [feature: string]: number;
  };
}
```

### Sample Pricing Data

```json
{
  "basePrices": {
    "bookcase": {
      "basePrice": 200,
      "dimensionFactors": {
        "width": 0.5,
        "height": 0.3,
        "depth": 0.2
      }
    },
    "table": {
      "basePrice": 300,
      "dimensionFactors": {
        "width": 0.6,
        "length": 0.6,
        "height": 0.1,
        "thickness": 5.0
      }
    },
    "console": {
      "basePrice": 250,
      "dimensionFactors": {
        "width": 0.5,
        "height": 0.2,
        "depth": 0.3
      }
    }
  },
  "componentPricing": {
    "divider": {
      "basePrice": 15,
      "sizeFactor": 0.02,
      "complexityFactor": 1.0
    },
    "shelf": {
      "basePrice": 20,
      "sizeFactor": 0.03,
      "complexityFactor": 1.0
    },
    "tabletop": {
      "basePrice": 150,
      "sizeFactor": 0.05,
      "complexityFactor": 1.0
    },
    "leg": {
      "basePrice": 25,
      "sizeFactor": 0.01,
      "complexityFactor": 1.2
    },
    "door": {
      "basePrice": 50,
      "sizeFactor": 0.04,
      "complexityFactor": 1.3
    },
    "drawer": {
      "basePrice": 75,
      "sizeFactor": 0.05,
      "complexityFactor": 1.5
    }
  },
  "materialPricing": {
    "wood": {
      "baseMultiplier": 1.0,
      "perUnitCost": 0.005
    },
    "oak": {
      "baseMultiplier": 1.5,
      "perUnitCost": 0.01
    },
    "walnut": {
      "baseMultiplier": 2.0,
      "perUnitCost": 0.015
    },
    "pine": {
      "baseMultiplier": 1.0,
      "perUnitCost": 0.005
    },
    "matte": {
      "baseMultiplier": 1.2,
      "perUnitCost": 0.008
    },
    "gloss": {
      "baseMultiplier": 1.3,
      "perUnitCost": 0.01
    }
  },
  "styleMultipliers": {
    "grid": 1.0,
    "pattern": 1.1,
    "slant": 1.2,
    "mosaic": 1.3,
    "straight": 1.0,
    "angled": 1.1,
    "tapered": 1.2,
    "hairpin": 1.3,
    "pedestal": 1.4
  },
  "featureAdders": {
    "backPanel": 25,
    "glass": 100,
    "cableManagement": 30,
    "outlets": 50,
    "storage": 75,
    "extensions": 120
  }
}
```

## Calculation Rules

### Factory Pattern for Price Calculators

The system uses a factory pattern to create the appropriate pricing calculator for each product type:

```typescript
function createPriceCalculator(productType: ProductTypeName, pricingData: PricingData) {
  switch(productType) {
    case 'cabinet':
    case 'bookcase':
      return new CabinetPriceCalculator(pricingData);
    case 'table':
    case 'desk':
      return new TablePriceCalculator(pricingData);
    case 'console':
      return new ConsolePriceCalculator(pricingData);
    default:
      throw new Error(`No price calculator available for product type: ${productType}`);
  }
}
```

### Component-Based Price Calculation

```typescript
// Base abstract calculator
abstract class PriceCalculator {
  constructor(protected pricingData: PricingData) {}
  
  // Shared component pricing logic
  protected calculateComponentPrice(component: ProductComponent): number {
    const componentType = component.type;
    const componentPricing = this.pricingData.componentPricing[componentType];
    
    if (!componentPricing) return 0;
    
    // Calculate volume/area as appropriate for component type
    const size = this.calculateComponentSize(component);
    
    // Calculate base component price
    let price = componentPricing.basePrice;
    
    // Add size-based cost
    price += size * componentPricing.sizeFactor;
    
    // Apply material multiplier
    const materialFactor = this.pricingData.materialPricing[component.material]?.baseMultiplier || 1;
    price *= materialFactor;
    
    // Apply complexity factor (based on component type)
    price *= componentPricing.complexityFactor;
    
    return price;
  }
  
  // Calculate appropriate size metric for different component types
  protected calculateComponentSize(component: ProductComponent): number {
    const { width, height, depth } = component.dimensions;
    
    switch(component.type) {
      case 'divider':
      case 'shelf':
        // Area-based for flat components
        return width * depth;
      case 'leg':
        // Length-based for vertical components
        return height;
      case 'tabletop':
        // Volume-based for substantial components
        return width * depth * (component as any).thickness || 1;
      default:
        // Default to volume
        return width * height * depth;
    }
  }
  
  // Abstract method to be implemented by specific calculators
  abstract calculatePrice(configuration: ProductConfiguration): number;
}
```

### Type-Specific Calculators

```typescript
// Cabinet/Bookcase calculator
class CabinetPriceCalculator extends PriceCalculator {
  calculatePrice(configuration: ProductConfiguration): number {
    // Get base price from product type
    const baseData = this.pricingData.basePrices['bookcase'];
    let basePrice = baseData.basePrice;
    
    // Add dimension factors
    Object.entries(configuration.dimensions).forEach(([dimension, value]) => {
      if (baseData.dimensionFactors[dimension]) {
        basePrice += value * baseData.dimensionFactors[dimension];
      }
    });
    
    // Add component prices
    let componentPrice = 0;
    configuration.components.forEach(component => {
      componentPrice += this.calculateComponentPrice(component);
    });
    
    // Apply style multiplier
    const styleName = configuration.metadata.style || 'grid';
    const styleFactor = this.pricingData.styleMultipliers[styleName] || 1;
    basePrice *= styleFactor;
    
    // Add feature costs
    let featurePrice = 0;
    Object.entries(configuration.metadata.features || {}).forEach(([feature, enabled]) => {
      if (enabled && this.pricingData.featureAdders[feature]) {
        featurePrice += this.pricingData.featureAdders[feature];
      }
    });
    
    return Math.round(basePrice + componentPrice + featurePrice);
  }
}

// Table calculator
class TablePriceCalculator extends PriceCalculator {
  calculatePrice(configuration: ProductConfiguration): number {
    // Get base price from product type
    const baseData = this.pricingData.basePrices['table'];
    let basePrice = baseData.basePrice;
    
    // Table-specific pricing logic
    // Similar to cabinet but with table-specific factors
    
    // Calculate tabletop price (as the primary component)
    const tabletop = configuration.components.find(c => c.type === 'tabletop');
    let tabletopPrice = 0;
    if (tabletop) {
      tabletopPrice = this.calculateComponentPrice(tabletop);
      
      // Apply edge style factor
      const edgeStyle = configuration.metadata.edgeStyle || 'straight';
      const edgeFactor = edgeStyle === 'live' ? 1.5 : 
                         edgeStyle === 'beveled' ? 1.2 :
                         edgeStyle === 'rounded' ? 1.1 : 1.0;
      tabletopPrice *= edgeFactor;
    }
    
    // Calculate leg prices
    let legPrice = 0;
    configuration.components.filter(c => c.type === 'leg').forEach(leg => {
      legPrice += this.calculateComponentPrice(leg);
    });
    
    // Apply leg style multiplier
    const legStyle = configuration.metadata.legStyle || 'straight';
    const legStyleFactor = this.pricingData.styleMultipliers[legStyle] || 1;
    legPrice *= legStyleFactor;
    
    // Add feature costs
    let featurePrice = 0;
    Object.entries(configuration.metadata.accessories || {}).forEach(([feature, enabled]) => {
      if (enabled && this.pricingData.featureAdders[feature]) {
        featurePrice += this.pricingData.featureAdders[feature];
      }
    });
    
    return Math.round(basePrice + tabletopPrice + legPrice + featurePrice);
  }
}
```

### Unified Pricing Interface

```typescript
// Main pricing service
class PricingService {
  private pricingData: PricingData;
  private calculators: Map<ProductTypeName, PriceCalculator> = new Map();
  
  constructor(pricingData: PricingData) {
    this.pricingData = pricingData;
    
    // Create calculators for all product types
    this.initializeCalculators();
  }
  
  private initializeCalculators() {
    ['bookcase', 'cabinet', 'table', 'desk', 'console'].forEach(type => {
      this.calculators.set(type as ProductTypeName, 
                          createPriceCalculator(type as ProductTypeName, this.pricingData));
    });
  }
  
  calculatePrice(configuration: ProductConfiguration): number {
    const productType = configuration.productTypeId as ProductTypeName;
    const calculator = this.calculators.get(productType);
    
    if (!calculator) {
      console.error(`No calculator found for product type: ${productType}`);
      return 0;
    }
    
    return calculator.calculatePrice(configuration);
  }
}
```

## Integration Requirements

### Configurator Component Integration
- Must initialize with the latest pricing data
- Must recalculate price on any configuration change
- Must display price updates in real-time (<100ms)
- Must properly format price with currency symbol
- Must handle different product types correctly

### Price Data Loading
- Initial pricing data must be loaded at application startup
- Updates to pricing data must be applied without page refresh
- Caching strategy must prevent unnecessary data fetches
- Error handling must gracefully manage pricing data issues

### Product Type-Aware Hooks
```typescript
// Pricing hook using Valtio
function usePricing() {
  const store = useConfiguratorStore();
  const snap = useSnapshot(store);
  
  const [price, setPrice] = useState(0);
  
  // Recalculate price when configuration changes
  useEffect(() => {
    if (snap.activeConfiguration) {
      const pricingService = new PricingService(snap.pricingData);
      const calculatedPrice = pricingService.calculatePrice(snap.activeConfiguration);
      setPrice(calculatedPrice);
    }
  }, [snap.activeConfiguration]);
  
  return {
    price,
    formattedPrice: formatPrice(price, snap.currency || 'USD')
  };
}
```

## Performance Requirements
- Initial pricing data load: < 500ms
- Price calculation: < 100ms for any configuration
- UI update after price change: < 50ms
- Memory footprint: < 200KB for pricing data

## Testing Strategy
- Unit tests for all pricing calculation functions
- Property-based testing for pricing algorithm robustness
- Integration tests with the configurator component
- Performance benchmarks for various configuration complexities
- Tests for each product type calculator
- Cross-cutting tests for shared pricing logic

## Future Extensions
1. **Discount System**: Support for time-based and user-based discounts
2. **Tax Calculation**: Region-specific tax calculation
3. **Package Pricing**: Bundled items and volume discount
4. **Currency Conversion**: Multi-currency support
5. **Price Comparison**: Show savings against standard configurations
6. **Automated Price Testing**: For validating pricing logic against known standards

## Maintenance Considerations
- Monthly review of pricing accuracy
- Quarterly update of base prices and multipliers
- Clear documentation of pricing logic for business stakeholders
- Version control for pricing data with rollback capability 
- Versioned pricing for orders placed in the past 