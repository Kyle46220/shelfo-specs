# Row Height Adjustment Specification

## Overview
The row height adjustment feature allows customers to customize the height of individual rows in their bookcase design, providing flexibility for different storage needs and aesthetic preferences.

## User Interface Requirements
- Row height options in the compartment configuration modal
- Three predefined height options: Small (25cm), Medium (35cm), Large (45cm)
- Visual indicators showing actual measurements for each option
- Clear selection state for the currently selected height
- Modal appears when user hovers over a specific row
- Position of modal adapts to viewport to avoid overflow
- Close button to dismiss the modal

## Technical Requirements
- Reference: `.cursor/rules/technologies/3d-components.mdc`
- Reference: `.cursor/rules/technologies/state-management.mdc` (Note: Now using Valtio instead of Zustand)

## Functional Requirements

### Row Height Management
1. Each row in the bookcase can have an independent height setting
2. Default height for all rows is Medium (35cm)
3. User can change the height of any row individually
4. Row heights are stored in the configuration state
5. Configuration updates when row height changes
6. 3D model updates in real-time to reflect height changes

### Total Height Calculation
1. Total bookcase height is calculated as the sum of all row heights
2. When row heights change, total height is recalculated
3. Pricing is updated based on the new total height
4. Height changes must respect minimum and maximum bookcase height constraints

### Divider Positioning
1. Vertical dividers reposition based on new row heights
2. Horizontal dividers (shelves) reposition based on cumulative height
3. Style pattern is maintained when heights change
4. Spacing calculations adapt to different row heights

### Modal Interaction
1. Modal appears when user hovers over a row in the 3D view
2. Modal disappears after a delay when mouse leaves row
3. Modal remains visible when mouse enters the modal itself
4. Height changes apply immediately when option is selected
5. Cancel button restores previous height

## Data Structure

### Row Height Configuration
```typescript
interface Configuration {
  // Other configuration properties...
  rowHeights: RowHeight[]; // Array of height settings for each row
}

type RowHeight = 'small' | 'medium' | 'large';

// Height values in cm
const heightValues = {
  small: 25,
  medium: 35,
  large: 45
};
```

### State Management
```javascript
// In Valtio state (previously Zustand)
{
  config: {
    dimensions: { width: 100, height: 250, depth: 30 },
    rowHeights: ['medium', 'medium', 'medium', 'medium'],
    // Other config properties...
  },
  hoveredRow: null, // Index of the currently hovered row or null
  hoveredRowPosition: null, // Position for modal placement
  
  // Actions (implemented as functions that mutate state)
  getRowHeight: (rowIndex) => { /* Returns height for specified row */ },
  updateRowHeight: (rowIndex, height) => { /* Updates height and recalculates total */ }
}
```

## Calculations

### Row Position Calculation
```javascript
// Calculate Y-position of each shelf based on cumulative row heights
function calculateShelfPositions(rowHeights) {
  const positions = [0]; // Bottom shelf starts at 0
  let currentHeight = 0;
  
  rowHeights.forEach(height => {
    const heightInCm = heightValues[height];
    currentHeight += heightInCm;
    positions.push(currentHeight);
  });
  
  return positions;
}
```

### Total Height Recalculation
```javascript
function recalculateTotalHeight(rowHeights) {
  return rowHeights.reduce((total, height) => {
    return total + heightValues[height];
  }, 0);
}
```

## User Experience Flow

1. **Initial State**:
   - Bookcase displayed with default row heights (all Medium)
   - Total height calculated and displayed

2. **Height Adjustment**:
   - User hovers over a specific row in the 3D model
   - Compartment configuration modal appears near the cursor
   - Current row height option is highlighted
   - User selects a different height option (Small, Medium, or Large)

3. **System Response**:
   - 3D model immediately updates to show new row height
   - Total height recalculates
   - Price updates if applicable
   - Dividers reposition based on new height
   - Row height setting is stored in configuration

4. **Edge Cases**:
   - If changing height would exceed maximum total height, show warning
   - If modal would appear off-screen, reposition to stay within viewport
   - If user has no WebGL, provide alternative UI for adjustments

## 3D Visualization Requirements
1. Real-time update of row height in the 3D model
2. Visual indicator for the currently hovered row
3. Smooth transition animation when height changes
4. Correct repositioning of all shelves and dividers
5. Maintenance of material appearance and lighting

## Acceptance Criteria
- [ ] User can change row height through compartment modal
- [ ] Three height options (Small, Medium, Large) are available
- [ ] Each option shows the exact measurement (25cm, 35cm, 45cm)
- [ ] 3D model updates in real-time to reflect height changes
- [ ] Changing one row doesn't affect heights of other rows
- [ ] Total bookcase height updates correctly with row changes
- [ ] All dividers and shelves reposition correctly with height changes
- [ ] Row heights persist when leaving and returning to configurator
- [ ] Modal appears in the correct position relative to hovered row
- [ ] Modal has appropriate hover behaviors and dismissal
- [ ] Height changes respect minimum and maximum bookcase constraints

## Performance Considerations
- 3D model updates must occur within 200ms of selection
- Calculations should be optimized to prevent UI lag
- Height changes should use animation or transition for smoothness
- Modal should appear within 100ms of row hover
- Minimize unnecessary rerenders in the component hierarchy