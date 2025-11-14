import { Board, Ship, Position, Orientation, CellStatus, AIState } from './types';

export const BOARD_SIZE = 10;
export const SHIP_SIZES = [5, 4, 3, 3, 2];

export const createEmptyBoard = (): Board => {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() =>
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => ({ status: 'empty' as CellStatus }))
    );
};

const hasAdjacentShip = (board: Board, row: number, col: number): boolean => {
  // Check all 8 surrounding cells (including diagonals)
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],  // top-left, top, top-right
    [0, -1],           [0, 1],   // left, right
    [1, -1],  [1, 0],  [1, 1],   // bottom-left, bottom, bottom-right
  ];

  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    // Check if within bounds and has a ship
    if (
      newRow >= 0 &&
      newRow < BOARD_SIZE &&
      newCol >= 0 &&
      newCol < BOARD_SIZE &&
      board[newRow][newCol].status === 'ship'
    ) {
      return true;
    }
  }
  
  return false;
};

export const canPlaceShip = (
  board: Board,
  row: number,
  col: number,
  size: number,
  orientation: Orientation
): boolean => {
  if (orientation === 'horizontal') {
    if (col + size > BOARD_SIZE) return false;
    
    // Check each position the ship would occupy
    for (let c = col; c < col + size; c++) {
      // Check if cell is occupied
      if (board[row][c].status === 'ship') return false;
      
      // Check if any adjacent cell has a ship
      if (hasAdjacentShip(board, row, c)) return false;
    }
  } else {
    if (row + size > BOARD_SIZE) return false;
    
    // Check each position the ship would occupy
    for (let r = row; r < row + size; r++) {
      // Check if cell is occupied
      if (board[r][col].status === 'ship') return false;
      
      // Check if any adjacent cell has a ship
      if (hasAdjacentShip(board, r, col)) return false;
    }
  }
  return true;
};

export const placeShip = (
  board: Board,
  row: number,
  col: number,
  size: number,
  orientation: Orientation,
  shipId: number
): { board: Board; positions: Position[] } => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const positions: Position[] = [];

  if (orientation === 'horizontal') {
    for (let c = col; c < col + size; c++) {
      newBoard[row][c] = { status: 'ship', shipId };
      positions.push({ row, col: c });
    }
  } else {
    for (let r = row; r < row + size; r++) {
      newBoard[r][col] = { status: 'ship', shipId };
      positions.push({ row: r, col });
    }
  }

  return { board: newBoard, positions };
};

export const placeShipsRandomly = (shipSizes: number[]): { board: Board; ships: Ship[] } => {
  const board = createEmptyBoard();
  const ships: Ship[] = [];

  shipSizes.forEach((size, index) => {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 1000;

    while (!placed && attempts < maxAttempts) {
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';

      if (canPlaceShip(board, row, col, size, orientation)) {
        const result = placeShip(board, row, col, size, orientation, index);
        result.board.forEach((r, ri) => {
          r.forEach((c, ci) => {
            board[ri][ci] = c;
          });
        });

        ships.push({
          id: index,
          size,
          positions: result.positions,
          hits: 0,
          sunk: false,
        });

        placed = true;
      }
      attempts++;
    }
  });

  return { board, ships };
};

export const processShot = (
  board: Board,
  ships: Ship[],
  row: number,
  col: number
): { board: Board; ships: Ship[]; isHit: boolean; sunkShip: Ship | null } => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const newShips = ships.map(ship => ({ ...ship }));
  let isHit = false;
  let sunkShip: Ship | null = null;

  const cell = newBoard[row][col];

  if (cell.status === 'ship' && cell.shipId !== undefined) {
    isHit = true;
    newBoard[row][col].status = 'hit';

    const ship = newShips[cell.shipId];
    ship.hits++;

    if (ship.hits === ship.size) {
      ship.sunk = true;
      sunkShip = ship;
    }
  } else if (cell.status === 'empty') {
    newBoard[row][col].status = 'miss';
  }

  return { board: newBoard, ships: newShips, isHit, sunkShip };
};

const isValidCell = (row: number, col: number, board: Board): boolean => {
  return (
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE &&
    (board[row][col].status === 'empty' || board[row][col].status === 'ship')
  );
};

