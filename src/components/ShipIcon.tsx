import React from 'react';

interface ShipIconProps {
  size: number;
  id: number;
  orientation: 'horizontal' | 'vertical';
  isPreview?: boolean;
}

const getShipType = (size: number, id: number): string => {
  if (size === 5) return 'carrier';
  if (size === 4) return 'battleship';
  if (size === 3 && id === 2) return 'cruiser';
  if (size === 3 && id === 3) return 'submarine';
  if (size === 2) return 'destroyer';
  return 'cruiser'; // fallback
};

export const ShipIcon: React.FC<ShipIconProps> = ({ size, id, orientation, isPreview = false }) => {
  const type = getShipType(size, id);
  const isVertical = orientation === 'vertical';
  
  // Each cell is 40px, make ship span exactly 'size' cells
  const cellSize = 40;
  const width = isVertical ? cellSize - 4 : (size * cellSize) - 4;
  const height = isVertical ? (size * cellSize) - 4 : cellSize - 4;
  
  // ViewBox should match the ship dimensions to span multiple cells
  const viewBoxWidth = isVertical ? 60 : size * 60;
  const viewBoxHeight = isVertical ? size * 60 : 60;
  
  const opacity = isPreview ? 0.7 : 1;
  const baseColor = isPreview ? '#f39c12' : '#4a5568';
  const darkColor = isPreview ? '#e67e22' : '#2d3748';
  const lightColor = isPreview ? '#f1c40f' : '#718096';
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
      style={{ opacity }}
      className="ship-svg-grid"
      preserveAspectRatio="none"
    >
      {!isVertical && (
        <>
          {type === 'carrier' && (
            <>
              {/* Spans 5 cells: viewBox is 300x60 */}
              <rect x="10" y="25" width={viewBoxWidth - 20} height="15" fill={baseColor} />
              <rect x="15" y="20" width={viewBoxWidth - 30} height="5" fill={darkColor} />
              <rect x={viewBoxWidth / 2 - 10} y="10" width="20" height="10" fill={darkColor} />
              <polygon points={`10,40 15,50 ${viewBoxWidth - 15},50 ${viewBoxWidth - 10},40`} fill={darkColor} />
            </>
          )}
          {type === 'battleship' && (
            <>
              {/* Spans 4 cells: viewBox is 240x60 */}
              <rect x="20" y="30" width={viewBoxWidth - 40} height="12" fill={baseColor} />
              <rect x={viewBoxWidth * 0.3} y="20" width="25" height="10" fill={darkColor} />
              <rect x={viewBoxWidth * 0.6} y="20" width="25" height="10" fill={darkColor} />
              <rect x={viewBoxWidth / 2 - 15} y="15" width="30" height="5" fill={lightColor} />
              <polygon points={`20,42 25,50 ${viewBoxWidth - 25},50 ${viewBoxWidth - 20},42`} fill={darkColor} />
            </>
          )}
          {type === 'cruiser' && (
            <>
              {/* Spans 3 cells: viewBox is 180x60 */}
              <rect x="20" y="30" width={viewBoxWidth - 40} height="10" fill={baseColor} />
              <rect x={viewBoxWidth / 2 - 15} y="22" width="30" height="8" fill={darkColor} />
              <rect x={viewBoxWidth / 2 - 8} y="18" width="16" height="4" fill={lightColor} />
              <polygon points={`20,40 25,48 ${viewBoxWidth - 25},48 ${viewBoxWidth - 20},40`} fill={darkColor} />
            </>
          )}
          {type === 'submarine' && (
            <>
              {/* Spans 3 cells: viewBox is 180x60 */}
              <ellipse cx={viewBoxWidth / 2} cy="35" rx={viewBoxWidth / 2 - 15} ry="8" fill={darkColor} />
              <rect x={viewBoxWidth / 2 - 8} y="25" width="16" height="10" fill={baseColor} />
              <rect x={viewBoxWidth / 2 - 4} y="22" width="8" height="3" fill={lightColor} />
              <ellipse cx={viewBoxWidth / 2} cy="35" rx={viewBoxWidth / 2 - 20} ry="6" fill={isPreview ? '#d35400' : '#1a202c'} />
            </>
          )}
          {type === 'destroyer' && (
            <>
              {/* Spans 2 cells: viewBox is 120x60 */}
              <rect x="15" y="32" width={viewBoxWidth - 30} height="8" fill={baseColor} />
              <rect x={viewBoxWidth / 2 - 10} y="25" width="20" height="7" fill={darkColor} />
              <polygon points={`15,40 20,46 ${viewBoxWidth - 20},46 ${viewBoxWidth - 15},40`} fill={darkColor} />
              <rect x={viewBoxWidth / 2 - 5} y="22" width="10" height="3" fill={lightColor} />
            </>
          )}
        </>
      )}
      
      {isVertical && (
        <>
          {type === 'carrier' && (
            <>
              {/* Spans 5 cells: viewBox is 60x300 */}
              <rect x="25" y="10" width="15" height={viewBoxHeight - 20} fill={baseColor} />
              <rect x="20" y="15" width="5" height={viewBoxHeight - 30} fill={darkColor} />
              <rect x="10" y={viewBoxHeight / 2 - 10} width="10" height="20" fill={darkColor} />
              <polygon points={`40,10 50,15 50,${viewBoxHeight - 15} 40,${viewBoxHeight - 10}`} fill={darkColor} />
            </>
          )}
          {type === 'battleship' && (
            <>
              {/* Spans 4 cells: viewBox is 60x240 */}
              <rect x="30" y="20" width="12" height={viewBoxHeight - 40} fill={baseColor} />
              <rect x="20" y={viewBoxHeight * 0.3} width="10" height="25" fill={darkColor} />
              <rect x="20" y={viewBoxHeight * 0.6} width="10" height="25" fill={darkColor} />
              <rect x="15" y={viewBoxHeight / 2 - 15} width="5" height="30" fill={lightColor} />
              <polygon points={`42,20 50,25 50,${viewBoxHeight - 25} 42,${viewBoxHeight - 20}`} fill={darkColor} />
            </>
          )}
          {type === 'cruiser' && (
            <>
              {/* Spans 3 cells: viewBox is 60x180 */}
              <rect x="30" y="20" width="10" height={viewBoxHeight - 40} fill={baseColor} />
              <rect x="22" y={viewBoxHeight / 2 - 15} width="8" height="30" fill={darkColor} />
              <rect x="18" y={viewBoxHeight / 2 - 8} width="4" height="16" fill={lightColor} />
              <polygon points={`40,20 48,25 48,${viewBoxHeight - 25} 40,${viewBoxHeight - 20}`} fill={darkColor} />
            </>
          )}
          {type === 'submarine' && (
            <>
              {/* Spans 3 cells: viewBox is 60x180 */}
              <ellipse cx="35" cy={viewBoxHeight / 2} rx="8" ry={viewBoxHeight / 2 - 15} fill={darkColor} />
              <rect x="25" y={viewBoxHeight / 2 - 8} width="10" height="16" fill={baseColor} />
              <rect x="22" y={viewBoxHeight / 2 - 4} width="3" height="8" fill={lightColor} />
              <ellipse cx="35" cy={viewBoxHeight / 2} rx="6" ry={viewBoxHeight / 2 - 20} fill={isPreview ? '#d35400' : '#1a202c'} />
            </>
          )}
          {type === 'destroyer' && (
            <>
              {/* Spans 2 cells: viewBox is 60x120 */}
              <rect x="32" y="15" width="8" height={viewBoxHeight - 30} fill={baseColor} />
              <rect x="25" y={viewBoxHeight / 2 - 10} width="7" height="20" fill={darkColor} />
              <polygon points={`40,15 46,20 46,${viewBoxHeight - 20} 40,${viewBoxHeight - 15}`} fill={darkColor} />
              <rect x="22" y={viewBoxHeight / 2 - 5} width="3" height="10" fill={lightColor} />
            </>
          )}
        </>
      )}
    </svg>
  );
};
