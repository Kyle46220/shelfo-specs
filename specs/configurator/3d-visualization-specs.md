# 3D Visualization Specifications

## Overview
This document specifies the 3D visualization system for the Shelfo furniture configurator. The visualization system provides real-time, interactive 3D rendering of configurable furniture products using React Three Fiber (R3F).

## Core Components

### Scene Setup
The 3D scene provides the environment for furniture visualization:

```jsx
// Main scene component
function ConfiguratorScene({ children }) {
  return (
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
          zoom={0.8}
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
          <group position={[0, 0, 0]} scale={1}>
            {children}
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
  );
}
```

### Model Loading
The system loads and manages 3D models efficiently:

```jsx
// Model loader component
function ModelLoader({ url, onLoad }) {
  const { scene } = useGLTF(url);
  
  useEffect(() => {
    if (scene && onLoad) {
      onLoad(scene);
    }
  }, [scene, onLoad]);
  
  return null;
}

// Preload critical models
useEffect(() => {
  const urls = [
    '/models/base-cabinet.glb',
    '/models/cabinet-foot.glb',
    '/models/shelf.glb',
    '/models/divider.glb',
    '/models/door.glb',
    '/models/drawer.glb'
  ];
  
  urls.forEach(url => {
    preloadGLTF(url);
  });
}, []);
```

### Component Rendering
Components are rendered based on their type and properties:

```jsx
// Shelf component renderer
function ShelfRenderer({ component }) {
  const { nodes, materials } = useGLTF('/models/shelf.glb');
  const { position, rotation, dimensions, material, color } = component;
  
  // Apply material and color
  const materialProps = useMemo(() => {
    return getMaterialProperties(material, color);
  }, [material, color]);
  
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh 
        geometry={nodes.Shelf.geometry}
        scale={[dimensions.width / 100, dimensions.height / 100, dimensions.depth / 100]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...materialProps} />
      </mesh>
    </group>
  );
}

// Divider component renderer
function DividerRenderer({ component }) {
  const { nodes, materials } = useGLTF('/models/divider.glb');
  const { position, rotation, dimensions, material, color } = component;
  
  // Apply material and color
  const materialProps = useMemo(() => {
    return getMaterialProperties(material, color);
  }, [material, color]);
  
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh 
        geometry={nodes.Divider.geometry}
        scale={[dimensions.width / 100, dimensions.height / 100, dimensions.depth / 100]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...materialProps} />
      </mesh>
    </group>
  );
}
```

### Material System
The material system provides realistic rendering of different materials:

```typescript
// Material properties
interface MaterialProperties {
  color: string;
  roughness: number;
  metalness: number;
  normalMap?: THREE.Texture;
  aoMap?: THREE.Texture;
  map?: THREE.Texture;
}

// Get material properties based on material type and color
function getMaterialProperties(material: Material, color: Color): MaterialProperties {
  // Base properties
  const baseProps: MaterialProperties = {
    color: getColorHex(color),
    roughness: 0.5,
    metalness: 0,
  };
  
  // Apply material-specific properties
  switch (material) {
    case 'wood':
      return {
        ...baseProps,
        roughness: 0.7,
        normalMap: woodNormalMap,
        map: woodTextures[color] || woodTextures.natural,
      };
    case 'metal':
      return {
        ...baseProps,
        roughness: 0.2,
        metalness: 0.8,
      };
    case 'glass':
      return {
        ...baseProps,
        roughness: 0.1,
        metalness: 0,
        transparent: true,
        opacity: 0.6,
      };
    default:
      return baseProps;
  }
}
```

### Interaction System
The interaction system handles user interactions with the 3D model:

```jsx
// Interaction handler component
function InteractionHandler({ children }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  
  // Handle pointer events
  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    setHovered(e.object.userData.id);
  }, []);
  
  const handlePointerOut = useCallback(() => {
    setHovered(null);
  }, []);
  
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    setSelected(e.object.userData.id);
  }, []);
  
  // Apply interaction handlers to children
  const childrenWithProps = React.Children.map(children, child => {
    return React.cloneElement(child, {
      onPointerOver: handlePointerOver,
      onPointerOut: handlePointerOut,
      onClick: handleClick,
      userData: {
        ...child.props.userData,
        hovered: hovered === child.props.userData?.id,
        selected: selected === child.props.userData?.id,
      }
    });
  });
  
  return <>{childrenWithProps}</>;
}
```

### Camera Controls
The camera control system provides intuitive navigation:

```jsx
// Camera controls component
function CameraControls() {
  const { camera, gl } = useThree();
  const controls = useRef();
  
  useFrame(() => {
    controls.current.update();
  });
  
  return (
    <OrbitControls
      ref={controls}
      args={[camera, gl.domElement]}
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={10}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2}
      enablePan={false}
    />
  );
}
```

### Screenshot System
The screenshot system captures the current configuration:

