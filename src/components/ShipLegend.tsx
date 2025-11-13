import React from 'react';
import './ShipLegend.css';

interface Ship {
  name: string;
  size: number;
  type: 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';
}

const ships: Ship[] = [
  { name: 'Aircraft Carrier', size: 5, type: 'carrier' },
  { name: 'Battleship', size: 4, type: 'battleship' },
  { name: 'Cruiser', size: 3, type: 'cruiser' },
  { name: 'Submarine', size: 3, type: 'submarine' },
  { name: 'Destroyer', size: 2, type: 'destroyer' },
];

const ShipIcon: React.FC<{ type: string }> = ({ type }) => {
  return (
    <div className={`ship-icon ${type}`}>
      <svg viewBox="0 0 120 60" className="ship-svg">
        {type === 'carrier' && (
          <>
            {/* Aircraft Carrier - large flat deck */}
            <rect x="10" y="25" width="100" height="15" fill="#4a5568" />
            <rect x="15" y="20" width="90" height="5" fill="#2d3748" />
            <rect x="50" y="10" width="20" height="10" fill="#2d3748" />
            <polygon points="10,40 15,50 105,50 110,40" fill="#2d3748" />
          </>
        )}
        {type === 'battleship' && (
          <>
            {/* Battleship - guns and tower */}
            <rect x="20" y="30" width="80" height="12" fill="#4a5568" />
            <rect x="40" y="20" width="15" height="10" fill="#2d3748" />
            <rect x="65" y="20" width="15" height="10" fill="#2d3748" />
            <rect x="52" y="15" width="16" height="5" fill="#718096" />
            <polygon points="20,42 25,50 95,50 100,42" fill="#2d3748" />
          </>
        )}
        {type === 'cruiser' && (
          <>
            {/* Cruiser - medium ship with tower */}
            <rect x="30" y="30" width="60" height="10" fill="#4a5568" />
            <rect x="50" y="22" width="20" height="8" fill="#2d3748" />
            <rect x="55" y="18" width="10" height="4" fill="#718096" />
            <polygon points="30,40 35,48 85,48 90,40" fill="#2d3748" />
          </>
        )}
        {type === 'submarine' && (
          <>
            {/* Submarine - underwater vessel */}
            <ellipse cx="60" cy="35" rx="45" ry="8" fill="#2d3748" />
            <rect x="55" y="25" width="10" height="10" fill="#4a5568" />
            <rect x="58" y="22" width="4" height="3" fill="#718096" />
            <ellipse cx="60" cy="35" rx="40" ry="6" fill="#1a202c" />
          </>
        )}
        {type === 'destroyer' && (
          <>
            {/* Destroyer - small fast ship */}
            <rect x="35" y="32" width="50" height="8" fill="#4a5568" />
            <rect x="55" y="25" width="15" height="7" fill="#2d3748" />
            <polygon points="35,40 40,46 80,46 85,40" fill="#2d3748" />
            <rect x="60" y="22" width="5" height="3" fill="#718096" />
          </>
        )}
      </svg>
    </div>
  );
};

export const ShipLegend: React.FC = () => {
  return (
    <div className="ship-legend">
      <h3>Fleet</h3>
      <div className="ships-list">
        {ships.map((ship, index) => (
          <div key={index} className="ship-item">
            <ShipIcon type={ship.type} />
            <div className="ship-details">
              <div className="ship-name">{ship.name}</div>
              <div className="ship-size">{ship.size} cells</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
