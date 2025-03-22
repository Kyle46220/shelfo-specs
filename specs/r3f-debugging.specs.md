# R3F Debugging Specifications

## Overview
This document specifies debugging mechanisms for React Three Fiber (R3F) components in the Shelfo configurator. These mechanisms enable AI agents and developers to understand and debug 3D scenes without directly seeing the rendered output.

## Core Debugging Mechanisms

### Structured Scene Logging

A structured logging system that captures and outputs the state of the 3D scene in a machine-readable format:

```typescript
// utils/sceneLogger.ts
import { Scene, Camera, Object3D } from 'three';

export interface SceneLogObject {
  id: number;
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  visible: boolean;
  children: number;
  material?: {
    type: string;
    color?: string;
    opacity?: number;
  };
  geometry?: {
    type: string;
    parameters?: Record<string, any>;
  };
}

export interface SceneLog {
  timestamp: string;
  cameraPosition: [number, number, number];
  cameraRotation: [number, number, number];
  objectCount: number;
  visibleObjects: SceneLogObject[];
  performance: {
    fps: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
}

export function logSceneState(scene: Scene, camera: Camera): SceneLog {
  const visibleObjects: SceneLogObject[] = [];
  
  scene.traverse((object: Object3D) => {
    if (object.visible) {
      const obj: SceneLogObject = {
        id: object.id,
        name: object.name || `unnamed-${object.type}-${object.id}`,
        type: object.type,
        position: [object.position.x, object.position.y, object.position.z],
        rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
        scale: [object.scale.x, object.scale.y, object.scale.z],
        visible: object.visible,
        children: object.children.length
      };
      
      // Add material info if available
      if ('material' in object && object.material) {
        const material = object.material;
        obj.material = {
          type: material.type
        };
        
        if ('color' in material && material.color) {
          obj.material.color = `#${material.color.getHexString()}`;
        }
        
        if ('opacity' in material) {
          obj.material.opacity = material.opacity;
        }
      }
      
      // Add geometry info if available
      if ('geometry' in object && object.geometry) {
        const geometry = object.geometry;
        obj.geometry = {
          type: geometry.type
        };
        
        if ('parameters' in geometry) {
          obj.geometry.parameters = geometry.parameters;
        }
      }
      
      visibleObjects.push(obj);
    }
  });
  
  // Get performance metrics
  const renderer = (window as any).__THREE_DEVTOOLS__?.dispatchEvent 
    ? (window as any).__THREE_DEVTOOLS__.dispatchEvent.renderer 
    : null;
  
  const performance = {
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0
  };
  
  if (renderer && renderer.info) {
    const info = renderer.info;
    performance.drawCalls = info.render?.calls || 0;
    performance.triangles = info.render?.triangles || 0;
    performance.geometries = info.memory?.geometries || 0;
    performance.textures = info.memory?.textures || 0;
  }
  
  return {
    timestamp: new Date().toISOString(),
    cameraPosition: [camera.position.x, camera.position.y, camera.position.z],
    cameraRotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z],
    objectCount: visibleObjects.length,
    visibleObjects,
    performance
  };
}

