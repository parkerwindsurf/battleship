import React from 'react';
import { Board as BoardType, GamePhase, Ship } from '../types';
import { ShipIcon } from './ShipIcon';
import './Board.css';

interface BoardProps {
  board: BoardType;
  isPlayerBoard: boolean;
  gamePhase: GamePhase;
  onCellClick: (row: number, col: number) => void;
  onCellHover?: (row: number, col: number) => void;
  onCellLeave?: () => void;
  highlightCells?: { row: number; col: number }[];
  ships?: Ship[];
  highlightShipSize?: number;
  highlightShipId?: number;
  highlightOrientation?: 'horizontal' | 'vertical';
  isColorBlindMode?: boolean;
}

export const Board: React.FC<BoardProps> = ({
  board,
  isPlayerBoard,
  gamePhase,
  onCellClick,
  onCellHover,
  onCellLeave,
  highlightCells = [],
  ships = [],
  highlightShipSize,
  highlightShipId,
  highlightOrientation,
  isColorBlindMode = false,
}) => {
  const getCellClass = (row: number, col: number) => {
    const cell = board[row][col];
    const classes = ['cell'];

    if (cell.status === 'hit') {
      classes.push(isColorBlindMode ? 'hit-colorblind' : 'hit');
    } else if (cell.status === 'miss') {
      classes.push(isColorBlindMode ? 'miss-colorblind' : 'miss');
    } else if (cell.status === 'ship' && isPlayerBoard) {
      // Ship cells are transparent now, ship icon renders on top
      classes.push('ship-cell');
    }

    const isHighlighted = highlightCells.some(
      pos => pos.row === row && pos.col === col
    );
    if (isHighlighted) {
      classes.push('highlight');
    }

    if (!isPlayerBoard && gamePhase === 'playing' && 
        (cell.status === 'empty' || cell.status === 'ship')) {
      classes.push('clickable');
    }

    return classes.join(' ');
  };

  const getCellContent = (row: number, col: number) => {
    const cell = board[row][col];
    if (cell.status === 'hit') {
      return <span className={isColorBlindMode ? 'hit-marker-colorblind' : 'hit-marker'}>
        {isColorBlindMode ? '●' : 'X'}
      </span>;
    } else if (cell.status === 'miss') {
      return <span className={isColorBlindMode ? 'miss-marker-colorblind' : 'miss-marker'}>
        {isColorBlindMode ? '○' : 'X'}
      </span>;
    }
    return null;
  };

  const renderShipIcons = () => {
    if (!isPlayerBoard) return null;
    
    return ships.map((ship) => {
      if (ship.positions.length === 0) return null;
      
      const firstPos = ship.positions[0];
      const isHorizontal = ship.positions.length > 1 && ship.positions[1].col !== firstPos.col;
      const orientation = isHorizontal ? 'horizontal' : 'vertical';
      
      // Offset by 2px to center within cells (accounting for borders)
      const left = firstPos.col * 40 + 2;
      const top = firstPos.row * 40 + 2;
      
      return (
        <div
          key={ship.id}
          className="ship-overlay"
          style={{
            position: 'absolute',
            left: `${left}px`,
            top: `${top}px`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <ShipIcon 
            size={ship.size} 
            id={ship.id} 
            orientation={orientation}
          />
        </div>
      );
    });
  };

  const renderHighlightShip = () => {
    if (highlightCells.length === 0 || !highlightShipSize || highlightShipId === undefined) return null;
    
    const firstPos = highlightCells[0];
    // Offset by 2px to center within cells (accounting for borders)
    const left = firstPos.col * 40 + 2;
    const top = firstPos.row * 40 + 2;
    
    return (
      <div
        className="ship-overlay-preview"
        style={{
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <ShipIcon 
          size={highlightShipSize} 
          id={highlightShipId} 
          orientation={highlightOrientation || 'horizontal'}
          isPreview={true}
        />
      </div>
    );
  };

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  return (
    <div className="board-container-wrapper">
      <div className="board-with-labels">
        {/* Top number labels */}
        <div className="axis-labels-top">
          <div className="axis-corner"></div>
          {numbers.map((num, index) => (
            <div key={index} className="axis-label-number">
              {num}
            </div>
          ))}
        </div>
        
        <div className="board-with-letters">
          {/* Left letter labels */}
          <div className="axis-labels-left">
            {letters.map((letter, index) => (
              <div key={index} className="axis-label-letter">
                {letter}
              </div>
            ))}
          </div>
          
          {/* Game board */}
          <div className="board">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="board-row">
                {row.map((_, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={getCellClass(rowIndex, colIndex)}
                    onClick={() => onCellClick(rowIndex, colIndex)}
                    onMouseEnter={() => onCellHover?.(rowIndex, colIndex)}
                    onMouseLeave={() => onCellLeave?.()}
                  >
                    {getCellContent(rowIndex, colIndex)}
                  </div>
                ))}
              </div>
            ))}
            {renderShipIcons()}
            {renderHighlightShip()}
          </div>
        </div>
      </div>
    </div>
  );
};
