# Supabase Integration Specifications

## Overview
This document outlines the integration between the Shelfo configurator and Supabase, focusing on a frontend-based pricing calculation system with minimal database usage. This approach optimizes for simplicity, performance, and user experience while maintaining all core functionality requirements.

## Core Components

### 1. Frontend Pricing System
- JSON-based pricing rules stored in Supabase and cached locally
- Client-side price calculation for real-time updates
- Support for dimension-based, material-based, and feature-based pricing

### 2. User Configuration Storage
- Persistent saving of user-customized configurations
- Unique identification and retrieval of saved designs
- Configuration versioning and history

### 3. Authentication System
- User account management via Supabase Auth
- Role-based access control (customers vs. administrators)
- Secure access to saved configurations

### 4. Order Management
- Basic order creation and storage
- Configuration linking to orders
- Order status tracking

## Technical Implementation

### Pricing Data Structure
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
        "height": 0.1
      }
    }
  },
  "materialMultipliers": {
    "pine": 1.0,
    "oak": 1.5,
    "walnut": 2.0,
    "white": 1.2,
    "black": 1.3
  },
  "featureAdders": {
    "drawer": 50,
    "door": 75,
    "backPanel": 25,
    "glass": 100
  },
  "styleMultipliers": {
    "grid": 1.0,
    "pattern": 1.1,
    "slant": 1.2,
    "mosaic": 1.3
  }
}
```

### Database Schema
```sql
-- Product types reference
CREATE TABLE product_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  model_path TEXT
);

-- User saved configurations
CREATE TABLE saved_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users,
  name TEXT,
  configuration JSONB NOT NULL,
  calculated_price DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing data table for admin updates
CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pricing_data JSONB NOT NULL,
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users
);

-- Orders (minimal implementation)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  configuration_id UUID REFERENCES saved_configurations,
  user_id UUID REFERENCES auth.users,
  status TEXT DEFAULT 'new',
  total_price DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Requirements

### Price Calculation System

#### Core Functions
- Must accurately calculate prices based on all configuration parameters
- Must return results in < 100ms for optimal user experience
- Must handle all product types and feature combinations

#### Example Implementation
```javascript
function calculatePrice(configuration, pricingData) {
  // Get base product type
  const productType = configuration.productType;
  const baseData = pricingData.basePrices[productType];
  
  // Calculate base price from dimensions
  let basePrice = baseData.basePrice;
  Object.entries(configuration.dimensions).forEach(([dimension, value]) => {
    if (baseData.dimensionFactors[dimension]) {
      basePrice += value * baseData.dimensionFactors[dimension];
    }
  });
  
  // Apply material multiplier
  const materialFactor = pricingData.materialMultipliers[configuration.material] || 1;
  let price = basePrice * materialFactor;
  
  // Apply style multiplier
  const styleFactor = pricingData.styleMultipliers[configuration.style.pattern] || 1;
  price = price * styleFactor;
  
  // Add feature costs
  configuration.components.forEach(component => {
    const featurePrice = pricingData.featureAdders[component.type] || 0;
    price += featurePrice;
  });
  
  return Math.round(price);
}
```

### Configuration Management

#### Saving Configurations
- All user configurations must be persistently stored
- System must handle unauthenticated sessions gracefully
- Configuration data must include all parameters needed for reproduction

#### Loading Configurations
- Must provide fast retrieval of user's saved configurations
- Must support filtering and sorting of saved designs
- Must restore exact configuration state when loaded

## Integration Points

### Configurator Component
- Must load pricing data at initialization
- Must recalculate prices on all configuration changes
- Must provide save/load functionality integrated with Supabase

### Admin Interface
- Must provide pricing rule management
- Must include validation for pricing data updates
- Must track pricing history and allow rollbacks

## Performance Requirements

- Initial pricing data load: < 500ms
- Price calculation: < 100ms per configuration change
- Configuration save/load: < 1s operation time
- Database query efficiency: < 50ms for typical operations

## Benefits

1. **Simplicity**: Streamlined architecture with fewer server-side dependencies
2. **Speed**: Client-side calculations provide immediate feedback to users
3. **Offline Capability**: Core functionality available even with intermittent connectivity
4. **Reduced Complexity**: Minimized backend logic and infrastructure requirements
5. **Improved Testability**: Isolated pricing logic for easier unit testing

## Testing Requirements

- Comprehensive unit tests for price calculation
- Integration tests for Supabase data operations
- Performance tests for calculation speed under various configurations
- Stress tests for concurrent user operations

## Future Extensions

1. **Enhanced Admin Tools**: More sophisticated pricing rule management
2. **Multi-currency Support**: International pricing capabilities
3. **Discount System**: Support for promotional pricing and discounts
4. **Cost Estimation**: Integration with manufacturing cost calculators
5. **Analytics**: Usage patterns and popular configurations