// Format and output the log
export function outputSceneLog(log: SceneLog, format: 'json' | 'console' = 'console'): void {
  if (format === 'json') {
    console.log(JSON.stringify(log, null, 2));
  } else {
    console.group('Scene Log');
    console.log(`Timestamp: ${log.timestamp}`);
    console.log(`Camera Position: [${log.cameraPosition.join(', ')}]`);
    console.log(`Object Count: ${log.objectCount}`);
    console.log('Performance:', log.performance);
    
    console.group('Visible Objects');
    log.visibleObjects.forEach(obj => {
      console.group(`${obj.name} (${obj.type})`);
      console.log(`Position: [${obj.position.join(', ')}]`);
      console.log(`Rotation: [${obj.rotation.join(', ')}]`);
      console.log(`Scale: [${obj.scale.join(', ')}]`);
      console.log(`Children: ${obj.children}`);
      if (obj.material) console.log('Material:', obj.material);
      if (obj.geometry) console.log('Geometry:', obj.geometry);
      console.groupEnd();
    });
    console.groupEnd();
    console.groupEnd();
  }
}
```

### Scene State Capture Hook

A React hook that captures and exposes the scene state for debugging:

```typescript
// hooks/useSceneDebug.ts
import { useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { logSceneState, SceneLog } from '../utils/sceneLogger';

export interface SceneDebugOptions {
  autoCapture: boolean;
  captureInterval: number;
  logToConsole: boolean;
  logFormat: 'json' | 'console';
}

const defaultOptions: SceneDebugOptions = {
  autoCapture: false,
  captureInterval: 1000,
  logToConsole: true,
  logFormat: 'console'
};

export function useSceneDebug(options: Partial<SceneDebugOptions> = {}) {
  const { scene, camera, gl } = useThree();
  const [sceneLog, setSceneLog] = useState<SceneLog | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Function to capture current scene state
  const captureSceneState = () => {
    const log = logSceneState(scene, camera);
    setSceneLog(log);
    
    if (mergedOptions.logToConsole) {
      outputSceneLog(log, mergedOptions.logFormat);
    }
    
    return log;
  };
  
  // Take screenshot of current scene
  const takeScreenshot = () => {
    gl.render(scene, camera);
    return gl.domElement.toDataURL('image/png');
  };
  
  // Auto-capture on interval if enabled
  useEffect(() => {
    if (!mergedOptions.autoCapture) return;
    
    const intervalId = setInterval(() => {
      captureSceneState();
    }, mergedOptions.captureInterval);
    
    return () => clearInterval(intervalId);
  }, [mergedOptions.autoCapture, mergedOptions.captureInterval]);
  
  // Toggle continuous capturing
  const toggleCapturing = () => {
    setIsCapturing(prev => !prev);
  };
  
  // Capture on each frame if continuous capturing is enabled
  useFrame(() => {
    if (isCapturing) {
      captureSceneState();
    }
  });
  
  return {
    sceneLog,
    captureSceneState,
    takeScreenshot,
    isCapturing,
    toggleCapturing
  };
}
```

### Debug UI Component

A component that displays debug information and controls:

```typescript
// components/configurator/debug/DebugPanel.tsx
import { useState } from 'react';
import { useSceneDebug } from '../../../hooks/useSceneDebug';

interface DebugPanelProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  initiallyOpen?: boolean;
}

