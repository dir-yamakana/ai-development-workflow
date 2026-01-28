/**
 * テトリスゲームのユーティリティ関数
 */

import type { Board, Tetromino, TetrominoType } from '@/app/types/tetris';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINO_SHAPES,
  TETROMINO_COLORS,
} from '@/app/constants/tetris';

/**
 * 空のボードを作成
 */
export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null)
  );
}

/**
 * ランダムなテトリミノを生成
 */
export function createRandomTetromino(): Tetromino {
  const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  const type = types[Math.floor(Math.random() * types.length)];

  return {
    type,
    shape: TETROMINO_SHAPES[type],
    color: TETROMINO_COLORS[type],
    position: {
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINO_SHAPES[type][0].length / 2),
      y: 0,
    },
  };
}

/**
 * テトリミノを回転
 */
export function rotateTetromino(tetromino: Tetromino): Tetromino {
  // Oブロックは回転不要
  if (tetromino.type === 'O') {
    return tetromino;
  }

  const newShape = tetromino.shape[0].map((_, colIndex) =>
    tetromino.shape.map(row => row[colIndex]).reverse()
  );

  return {
    ...tetromino,
    shape: newShape,
  };
}

/**
 * 衝突判定
 */
export function checkCollision(
  board: Board,
  tetromino: Tetromino,
  offsetX = 0,
  offsetY = 0
): boolean {
  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        const newX = tetromino.position.x + x + offsetX;
        const newY = tetromino.position.y + y + offsetY;

        // ボード外チェック
        if (
          newX < 0 ||
          newX >= BOARD_WIDTH ||
          newY >= BOARD_HEIGHT
        ) {
          return true;
        }

        // 既存ブロックとの衝突チェック（上端より上は除外）
        if (newY >= 0 && board[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * テトリミノをボードに固定
 */
export function mergePieceToBoard(board: Board, tetromino: Tetromino): Board {
  const newBoard = board.map(row => [...row]);

  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        const boardY = tetromino.position.y + y;
        const boardX = tetromino.position.x + x;

        if (boardY >= 0 && boardY < BOARD_HEIGHT) {
          newBoard[boardY][boardX] = tetromino.color;
        }
      }
    }
  }

  return newBoard;
}

/**
 * 完成したラインを削除して詰める
 */
export function clearLines(board: Board): { newBoard: Board; linesCleared: number } {
  const newBoard: Board = [];
  let linesCleared = 0;

  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== null)) {
      linesCleared++;
    } else {
      newBoard.unshift(board[y]);
    }
  }

  // 消去した分だけ空行を追加
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }

  return { newBoard, linesCleared };
}

/**
 * ハードドロップの落下距離を計算
 */
export function calculateDropDistance(board: Board, tetromino: Tetromino): number {
  let distance = 0;

  while (!checkCollision(board, tetromino, 0, distance + 1)) {
    distance++;
  }

  return distance;
}
