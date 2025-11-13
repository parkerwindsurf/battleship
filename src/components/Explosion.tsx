import React, { useEffect, useState } from 'react';
import './Explosion.css';

interface ExplosionProps {
  position: { row: number; col: number };
  onComplete: () => void;
}

export const Explosion: React.FC<ExplosionProps> = ({ position, onComplete }) => {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsActive(false);
      onComplete();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isActive) return null;

  // Position relative to the board grid
  // Account for 2px border on board + center within 40px cell
  const cellSize = 40;
  const boardBorder = 2;
  const left = position.col * cellSize + boardBorder;
  const top = position.row * cellSize + boardBorder;

  return (
    <div className="explosion-container" style={{ left: `${left}px`, top: `${top}px` }}>
      <div className="explosion">
        <div className="explosion-particle particle-1"></div>
        <div className="explosion-particle particle-2"></div>
        <div className="explosion-particle particle-3"></div>
        <div className="explosion-particle particle-4"></div>
        <div className="explosion-particle particle-5"></div>
        <div className="explosion-particle particle-6"></div>
        <div className="explosion-particle particle-7"></div>
        <div className="explosion-particle particle-8"></div>
        <div className="explosion-core"></div>
      </div>
    </div>
  );
};
