# ⚓ Battleship Game

A browser-based Battleship game built with React and TypeScript. Play against an AI opponent in this classic naval combat game!

## Features

- **10x10 Grid**: Standard Battleship board size
- **Fleet**: 5 ships with unique silhouettes (Aircraft Carrier: 5, Battleship: 4, Cruiser: 3, Submarine: 3, Destroyer: 2)
- **Manual Ship Placement**: Click to place ships, toggle orientation (horizontal/vertical)
- **Realistic Ship Graphics**: Each ship displays as an actual vessel silhouette instead of simple squares
- **AI Opponent**: Computer randomly places ships and makes moves
- **Visual Feedback**: 
  - Red 'X' for hits
  - Black 'X' for misses
  - Ship silhouettes visible on your board
  - Orange preview when placing ships
- **Game State Management**: Track turns, hits, and game progress
- **Win Detection**: Game ends when all ships are sunk
- **Modal Victory Screen**: Clear winner display with replay option
- **No Page Reloads**: Pure frontend implementation

## Tech Stack

- React 18
- TypeScript
- Vite (build tool)
- CSS3

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## How to Play

1. **Setup Phase**: 
   - Place all 5 ships on your board
   - Click cells to place ships
   - Hover over cells to see ship preview (orange highlight)
   - Ships automatically snap to grid boundaries - never outside the 10x10 grid
   - Ships must have a 1-cell gap (cannot touch, even diagonally)
   - No highlight = invalid placement (too close to another ship)
   - Click "Orientation" button to toggle between horizontal/vertical
   - Click "Start Game" when all ships are placed

2. **Battle Phase**:
   - Click on the enemy board to fire shots
   - Red X = Hit, Black X = Miss
   - Computer uses smart AI with hunt-and-target strategy
   - Computer takes turns automatically
   - First to sink all enemy ships wins!

3. **Game Over**:
   - Victory or defeat modal appears
   - Click "Play Again" to restart

## Game Rules

- Ships cannot touch each other (must have at least 1-cell gap)
- Ships cannot be adjacent, even diagonally
- Ships automatically adjust to stay within the 10x10 board boundaries
- Ships "snap" to grid edges when placed near boundaries
- Valid placements show orange preview highlights
- Each player takes turns shooting
- You cannot shoot the same cell twice
- Game ends when all ships of one player are sunk

## Project Structure

```
src/
├── components/
│   ├── Board.tsx        # Board component
│   └── Board.css        # Board styling
├── types.ts             # TypeScript type definitions
├── gameLogic.ts         # Core game logic
├── App.tsx              # Main app component
├── App.css              # App styling
└── main.tsx             # Entry point
```

## License

MIT
