export type CellStatus = 'empty' | 'ship' | 'hit' | 'miss';

export type Orientation = 'horizontal' | 'vertical';

export interface Ship {
  id: number;
  size: number;
  positions: Position[];
  hits: number;
  sunk: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  status: CellStatus;
  shipId?: number;
}

export type Board = Cell[][];

export type GamePhase = 'setup' | 'playing' | 'gameover';

export interface AIState {
  mode: 'hunt' | 'target';
  targetQueue: Position[];
  lastHit: Position | null;
  hitStreak: Position[];
  direction: 'horizontal' | 'vertical' | null;
}

export interface GameState {
  phase: GamePhase;
  playerBoard: Board;
  computerBoard: Board;
  playerShips: Ship[];
  computerShips: Ship[];
  currentTurn: 'player' | 'computer';
  winner: 'player' | 'computer' | null;
  message: string;
  shipsToPlace: number[];
  currentShipIndex: number;
  shipOrientation: Orientation;
  aiState: AIState;
}
