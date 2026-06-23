# Chess-JS

A custom board game engine built in vanilla JavaScript. Despite the project name, this is **not** standard chess — it features its own unique piece placement and movement rules.

## Project Description

The project implements a turn-based strategy board game on an 8×8 grid with two players ("First Player" and "Second Player"). Each player controls an army of units with six distinct types: Pawn, Knight, Bishop, Rook, Queen, and King. The King is the game-critical piece — when it is captured, the opposing player wins.

### Core Features

- **Turn-based play**: Players alternate turns; First Player (white) moves first.
- **Six unit types**: Each with its own unique movement rules implemented via dedicated calculator classes.
- **Piece capture**: Moving to a square occupied by an opponent's piece removes it from the board.
- **Pawn promotion**: When a Pawn reaches the opponent's home row, it is automatically promoted to a Queen.
- **Win conditions**: A player wins by capturing the opponent's King, or when the turn limit (80 turns) is exceeded (Second Player wins by default in this case).
- **Move validation**: The engine computes all possible legal moves for every piece each turn.

---

## Code Evaluation

### Architecture

The codebase uses a clean class-based OOP design:

| Layer | Classes | Purpose |
|---|---|---|
| **Utils** | `Alignment`, `Coordinate`, `HomeRowCalculator` | Player sides, board coordinates, home row lookup |
| **Army Units** | `ArmyUnit`, `ArmyUnitType` (base), `PawnUnitType`, `KnightUnitType`, `BishopUnitType`, `RookUnitType`, `QueenUnitType`, `KingUnitType` | Unit data model and type hierarchy |
| **Movement** | `PawnPossibleMovesCalculator`, `KnightPossibleMovesCalculator`, `BishopPossibleMovesCalculator`, `RookPossibleMovesCalculator`, `QueenPossibleMovesCalculator`, `KingPossibleMovesCalculator`, `LineMovementHelper` | Legal move computation for each piece type |
| **Core** | `Cell`, `Board`, `GameState`, `GameManager`, `Player` | Game board, state management, turn logic, win detection |
| **Content Generation** | `SampleBoardGenerator`, `SampleGameManagerGenerator`, `UnitTypeLibraryGenerator` | Factory classes for game setup |
| **Tests** | `TextGridToBoardConverter`, `TextGridToCoordinateSetConverter`, `TextGridCoordinateAdjuster`, `CoordinateSetComparator` | Test utilities (incomplete) |

### Behavior Description

1. **Game Initialization**: `UnitTypeLibraryGenerator` creates all six unit types. `SampleBoardGenerator` places units on the board in the game's custom layout. `SampleGameManagerGenerator` wires everything together with a `GameState` and `GameManager`.

2. **Turn Flow**: On each turn, the active player selects one of their units and a destination. `GameManager.executeMove()` validates the move, executes captures if applicable, checks for King capture (game over), moves the piece, checks for pawn promotion, switches the active player, and recalculates all possible moves.

3. **Movement System**: Each `ArmyUnitType` subclass delegates move calculation to its corresponding static calculator class. Line-based pieces (Bishop, Rook, Queen) share `LineMovementHelper` which traces rays in given directions until hitting a board edge or another piece.

4. **No Visual Interface**: The current `index.html` only displays "Hello world". The `main.js` file contains a hardcoded sequence of moves that exercises the game logic via console output.

---

## Bug Report

### Critical Bugs

#### Bug 1: `GameState.placeNewUnit()` and `removeUnit()` — missing `this.board`

**File**: `src/java_script/core/GameState.js`, lines 74 and 80

Both methods reference bare `board` instead of `this.board`. Since `board` is not a global variable, these methods will throw a `ReferenceError` at runtime. This means pawn promotion (which calls `GameManager.placeNewUnit()` → `GameState.placeNewUnit()`) will crash.

```javascript
// BUG (line 74):
board.placeNewUnit( newUnit, row, column );
// FIX:
this.board.placeNewUnit( newUnit, row, column );

// BUG (line 80):
board.removeUnit( unit );
// FIX:
this.board.removeUnit( unit );
```

