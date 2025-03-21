# Backend Integration Specifications

## Overview
This document specifies the integration between the Shelfo furniture configurator frontend and the backend system. The backend provides essential services for data persistence, user authentication, and order management while keeping the architecture simple and maintainable.

## Core Components

### API Endpoints
The backend exposes RESTful API endpoints for the frontend to interact with:

```typescript
// API endpoint structure
const API_ENDPOINTS = {
  // Configuration endpoints
  configurations: {
    list: '/api/configurations',
    get: (id: string) => `/api/configurations/${id}`,
    create: '/api/configurations',
    update: (id: string) => `/api/configurations/${id}`,
    delete: (id: string) => `/api/configurations/${id}`,
  },
  
  // User endpoints
  users: {
    profile: '/api/users/profile',
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
  },
  
  // Order endpoints
  orders: {
    list: '/api/orders',
    get: (id: string) => `/api/orders/${id}`,
    create: '/api/orders',
    update: (id: string) => `/api/orders/${id}`,
  },
  
  // Pricing endpoints
  pricing: {
    calculate: '/api/pricing/calculate',
    rules: '/api/pricing/rules',
  },
  
  // Product endpoints
  products: {
    types: '/api/products/types',
    presets: '/api/products/presets',
    materials: '/api/products/materials',
  },
};
```

### Data Models
The backend uses these data models to store and manage information:

```typescript
// User model
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Saved configuration model
interface SavedConfiguration {
  id: string;
  userId: string;
  name: string;
  description?: string;
  configuration: SerializedConfiguration;
  calculatedPrice: number;
  createdAt: string;
  updatedAt: string;
}

// Order model
interface Order {
  id: string;
  userId: string;
  configurationId: string;
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalPrice: number;
  shippingDetails: ShippingDetails;
  paymentDetails: PaymentDetails;
  createdAt: string;
  updatedAt: string;
}

// Pricing rule model
interface PricingRule {
  id: string;
  productType: ProductTypeName;
  basePrice: number;
  dimensionFactors: Record<string, number>;
  materialMultipliers: Record<string, number>;
  featureAdders: Record<string, number>;
  styleMultipliers: Record<string, number>;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}
```

### Database Schema
A simple database schema supports the backend functionality:

```sql
-- Product types reference
CREATE TABLE product_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model_path TEXT
);

-- User saved configurations
CREATE TABLE saved_configurations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  description TEXT,
  configuration JSONB NOT NULL,
  calculated_price DECIMAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing data table for admin updates
CREATE TABLE pricing (
  id TEXT PRIMARY KEY,
  pricing_data JSONB NOT NULL,
  effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- Orders (minimal implementation)
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  configuration_id TEXT,
  user_id TEXT,
  status TEXT DEFAULT 'new',
  total_price DECIMAL NOT NULL,
  shipping_details JSONB,
  payment_details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

### Authentication
- Simple JWT-based authentication system
- Secure password storage with proper hashing
- Session management with refresh tokens

### API Implementation
- RESTful API design principles
- JSON response format
- Proper error handling and status codes
- Rate limiting for security

## Integration Points

### Configurator Component
- Must load pricing data at initialization
- Must recalculate prices on all configuration changes
- Must provide save/load functionality integrated with backend

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
- Integration tests for backend data operations
- Performance tests for calculation speed under various configurations
- Stress tests for concurrent user operations

## Future Extensions
1. **Enhanced Admin Tools**: More sophisticated pricing rule management
2. **Multi-currency Support**: International pricing capabilities
3. **Discount System**: Support for promotional pricing and discounts
4. **Cost Estimation**: Integration with manufacturing cost calculators
5. **Analytics**: Usage patterns and popular configurations
