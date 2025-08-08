// Tetris game constants and logic
import { dlog, warn } from '../utils/debug';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const PREVIEW_SIZE = 4;

// Tetromino shapes
export const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: 0
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 1
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 2
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: 3
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: 4
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 5
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 6
  }
};

export const TETROMINO_NAMES = Object.keys(TETROMINOES);

// Create empty board
export const createBoard = () => {
  return Array.from({ length: BOARD_HEIGHT }, () => 
    Array.from({ length: BOARD_WIDTH }, () => 0)
  );
};

// Get random tetromino
export const getRandomTetromino = () => {
  const name = TETROMINO_NAMES[Math.floor(Math.random() * TETROMINO_NAMES.length)];
  const tetromino = TETROMINOES[name];
  
  // Find the first row that contains blocks to determine proper spawn position
  let firstBlockRow = 0;
  for (let row = 0; row < tetromino.shape.length; row++) {
    if (tetromino.shape[row].some(cell => cell !== 0)) {
      firstBlockRow = row;
      break;
    }
  }
  
  return {
    name,
    ...tetromino,
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
    y: -firstBlockRow, // Start above the board to account for empty rows in piece matrix
    rotation: 0 // NEW: Add rotation state
  };
};

// Helper: Check if piece is grounded (touching the ground or another piece)
export const isGrounded = (board, piece) => 
  !isValidPosition(board, piece, piece.x, piece.y + 1);

// Check if piece would lock above the top of the board (y < 0)
export const wouldLockAboveTop = (piece) => {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c] && (piece.y + r) < 0) return true;
    }
  }
  return false;
};

// Rotate matrix 90 degrees clockwise
export const rotateMatrix = (matrix) => {
  const N = matrix.length;
  const rotated = Array.from({ length: N }, () => Array(N).fill(0));
  
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      rotated[j][N - 1 - i] = matrix[i][j];
    }
  }
  
  return rotated;
};

// Check if position is valid
export const isValidPosition = (board, piece, x, y, _dbg) => {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (!piece.shape[row][col]) continue;

      const newX = x + col;
      const newY = y + row;

      // Hors limites
      if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
        if (_dbg) dlog('COLLIDE/BOUND', { x:newX, y:newY, piece: piece.name });
        return false;
      }
      // En haut du board : autorisé tant que <= -1 (spawn)
      if (newY < 0) continue;

      // Cellule occupée
      if (board[newY][newX]) {
        if (_dbg) dlog('COLLIDE/CELL ', { x:newX, y:newY, val: board[newY][newX], piece: piece.name });
        return false;
      }
    }
  }
  return true;
};

// Merge piece with board
export const mergePiece = (board, piece) => {
  const newBoard = board.map(row => [...row]);
  let overlap = false;
  const overlaps = [];

  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const y = piece.y + r;
      const x = piece.x + c;

      // Sécurité x avant d'indexer
      if (x < 0 || x >= BOARD_WIDTH) {
        warn('MERGE/OOB-X', { x, y, piece: piece.name });
        return null;
      }
      if (y >= 0) {
        if (newBoard[y][x] !== 0) {
          overlap = true;
          overlaps.push({ x, y, existing: newBoard[y][x] });
        }
        newBoard[y][x] = piece.color + 1;
      }
    }
  }
  if (overlap) {
    warn('MERGE/OVERLAP', { piece: piece.name, at: { x: piece.x, y: piece.y }, overlaps });
    return null;
  }
  return newBoard;
};

// Clear completed lines
export const clearLines = (board) => {
  let linesCleared = 0;
  const newBoard = [];
  const clearedLineIndices = [];
  
  for (let row = 0; row < BOARD_HEIGHT; row++) {
    if (board[row].every(cell => cell !== 0)) {
      linesCleared++;
      clearedLineIndices.push(row);
    } else {
      newBoard.push(board[row]);
    }
  }
  
  // Add empty lines at the top
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0));
  }
  
  return { board: newBoard, linesCleared, clearedLineIndices };
};

// Get lines to clear (for animation purposes)
export const getLinesToClear = (board) => {
  const linesToClear = [];
  
  for (let row = 0; row < BOARD_HEIGHT; row++) {
    if (board[row].every(cell => cell !== 0)) {
      linesToClear.push(row);
    }
  }
  
  return linesToClear;
};

// Calculate score based on lines cleared
export const calculateScore = (linesCleared, level) => {
  const baseScores = {
    0: 0,
    1: 100,
    2: 300,
    3: 500,
    4: 800  // Tetris!
  };
  
  return baseScores[linesCleared] * level;
};

// Calculate combo bonus score
export const calculateComboBonus = (comboCount, level) => {
  if (comboCount <= 1) return 0;
  
  // Combo bonus increases exponentially
  const baseBonus = 50;
  const multiplier = Math.min(comboCount - 1, 10); // Cap at 10x multiplier
  
  return baseBonus * multiplier * level;
};