export function DebugPanel({ 
  position = 'bottom-right', 
  initiallyOpen = false 
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const { 
    sceneLog, 
    captureSceneState, 
    takeScreenshot,
    isCapturing,
    toggleCapturing
  } = useSceneDebug({
    autoCapture: false,
    captureInterval: 1000,
    logToConsole: true
  });
  
  // Position styles
  const positionStyles: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };
  
  // Download scene log as JSON
  const downloadSceneLog = () => {
    if (!sceneLog) return;
    
    const dataStr = JSON.stringify(sceneLog, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `scene-log-${new Date().toISOString()}.json`;
    link.click();
  };
  
  // Download screenshot
  const downloadScreenshot = () => {
    const screenshot = takeScreenshot();
    
    const link = document.createElement('a');
    link.href = screenshot;
    link.download = `scene-screenshot-${new Date().toISOString()}.png`;
    link.click();
  };
  
  return (
    <div className={`fixed ${positionStyles[position]} z-50`}>
      <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div 
          className="p-2 bg-gray-100 dark:bg-gray-700 cursor-pointer flex justify-between items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h3 className="text-sm font-medium">Scene Debug</h3>
          <span>{isOpen ? '▼' : '▶'}</span>
        </div>
        
        {isOpen && (
          <div className="p-3">
            <div className="flex space-x-2 mb-3">
              <button 
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                onClick={captureSceneState}
              >
                Capture State
              </button>
              <button 
                className="px-2 py-1 bg-green-500 text-white text-xs rounded"
                onClick={downloadScreenshot}
              >
                Screenshot
              </button>
              <button 
                className={`px-2 py-1 ${isCapturing ? 'bg-red-500' : 'bg-gray-500'} text-white text-xs rounded`}
                onClick={toggleCapturing}
              >
                {isCapturing ? 'Stop Capture' : 'Auto Capture'}
              </button>
              {sceneLog && (
                <button 
                  className="px-2 py-1 bg-purple-500 text-white text-xs rounded"
                  onClick={downloadSceneLog}
                >
                  Save Log
                </button>
              )}
            </div>
            
            {sceneLog && (
              <div className="text-xs overflow-auto max-h-60">
                <div className="grid grid-cols-2 gap-1">
                  <div className="font-medium">Camera:</div>
                  <div>[{sceneLog.cameraPosition.map(v => v.toFixed(2)).join(', ')}]</div>
                  
                  <div className="font-medium">Objects:</div>
                  <div>{sceneLog.objectCount}</div>
                  
                  <div className="font-medium">FPS:</div>
                  <div>{sceneLog.performance.fps}</div>
                  
                  <div className="font-medium">Draw Calls:</div>
                  <div>{sceneLog.performance.drawCalls}</div>
                  
                  <div className="font-medium">Triangles:</div>
                  <div>{sceneLog.performance.triangles}</div>
                </div>
                
                <div className="mt-2">
                  <div className="font-medium mb-1">Visible Objects:</div>
                  <div className="pl-2 border-l-2 border-gray-300 dark:border-gray-600">
                    {sceneLog.visibleObjects.slice(0, 5).map(obj => (
                      <div key={obj.id} className="mb-1">
                        <div>{obj.name} ({obj.type})</div>
                        <div className="pl-2 text-gray-500">
                          pos: [{obj.position.map(v => v.toFixed(2)).join(', ')}]
                        </div>
                      </div>
                    ))}
                    {sceneLog.visibleObjects.length > 5 && (
                      <div className="text-gray-500">
                        ...and {sceneLog.visibleObjects.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Scene Snapshot Component

A component that captures and displays the scene state as JSON:

```typescript
// components/configurator/debug/SceneSnapshot.tsx
import { useState } from 'react';
import { useSceneDebug } from '../../../hooks/useSceneDebug';

export function SceneSnapshot() {
  const { sceneLog, captureSceneState } = useSceneDebug();
  const [showFullLog, setShowFullLog] = useState(false);
  
  const handleCaptureClick = () => {
    captureSceneState();
  };
  
  const toggleFullLog = () => {
    setShowFullLog(!showFullLog);
  };
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Scene Snapshot</h2>
        <button 
          className="px-3 py-1 bg-blue-500 text-white rounded"
          onClick={handleCaptureClick}
        >
          Capture
        </button>
      </div>
      
      {sceneLog ? (
        <div>
          <div className="mb-2">
            <span className="font-medium">Timestamp:</span> {sceneLog.timestamp}
          </div>
          <div className="mb-2">
            <span className="font-medium">Camera Position:</span> [{sceneLog.cameraPosition.map(v => v.toFixed(2)).join(', ')}]
          </div>
          <div className="mb-2">
            <span className="font-medium">Object Count:</span> {sceneLog.objectCount}
          </div>
          
          <button 
            className="text-blue-500 text-sm mb-2"
            onClick={toggleFullLog}
          >
            {showFullLog ? 'Hide' : 'Show'} Full Log
          </button>
          
          {showFullLog && (
            <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-96 text-xs">
              {JSON.stringify(sceneLog, null, 2)}
            </pre>
          )}
        </div>
      ) : (
        <div className="text-gray-500">
          No snapshot captured yet. Click "Capture" to take a snapshot of the current scene.
        </div>
      )}
    </div>
  );
}
```

### Automated Test Utilities

Utilities for testing R3F components:

```typescript
// utils/testUtils.ts
import { render, RenderResult } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { act } from 'react-dom/test-utils';
import { logSceneState, SceneLog } from './sceneLogger';

interface RenderR3FOptions {
  waitTime?: number;
  onSceneReady?: (log: SceneLog) => void;
}

export async function renderR3F(
  component: React.ReactNode,
  options: RenderR3FOptions = {}
): Promise<RenderResult & { sceneLog: SceneLog }> {
  const { waitTime = 100, onSceneReady } = options;
  
  // Create a container with specific dimensions
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);
  
  let sceneLog: SceneLog | null = null;
  
  // Wrap component in Canvas
  const result = render(
    <Canvas
      gl={{ preserveDrawingBuffer: true }}
      onCreated={({ scene, camera }) => {
        // Wait a bit for the scene to initialize
        setTimeout(() => {
          sceneLog = logSceneState(scene, camera);
          if (onSceneReady) onSceneReady(sceneLog);
        }, waitTime);
      }}
    >
      {component}
    </Canvas>,
    { container }
  );
  
  // Wait for scene to initialize
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, waitTime + 50));
  });
  
  return {
    ...result,
    sceneLog: sceneLog!
  };
}

export function getObjectByName(sceneLog: SceneLog, name: string) {
  return sceneLog.visibleObjects.find(obj => obj.name === name);
}

export function getObjectsByType(sceneLog: SceneLog, type: string) {
  return sceneLog.visibleObjects.filter(obj => obj.type === type);
}

export function countObjectsByType(sceneLog: SceneLog) {
  const counts: Record<string, number> = {};
  
  sceneLog.visibleObjects.forEach(obj => {
    counts[obj.type] = (counts[obj.type] || 0) + 1;
  });
  
  return counts;
}
```

## Integration with Configurator

### Debug Mode Toggle

A mechanism to enable/disable debug mode:

```typescript
// store/debugStore.ts
import { proxy } from 'valtio';

export const debugStore = proxy({
  enabled: process.env.NODE_ENV === 'development',
  showDebugPanel: false,
  showPerformanceStats: false,
  showSceneSnapshot: false,
  logToConsole: false,
  
  actions: {
    toggleDebugMode() {
      debugStore.enabled = !debugStore.enabled;
    },
    toggleDebugPanel() {
      debugStore.showDebugPanel = !debugStore.showDebugPanel;
    },
    togglePerformanceStats() {
      debugStore.showPerformanceStats = !debugStore.showPerformanceStats;
    },
    toggleSceneSnapshot() {
      debugStore.showSceneSnapshot = !debugStore.showSceneSnapshot;
    },
    toggleLogToConsole() {
      debugStore.logToConsole = !debugStore.logToConsole;
    }
  }
});
```

### Debug Controls Component

A component that provides debug controls:

```typescript
// components/configurator/debug/DebugControls.tsx
import { useSnapshot } from 'valtio';
import { debugStore } from '../../../store/debugStore';

export function DebugControls() {
  const debug = useSnapshot(debugStore);
  
  if (!debug.enabled) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-white/90 dark:bg-gray-800/90 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium mb-2">Debug Controls</h3>
      
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={debug.showDebugPanel}
            onChange={debugStore.actions.toggleDebugPanel}
            className="mr-2"
          />
          <span className="text-sm">Show Debug Panel</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={debug.showPerformanceStats}
            onChange={debugStore.actions.togglePerformanceStats}
            className="mr-2"
          />
          <span className="text-sm">Show Performance Stats</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={debug.showSceneSnapshot}
            onChange={debugStore.actions.toggleSceneSnapshot}
            className="mr-2"
          />
          <span className="text-sm">Show Scene Snapshot</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={debug.logToConsole}
            onChange={debugStore.actions.toggleLogToConsole}
            className="mr-2"
          />
          <span className="text-sm">Log to Console</span>
        </label>
      </div>
    </div>
  );
}
```

### Debug Provider Component

A component that provides debug functionality to the application:

```typescript
// components/configurator/debug/DebugProvider.tsx
import { useSnapshot } from 'valtio';
import { debugStore } from '../../../store/debugStore';
import { DebugControls } from './DebugControls';
import { DebugPanel } from './DebugPanel';
import { SceneSnapshot } from './SceneSnapshot';
import { Stats } from '@react-three/drei';

interface DebugProviderProps {
  children: React.ReactNode;
}

export function DebugProvider({ children }: DebugProviderProps) {
  const debug = useSnapshot(debugStore);
  
  return (
    <>
      {children}
      
      {debug.enabled && (
        <>
          <DebugControls />
          
          {debug.showDebugPanel && (
            <DebugPanel position="bottom-right" initiallyOpen={true} />
          )}
          
          {debug.showPerformanceStats && (
            <Stats className="top-0 left-0" />
          )}
          
          {debug.showSceneSnapshot && (
            <div className="fixed bottom-4 left-4 z-40 max-w-md">
              <SceneSnapshot />
            </div>
          )}
        </>
      )}
    </>
  );
}
```

## Testing with Debug Tools

### Component Testing Example

Example of testing a component with debug tools:

```typescript
// components/configurator/3d/Shelf.test.tsx
import { renderR3F, getObjectByName, countObjectsByType } from '../../../utils/testUtils';
import { Shelf } from './Shelf';

describe('Shelf Component', () => {
  it('renders with correct dimensions', async () => {
    const { sceneLog } = await renderR3F(
      <Shelf 
        position={[0, 1, 0]} 
        dimensions={{ width: 2, height: 0.05, depth: 0.5 }} 
        material="wood" 
        color="#8B4513" 
      />
    );
    
    // Check if shelf was rendered
    const shelfObject = getObjectByName(sceneLog, 'shelf');
    expect(shelfObject).toBeDefined();
    
    // Check position
    expect(shelfObject?.position[0]).toBeCloseTo(0);
    expect(shelfObject?.position[1]).toBeCloseTo(1);
    expect(shelfObject?.position[2]).toBeCloseTo(0);
    
    // Check if material was applied
    expect(shelfObject?.material?.color).toBe('#8b4513');
    
    // Check object counts
    const counts = countObjectsByType(sceneLog);
    expect(counts.Mesh).toBeGreaterThanOrEqual(1);
  });
});
```

### Integration Testing Example

Example of testing multiple components together:

```typescript
// components/configurator/3d/Bookcase.test.tsx
import { renderR3F, getObjectsByType } from '../../../utils/testUtils';
import { Bookcase } from './Bookcase';

describe('Bookcase Component', () => {
  it('renders all required components', async () => {
    const { sceneLog } = await renderR3F(
      <Bookcase 
        dimensions={{ width: 3, height: 2, depth: 0.5 }}
        shelves={3}
        material="wood"
        color="#8B4513"
      />
    );
    
    // Check if all meshes were rendered
    const meshes = getObjectsByType(sceneLog, 'Mesh');
    
    // Should have at least:
    // - 2 vertical sides
    // - 1 top
    // - 1 bottom
    // - 3 shelves
    expect(meshes.length).toBeGreaterThanOrEqual(7);
    
    // Check if frame exists
    const frame = getObjectByName(sceneLog, 'bookcase-frame');
    expect(frame).toBeDefined();
    
    // Check if shelves exist
    const shelves = meshes.filter(mesh => mesh.name.includes('shelf'));
    expect(shelves.length).toBeGreaterThanOrEqual(3);
  });
});
```

## Debug Workflow

### For AI Agents

1. **Enable Debug Mode**: Start by enabling debug mode to access debugging tools
2. **Capture Scene State**: Use the scene capture functionality to get a snapshot of the current scene
3. **Analyze Scene Structure**: Examine the scene log to understand the hierarchy and properties of objects
4. **Identify Issues**: Look for missing objects, incorrect positions, or other anomalies
5. **Make Changes**: Modify the code based on the analysis
6. **Capture Updated State**: Take another snapshot to verify changes
7. **Compare States**: Compare before and after snapshots to confirm improvements
8. **Repeat**: Continue this process until the scene renders correctly

### For Developers

1. **Use Debug Panel**: Enable the debug panel to see real-time information about the scene
2. **Take Screenshots**: Capture screenshots to share with AI agents or document the current state
3. **Export Scene Logs**: Save scene logs as JSON files to share with AI agents
4. **Write Tests**: Create tests that use the debug utilities to verify component behavior
5. **Monitor Performance**: Use the performance stats to identify optimization opportunities

## Implementation Checklist

- [ ] Implement the scene logger utility
- [ ] Create the scene debug hook
- [ ] Build the debug panel component
- [ ] Implement the scene snapshot component
- [ ] Create test utilities for R3F components
- [ ] Set up the debug store
- [ ] Implement debug controls
- [ ] Create the debug provider component
- [ ] Write tests using the debug utilities
- [ ] Document the debug workflow for AI agents and developers

## Success Criteria

- [ ] AI agents can effectively debug R3F components without seeing the rendered output
- [ ] Developers can easily capture and share scene state information
- [ ] Tests can verify the correct rendering of 3D components
- [ ] Performance issues can be identified and addressed
- [ ] The debugging tools have minimal impact on production performance
