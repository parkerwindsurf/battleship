import React, { useState, useCallback } from 'react';
import './App.css';
import { Board } from './components/Board';
import { ShipLegend } from './components/ShipLegend';
import { CognitionLogo } from './components/CognitionLogo';
import { ShipDestroyedNotification } from './components/ShipDestroyedNotification';
import { GameState } from './types';
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
import { playShipDestroyedSound } from './utils/soundEffects';

const App: React.FC = () => {
  // Enemy names array
  const enemyNames = ['Cursor', 'Claude Code', 'CodeX', 'Github Copilot', 'Augment'];
  
  // Randomly select an enemy name for this game session
  const getRandomEnemyName = () => {
    return enemyNames[Math.floor(Math.random() * enemyNames.length)];
  };

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
  const [currentEnemyName, setCurrentEnemyName] = useState(getRandomEnemyName());
  const [destroyedShipNotification, setDestroyedShipNotification] = useState<{
    shipType: string;
    isPlayer: boolean;
  } | null>(null);
  const [isColorBlindMode, setIsColorBlindMode] = useState(false);

  // Get ship type name based on size and ship ID
  const getShipTypeName = (size: number, shipId?: number): string => {
    switch (size) {
      case 5: return 'Aircraft Carrier';
      case 4: return 'Battleship';
      case 3: 
        // The third ship (index 2) is Cruiser, fourth ship (index 3) is Submarine
        return (shipId === 2) ? 'Cruiser' : 'Submarine';
      case 2: return 'Destroyer';
      default: return 'Ship';
    }
  };

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
      // Play sound and show notification for enemy ship destroyed
      playShipDestroyedSound();
      setDestroyedShipNotification({
        shipType: getShipTypeName(shotResult.sunkShip.size, shotResult.sunkShip.id),
        isPlayer: false
      });
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
        ? `Enemy hit your ship at ${coords}!`
        : `Enemy missed at ${coords}.`;

      let updatedAIState = updateAIStateAfterShot(
        newAIState,
        move,
        shotResult.isHit,
        shotResult.board
      );

      if (shotResult.sunkShip) {
        message = `Enemy sunk your ship of size ${shotResult.sunkShip.size} at ${coords}!`;
        // Play sound and show notification for player ship destroyed
        playShipDestroyedSound();
        setDestroyedShipNotification({
          shipType: getShipTypeName(shotResult.sunkShip.size, shotResult.sunkShip.id),
          isPlayer: true
        });
        
        // After sinking a ship, check for any other existing hits that need to be targeted
        const existingHits: {row: number; col: number}[] = [];
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 10; col++) {
            const cell = shotResult.board[row][col];
            // Find hits that belong to ships that are not yet sunk
            if (cell.status === 'hit' && cell.shipId !== undefined) {
              const ship = shotResult.ships.find(s => s.id === cell.shipId);
              if (ship && !ship.sunk) {
                existingHits.push({row, col});
              }
            }
          }
        }
        
        // If there are other hits, stay in target mode and resume targeting
        if (existingHits.length > 0) {
          // Don't reset completely - preserve target mode and build new target queue
          updatedAIState.mode = 'target';
          updatedAIState.lastHit = existingHits[0];
          updatedAIState.hitStreak = [existingHits[0]];
          updatedAIState.direction = null; // Reset direction since we're starting fresh on a new ship
          
          // Add adjacent cells of ALL existing hits to target queue
          const adjacentCells: {row: number; col: number}[] = [];
          const directions = [
            { row: -1, col: 0 }, { row: 1, col: 0 },
            { row: 0, col: -1 }, { row: 0, col: 1 }
          ];
          
          // Check if multiple hits form a line (same ship being partially hit)
          if (existingHits.length >= 2) {
            // Check if hits are aligned
            const sameRow = existingHits.every(h => h.row === existingHits[0].row);
            const sameCol = existingHits.every(h => h.col === existingHits[0].col);
            
            if (sameRow) {
              updatedAIState.direction = 'horizontal';
              updatedAIState.hitStreak = [...existingHits];
              // Add cells at the ends of the line
              const minCol = Math.min(...existingHits.map(h => h.col));
              const maxCol = Math.max(...existingHits.map(h => h.col));
              if (minCol > 0) {
                const leftCell = shotResult.board[existingHits[0].row][minCol - 1];
                if (leftCell.status === 'empty' || leftCell.status === 'ship') {
                  adjacentCells.push({ row: existingHits[0].row, col: minCol - 1 });
                }
              }
              if (maxCol < 9) {
                const rightCell = shotResult.board[existingHits[0].row][maxCol + 1];
                if (rightCell.status === 'empty' || rightCell.status === 'ship') {
                  adjacentCells.push({ row: existingHits[0].row, col: maxCol + 1 });
                }
              }
            } else if (sameCol) {
              updatedAIState.direction = 'vertical';
              updatedAIState.hitStreak = [...existingHits];
              // Add cells at the ends of the line
              const minRow = Math.min(...existingHits.map(h => h.row));
              const maxRow = Math.max(...existingHits.map(h => h.row));
              if (minRow > 0) {
                const topCell = shotResult.board[minRow - 1][existingHits[0].col];
                if (topCell.status === 'empty' || topCell.status === 'ship') {
                  adjacentCells.push({ row: minRow - 1, col: existingHits[0].col });
                }
              }
              if (maxRow < 9) {
                const bottomCell = shotResult.board[maxRow + 1][existingHits[0].col];
                if (bottomCell.status === 'empty' || bottomCell.status === 'ship') {
                  adjacentCells.push({ row: maxRow + 1, col: existingHits[0].col });
                }
              }
            } else {
              // Hits are not aligned, add adjacent cells for all hits
              for (const hit of existingHits) {
                for (const dir of directions) {
                  const newRow = hit.row + dir.row;
                  const newCol = hit.col + dir.col;
                  if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
                    const targetCell = shotResult.board[newRow][newCol];
                    if (targetCell.status === 'empty' || targetCell.status === 'ship') {
                      // Check if not already in the list
                      if (!adjacentCells.some(c => c.row === newRow && c.col === newCol)) {
                        adjacentCells.push({ row: newRow, col: newCol });
                      }
                    }
                  }
                }
              }
            }
          } else {
            // Only one existing hit, add its adjacent cells
            for (const dir of directions) {
              const newRow = existingHits[0].row + dir.row;
              const newCol = existingHits[0].col + dir.col;
              if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
                const targetCell = shotResult.board[newRow][newCol];
                if (targetCell.status === 'empty' || targetCell.status === 'ship') {
                  adjacentCells.push({ row: newRow, col: newCol });
                }
              }
            }
          }
          
          updatedAIState.targetQueue = adjacentCells;
        } else {
          // No other hits found, fully reset to hunt mode
          updatedAIState = resetAIStateAfterSink();
        }
      }

      const gameOver = checkGameOver(shotResult.ships);

      if (gameOver) {
        return {
          ...prev,
          playerBoard: shotResult.board,
          playerShips: shotResult.ships,
          phase: 'gameover',
          winner: 'computer',
          message: '💥 Game Over! Enemy won.',
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
    // Select a new random enemy for the new game
    setCurrentEnemyName(getRandomEnemyName());
    
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
      <button 
        className="colorblind-toggle"
        onClick={() => setIsColorBlindMode(!isColorBlindMode)}
        aria-label="Toggle colorblind mode"
      >
        {isColorBlindMode ? '🎨' : '👁️'}
      </button>
      <h1>⚓ Battleship ⚓</h1>
      
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
                isColorBlindMode={isColorBlindMode}
              />
            </div>
            <div className="ship-info">
              Ships: {gameState.phase === 'setup' 
                ? `${gameState.playerShips.length} / ${SHIP_SIZES.length}`
                : `${gameState.playerShips.filter(s => !s.sunk).length} / ${gameState.playerShips.length}`
              }
            </div>
          </div>

        <div className="board-wrapper">
          <h2 className={`enemy-name enemy-${currentEnemyName.toLowerCase().replace(/\s+/g, '-')}`}>
            {currentEnemyName}
          </h2>
          <div className="board-container-wrapper">
            <Board
              board={gameState.computerBoard}
              isPlayerBoard={false}
              gamePhase={gameState.phase}
              onCellClick={handleComputerBoardClick}
              ships={gameState.computerShips}
              isColorBlindMode={isColorBlindMode}
            />
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

      {destroyedShipNotification && (
        <ShipDestroyedNotification
          shipType={destroyedShipNotification.shipType}
          isPlayer={destroyedShipNotification.isPlayer}
          onComplete={() => setDestroyedShipNotification(null)}
        />
      )}
    </div>
  );
};

export default App;
