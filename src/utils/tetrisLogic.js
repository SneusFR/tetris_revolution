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
  return {
    name,
    ...TETROMINOES[name],
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINOES[name].shape[0].length / 2),
    y: 0
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
    return !isValidPosition(board, newPiece, newPiece.x, newPiece.y);
  }
  
  // Fallback: check if top rows have blocks (but this should rarely be used)
  return board[0].some(cell => cell !== 0) || board[1].some(cell => cell !== 0);
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
  
  // Try wall kicks
  const kickData = piece.name === 'I' ? WALL_KICK_DATA.I : WALL_KICK_DATA.normal;
  const currentRotation = 0; // Simplified, would need to track actual rotation state
  const newRotation = (currentRotation + direction + 4) % 4;
  const kickKey = `${currentRotation}->${newRotation}`;
  
  if (kickData[kickKey]) {
    for (const [kickX, kickY] of kickData[kickKey]) {
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
  
  return bag.map(name => ({
    name,
    ...TETROMINOES[name],
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINOES[name].shape[0].length / 2),
    y: 0
  }));
};
