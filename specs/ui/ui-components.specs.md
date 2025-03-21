# UI Components Specifications

## Overview
This document specifies the UI components for the Shelfo furniture configurator. The UI provides intuitive controls for customizing furniture products while maintaining a clean, modern design using Shadcn components.

## Core Components

### Layout Structure
The application layout organizes the configurator interface:

```tsx
// Main layout component
function ConfiguratorLayout() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] h-screen">
      <ConfiguratorSidebar />
      <ConfiguratorViewport />
    </div>
  );
}

// Sidebar component
function ConfiguratorSidebar() {
  return (
    <div className="h-screen overflow-y-auto border-r border-gray-200 p-4">
      <Tabs defaultValue="dimensions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
        </TabsList>
        <TabsContent value="dimensions">
          <DimensionsPanel />
        </TabsContent>
        <TabsContent value="materials">
          <MaterialsPanel />
        </TabsContent>
        <TabsContent value="components">
          <ComponentsPanel />
        </TabsContent>
      </Tabs>
      <div className="mt-6">
        <PricingSummary />
      </div>
      <div className="mt-6">
        <ActionButtons />
      </div>
    </div>
  );
}

// Viewport component
function ConfiguratorViewport() {
  return (
    <div className="h-screen relative">
      <div className="absolute top-4 right-4 z-10">
        <ViewControls />
      </div>
      <ConfiguratorScene />
    </div>
  );
}
```

### Dimensions Panel
Controls for adjusting product dimensions:

```tsx
// Dimensions panel component
function DimensionsPanel() {
  const snap = useSnapshot(configuratorStore);
  const productType = snap.activeProductType;
  
  if (!productType) return null;
  
  const handleDimensionChange = (dimension: keyof Dimensions, value: number) => {
    configuratorStore.actions.updateDimensions({
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
              {productType.defaultDimensions.width} mm
            </span>
          </div>
          <Slider
            id="width"
            min={productType.minDimensions.width}
            max={productType.maxDimensions.width}
            step={10}
            value={[productType.defaultDimensions.width]}
            onValueChange={([value]) => handleDimensionChange('width', value)}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{productType.minDimensions.width} mm</span>
            <span>{productType.maxDimensions.width} mm</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between">
            <Label htmlFor="height">Height</Label>
            <span className="text-sm text-gray-500">
              {productType.defaultDimensions.height} mm
            </span>
          </div>
          <Slider
            id="height"
            min={productType.minDimensions.height}
            max={productType.maxDimensions.height}
            step={10}
            value={[productType.defaultDimensions.height]}
            onValueChange={([value]) => handleDimensionChange('height', value)}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{productType.minDimensions.height} mm</span>
            <span>{productType.maxDimensions.height} mm</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between">
            <Label htmlFor="depth">Depth</Label>
            <span className="text-sm text-gray-500">
              {productType.defaultDimensions.depth} mm
            </span>
          </div>
          <Slider
            id="depth"
            min={productType.minDimensions.depth}
            max={productType.maxDimensions.depth}
            step={10}
            value={[productType.defaultDimensions.depth]}
            onValueChange={([value]) => handleDimensionChange('depth', value)}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{productType.minDimensions.depth} mm</span>
            <span>{productType.maxDimensions.depth} mm</span>
          </div>
        </div>
      </div>
      
      {isCabinetType(productType) && (
        <CabinetDimensionsPanel />
      )}
      
      {isTableType(productType) && (
        <TableDimensionsPanel />
      )}
    </div>
  );
}
```

### Materials Panel
Controls for selecting materials and colors:

```tsx
// Materials panel component
function MaterialsPanel() {
  const snap = useSnapshot(configuratorStore);
  const productType = snap.activeProductType;
  
  if (!productType) return null;
  
  const handleMaterialChange = (material: Material) => {
    configuratorStore.actions.updateMaterial(material, snap.components[0]?.color || 'natural');
  };
  
  const handleColorChange = (color: Color) => {
    configuratorStore.actions.updateMaterial(snap.components[0]?.material || 'wood', color);
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Materials</h3>
      
      <div>
        <Label htmlFor="material">Material</Label>
        <Select
          value={snap.components[0]?.material || 'wood'}
          onValueChange={handleMaterialChange}
        >
          <SelectTrigger id="material">
            <SelectValue placeholder="Select material" />
          </SelectTrigger>
          <SelectContent>
            {productType.availableMaterials.map(material => (
              <SelectItem key={material} value={material}>
                {formatMaterialName(material)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="color">Color</Label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {productType.availableColors.map(color => (
            <button
              key={color}
              className={`w-full aspect-square rounded-md border ${
                snap.components[0]?.color === color ? 'ring-2 ring-primary' : ''
              }`}
              style={{ backgroundColor: getColorHex(color) }}
              onClick={() => handleColorChange(color)}
              aria-label={formatColorName(color)}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Material Groups</h4>
        {snap.materialGroups.map(group => (
          <div key={group.id} className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: getColorHex(group.color) }}
              />
              <span>{formatMaterialName(group.material)} - {formatColorName(group.color)}</span>
            </div>
            <Badge variant="outline">{group.components.length}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Components Panel
Controls for managing product components:

```tsx
// Components panel component
function ComponentsPanel() {
  const snap = useSnapshot(configuratorStore);
  const productType = snap.activeProductType;
  
  if (!productType) return null;
  
  const handleComponentSelect = (componentId: string) => {
    configuratorStore.ui.selectedComponent = componentId;
  };
  
  const handleComponentRemove = (componentId: string) => {
    configuratorStore.actions.removeComponent(componentId);
  };
  
  const getAvailableComponents = () => {
    if (isCabinetType(productType)) {
      return [
        { type: 'shelf', label: 'Shelf' },
        { type: 'divider', label: 'Divider' },
        { type: 'door', label: 'Door' },
        { type: 'drawer', label: 'Drawer' },
      ];
    } else if (isTableType(productType)) {
      return [
        { type: 'tabletop', label: 'Tabletop' },
        { type: 'leg', label: 'Leg' },
        { type: 'support', label: 'Support' },
      ];
    }
    
    return [];
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Components</h3>
      
      <div>
        <Label>Add Component</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {getAvailableComponents().map(component => (
            <Button
              key={component.type}
              variant="outline"
              onClick={() => configuratorStore.actions.addComponent(component.type, { x: 0, y: 0, z: 0 })}
            >
              <Plus className="w-4 h-4 mr-2" />
              {component.label}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Current Components</h4>
        <div className="space-y-2">
          {snap.components.map(component => (
            <div 
              key={component.id}
              className={`flex items-center justify-between p-2 rounded-md border ${
                snap.ui.selectedComponent === component.id ? 'bg-primary/10 border-primary' : 'border-gray-200'
              }`}
              onClick={() => handleComponentSelect(component.id)}
            >
              <div>
                <div className="font-medium">{formatComponentType(component.type)}</div>
                <div className="text-xs text-gray-500">
                  {component.dimensions.width} × {component.dimensions.height} × {component.dimensions.depth} mm
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleComponentRemove(component.id);
                }}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      {snap.ui.selectedComponent && (
        <ComponentEditor componentId={snap.ui.selectedComponent} />
      )}
    </div>
  );
}
```

### Preset Selection
Interface for selecting and applying presets:

```tsx
// Preset selection component
function PresetSelection() {
  const [presets, setPresets] = useState<ProductPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  useEffect(() => {
    // Load presets from API
    async function loadPresets() {
      const response = await fetch('/api/presets');
      const data = await response.json();
      setPresets(data);
    }
    
    loadPresets();
  }, []);
  
  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = presets.find(p => p.id === presetId);
    
    if (preset) {
      // Apply preset configuration
      configuratorStore.actions.loadPreset(preset);
    }
  };
  
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
            onClick={() => handlePresetSelect(preset.id)}
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

### Pricing Summary
Display of pricing information:

```tsx
// Pricing summary component
function PricingSummary() {
  const snap = useSnapshot(configuratorStore.pricing);
  
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="text-lg font-medium mb-2">Price Summary</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Base Price</span>
          <span>${formatPrice(snap.basePrice)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Materials</span>
          <span>${formatPrice(snap.materialPrice)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Components</span>
          <span>${formatPrice(Object.values(snap.componentPrices).reduce((a, b) => a + b, 0))}</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-medium">
          <span>Total Price</span>
          <span>${formatPrice(snap.totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
```

### Action Buttons
Controls for saving, loading, and ordering:

```tsx
// Action buttons component
function ActionButtons() {
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [configName, setConfigName] = useState('');
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const configuration = configuratorStore.actions.saveConfiguration(configName);
      
      // Save to backend
      await fetch('/api/configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configuration),
      });
      
      toast({
        title: 'Configuration saved',
        description: 'Your configuration has been saved successfully.',
      });
      
      setShowSaveDialog(false);
    } catch (error) {
      toast({
        title: 'Error saving configuration',
        description: 'There was an error saving your configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddToCart = () => {
    // Add current configuration to cart
    const configuration = configuratorStore.actions.saveConfiguration('Cart Item');
    
    // Add to cart
    cartStore.actions.addItem({
      id: configuration.id,
      name: configuration.name,
      configuration,
      price: configuratorStore.pricing.totalPrice,
      quantity: 1,
    });
    
    toast({
      title: 'Added to cart',
      description: 'Your configuration has been added to the cart.',
    });
  };
  
  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={() => setShowSaveDialog(true)}>
        <Save className="w-4 h-4 mr-2" />
        Save Configuration
      </Button>
      
      <Button className="w-full" variant="secondary" onClick={handleAddToCart}>
        <ShoppingCart className="w-4 h-4 mr-2" />
        Add to Cart
      </Button>
      
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Configuration</DialogTitle>
            <DialogDescription>
              Give your configuration a name to save it for later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Configuration Name</Label>
              <Input
                id="name"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="My Custom Bookcase"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !configName}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### View Controls
Controls for adjusting the 3D view:

```tsx
// View controls component
function ViewControls() {
  const snap = useSnapshot(configuratorStore.ui);
  
  const toggleViewMode = () => {
    configuratorStore.ui.viewMode = snap.viewMode === '3d' ? '2d' : '3d';
  };
  
  const toggleMeasurements = () => {
    configuratorStore.ui.showMeasurements = !snap.showMeasurements;
  };
  
  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.5, Math.min(2, snap.zoomLevel + delta));
    configuratorStore.ui.zoomLevel = newZoom;
  };
  
  const handleScreenshot = () => {
    const screenshot = captureScreenshot();
    
    if (screenshot) {
      // Create download link
      const link = document.createElement('a');
      link.href = screenshot;
      link.download = 'furniture-configuration.png';
      link.click();
    }
  };
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-md shadow-sm border border-gray-200 p-1">
      <div className="flex space-x-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleViewMode}
          title={snap.viewMode === '3d' ? 'Switch to 2D view' : 'Switch to 3D view'}
        >
          {snap.viewMode === '3d' ? (
            <View className="w-4 h-4" />
          ) : (
            <Cube className="w-4 h-4" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMeasurements}
          title={snap.showMeasurements ? 'Hide measurements' : 'Show measurements'}
          className={snap.showMeasurements ? 'bg-primary/10' : ''}
        >
          <Ruler className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleZoom(-0.1)}
          title="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleZoom(0.1)}
          title="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleScreenshot}
          title="Take screenshot"
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
```

### Mobile Responsiveness
Adaptations for mobile devices:

```tsx
// Mobile layout component
function MobileConfiguratorLayout() {
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

// Responsive layout wrapper
function ResponsiveConfiguratorLayout() {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  
  return isMobile ? <MobileConfiguratorLayout /> : <ConfiguratorLayout />;
}
```

## Integration Points

### State Management
- UI components connect to Valtio state
- Components react to state changes
- User interactions update state

### 3D Visualization
- Viewport displays 3D model
- View controls manipulate camera and rendering
- Selection in UI highlights components in 3D

### Product Type System
- UI adapts to active product type
- Type-specific controls and options
- Dynamic component options based on product type

## Accessibility Considerations

### Keyboard Navigation
Ensure keyboard accessibility:

```tsx
// Keyboard accessible slider
function AccessibleSlider({ label, ...props }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{label}</Label>
      <Slider
        {...props}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            // Increase value
          } else if (e.key === 'ArrowLeft') {
            // Decrease value
          }
        }}
      />
    </div>
  );
}
```

### Screen Reader Support
Provide appropriate ARIA attributes:

```tsx
// Screen reader friendly color selector
function AccessibleColorSelector({ colors, selectedColor, onChange }) {
  return (
    <div 
      role="radiogroup" 
      aria-label="Color selection"
      className="grid grid-cols-4 gap-2"
    >
      {colors.map(color => (
        <div
          key={color}
          role="radio"
          aria-checked={selectedColor === color}
          tabIndex={0}
          className="w-full aspect-square rounded-md border cursor-pointer"
          style={{ backgroundColor: getColorHex(color) }}
          onClick={() => onChange(color)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onChange(color);
              e.preventDefault();
            }
          }}
        >
          <span className="sr-only">{formatColorName(color)}</span>
        </div>
      ))}
    </div>
  );
}
```

## Success Criteria
- [ ] UI components correctly display and update based on state
- [ ] Controls provide intuitive interaction for all product types
- [ ] Mobile responsiveness works correctly on various devices
- [ ] Accessibility requirements are met for keyboard and screen readers
- [ ] Performance remains smooth with complex configurations
- [ ] Visual design is clean, modern, and consistent with brand
- [ ] All user actions provide appropriate feedback