const getAdjacentCells = (pos: Position, board: Board): Position[] => {
  const adjacent: Position[] = [];
  const directions = [
    { row: -1, col: 0 }, // up
    { row: 1, col: 0 },  // down
    { row: 0, col: -1 }, // left
    { row: 0, col: 1 },  // right
  ];

  for (const dir of directions) {
    const newRow = pos.row + dir.row;
    const newCol = pos.col + dir.col;
    if (isValidCell(newRow, newCol, board)) {
      adjacent.push({ row: newRow, col: newCol });
    }
  }

  return adjacent;
};

// Removed unused getDirectionalCells function - logic is now inline in updateAIStateAfterShot

const getCheckerboardCells = (board: Board): Position[] => {
  const cells: Position[] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Checkerboard pattern: only cells where (row + col) is even
      if ((row + col) % 2 === 0 && isValidCell(row, col, board)) {
        cells.push({ row, col });
      }
    }
  }
  
  return cells;
};

export const createAIState = (): AIState => ({
  mode: 'hunt',
  targetQueue: [],
  lastHit: null,
  hitStreak: [],
  direction: null,
});

export const getSmartComputerMove = (
  board: Board,
  aiState: AIState
): { position: Position; newAIState: AIState } => {
  const newAIState = { ...aiState };

  console.log('AI State:', {
    mode: newAIState.mode,
    targetQueueLength: newAIState.targetQueue.length,
    hitStreakLength: newAIState.hitStreak.length,
    direction: newAIState.direction
  });

  // Target mode: we have hits to follow up on
  if (newAIState.mode === 'target' && newAIState.targetQueue.length > 0) {
    // Filter out any invalid targets (already hit/missed)
    const validTargets: Position[] = [];
    for (const target of newAIState.targetQueue) {
      if (isValidCell(target.row, target.col, board)) {
        validTargets.push(target);
      }
    }
    
    console.log('Valid targets available:', validTargets.length);
    
    if (validTargets.length > 0) {
      // Take the first valid target and update the queue
      const target = validTargets[0];
      newAIState.targetQueue = validTargets.slice(1);
      console.log('AI targeting adjacent cell at:', target);
      return { position: target, newAIState };
    }
  }

  // If target queue is empty but we're in target mode, switch to hunt
  if (newAIState.mode === 'target' && newAIState.targetQueue.length === 0) {
    newAIState.mode = 'hunt';
    newAIState.lastHit = null;
    newAIState.hitStreak = [];
    newAIState.direction = null;
  }

  // Hunt mode: use checkerboard pattern first, then any available cell
  let availableCells = getCheckerboardCells(board);
  
  if (availableCells.length === 0) {
    // Fall back to any available cell
    availableCells = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (isValidCell(row, col, board)) {
          availableCells.push({ row, col });
        }
      }
    }
  }

  if (availableCells.length === 0) {
    return { position: { row: 0, col: 0 }, newAIState };
  }

  const position = availableCells[Math.floor(Math.random() * availableCells.length)];
  return { position, newAIState };
};

