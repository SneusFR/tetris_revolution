// Tetris game constants and logic

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
    y: -firstBlockRow // Start above the board to account for empty rows in piece matrix
  };
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
export const isValidPosition = (board, piece, x, y) => {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const newX = x + col;
        const newY = y + row;
        
        if (newX < 0 || newX >= BOARD_WIDTH || 
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY][newX])) {
          return false;
        }
      }
    }
  }
  return true;
};

// Merge piece with board
export const mergePiece = (board, piece) => {
  const newBoard = board.map(row => [...row]);
  
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const boardY = piece.y + row;
        const boardX = piece.x + col;
        
        if (boardY >= 0) {
          newBoard[boardY][boardX] = piece.color + 1;
        }
      }
    }
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

// Check if game is over
export const isGameOver = (board, newPiece = null) => {
  // If we have a new piece, check if it can be placed at its spawn position
  if (newPiece) {
    // Try to place the piece at its spawn position
    const canPlace = isValidPosition(board, newPiece, newPiece.x, newPiece.y);
    
    // If it can't be placed at spawn, try moving it up slightly
    if (!canPlace) {
      // Try placing it one row higher
      const canPlaceHigher = isValidPosition(board, newPiece, newPiece.x, newPiece.y - 1);
      if (canPlaceHigher) {
        // Update the piece position to the valid position
        newPiece.y = newPiece.y - 1;
        return false;
      }
      return true; // Game over if it can't be placed even higher
    }
    
    return false; // Piece can be placed normally
  }
  
  // Fallback: check if the spawn area is blocked
  // Check only the visible area where pieces actually spawn (rows 0-1)
  for (let row = 0; row < 2; row++) {
    for (let col = 3; col < 7; col++) { // Center columns where pieces spawn
      if (board[row] && board[row][col] !== 0) {
        return true;
      }
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

// Try to rotate piece with wall kicks
export const tryRotate = (board, piece, direction = 1) => {
  const rotatedShape = direction === 1 ? 
    rotateMatrix(piece.shape) : 
    rotateMatrix(rotateMatrix(rotateMatrix(piece.shape)));
  
  const rotatedPiece = {
    ...piece,
    shape: rotatedShape
  };
  
  // Try basic rotation
  if (isValidPosition(board, rotatedPiece, piece.x, piece.y)) {
    return rotatedPiece;
  }
  
  // Try simple wall kicks for all pieces
  // These offsets help pieces rotate near walls
  const simpleKicks = [
    [0, 0],   // Try original position
    [-1, 0],  // Try moving left
    [1, 0],   // Try moving right
    [0, -1],  // Try moving up
    [-2, 0],  // Try moving 2 left (for I piece)
    [2, 0],   // Try moving 2 right (for I piece)
    [-1, -1], // Try moving left and up
    [1, -1],  // Try moving right and up
    [0, 1],   // Try moving down
    [-1, 1],  // Try moving left and down
    [1, 1],   // Try moving right and down
  ];
  
  // For I piece, use special kicks
  if (piece.name === 'I') {
    const iKicks = [
      [0, 0],
      [-2, 0], [1, 0],
      [-2, 1], [1, -2],
      [0, -2], [0, 1],
      [-1, -2], [2, 1],
      [2, -1], [-1, 2]
    ];
    
    for (const [kickX, kickY] of iKicks) {
      if (isValidPosition(board, rotatedPiece, piece.x + kickX, piece.y + kickY)) {
        return {
          ...rotatedPiece,
          x: piece.x + kickX,
          y: piece.y + kickY
        };
      }
    }
  } else {
    // For all other pieces, use simple kicks
    for (const [kickX, kickY] of simpleKicks) {
      if (isValidPosition(board, rotatedPiece, piece.x + kickX, piece.y + kickY)) {
        return {
          ...rotatedPiece,
          x: piece.x + kickX,
          y: piece.y + kickY
        };
      }
    }
  }
  
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
      y: -firstBlockRow // Start above the board to account for empty rows in piece matrix
    };
  });
};