#### Bug 2: `GameManager.canExecuteMove()` — move validation disabled

**File**: `src/java_script/core/GameManager.js`, lines 43–50

The code that checks whether a move is in the computed set of legal moves is commented out. The developer's comment explains why: *"Coordinate should work as value, but it is Object."* JavaScript Sets use reference equality for objects, so `Set.has(new Coordinate(...))` will never match an existing Coordinate in the set.

**Impact**: Any piece can move to any square as long as it belongs to the active player. All movement rules are effectively unenforced.

**Fix**: Iterate the possible moves set and compare using `Coordinate.areEqual()`.

#### Bug 3: Loose equality operators (`==` / `!=`) for object comparison

Multiple files use `==` or `!=` to compare `Alignment` singleton objects. This works by coincidence (since they are the same object references), but `===` / `!==` is the correct practice and prevents subtle bugs if the code is ever refactored.

**Affected files**:
- `GameManager.js` line 93
- `LineMovementHelper.js` line 28
- `KingPossibleMovesCalculator.js` line 38
- `KnightPossibleMovesCalculator.js` line 37
- `PawnPossibleMovesCalculator.js` line 58

---

### Test Utility Bugs

These bugs are in the test helper classes under `tests/utils/`. They don't affect game runtime but make the testing infrastructure completely non-functional.

#### Bug 4: `TextGridToBoardConverter.execute()` — variable name typo

**File**: `src/java_script/tests/utils/TextGridToBoardConverter.js`, line 25

```javascript
// BUG: declares 'coumn' but loop uses 'column' (implicit global)
for ( let coumn = 0; column < columnCount; ++column )
// FIX:
for ( let column = 0; column < columnCount; ++column )
```

Also on line 19: bare `inputGrid` instead of `this.inputGrid`.

#### Bug 5: `TextGridToBoardConverter.processCell()` — wrong method called for column

**File**: `src/java_script/tests/utils/TextGridToBoardConverter.js`, line 35

```javascript
// BUG: calls adjustLine() for column coordinate
const adjustedColumn = TextGridCoordinateAdjuster.adjustLine( inpiutColumn, this.board );
// FIX:
const adjustedColumn = TextGridCoordinateAdjuster.adjustColumn( inputColumn, this.board );
```

#### Bug 6: `TextGridCoordinateAdjuster.adjustLine()` — wrong method name and missing parentheses

**File**: `src/java_script/tests/utils/TextGridCoordinateAdjuster.js`, line 3

```javascript
// BUG: 'getLineCount' is not a method; also missing () for method call
return ( board.getLineCount - 1 ) - line;
// FIX:
return ( board.getRowCount() - 1 ) - line;
```

#### Bug 7: `TextGridToCoordinateSetConverter` — multiple bugs

**File**: `src/java_script/tests/utils/TextGridToCoordinateSetConverter.js`