```jsx
// Screenshot function
function captureScreenshot() {
  const canvas = document.querySelector('canvas');
  if (!canvas) return null;
  
  // Render at higher resolution for better quality
  const originalSize = {
    width: canvas.width,
    height: canvas.height
  };
  
  // Set to higher resolution temporarily
  canvas.width = 1920;
  canvas.height = 1080;
  
  // Force render at new resolution
  renderer.render(scene, camera);
  
  // Capture image
  const dataUrl = canvas.toDataURL('image/png');
  
  // Restore original size
  canvas.width = originalSize.width;
  canvas.height = originalSize.height;
  
  return dataUrl;
}
```

## Performance Optimization

### Instanced Meshes
For repeated components, instanced meshes improve performance:

```jsx
// Instanced mesh renderer for repeated components
function InstancedComponentRenderer({ components, modelUrl, modelNode }) {
  const { nodes } = useGLTF(modelUrl);
  const geometry = nodes[modelNode].geometry;
  const meshRef = useRef();
  
  // Update instances when components change
  useEffect(() => {
    if (!meshRef.current) return;
    
    components.forEach((component, i) => {
      // Create transformation matrix
      const matrix = new THREE.Matrix4();
      
      // Set position
      matrix.setPosition(component.position.x, component.position.y, component.position.z);
      
      // Set rotation
      const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
        new THREE.Euler(component.rotation.x, component.rotation.y, component.rotation.z)
      );
      matrix.multiply(rotationMatrix);
      
      // Set scale
      const scaleMatrix = new THREE.Matrix4().makeScale(
        component.dimensions.width / 100,
        component.dimensions.height / 100,
        component.dimensions.depth / 100
      );
      matrix.multiply(scaleMatrix);
      
      // Apply matrix to instance
      meshRef.current.setMatrixAt(i, matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [components]);
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, null, components.length]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial {...getMaterialProperties(components[0].material, components[0].color)} />
    </instancedMesh>
  );
}
```

### Level of Detail
Level of detail (LOD) reduces complexity for distant objects:

```jsx
// LOD component
function LODComponent({ component, highDetailDistance = 5 }) {
  const { camera } = useThree();
  const [detail, setDetail] = useState('high');
  
  // Check distance from camera and update detail level
  useFrame(() => {
    const distance = camera.position.distanceTo(
      new THREE.Vector3(component.position.x, component.position.y, component.position.z)
    );
    
    const newDetail = distance < highDetailDistance ? 'high' : 'low';
    if (newDetail !== detail) {
      setDetail(newDetail);
    }
  });
  
  return detail === 'high' 
    ? <HighDetailRenderer component={component} />
    : <LowDetailRenderer component={component} />;
}
```

### Texture Management
Efficient texture management reduces memory usage:

```jsx
// Texture manager
const textureManager = {
  textures: {},
  
  // Load texture with caching
  loadTexture(url) {
    if (this.textures[url]) {
      return this.textures[url];
    }
    
    const texture = new THREE.TextureLoader().load(url);
    this.textures[url] = texture;
    
    return texture;
  },
  
  // Preload common textures
  preloadTextures() {
    const urls = [
      '/textures/wood_oak.jpg',
      '/textures/wood_walnut.jpg',
      '/textures/wood_pine.jpg',
      '/textures/metal.jpg',
      '/textures/normal_wood.jpg'
    ];
    
    urls.forEach(url => this.loadTexture(url));
  },
  
  // Release unused textures
  releaseUnused(usedUrls) {
    Object.keys(this.textures).forEach(url => {
      if (!usedUrls.includes(url)) {
        this.textures[url].dispose();
        delete this.textures[url];
      }
    });
  }
};
```

## Mobile Optimization
Special considerations for mobile performance:

```jsx
// Mobile-optimized scene
function MobileOptimizedScene({ children }) {
  const isMobile = useIsMobile();
  
  // Adjust settings based on device
  const settings = useMemo(() => {
    return isMobile ? {
      shadowMapSize: 1024,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      maxLights: 2,
      enableSSAO: false,
      enableBloom: false
    } : {
      shadowMapSize: 2048,
      pixelRatio: window.devicePixelRatio,
      maxLights: 4,
      enableSSAO: true,
      enableBloom: true
    };
  }, [isMobile]);
  
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.5, 4], fov: 50 }}
      gl={{ 
        preserveDrawingBuffer: true,
        antialias: !isMobile,
        powerPreference: 'high-performance'
      }}
      dpr={settings.pixelRatio}
    >
      {/* Scene content with optimized settings */}
    </Canvas>
  );
}
```

## Integration Points

### Product Type System
- Type-specific 3D model loading
- Type-specific component rendering
- Type-specific camera positioning

### Component System
- Component-based rendering
- Component interaction handling
- Component material application

### UI Integration
- 3D view synchronized with UI controls
- Real-time updates based on user input
- Highlighting components based on UI selection

## Success Criteria
- [ ] 3D visualization accurately represents all product types
- [ ] Real-time updates reflect configuration changes immediately
- [ ] Performance meets targets on both desktop and mobile devices
- [ ] Material rendering is realistic and visually appealing
- [ ] User interactions with 3D model are intuitive and responsive
- [ ] Screenshots capture high-quality images of configurations
- [ ] Mobile optimization provides acceptable performance on devices