// Get ghost piece position (preview where piece will land)
export const getGhostPieceY = (board, piece) => {
  if (!piece || !piece.shape) return null;
  
  let ghostY = piece.y;
  
  // Keep moving down until we find an invalid position
  while (isValidPosition(board, piece, piece.x, ghostY + 1)) {
    ghostY++;
  }
  
  // Return the ghost position only if it's different from current position
  return ghostY > piece.y ? ghostY : null;
};

// Check if game is over - Pure function that doesn't mutate the piece
export const isGameOver = (board, piece) => {
  if (!piece) return false;
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const y = piece.y + r;
      const x = piece.x + c;
      // Si une case de spawn touche quelque chose dans la grille visible -> top-out.
      if (y >= 0 && (
        y >= BOARD_HEIGHT || x < 0 || x >= BOARD_WIDTH || board[y][x] !== 0
      )) return true;
    }
  }
  return false;
};

// Wall kick data for SRS (Super Rotation System)
export const WALL_KICK_DATA = {
  normal: {
    '0->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '1->0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '1->2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '2->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '2->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    '3->2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '3->0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '0->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
  },
  I: {
    '0->1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '1->0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '1->2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    '2->1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '2->3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '3->2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '3->0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '0->3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
  }
};

// Try to rotate piece with SRS wall kicks and ceiling kick protection
export const tryRotate = (board, piece, direction = 1) => {
  const from = piece.rotation || 0;
  const to = (from + (direction === 1 ? 1 : 3)) % 4;

  const rotatedShape = direction === 1 
    ? rotateMatrix(piece.shape) 
    : rotateMatrix(rotateMatrix(rotateMatrix(piece.shape)));

  const rotatedPiece = { ...piece, shape: rotatedShape, rotation: to };

  const table = piece.name === 'I' ? WALL_KICK_DATA.I : WALL_KICK_DATA.normal;
  const key = `${from}->${to}`;
  const kicks = table[key] || [[0, 0]];
  const grounded = isGrounded(board, piece);

  for (const [dx, dy] of kicks) {
    if (!grounded && dy < 0) continue; // ta règle

    const nx = piece.x + dx;
    const ny = piece.y + dy;

    if (isValidPosition(board, rotatedPiece, nx, ny, 'ROT')) {
      dlog('ROTATE/OK     ', { name: piece.name, from, to, kick:[dx,dy], grounded });
      return { ...rotatedPiece, x: nx, y: ny };
    }
  }
  dlog('ROTATE/FAIL   ', { name: piece.name, from, to, grounded });
  return null;
};

// Apply a single move to a piece (for authoritative engine)
export const applyMove = (board, piece, { dx = 0, dy = 0, rot = 0 }) => {
  if (!piece) return piece;
  
  let candidate = piece;
  
  // Apply rotation first if requested
  if (rot !== 0) {
    const rotated = tryRotate(board, candidate, rot > 0 ? 1 : -1);
    if (rotated) {
      candidate = rotated;
    }
    // If rotation fails, continue with translation
  }
  
  // Apply horizontal movement
  if (dx !== 0) {
    const newX = candidate.x + dx;
    if (isValidPosition(board, candidate, newX, candidate.y)) {
      candidate = { ...candidate, x: newX };
    }
  }
  
  // Apply vertical movement
  if (dy !== 0) {
    const newY = candidate.y + dy;
    if (isValidPosition(board, candidate, candidate.x, newY)) {
      candidate = { ...candidate, y: newY };
    }
  }
  
  return candidate;
};

// Validate and potentially fix a piece position (fallback for lock safety)
export const validatePiecePosition = (board, piece) => {
  if (!piece) return null;
  
  // First check if current position is valid
  if (isValidPosition(board, piece, piece.x, piece.y)) {
    return piece;
  }
  
  // Try to move up a few positions to find a valid spot
  for (let offset = 1; offset <= 3; offset++) {
    const testY = piece.y - offset;
    if (isValidPosition(board, piece, piece.x, testY)) {
      warn('PIECE/FIXED   ', { from: piece.y, to: testY, offset });
      return { ...piece, y: testY };
    }
  }
  
  // If we can't fix it, return null to trigger game over
  warn('PIECE/UNFIXABLE', { piece: piece.name, x: piece.x, y: piece.y });
  return null;
};

// Generate bag of 7 pieces (7-bag randomizer)
export const generateBag = () => {
  const bag = [...TETROMINO_NAMES];
  
  // Fisher-Yates shuffle
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  
  return bag.map(name => {
    const tetromino = TETROMINOES[name];
    
    // Find the first row that contains blocks to determine proper spawn position
    let firstBlockRow = 0;
    for (let row = 0; row < tetromino.shape.length; row++) {
      if (tetromino.shape[row].some(cell => cell !== 0)) {
        firstBlockRow = row;
        break;
      }
    }
    
    return {
      name,
      ...tetromino,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
      y: -firstBlockRow, // Start above the board to account for empty rows in piece matrix
      rotation: 0 // NEW: Add rotation state
    };
  });
};