| Line | Bug | Fix |
|------|-----|-----|
| 13 | bare `inputGrid` | `this.inputGrid` |
| 17 | typo `coumn` vs `column` | `let column` |
| 22 | returns `this.board` (doesn't exist) | return `this.resultSet` |
| 26 | references `this.board` (doesn't exist) | needs a board reference or row count |
| 27 | typo `inpiutColumn` | `inputColumn` |
| 29 | semicolon after `if` — makes next line unconditional | remove semicolon |
| 30 | bare `resultSet` | `this.resultSet` |
| 33 | `static` method called via `this.` | remove `static` or call via class name |

#### Bug 8: `CoordinateSetComparator.execute()` — missing variable declarations

**File**: `src/java_script/tests/utils/CoordinateSetComparator.js`, lines 8–9

```javascript
// BUG: implicit global variables
array1 = Array.from( set1 );
array2 = Array.from( set2 );
// FIX:
const array1 = Array.from( set1 );
const array2 = Array.from( set2 );
```

---

## Changes from Original Logic Code

The game logic (`logic/` folder) received only **bug fixes** — no gameplay rules, unit placement, or movement behavior was altered. All changes:

1. **`GameState.js`** — `placeNewUnit()` and `removeUnit()` referenced a bare `board` variable instead of `this.board`, causing a crash whenever units were added or removed.
2. **`GameManager.js`** — `canExecuteMove()` used `Set.has()` to check if a `Coordinate` was in the valid moves set, which always returned `false` because `Coordinate` objects need value-based comparison. Replaced with an iteration using `Coordinate.areEqual()`.
3. **`GameManager.js` + 4 movement calculators** — Loose equality operators (`==`, `!=`) replaced with strict (`===`, `!==`) across `GameManager`, `LineMovementHelper`, `KingPossibleMovesCalculator`, `KnightPossibleMovesCalculator`, and `PawnPossibleMovesCalculator`.
4. **Test utilities** (4 files) — Fixed typos (`coumn` → `column`, `inpiutColumn` → `inputColumn`), missing `this.` references, wrong method names (`getLineCount` → `getRowCount()`), incorrect return values, a semicolon after `if` that broke control flow, and missing `const` declarations.

---

## Architecture


The project follows a strict separation between game logic and graphics:

```
src/
├── logic/                 Pure game engine (zero DOM/rendering dependencies)
│   ├── utils/             Alignment, Coordinate, HomeRowCalculator
│   ├── army_unit/         ArmyUnit + type hierarchy with movement calculators
│   ├── Board.js           8×8 grid with unit-to-coordinate mapping
│   ├── Cell.js            Single board cell container
│   ├── GameManager.js     Move execution, validation, promotion, win detection
│   ├── GameState.js       Board + players + turn tracking
│   └── Player.js          Player with unit set
├── content_generation/    Factory classes for game setup
├── graphics/              Babylon.js 3D rendering layer
│   ├── ChessScene.js      Engine, camera, lighting, environment
│   ├── BoardRenderer.js   3D board with PBR materials and highlights
│   ├── PieceRenderer.js   Procedural 3D pieces with shadow casting
│   ├── AnimationManager.js Move/capture/promotion animations
│   ├── InputHandler.js    Click/touch input → game logic bridge
│   └── UIOverlay.js       HUD: turn indicator, captured pieces, game over
├── tests/                 Test utilities (text-grid-based)
├── style.css              UI styling with glassmorphism
├── index.html             Entry point
└── main.js                Application bootstrap
```

## Technology Stack

| Technology | Purpose |
|---|---|
| **JavaScript (ES6+)** | Game logic and application code |
| **Babylon.js** | 3D rendering engine (loaded via CDN) |
| **PBR Materials** | Physically-based rendering for realistic surfaces |
| **HTML5 Canvas** | WebGL rendering target |
| **CSS3** | UI overlay with glassmorphism, responsive design |
| **Google Fonts (Inter)** | Typography |

## How to Run

1. Serve the `src/` directory with any HTTP server:

   ```bash
   # Using Node.js
   npx http-server src -p 8080

   # Using Python
   python -m http.server 8080 --directory src
   ```

2. Open `http://localhost:8080` in a modern browser.

3. **Desktop**: Click a piece to select it, then click a highlighted square to move.
4. **Mobile**: Tap a piece to select, tap a valid destination to move. Pinch to zoom, drag to orbit.

## Graphics Features

- **3D Board**: Alternating marble/wood PBR squares with a raised wooden frame and coordinate labels
- **Procedural Pieces**: Six distinct piece shapes built from Babylon.js primitives (cylinders, spheres, boxes, toruses)
- **Lighting**: Hemispheric ambient + directional key/fill lights with soft shadow mapping
- **Animations**: Piece lift-arc-place movement, capture shrink effect with particles, promotion scale-in
- **Input**: Unified pointer events for mouse and touch; piece selection highlights with pulsing valid-move indicators
- **UI Overlay**: Glassmorphism turn indicator, captured pieces display, animated game-over panel with New Game button
- **Responsive**: Full mobile support with touch camera controls and adaptive UI breakpoints
