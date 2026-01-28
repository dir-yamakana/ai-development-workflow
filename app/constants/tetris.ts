/**
 * テトリスゲームの定数定義
 */

import type { TetrominoType } from '@/app/types/tetris';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const INITIAL_DROP_SPEED = 1000; // ミリ秒
export const FAST_DROP_SPEED = 50; // ミリ秒（ソフトドロップ）

// テトリミノの形状定義
export const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

// テトリミノの標準色
export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: '#00f0f0', // シアン
  J: '#0000f0', // 青
  L: '#f0a000', // オレンジ
  O: '#f0f000', // 黄色
  S: '#00f000', // 緑
  T: '#a000f0', // 紫
  Z: '#f00000', // 赤
};

// スコアリング
export const SCORE_VALUES = {
  SINGLE_LINE: 100,
  DOUBLE_LINE: 300,
  TRIPLE_LINE: 500,
  TETRIS: 800,
  SOFT_DROP: 1,
  HARD_DROP: 2,
};
