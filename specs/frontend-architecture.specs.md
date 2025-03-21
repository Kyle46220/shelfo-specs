# Frontend Architecture Specifications

## Overview
This document specifies the frontend architecture for the Shelfo furniture configurator. The frontend provides an interactive, responsive interface for users to customize furniture products using React, Next.js, and React Three Fiber.

## Core Technologies

### Next.js Framework
The application is built on Next.js 15 with App Router:

```typescript
// app/layout.tsx - Root layout
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Shelfo Furniture Configurator',
  description: 'Customize your perfect furniture piece',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

// app/providers.tsx - Application providers
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
```

### Page Structure
The application uses a modular page structure:

```typescript
// app/page.tsx - Home page
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Shelfo Furniture Configurator</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        <ProductTypeCard
          title="Bookcase"
          description="Customize your perfect bookcase with adjustable shelves and compartments."
          image="/images/bookcase.jpg"
          href="/configure/bookcase"
        />
        <ProductTypeCard
          title="Table"
          description="Design a table that fits your space perfectly with custom dimensions and finishes."
          image="/images/table.jpg"
          href="/configure/table"
        />
        <ProductTypeCard
          title="Coming Soon"
          description="More furniture types will be available soon."
          image="/images/coming-soon.jpg"
          href="#"
          disabled
        />
      </div>
    </main>
  );
}

// app/configure/[type]/page.tsx - Configurator page
export default function ConfiguratorPage({
  params
}: {
  params: { type: string }
}) {
  return (
    <main className="h-screen overflow-hidden">
      <ConfiguratorProvider type={params.type}>
        <ResponsiveConfiguratorLayout />
      </ConfiguratorProvider>
    </main>
  );
}
```

### Component Architecture
The application uses a hierarchical component structure:

```
/components
  /ui                  # Shadcn UI components
  /configurator        # Configurator-specific components
    /layout            # Layout components
    /controls          # Control panel components
    /3d                # 3D visualization components
    /presets           # Preset selection components
    /product-types     # Product type specific components
      /bookcase        # Bookcase-specific components
      /table           # Table-specific components
  /shared              # Shared utility components
```

## State Management

### Valtio Store Structure
The application uses Valtio for state management:

```typescript
// store/configurator.ts - Main configurator store
import { proxy } from 'valtio';
import { derive } from 'valtio/utils';
import { ProductType, ProductComponent, MaterialGroup } from '@/types';

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

// Derived state
export const derivedState = derive({
  // Active dimensions
  dimensions: (get) => {
    const productType = get(configuratorStore).activeProductType;
    return productType?.defaultDimensions || { width: 0, height: 0, depth: 0 };
  },
  
  // Active material
  activeMaterial: (get) => {
    const components = get(configuratorStore).components;
    return components.length > 0 ? components[0].material : 'wood';
  },
  
  // Active color
  activeColor: (get) => {
    const components = get(configuratorStore).components;
    return components.length > 0 ? components[0].color : 'natural';
  },
  
  // Component count
  componentCount: (get) => {
    return get(configuratorStore).components.length;
  },
  
  // Is cabinet type
  isCabinetType: (get) => {
    const productType = get(configuratorStore).activeProductType;
    return productType?.type === 'cabinet';
  },
  
  // Is table type
  isTableType: (get) => {
    const productType = get(configuratorStore).activeProductType;
    return productType?.type === 'table';
  },
});
```

### Store Actions
Actions for modifying the store state:

```typescript
// store/actions.ts - Store actions
import { configuratorStore } from './configurator';
import { createProductType, generateComponents, calculatePrice } from '@/lib/configurator';
import { isCabinetType, isTableType } from '@/lib/type-guards';

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

// Save current state to history
function saveToHistory() {
  const currentState = createSnapshot();
  configuratorStore.history.past.push(currentState);
  configuratorStore.history.future = []; // Clear redo stack
}

// Update metadata
function updateMetadata() {
  configuratorStore.metadata.modifiedAt = new Date().toISOString();
}

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
  
  // Additional actions...
};

// Attach actions to the store
Object.assign(configuratorStore, { actions });
```

### Context Provider
Context provider for accessing the store:

```typescript
// contexts/ConfiguratorContext.tsx - Configurator context
import { createContext, useContext, useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { configuratorStore, derivedState } from '@/store/configurator';
import { actions } from '@/store/actions';
import { loadProductType } from '@/lib/product-registry';

// Create context
const ConfiguratorContext = createContext({
  store: configuratorStore,
  derived: derivedState,
  actions,
});

// Provider component
export function ConfiguratorProvider({
  children,
  type
}: {
  children: React.ReactNode;
  type: string;
}) {
  // Initialize product type on mount
  useEffect(() => {
    const productType = loadProductType(type);
    if (productType) {
      actions.setProductType(type as ProductTypeName, productType);
    }
  }, [type]);
  
  return (
    <ConfiguratorContext.Provider value={{ store: configuratorStore, derived: derivedState, actions }}>
      {children}
    </ConfiguratorContext.Provider>
  );
}

// Hook for using the configurator context
export function useConfigurator() {
  return useContext(ConfiguratorContext);
}

// Hook for using the configurator store with reactive updates
export function useConfiguratorStore() {
  return useSnapshot(configuratorStore);
}

// Hook for using derived state with reactive updates
export function useDerivedState() {
  return useSnapshot(derivedState);
}
```

