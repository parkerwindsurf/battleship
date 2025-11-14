import React, { useEffect } from 'react';
import './ShipDestroyedNotification.css';

interface ShipDestroyedNotificationProps {
  shipType: string;
  isPlayer: boolean;
  onComplete: () => void;
}

export const ShipDestroyedNotification: React.FC<ShipDestroyedNotificationProps> = ({
  shipType,
  isPlayer,
  onComplete
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="ship-destroyed-overlay">
      <div className={`ship-destroyed-notification ${isPlayer ? 'player-loss' : 'enemy-loss'}`}>
        <div className="explosion-effect"></div>
        <h2 className="destroyed-title">
          {isPlayer ? '💥 SHIP LOST! 💥' : '🎯 ENEMY SHIP SUNK! 🎯'}
        </h2>
        <div className="ship-type-name">
          {shipType}
        </div>
        <div className="destroyed-subtitle">
          {isPlayer ? 'Your ship has been destroyed!' : 'Direct hit! Enemy vessel eliminated!'}
        </div>
      </div>
    </div>
  );
};
