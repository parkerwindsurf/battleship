import React, { useState, useCallback } from 'react';
import { Board } from './components/Board';
import { ShipLegend } from './components/ShipLegend';
import { CognitionLogo } from './components/CognitionLogo';
import { Explosion } from './components/Explosion';
import { playExplosionSound } from './utils/soundEffects';
import { GameState, Position } from './types';
import {
  createEmptyBoard,
  SHIP_SIZES,
  canPlaceShip,
  placeShip,
  placeShipsRandomly,
  processShot,
  getSmartComputerMove,
  updateAIStateAfterShot,
  resetAIStateAfterSink,
  createAIState,
  checkGameOver,
} from './gameLogic';
import './App.css';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    playerBoard: createEmptyBoard(),
    computerBoard: createEmptyBoard(),
    playerShips: [],
    computerShips: [],
    currentTurn: 'player',
    winner: null,
    message: `Place your ${SHIP_SIZES[0]}-cell ship. Click to toggle orientation.`,
    shipsToPlace: SHIP_SIZES,
    currentShipIndex: 0,
    shipOrientation: 'horizontal',
    aiState: createAIState(),
  });

  const [highlightCells, setHighlightCells] = useState<{ row: number; col: number }[]>([]);
  const [playerExplosions, setPlayerExplosions] = useState<{ id: number; position: Position }[]>([]);
  const [computerExplosions, setComputerExplosions] = useState<{ id: number; position: Position }[]>([]);

  // Convert coordinates to grid format (e.g., A5, J10)
  const coordinatesToGridFormat = (row: number, col: number): string => {
    const letter = String.fromCharCode(65 + row); // 65 is 'A'
    const number = col + 1;
    return `${letter}${number}`;
  };

  const toggleOrientation = () => {
    if (gameState.phase !== 'setup') return;
    setGameState(prev => ({
      ...prev,
      shipOrientation: prev.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal',
    }));
  };

  const handlePlayerBoardClick = useCallback((row: number, col: number) => {
    if (gameState.phase !== 'setup') return;
    if (gameState.currentShipIndex >= gameState.shipsToPlace.length) return;

    const shipSize = gameState.shipsToPlace[gameState.currentShipIndex];
    
    // Clamp position to grid boundaries
    let adjustedRow = row;
    let adjustedCol = col;
    
    if (gameState.shipOrientation === 'horizontal') {
      // Ensure ship doesn't extend past right edge
      if (col + shipSize > 10) {
        adjustedCol = 10 - shipSize;
      }
    } else {
      // Ensure ship doesn't extend past bottom edge
      if (row + shipSize > 10) {
        adjustedRow = 10 - shipSize;
      }
    }
    
    const canPlace = canPlaceShip(
      gameState.playerBoard,
      adjustedRow,
      adjustedCol,
      shipSize,
      gameState.shipOrientation
    );

    if (!canPlace) {
      setGameState(prev => ({
        ...prev,
        message: 'Cannot place ship here. Ships need a 1-cell gap between them.',
      }));
      return;
    }

    const { board, positions } = placeShip(
      gameState.playerBoard,
      adjustedRow,
      adjustedCol,
      shipSize,
      gameState.shipOrientation,
      gameState.currentShipIndex
    );

    const newShip = {
      id: gameState.currentShipIndex,
      size: shipSize,
      positions,
      hits: 0,
      sunk: false,
    };

    const newShipIndex = gameState.currentShipIndex + 1;
    const allShipsPlaced = newShipIndex >= gameState.shipsToPlace.length;

    setGameState(prev => ({
      ...prev,
      playerBoard: board,
      playerShips: [...prev.playerShips, newShip],
      currentShipIndex: newShipIndex,
      message: allShipsPlaced
        ? 'All ships placed! Click "Start Game" to begin.'
        : `Place your ${gameState.shipsToPlace[newShipIndex]}-cell ship. Click to toggle orientation.`,
    }));

    setHighlightCells([]);
  }, [gameState]);

  const handlePlayerBoardHover = useCallback((row: number, col: number) => {
    if (gameState.phase !== 'setup') return;
    if (gameState.currentShipIndex >= gameState.shipsToPlace.length) return;

    const shipSize = gameState.shipsToPlace[gameState.currentShipIndex];
    
    // Clamp position to grid boundaries (same as click handler)
    let adjustedRow = row;
    let adjustedCol = col;
    
    if (gameState.shipOrientation === 'horizontal') {
      // Ensure ship doesn't extend past right edge
      if (col + shipSize > 10) {
        adjustedCol = 10 - shipSize;
      }
    } else {
      // Ensure ship doesn't extend past bottom edge
      if (row + shipSize > 10) {
        adjustedRow = 10 - shipSize;
      }
    }
    
    // Check if the ship can be placed at the adjusted position
    const canPlace = canPlaceShip(
      gameState.playerBoard,
      adjustedRow,
      adjustedCol,
      shipSize,
      gameState.shipOrientation
    );

    // Only show highlight if the ship can be placed
    if (!canPlace) {
      setHighlightCells([]);
      return;
    }

    const positions: { row: number; col: number }[] = [];

    if (gameState.shipOrientation === 'horizontal') {
      for (let c = adjustedCol; c < adjustedCol + shipSize; c++) {
        positions.push({ row: adjustedRow, col: c });
      }
    } else {
      for (let r = adjustedRow; r < adjustedRow + shipSize; r++) {
        positions.push({ row: r, col: adjustedCol });
      }
    }

    setHighlightCells(positions);
  }, [gameState]);

  const triggerExplosionForShip = (ship: { positions: Position[] }, isPlayerBoard: boolean) => {
    playExplosionSound();
    
    // Create explosions for all positions of the ship
    const newExplosions = ship.positions.map((pos, index) => ({
      id: Date.now() + index,
      position: pos
    }));
    
    if (isPlayerBoard) {
      setPlayerExplosions(prev => [...prev, ...newExplosions]);
    } else {
      setComputerExplosions(prev => [...prev, ...newExplosions]);
    }
  };

  const removePlayerExplosion = (id: number) => {
    setPlayerExplosions(prev => prev.filter(exp => exp.id !== id));
  };

  const removeComputerExplosion = (id: number) => {
    setComputerExplosions(prev => prev.filter(exp => exp.id !== id));
  };

  const startGame = () => {
    if (gameState.currentShipIndex < gameState.shipsToPlace.length) return;

    const { board: computerBoard, ships: computerShips } = placeShipsRandomly(SHIP_SIZES);

    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      computerBoard,
      computerShips,
      message: 'Your turn! Click on the enemy board to fire.',
    }));
  };

  const handleComputerBoardClick = useCallback((row: number, col: number) => {
    if (gameState.phase !== 'playing') return;
    if (gameState.currentTurn !== 'player') return;

    const cell = gameState.computerBoard[row][col];
    if (cell.status === 'hit' || cell.status === 'miss') {
      setGameState(prev => ({
        ...prev,
        message: 'You already shot here. Choose another cell.',
      }));
      return;
    }

    const shotResult = processShot(
      gameState.computerBoard,
      gameState.computerShips,
      row,
      col
    );

    const coords = coordinatesToGridFormat(row, col);
    let message = shotResult.isHit ? `Hit at ${coords}!` : `Miss at ${coords}.`;
    if (shotResult.sunkShip) {
      message = `You sunk a ship of size ${shotResult.sunkShip.size} at ${coords}!`;
      triggerExplosionForShip(shotResult.sunkShip, false); // Computer board
    }

    const gameOver = checkGameOver(shotResult.ships);

    if (gameOver) {
      setGameState(prev => ({
        ...prev,
        computerBoard: shotResult.board,
        computerShips: shotResult.ships,
        phase: 'gameover',
        winner: 'player',
        message: '🎉 Congratulations! You won!',
      }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      computerBoard: shotResult.board,
      computerShips: shotResult.ships,
      currentTurn: 'computer',
      message,
    }));

    // Computer's turn
    setTimeout(() => {
      computerTurn();
    }, 1000);
  }, [gameState]);

  const computerTurn = () => {
    setGameState(prev => {
      const { position: move, newAIState } = getSmartComputerMove(prev.playerBoard, prev.aiState);
      const shotResult = processShot(
        prev.playerBoard,
        prev.playerShips,
        move.row,
        move.col
      );

      const coords = coordinatesToGridFormat(move.row, move.col);
      let message = shotResult.isHit
        ? `Computer hit your ship at ${coords}!`
        : `Computer missed at ${coords}.`;

      let updatedAIState = updateAIStateAfterShot(
        newAIState,
        move,
        shotResult.isHit,
        prev.playerBoard
      );

      if (shotResult.sunkShip) {
        message = `Computer sunk your ship of size ${shotResult.sunkShip.size} at ${coords}!`;
        triggerExplosionForShip(shotResult.sunkShip, true); // Player board
        // Reset AI state after sinking a ship
        updatedAIState = resetAIStateAfterSink();
      }

      const gameOver = checkGameOver(shotResult.ships);

      if (gameOver) {
        return {
          ...prev,
          playerBoard: shotResult.board,
          playerShips: shotResult.ships,
          phase: 'gameover',
          winner: 'computer',
          message: '💥 Game Over! Computer won.',
          aiState: updatedAIState,
        };
      }

      return {
        ...prev,
        playerBoard: shotResult.board,
        playerShips: shotResult.ships,
        currentTurn: 'player',
        message: message + ' Your turn!',
        aiState: updatedAIState,
      };
    });
  };

  const resetGame = () => {
    setGameState({
      phase: 'setup',
      playerBoard: createEmptyBoard(),
      computerBoard: createEmptyBoard(),
      playerShips: [],
      computerShips: [],
      currentTurn: 'player',
      winner: null,
      message: `Place your ${SHIP_SIZES[0]}-cell ship. Click to toggle orientation.`,
      shipsToPlace: SHIP_SIZES,
      currentShipIndex: 0,
      shipOrientation: 'horizontal',
      aiState: createAIState(),
    });
    setHighlightCells([]);
  };

  return (
    <div className="app">
      <h1>⚓ Battleship</h1>
      
      <div className="game-info">
        <p className="message">{gameState.message}</p>
        <div className="controls">
          {gameState.phase === 'setup' && (
            <>
              <button onClick={toggleOrientation} className="btn">
                Orientation: {gameState.shipOrientation}
              </button>
              <button
                onClick={startGame}
                disabled={gameState.currentShipIndex < gameState.shipsToPlace.length}
                className="btn btn-primary"
              >
                Start Game
              </button>
            </>
          )}
          {gameState.phase === 'gameover' && (
            <button onClick={resetGame} className="btn btn-primary">
              Play Again
            </button>
          )}
        </div>
      </div>

      <div className="game-layout">
        <ShipLegend />
        
        <div className="boards-container">
          <div className="board-wrapper">
            <CognitionLogo />
            <div className="board-container-wrapper">
              <Board
                board={gameState.playerBoard}
                isPlayerBoard={true}
                gamePhase={gameState.phase}
                onCellClick={handlePlayerBoardClick}
                onCellHover={handlePlayerBoardHover}
                onCellLeave={() => setHighlightCells([])}
                highlightCells={highlightCells}
                ships={gameState.playerShips}
                highlightShipSize={gameState.phase === 'setup' ? gameState.shipsToPlace[gameState.currentShipIndex] : undefined}
                highlightShipId={gameState.currentShipIndex}
                highlightOrientation={gameState.shipOrientation}
              />
              {playerExplosions.map(explosion => (
                <Explosion
                  key={explosion.id}
                  position={explosion.position}
                  onComplete={() => removePlayerExplosion(explosion.id)}
                />
              ))}
            </div>
            <div className="ship-info">
              Ships: {gameState.playerShips.filter(s => !s.sunk).length} / {gameState.playerShips.length}
            </div>
          </div>

        <div className="board-wrapper">
          <h2>Enemy Waters</h2>
          <div className="board-container-wrapper">
            <Board
              board={gameState.computerBoard}
              isPlayerBoard={false}
              gamePhase={gameState.phase}
              onCellClick={handleComputerBoardClick}
              ships={gameState.computerShips}
            />
            {computerExplosions.map(explosion => (
              <Explosion
                key={explosion.id}
                position={explosion.position}
                onComplete={() => removeComputerExplosion(explosion.id)}
              />
            ))}
          </div>
          <div className="ship-info">
            Ships: {gameState.computerShips.filter(s => !s.sunk).length} / {gameState.computerShips.length}
          </div>
        </div>
        </div>
      </div>

      {gameState.phase === 'gameover' && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{gameState.winner === 'player' ? '🎉 Victory!' : '💥 Defeat!'}</h2>
            <p>{gameState.message}</p>
            <button onClick={resetGame} className="btn btn-large">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