## 3D Visualization

### React Three Fiber Setup
The 3D visualization is built with React Three Fiber:

```typescript
// components/configurator/3d/ConfiguratorScene.tsx - Main 3D scene
import { Canvas } from '@react-three/fiber';
import { Environment, PresentationControls, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import { useConfiguratorStore, useDerivedState } from '@/contexts/ConfiguratorContext';
import { ProductRenderer } from './ProductRenderer';
import { LoadingPlaceholder } from './LoadingPlaceholder';

export function ConfiguratorScene() {
  const store = useConfiguratorStore();
  const derived = useDerivedState();
  
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 4], fov: 50 }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <Suspense fallback={<LoadingPlaceholder />}>
          <Environment preset="apartment" />
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={0.5} 
            castShadow 
            shadow-mapSize={[2048, 2048]} 
          />
          <PresentationControls
            global
            zoom={store.ui.zoomLevel}
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 4, Math.PI / 4]}
            azimuth={[-Math.PI / 4, Math.PI / 4]}
          >
            <group position={[0, 0, 0]} scale={1}>
              <ProductRenderer />
            </group>
          </PresentationControls>
          <gridHelper args={[10, 10]} position={[0, -0.5, 0]} />
          <ContactShadows 
            opacity={0.5} 
            scale={10} 
            blur={1} 
            far={10} 
            resolution={256} 
            color="#000000" 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

### Product Rendering
Type-specific product rendering:

```typescript
// components/configurator/3d/ProductRenderer.tsx - Product renderer
import { useConfiguratorStore } from '@/contexts/ConfiguratorContext';
import { CabinetRenderer } from './product-types/CabinetRenderer';
import { TableRenderer } from './product-types/TableRenderer';

export function ProductRenderer() {
  const { activeProductType } = useConfiguratorStore();
  
  if (!activeProductType) return null;
  
  // Render based on product type
  switch(activeProductType.type) {
    case 'cabinet':
      return <CabinetRenderer config={activeProductType.config} />;
    case 'table':
      return <TableRenderer config={activeProductType.config} />;
    default:
      return null;
  }
}
```

### Component Rendering
Component-based rendering system:

```typescript
// components/configurator/3d/ComponentRenderer.tsx - Component renderer
import { useConfiguratorStore } from '@/contexts/ConfiguratorContext';
import { ShelfRenderer } from './components/ShelfRenderer';
import { DividerRenderer } from './components/DividerRenderer';
import { DoorRenderer } from './components/DoorRenderer';
import { DrawerRenderer } from './components/DrawerRenderer';
import { TabletopRenderer } from './components/TabletopRenderer';
import { LegRenderer } from './components/LegRenderer';

export function ComponentRenderer({ component }) {
  const { ui } = useConfiguratorStore();
  
  // Determine if component is hovered or selected
  const isHovered = ui.hoveredComponent === component.id;
  const isSelected = ui.selectedComponent === component.id;
  
  // Render based on component type
  switch(component.type) {
    case 'shelf':
      return <ShelfRenderer component={component} isHovered={isHovered} isSelected={isSelected} />;
    case 'divider':
      return <DividerRenderer component={component} isHovered={isHovered} isSelected={isSelected} />;
    case 'door':
      return <DoorRenderer component={component} isHovered={isHovered} isSelected={isSelected} />;
    case 'drawer':
      return <DrawerRenderer component={component} isHovered={isHovered} isSelected={isSelected} />;
    case 'tabletop':
      return <TabletopRenderer component={component} isHovered={isHovered} isSelected={isSelected} />;
    case 'leg':
      return <LegRenderer component={component} isHovered={isHovered} isSelected={isSelected} />;
    default:
      return null;
  }
}
```

## UI Components

### Layout Components
Responsive layout components:

```typescript
// components/configurator/layout/ResponsiveConfiguratorLayout.tsx - Responsive layout
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ConfiguratorLayout } from './ConfiguratorLayout';
import { MobileConfiguratorLayout } from './MobileConfiguratorLayout';

export function ResponsiveConfiguratorLayout() {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  
  return isMobile ? <MobileConfiguratorLayout /> : <ConfiguratorLayout />;
}