export const updateAIStateAfterShot = (
  aiState: AIState,
  position: Position,
  wasHit: boolean,
  board: Board
): AIState => {
  const newAIState = { ...aiState };

  if (!wasHit) {
    // On a miss, if we have a direction, we might need to reverse
    if (newAIState.direction && newAIState.hitStreak.length > 0) {
      // Clear current target queue and rebuild from the other end
      newAIState.targetQueue = [];
      
      // Add targets from the first hit in the opposite direction
      const firstHit = newAIState.hitStreak[0];
      const lastHit = newAIState.hitStreak[newAIState.hitStreak.length - 1];
      
      // If we were going right/down, now try left/up from the first hit
      if (newAIState.direction === 'horizontal') {
        // Try the opposite side of the ship
        if (position.col > firstHit.col) {
          // We were going right, now go left from first hit
          if (isValidCell(firstHit.row, firstHit.col - 1, board)) {
            newAIState.targetQueue.push({ row: firstHit.row, col: firstHit.col - 1 });
          }
        } else {
          // We were going left, now go right from last hit
          if (isValidCell(lastHit.row, lastHit.col + 1, board)) {
            newAIState.targetQueue.push({ row: lastHit.row, col: lastHit.col + 1 });
          }
        }
      } else if (newAIState.direction === 'vertical') {
        // Try the opposite side of the ship
        if (position.row > firstHit.row) {
          // We were going down, now go up from first hit
          if (isValidCell(firstHit.row - 1, firstHit.col, board)) {
            newAIState.targetQueue.push({ row: firstHit.row - 1, col: firstHit.col });
          }
        } else {
          // We were going up, now go down from last hit
          if (isValidCell(lastHit.row + 1, lastHit.col, board)) {
            newAIState.targetQueue.push({ row: lastHit.row + 1, col: lastHit.col });
          }
        }
      }
    }
    return newAIState;
  }

  // Hit! Switch to target mode
  console.log('AI got a hit at:', position);
  newAIState.mode = 'target';
  newAIState.lastHit = position;
  newAIState.hitStreak.push(position);

  // Determine or confirm direction
  if (newAIState.hitStreak.length >= 2) {
    const last = newAIState.hitStreak[newAIState.hitStreak.length - 1];
    const prev = newAIState.hitStreak[newAIState.hitStreak.length - 2];
    
    if (last.row === prev.row) {
      newAIState.direction = 'horizontal';
    } else if (last.col === prev.col) {
      newAIState.direction = 'vertical';
    }
  }

  // Clear and rebuild target queue with proper priority
  newAIState.targetQueue = [];

  if (newAIState.direction) {
    // Continue in the known direction from the latest hit
    const newTargets: Position[] = [];
    
    if (newAIState.direction === 'horizontal') {
      // Try both directions from the latest hit
      if (isValidCell(position.row, position.col + 1, board)) {
        newTargets.push({ row: position.row, col: position.col + 1 });
      }
      if (isValidCell(position.row, position.col - 1, board)) {
        newTargets.push({ row: position.row, col: position.col - 1 });
      }
      
      // Also check from the ends of the hit streak
      const minCol = Math.min(...newAIState.hitStreak.map(h => h.col));
      const maxCol = Math.max(...newAIState.hitStreak.map(h => h.col));
      if (isValidCell(position.row, minCol - 1, board)) {
        newTargets.push({ row: position.row, col: minCol - 1 });
      }
      if (isValidCell(position.row, maxCol + 1, board)) {
        newTargets.push({ row: position.row, col: maxCol + 1 });
      }
    } else {
      // Vertical direction
      if (isValidCell(position.row + 1, position.col, board)) {
        newTargets.push({ row: position.row + 1, col: position.col });
      }
      if (isValidCell(position.row - 1, position.col, board)) {
        newTargets.push({ row: position.row - 1, col: position.col });
      }
      
      // Also check from the ends of the hit streak
      const minRow = Math.min(...newAIState.hitStreak.map(h => h.row));
      const maxRow = Math.max(...newAIState.hitStreak.map(h => h.row));
      if (isValidCell(minRow - 1, position.col, board)) {
        newTargets.push({ row: minRow - 1, col: position.col });
      }
      if (isValidCell(maxRow + 1, position.col, board)) {
        newTargets.push({ row: maxRow + 1, col: position.col });
      }
    }
    
    // Add unique targets only
    for (const target of newTargets) {
      const alreadyExists = newAIState.targetQueue.some(
        t => t.row === target.row && t.col === target.col
      );
      if (!alreadyExists) {
        newAIState.targetQueue.push(target);
      }
    }
  } else {
    // No direction yet, add all adjacent cells
    const adjacent = getAdjacentCells(position, board);
    console.log('Adjacent cells to hit:', adjacent);
    // Filter to ensure we only add valid cells
    const validAdjacent = adjacent.filter(cell => 
      board[cell.row][cell.col].status === 'empty' || 
      board[cell.row][cell.col].status === 'ship'
    );
    newAIState.targetQueue = validAdjacent;
    console.log('Added to target queue:', validAdjacent);
    
    // If no valid adjacent cells (shouldn't happen), stay in target mode
    if (validAdjacent.length === 0 && newAIState.mode === 'target') {
      console.warn('No valid adjacent cells found after hit at', position);
    }
  }

  return newAIState;
};

export const resetAIStateAfterSink = (): AIState => {
  return {
    mode: 'hunt',
    targetQueue: [],
    lastHit: null,
    hitStreak: [],
    direction: null,
  };
};

export const checkGameOver = (ships: Ship[]): boolean => {
  return ships.every(ship => ship.sunk);
};
