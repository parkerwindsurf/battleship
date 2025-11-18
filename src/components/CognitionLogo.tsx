import React from 'react';
import './CognitionLogo.css';

export const CognitionLogo: React.FC = () => {
  // Create hexagon with center point and radius
  const createHexagon = (cx: number, cy: number, size: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  const hexSize = 14;
  const center = 50;
  
  // Calculate positions for honeycomb pattern
  // Distance from center to surrounding hexagon centers
  const distance = hexSize * Math.sqrt(3);
  
  return (
    <div className="cognition-logo">
      <svg className="cognition-icon" viewBox="0 0 100 100" width="55" height="55">
        <defs>
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Honeycomb hexagonal pattern - 1 center + 6 surrounding */}
        <g className="cognition-hexagons" filter="url(#neonGlow)">
          {/* Center hexagon */}
          <polygon points={createHexagon(center, center, hexSize)} />
          
          {/* Top hexagon */}
          <polygon points={createHexagon(center, center - distance, hexSize)} />
          
          {/* Top-right hexagon */}
          <polygon points={createHexagon(center + distance * Math.cos(Math.PI / 6), center - distance * Math.sin(Math.PI / 6), hexSize)} />
          
          {/* Bottom-right hexagon */}
          <polygon points={createHexagon(center + distance * Math.cos(Math.PI / 6), center + distance * Math.sin(Math.PI / 6), hexSize)} />
          
          {/* Bottom hexagon */}
          <polygon points={createHexagon(center, center + distance, hexSize)} />
          
          {/* Bottom-left hexagon */}
          <polygon points={createHexagon(center - distance * Math.cos(Math.PI / 6), center + distance * Math.sin(Math.PI / 6), hexSize)} />
          
          {/* Top-left hexagon */}
          <polygon points={createHexagon(center - distance * Math.cos(Math.PI / 6), center - distance * Math.sin(Math.PI / 6), hexSize)} />
        </g>
      </svg>
      <span className="cognition-text">Cognition</span>
    </div>
  );
};