// components/configurator/layout/ConfiguratorLayout.tsx - Desktop layout
export function ConfiguratorLayout() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] h-screen">
      <ConfiguratorSidebar />
      <ConfiguratorViewport />
    </div>
  );
}

// components/configurator/layout/MobileConfiguratorLayout.tsx - Mobile layout
export function MobileConfiguratorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="h-screen relative">
      <div className="h-screen">
        <ConfiguratorViewport />
      </div>
      
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-white rounded-md shadow-md border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <PricingSummary />
            <Button onClick={() => setSidebarOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>
      </div>
      
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Configure Your Furniture</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <ConfiguratorSidebar />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
```

### Control Panel Components
UI controls for configuration:

```typescript
// components/configurator/controls/DimensionsPanel.tsx - Dimensions panel
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useConfigurator, useConfiguratorStore } from '@/contexts/ConfiguratorContext';
import { isCabinetType, isTableType } from '@/lib/type-guards';

export function DimensionsPanel() {
  const { actions } = useConfigurator();
  const { activeProductType } = useConfiguratorStore();
  
  if (!activeProductType) return null;
  
  const handleDimensionChange = (dimension: keyof Dimensions, value: number) => {
    actions.updateDimensions({
      [dimension]: value
    });
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Dimensions</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between">
            <Label htmlFor="width">Width</Label>
            <span className="text-sm text-gray-500">
              {activeProductType.defaultDimensions.width} mm
            </span>
          </div>
          <Slider
            id="width"
            min={activeProductType.minDimensions.width}
            max={activeProductType.maxDimensions.width}
            step={10}
            value={[activeProductType.defaultDimensions.width]}
            onValueChange={([value]) => handleDimensionChange('width', value)}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{activeProductType.minDimensions.width} mm</span>
            <span>{activeProductType.maxDimensions.width} mm</span>
          </div>
        </div>
        
        {/* Height and depth sliders follow the same pattern */}
      </div>
      
      {isCabinetType(activeProductType) && (
        <CabinetDimensionsPanel />
      )}
      
      {isTableType(activeProductType) && (
        <TableDimensionsPanel />
      )}
    </div>
  );
}
```

### Preset Selection Components
Components for selecting presets:

```typescript
// components/configurator/presets/PresetSelection.tsx - Preset selection
import { useState, useEffect } from 'react';
import { useConfigurator } from '@/contexts/ConfiguratorContext';
import { fetchPresets } from '@/lib/api';

