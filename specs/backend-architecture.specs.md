# Backend Architecture Specifications

## Overview
This document specifies the backend architecture for the Shelfo furniture configurator. The backend provides essential services for data persistence, user authentication, and order management while maintaining a simple and maintainable architecture.

## Core Technologies

### Backend Framework
The backend uses a lightweight, RESTful API approach:

```typescript
// Server setup with Express
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { json, urlencoded } from 'body-parser';
import { configurationRoutes } from './routes/configurations';
import { productRoutes } from './routes/products';
import { pricingRoutes } from './routes/pricing';
import { orderRoutes } from './routes/orders';
import { authRoutes } from './routes/auth';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

// Routes
app.use('/api/configurations', configurationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Database Structure
A simple database schema supports the backend functionality:

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product types reference
CREATE TABLE product_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model_path TEXT,
  data JSONB NOT NULL
);

-- User saved configurations
CREATE TABLE saved_configurations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT,
  description TEXT,
  configuration JSONB NOT NULL,
  calculated_price DECIMAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing data table for admin updates
CREATE TABLE pricing_rules (
  id TEXT PRIMARY KEY,
  pricing_data JSONB NOT NULL,
  effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'new',
  total_price DECIMAL NOT NULL,
  shipping_details JSONB,
  payment_details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  configuration_id TEXT REFERENCES saved_configurations(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Presets table
CREATE TABLE presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL,
  thumbnail TEXT,
  configuration JSONB NOT NULL,
  tags JSONB,
  popularity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Preset categories table
CREATE TABLE preset_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Preset to category mapping
CREATE TABLE preset_category_mapping (
  preset_id TEXT REFERENCES presets(id),
  category_id TEXT REFERENCES preset_categories(id),
  PRIMARY KEY (preset_id, category_id)
);
```

### Data Models
TypeScript interfaces for the data models:

```typescript
// User model
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

// Saved configuration model
export interface SavedConfiguration {
  id: string;
  userId: string;
  name: string;
  description?: string;
  configuration: any; // JSON configuration data
  calculatedPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

// Order model
export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalPrice: number;
  shippingDetails: ShippingDetails;
  paymentDetails: PaymentDetails;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

// Order item model
export interface OrderItem {
  id: string;
  orderId: string;
  configurationId: string;
  quantity: number;
  unitPrice: number;
  createdAt: Date;
}

// Pricing rule model
export interface PricingRule {
  id: string;
  pricingData: any; // JSON pricing data
  effectiveDate: Date;
  createdBy: string;
  createdAt: Date;
}

// Preset model
export interface Preset {
  id: string;
  name: string;
  description: string;
  productType: string;
  thumbnail: string;
  configuration: any; // JSON configuration data
  tags: string[];
  popularity: number;
  createdAt: Date;
}

// Preset category model
export interface PresetCategory {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  createdAt: Date;
  presets?: Preset[]; // Populated when fetching category with presets
}
```

## API Endpoints

### Authentication Endpoints
Endpoints for user authentication:

```typescript
// routes/auth.ts - Authentication routes
import { Router } from 'express';
import { register, login, logout, refreshToken, getProfile } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Logout user
router.post('/logout', authenticate, logout);

// Refresh access token
router.post('/refresh', refreshToken);

// Get user profile
router.get('/profile', authenticate, getProfile);

export const authRoutes = router;
```

### Configuration Endpoints
Endpoints for managing saved configurations:

```typescript
// routes/configurations.ts - Configuration routes
import { Router } from 'express';
import { 
  getConfigurations, 
  getConfiguration, 
  createConfiguration, 
  updateConfiguration, 
  deleteConfiguration 
} from '../controllers/configurations';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all configurations for user
router.get('/', authenticate, getConfigurations);

// Get specific configuration
router.get('/:id', authenticate, getConfiguration);

// Create new configuration
router.post('/', authenticate, createConfiguration);

// Update configuration
router.put('/:id', authenticate, updateConfiguration);

// Delete configuration
router.delete('/:id', authenticate, deleteConfiguration);

export const configurationRoutes = router;
```

### Product Endpoints
Endpoints for product data:

```typescript
// routes/products.ts - Product routes
import { Router } from 'express';
import { 
  getProductTypes, 
  getPresets, 
  getPresetsByCategory,
  getMaterials 
} from '../controllers/products';

const router = Router();

// Get all product types
router.get('/types', getProductTypes);

// Get all presets
router.get('/presets', getPresets);

// Get presets by category
router.get('/presets/category/:categoryId', getPresetsByCategory);

// Get all materials
router.get('/materials', getMaterials);

export const productRoutes = router;
```

### Pricing Endpoints
Endpoints for pricing calculations:

```typescript
// routes/pricing.ts - Pricing routes
import { Router } from 'express';
import { calculatePrice, getPricingRules } from '../controllers/pricing';
import { authenticate } from '../middleware/auth';

const router = Router();

// Calculate price for configuration
router.post('/calculate', calculatePrice);

// Get pricing rules (admin only)
router.get('/rules', authenticate, getPricingRules);

export const pricingRoutes = router;
```

### Order Endpoints
Endpoints for order management:

```typescript
// routes/orders.ts - Order routes
import { Router } from 'express';
import { 
  getOrders, 
  getOrder, 
  createOrder, 
  updateOrderStatus 
} from '../controllers/orders';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all orders for user
router.get('/', authenticate, getOrders);

// Get specific order
router.get('/:id', authenticate, getOrder);

// Create new order
router.post('/', authenticate, createOrder);

// Update order status
router.patch('/:id/status', authenticate, updateOrderStatus);

export const orderRoutes = router;
```

## Core Services

### Authentication Service
Service for user authentication:

```typescript
// services/auth.ts - Authentication service
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { User } from '../models';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Register new user
export async function registerUser(email: string, password: string, name: string): Promise<User> {
  // Check if user already exists
  const existingUser = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create user
  const userId = uuidv4();
  const now = new Date();
  
  const user = await db.one(
    'INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [userId, email, name, passwordHash, now, now]
  );
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.password_hash,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

// Login user
export async function loginUser(email: string, password: string): Promise<{ user: User, accessToken: string, refreshToken: string }> {
  // Find user
  const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }
  
  // Generate tokens
  const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  
  // Store refresh token (in a real app, store in database or Redis)
  // For simplicity, we're not storing it here
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.password_hash,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    },
    accessToken,
    refreshToken
  };
}

// Verify token
export function verifyToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Refresh access token
export function refreshAccessToken(refreshToken: string): { accessToken: string } {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };
    const accessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    return { accessToken };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}
```

### Configuration Service
Service for managing configurations:

```typescript
// services/configurations.ts - Configuration service
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { SavedConfiguration } from '../models';

// Get all configurations for user
export async function getUserConfigurations(userId: string): Promise<SavedConfiguration[]> {
  const configurations = await db.manyOrNone(
    'SELECT * FROM saved_configurations WHERE user_id = $1 ORDER BY updated_at DESC',
    [userId]
  );
  
  return configurations.map(config => ({
    id: config.id,
    userId: config.user_id,
    name: config.name,
    description: config.description,
    configuration: config.configuration,
    calculatedPrice: parseFloat(config.calculated_price),
    createdAt: config.created_at,
    updatedAt: config.updated_at
  }));
}

// Get configuration by ID
export async function getConfigurationById(id: string, userId: string): Promise<SavedConfiguration | null> {
  const config = await db.oneOrNone(
    'SELECT * FROM saved_configurations WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  
  if (!config) return null;
  
  return {
    id: config.id,
    userId: config.user_id,
    name: config.name,
    description: config.description,
    configuration: config.configuration,
    calculatedPrice: parseFloat(config.calculated_price),
    createdAt: config.created_at,
    updatedAt: config.updated_at
  };
}

// Create new configuration
export async function createConfiguration(
  userId: string,
  name: string,
  description: string | undefined,
  configuration: any,
  calculatedPrice: number
): Promise<SavedConfiguration> {
  const id = uuidv4();
  const now = new Date();
  
  const config = await db.one(
    'INSERT INTO saved_configurations (id, user_id, name, description, configuration, calculated_price, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [id, userId, name, description, configuration, calculatedPrice, now, now]
  );
  
  return {
    id: config.id,
    userId: config.user_id,
    name: config.name,
    description: config.description,
    configuration: config.configuration,
    calculatedPrice: parseFloat(config.calculated_price),
    createdAt: config.created_at,
    updatedAt: config.updated_at
  };
}

// Update configuration
export async function updateConfiguration(
  id: string,
  userId: string,
  updates: Partial<SavedConfiguration>
): Promise<SavedConfiguration | null> {
  // Check if configuration exists and belongs to user
  const existingConfig = await getConfigurationById(id, userId);
  if (!existingConfig) return null;
  
  // Build update query
  const updateFields = [];
  const queryParams = [];
  let paramIndex = 1;
  
  if (updates.name !== undefined) {
    updateFields.push(`name = $${paramIndex++}`);
    queryParams.push(updates.name);
  }
  
  if (updates.description !== undefined) {
    updateFields.push(`description = $${paramIndex++}`);
    queryParams.push(updates.description);
  }
  
  if (updates.configuration !== undefined) {
    updateFields.push(`configuration = $${paramIndex++}`);
    queryParams.push(updates.configuration);
  }
  
  if (updates.calculatedPrice !== undefined) {
    updateFields.push(`calculated_price = $${paramIndex++}`);
    queryParams.push(updates.calculatedPrice);
  }
  
  // Always update the updated_at timestamp
  const now = new Date();
  updateFields.push(`updated_at = $${paramIndex++}`);
  queryParams.push(now);
  
  // Add ID and user ID to query params
  queryParams.push(id);
  queryParams.push(userId);
  
  // Execute update
  const config = await db.oneOrNone(
    `UPDATE saved_configurations SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`,
    queryParams
  );
  
  if (!config) return null;
  
  return {
    id: config.id,
    userId: config.user_id,
    name: config.name,
    description: config.description,
    configuration: config.configuration,
    calculatedPrice: parseFloat(config.calculated_price),
    createdAt: config.created_at,
    updatedAt: config.updated_at
  };
}

// Delete configuration
export async function deleteConfiguration(id: string, userId: string): Promise<boolean> {
  const result = await db.result(
    'DELETE FROM saved_configurations WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  
  return result.rowCount > 0;
}
```

### Pricing Service
Service for price calculations:

```typescript
// services/pricing.ts - Pricing service
import { db } from '../db';

// Get active pricing rules
export async function getActivePricingRules(): Promise<any> {
  const rules = await db.oneOrNone(
    'SELECT pricing_data FROM pricing_rules ORDER BY effective_date DESC LIMIT 1'
  );
  
  return rules ? rules.pricing_data : null;
}

// Calculate price for configuration
export async function calculatePrice(configuration: any): Promise<number> {
  // Get pricing rules
  const pricingRules = await getActivePricingRules();
  if (!pricingRules) {
    throw new Error('Pricing rules not found');
  }
  
  // Get product type
  const productType = configuration.productType;
  const baseData = pricingRules.basePrices[productType];
  
  if (!baseData) {
    throw new Error(`Pricing data not found for product type: ${productType}`);
  }
  
  // Calculate base price from dimensions
  let basePrice = baseData.basePrice;
  Object.entries(configuration.dimensions).forEach(([dimension, value]) => {
    if (baseData.dimensionFactors[dimension]) {
      basePrice += (value as number) * baseData.dimensionFactors[dimension];
    }
  });
  
  // Apply material multiplier
  const materialFactor = pricingRules.materialMultipliers[configuration.material] || 1;
  let price = basePrice * materialFactor;
  
  // Apply style multiplier if available
  if (configuration.style && configuration.style.pattern) {
    const styleFactor = pricingRules.styleMultipliers[configuration.style.pattern] || 1;
    price = price * styleFactor;
  }
  
  // Add feature costs
  if (configuration.components && Array.isArray(configuration.components)) {
    configuration.components.forEach(component => {
      const featurePrice = pricingRules.featureAdders[component.type] || 0;
      price += featurePrice;
    });
  }
  
  // Round to 2 decimal places
  return Math.round(price * 100) / 100;
}
```

### Product Service
Service for product data:

```typescript
// services/products.ts - Product service
import { db } from '../db';
import { Preset, PresetCategory } from '../models';

// Get all product types
export async function getProductTypes(): Promise<any[]> {
  const types = await db.manyOrNone('SELECT id, name, data FROM product_types');
  
  return types.map(type => ({
    id: type.id,
    name: type.name,
    ...type.data
  }));
}

// Get all presets
export async function getPresets(): Promise<Preset[]> {
  const presets = await db.manyOrNone('SELECT * FROM presets ORDER BY popularity DESC');
  
  return presets.map(preset => ({
    id: preset.id,
    name: preset.name,
    description: preset.description,
    productType: preset.product_type,
    thumbnail: preset.thumbnail,
    configuration: preset.configuration,
    tags: preset.tags,
    popularity: preset.popularity,
    createdAt: preset.created_at
  }));
}

// Get presets by category
export async function getPresetsByCategory(categoryId: string): Promise<Preset[]> {
  const presets = await db.manyOrNone(
    `SELECT p.* FROM presets p
     JOIN preset_category_mapping pcm ON p.id = pcm.preset_id
     WHERE pcm.category_id = $1
     ORDER BY p.popularity DESC`,
    [categoryId]
  );
  
  return presets.map(preset => ({
    id: preset.id,
    name: preset.name,
    description: preset.description,
    productType: preset.product_type,
    thumbnail: preset.thumbnail,
    configuration: preset.configuration,
    tags: preset.tags,
    popularity: preset.popularity,
    createdAt: preset.created_at
  }));
}

// Get all preset categories
export async function getPresetCategories(): Promise<PresetCategory[]> {
  const categories = await db.manyOrNone('SELECT * FROM preset_categories');
  
  return categories.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description,
    thumbnail: category.thumbnail,
    createdAt: category.created_at
  }));
}

// Get all materials
export async function getMaterials(): Promise<any> {
  // In a real app, this would come from the database
  // For simplicity, we're returning a static object
  return {
    wood: {
      name: 'Wood',
      types: ['oak', 'walnut', 'pine', 'maple', 'birch'],
      finishes: ['natural', 'matte', 'gloss'],
      colors: ['natural', 'white', 'black', 'gray', 'brown']
    },
    metal: {
      name: 'Metal',
      types: ['steel', 'aluminum', 'brass'],
      finishes: ['brushed', 'polished', 'powder-coated'],
      colors: ['natural', 'white', 'black', 'gray']
    },
    glass: {
      name: 'Glass',
      types: ['clear', 'frosted', 'tinted'],
      finishes: ['polished', 'etched'],
      colors: ['clear', 'white', 'black', 'blue', 'green']
    }
  };
}
```

### Order Service
Service for order management:

```typescript
// services/orders.ts - Order service
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { Order, OrderItem } from '../models';

// Get all orders for user
export async function getUserOrders(userId: string): Promise<Order[]> {
  const orders = await db.manyOrNone(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  
  const result: Order[] = [];
  
  for (const order of orders) {
    // Get order items
    const items = await db.manyOrNone(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );
    
    result.push({
      id: order.id,
      userId: order.user_id,
      status: order.status,
      totalPrice: parseFloat(order.total_price),
      shippingDetails: order.shipping_details,
      paymentDetails: order.payment_details,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: items.map(item => ({
        id: item.id,
        orderId: item.order_id,
        configurationId: item.configuration_id,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        createdAt: item.created_at
      }))
    });
  }
  
  return result;
}

// Get order by ID
export async function getOrderById(id: string, userId: string): Promise<Order | null> {
  const order = await db.oneOrNone(
    'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  
  if (!order) return null;
  
  // Get order items
  const items = await db.manyOrNone(
    'SELECT * FROM order_items WHERE order_id = $1',
    [order.id]
  );
  
  return {
    id: order.id,
    userId: order.user_id,
    status: order.status,
    totalPrice: parseFloat(order.total_price),
    shippingDetails: order.shipping_details,
    paymentDetails: order.payment_details,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: items.map(item => ({
      id: item.id,
      orderId: item.order_id,
      configurationId: item.configuration_id,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      createdAt: item.created_at
    }))
  };
}

// Create new order
export async function createOrder(
  userId: string,
  items: { configurationId: string; quantity: number; unitPrice: number }[],
  shippingDetails: any,
  paymentDetails: any
): Promise<Order> {
  // Start transaction
  return db.tx(async t => {
    const orderId = uuidv4();
    const now = new Date();
    
    // Calculate total price
    const totalPrice = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    // Create order
    const order = await t.one(
      'INSERT INTO orders (id, user_id, status, total_price, shipping_details, payment_details, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [orderId, userId, 'new', totalPrice, shippingDetails, paymentDetails, now, now]
    );
    
    // Create order items
    const orderItems: OrderItem[] = [];
    
    for (const item of items) {
      const itemId = uuidv4();
      
      const orderItem = await t.one(
        'INSERT INTO order_items (id, order_id, configuration_id, quantity, unit_price, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [itemId, orderId, item.configurationId, item.quantity, item.unitPrice, now]
      );
      
      orderItems.push({
        id: orderItem.id,
        orderId: orderItem.order_id,
        configurationId: orderItem.configuration_id,
        quantity: orderItem.quantity,
        unitPrice: parseFloat(orderItem.unit_price),
        createdAt: orderItem.created_at
      });
    }
    
    return {
      id: order.id,
      userId: order.user_id,
      status: order.status,
      totalPrice: parseFloat(order.total_price),
      shippingDetails: order.shipping_details,
      paymentDetails: order.payment_details,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: orderItems
    };
  });
}

// Update order status
export async function updateOrderStatus(id: string, userId: string, status: string): Promise<Order | null> {
  // Check if order exists and belongs to user
  const existingOrder = await getOrderById(id, userId);
  if (!existingOrder) return null;
  
  // Update status
  const now = new Date();
  
  const order = await db.oneOrNone(
    'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
    [status, now, id, userId]
  );
  
  if (!order) return null;
  
  // Get order items
  const items = await db.manyOrNone(
    'SELECT * FROM order_items WHERE order_id = $1',
    [order.id]
  );
  
  return {
    id: order.id,
    userId: order.user_id,
    status: order.status,
    totalPrice: parseFloat(order.total_price),
    shippingDetails: order.shipping_details,
    paymentDetails: order.payment_details,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: items.map(item => ({
      id: item.id,
      orderId: item.order_id,
      configurationId: item.configuration_id,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      createdAt: item.created_at
    }))
  };
}
```

## Middleware

### Authentication Middleware
Middleware for authenticating requests:

```typescript
// middleware/auth.ts - Authentication middleware
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Authenticate middleware
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = verifyToken(token);
    
    // Attach user ID to request
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
```

### Error Handling Middleware
Middleware for handling errors:

```typescript
// middleware/error.ts - Error handling middleware
import { Request, Response, NextFunction } from 'express';

// Error interface
interface AppError extends Error {
  statusCode?: number;
}

// Error handler middleware
export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

// Not found middleware
export function notFound(req: Request, res: Response, next: NextFunction) {
  const error = new Error(`Not found - ${req.originalUrl}`) as AppError;
  error.statusCode = 404;
  next(error);
}
```

## Database Connection

### Database Setup
Setup for database connection:

```typescript
// db/index.ts - Database connection
import pgPromise from 'pg-promise';

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shelfo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

// Initialize pg-promise
const pgp = pgPromise();

// Create database instance
export const db = pgp(config);

// Test connection
db.connect()
  .then(obj => {
    console.log('Database connection successful');
    obj.done(); // Release connection
  })
  .catch(error => {
    console.error('Database connection error:', error);
  });
```

## Deployment

### Docker Configuration
Docker setup for containerization:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
```

### Environment Configuration
Environment variable configuration:

```typescript
// config/index.ts - Environment configuration
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'shelfo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  }
};
```

## Integration Points

### Frontend Integration
- RESTful API endpoints for frontend communication
- JWT authentication for secure access
- JSON response format for data exchange

### Product Definition System
- Product types stored in database
- Presets provide pre-configured options
- Materials and finishes available through API

### Pricing System
- Pricing rules stored in database
- Price calculation based on configuration
- Real-time pricing updates

## Success Criteria
- [ ] API endpoints correctly handle all required operations
- [ ] Authentication system securely manages user access
- [ ] Database schema supports all required data models
- [ ] Pricing calculations accurately reflect configurations
- [ ] Error handling provides clear feedback
- [ ] Performance meets targets for response times
- [ ] Deployment configuration supports scalability
