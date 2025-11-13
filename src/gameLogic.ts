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

const getDirectionalCells = (
  pos: Position,
  direction: 'horizontal' | 'vertical',
  board: Board
): Position[] => {
  const cells: Position[] = [];
  
  if (direction === 'horizontal') {
    // Check left and right
    if (isValidCell(pos.row, pos.col - 1, board)) {
      cells.push({ row: pos.row, col: pos.col - 1 });
    }
    if (isValidCell(pos.row, pos.col + 1, board)) {
      cells.push({ row: pos.row, col: pos.col + 1 });
    }
  } else {
    // Check up and down
    if (isValidCell(pos.row - 1, pos.col, board)) {
      cells.push({ row: pos.row - 1, col: pos.col });
    }
    if (isValidCell(pos.row + 1, pos.col, board)) {
      cells.push({ row: pos.row + 1, col: pos.col });
    }
  }
  
  return cells;
};

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

  // Target mode: we have hits to follow up on
  if (newAIState.mode === 'target' && newAIState.targetQueue.length > 0) {
    const target = newAIState.targetQueue.shift()!;
    return { position: target, newAIState };
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
    return newAIState;
  }

  // Hit! Switch to target mode
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

  // Add new targets based on direction
  if (newAIState.direction) {
    // Continue in the known direction
    const newTargets = getDirectionalCells(position, newAIState.direction, board);
    
    // Also check from the first hit in the streak
    if (newAIState.hitStreak.length > 0) {
      const firstHit = newAIState.hitStreak[0];
      const fromFirst = getDirectionalCells(firstHit, newAIState.direction, board);
      newTargets.push(...fromFirst);
    }
    
    // Remove duplicates and already queued targets
    for (const target of newTargets) {
      const alreadyQueued = newAIState.targetQueue.some(
        t => t.row === target.row && t.col === target.col
      );
      if (!alreadyQueued) {
        newAIState.targetQueue.push(target);
      }
    }
  } else {
    // No direction yet, add all adjacent cells
    const adjacent = getAdjacentCells(position, board);
    for (const adj of adjacent) {
      const alreadyQueued = newAIState.targetQueue.some(
        t => t.row === adj.row && t.col === adj.col
      );
      if (!alreadyQueued) {
        newAIState.targetQueue.push(adj);
      }
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