export function PresetSelection() {
  const { actions } = useConfigurator();
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadPresets() {
      setIsLoading(true);
      try {
        const data = await fetchPresets();
        setPresets(data);
      } catch (error) {
        console.error('Failed to load presets:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPresets();
  }, []);
  
  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.id);
    actions.loadPreset(preset);
  };
  
  if (isLoading) {
    return <div className="p-4">Loading presets...</div>;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Presets</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {presets.map(preset => (
          <div
            key={preset.id}
            className={`relative rounded-md overflow-hidden cursor-pointer border-2 ${
              selectedPreset === preset.id ? 'border-primary' : 'border-transparent'
            }`}
            onClick={() => handlePresetSelect(preset)}
          >
            <img
              src={preset.thumbnail}
              alt={preset.name}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
              <div className="text-white text-sm font-medium">{preset.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## API Integration

### API Client
Client for backend API communication:

```typescript
// lib/api.ts - API client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Fetch with error handling
async function fetchWithErrorHandling(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }
  
  return response.json();
}

// API endpoints
export const api = {
  // Configuration endpoints
  configurations: {
    list: () => fetchWithErrorHandling(`${API_BASE_URL}/configurations`),
    get: (id: string) => fetchWithErrorHandling(`${API_BASE_URL}/configurations/${id}`),
    create: (data: any) => fetchWithErrorHandling(`${API_BASE_URL}/configurations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchWithErrorHandling(`${API_BASE_URL}/configurations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchWithErrorHandling(`${API_BASE_URL}/configurations/${id}`, {
      method: 'DELETE',
    }),
  },
  
  // Product endpoints
  products: {
    types: () => fetchWithErrorHandling(`${API_BASE_URL}/products/types`),
    presets: () => fetchWithErrorHandling(`${API_BASE_URL}/products/presets`),
    materials: () => fetchWithErrorHandling(`${API_BASE_URL}/products/materials`),
  },
  
  // Pricing endpoints
  pricing: {
    calculate: (data: any) => fetchWithErrorHandling(`${API_BASE_URL}/pricing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    rules: () => fetchWithErrorHandling(`${API_BASE_URL}/pricing/rules`),
  },
  
  // Order endpoints
  orders: {
    create: (data: any) => fetchWithErrorHandling(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    list: () => fetchWithErrorHandling(`${API_BASE_URL}/orders`),
    get: (id: string) => fetchWithErrorHandling(`${API_BASE_URL}/orders/${id}`),
  },
};
```

### Data Fetching
Data fetching with React hooks:

```typescript
// hooks/useApi.ts - API hooks
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

// Hook for fetching data
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await fetchFn();
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, dependencies);
  
  return { data, isLoading, error };
}

// Hook for fetching product types
export function useProductTypes() {
  return useFetch(() => api.products.types());
}

// Hook for fetching presets
export function usePresets() {
  return useFetch(() => api.products.presets());
}

// Hook for fetching materials
export function useMaterials() {
  return useFetch(() => api.products.materials());
}

// Hook for fetching pricing rules
export function usePricingRules() {
  return useFetch(() => api.pricing.rules());
}
```

## Routing and Navigation

### Route Structure
The application uses Next.js App Router for routing:

```
/app
  /page.tsx                    # Home page
  /layout.tsx                  # Root layout
  /configure
    /[type]                    # Dynamic route for product type
      /page.tsx                # Configurator page
  /presets
    /page.tsx                  # Presets gallery page
    /[id]
      /page.tsx                # Preset detail page
  /saved
    /page.tsx                  # Saved configurations page
    /[id]
      /page.tsx                # Saved configuration detail page
  /cart
    /page.tsx                  # Shopping cart page
  /checkout
    /page.tsx                  # Checkout page
  /api                         # API routes
    /configurations
      /route.ts                # Configurations API
    /products
      /route.ts                # Products API
    /pricing
      /route.ts                # Pricing API
    /orders
      /route.ts                # Orders API
```

### Navigation Components
Components for application navigation:

```typescript
// components/shared/Navigation.tsx - Navigation component
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Settings } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  
  return (
    <header className="border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold">
            Shelfo
          </Link>
          
          <nav className="ml-8 hidden md:block">
            <ul className="flex space-x-6">
              <li>
                <Link 
                  href="/configure/bookcase"
                  className={`${pathname.startsWith('/configure/bookcase') ? 'text-primary font-medium' : 'text-gray-600'}`}
                >
                  Bookcase
                </Link>
              </li>
              <li>
                <Link 
                  href="/configure/table"
                  className={`${pathname.startsWith('/configure/table') ? 'text-primary font-medium' : 'text-gray-600'}`}
                >
                  Table
                </Link>
              </li>
              <li>
                <Link 
                  href="/presets"
                  className={`${pathname.startsWith('/presets') ? 'text-primary font-medium' : 'text-gray-600'}`}
                >
                  Presets
                </Link>
              </li>
              <li>
                <Link 
                  href="/saved"
                  className={`${pathname.startsWith('/saved') ? 'text-primary font-medium' : 'text-gray-600'}`}
                >
                  Saved Designs
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href="/cart">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/account">
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
```

## Performance Optimization

### Code Splitting
Optimize loading with code splitting:

```typescript
// Dynamic imports for code splitting
import dynamic from 'next/dynamic';

// Dynamically import the 3D scene with no SSR
const ConfiguratorScene = dynamic(
  () => import('@/components/configurator/3d/ConfiguratorScene').then(mod => mod.ConfiguratorScene),
  { ssr: false }
);

// Dynamically import heavy components
const PresetSelection = dynamic(() => import('@/components/configurator/presets/PresetSelection'));
```

### Memoization
Optimize rendering with memoization:

```typescript
// Memoized component
import { memo, useMemo } from 'react';

const MemoizedComponent = memo(function Component({ data }) {
  // Component implementation
  return <div>{/* Render content */}</div>;
});

// Usage with useMemo for props
function ParentComponent() {
  const data = useConfiguratorStore();
  
  const memoizedProps = useMemo(() => ({
    items: data.components,
    selected: data.ui.selectedComponent
  }), [data.components, data.ui.selectedComponent]);
  
  return <MemoizedComponent {...memoizedProps} />;
}
```

### Image Optimization
Optimize images with Next.js Image component:

```typescript
// Optimized image component
import Image from 'next/image';

function OptimizedImage({ src, alt, width, height }) {
  return (
    <div className="relative w-full aspect-square">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
        priority={false}
        quality={80}
      />
    </div>
  );
}
```

## Integration Points

### Product Definition System
- Product types drive UI components and options
- Component definitions determine rendering and behavior
- Manufacturing constraints enforce valid configurations

### State Management
- Valtio store provides reactive state updates
- Actions modify state in a consistent manner
- Derived state calculates values from base state

### Backend Integration
- API client communicates with backend services
- Data fetching hooks provide loading and error states
- Configuration persistence for saving and loading designs

## Success Criteria
- [ ] UI components correctly display and update based on state
- [ ] 3D visualization accurately represents the configured product
- [ ] Responsive design works on all device sizes
- [ ] Performance meets targets for initial load and interactions
- [ ] State management correctly handles all product types
- [ ] API integration provides seamless data persistence
- [ ] Navigation and routing provide intuitive user flow
