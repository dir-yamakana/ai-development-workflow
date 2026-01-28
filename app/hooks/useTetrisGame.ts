/**
 * テトリスゲームロジックのカスタムフック
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import type { GameState } from '@/app/types/tetris';
import {
  createEmptyBoard,
  createRandomTetromino,
  rotateTetromino,
  checkCollision,
  mergePieceToBoard,
  clearLines,
  calculateDropDistance,
} from '@/app/utils/tetris';
import { INITIAL_DROP_SPEED, SCORE_VALUES } from '@/app/constants/tetris';

export function useTetrisGame() {
  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(),
    currentPiece: null,
    nextPiece: null,
    score: 0,
    isGameOver: false,
    isPlaying: false,
  });

  const dropSpeedRef = useRef(INITIAL_DROP_SPEED);

  // ゲーム開始
  const startGame = useCallback(() => {
    const firstPiece = createRandomTetromino();
    const secondPiece = createRandomTetromino();

    setGameState({
      board: createEmptyBoard(),
      currentPiece: firstPiece,
      nextPiece: secondPiece,
      score: 0,
      isGameOver: false,
      isPlaying: true,
    });
    dropSpeedRef.current = INITIAL_DROP_SPEED;
  }, []);

  // 左移動
  const moveLeft = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.isGameOver || !prev.isPlaying) return prev;

      if (!checkCollision(prev.board, prev.currentPiece, -1, 0)) {
        return {
          ...prev,
          currentPiece: {
            ...prev.currentPiece,
            position: {
              ...prev.currentPiece.position,
              x: prev.currentPiece.position.x - 1,
            },
          },
        };
      }
      return prev;
    });
  }, []);

  // 右移動
  const moveRight = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.isGameOver || !prev.isPlaying) return prev;

      if (!checkCollision(prev.board, prev.currentPiece, 1, 0)) {
        return {
          ...prev,
          currentPiece: {
            ...prev.currentPiece,
            position: {
              ...prev.currentPiece.position,
              x: prev.currentPiece.position.x + 1,
            },
          },
        };
      }
      return prev;
    });
  }, []);

  // 回転
  const rotate = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.isGameOver || !prev.isPlaying) return prev;

      const rotated = rotateTetromino(prev.currentPiece);

      if (!checkCollision(prev.board, rotated, 0, 0)) {
        return {
          ...prev,
          currentPiece: rotated,
        };
      }
      return prev;
    });
  }, []);

  // ソフトドロップ
  const softDrop = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.isGameOver || !prev.isPlaying) return prev;

      if (!checkCollision(prev.board, prev.currentPiece, 0, 1)) {
        return {
          ...prev,
          currentPiece: {
            ...prev.currentPiece,
            position: {
              ...prev.currentPiece.position,
              y: prev.currentPiece.position.y + 1,
            },
          },
          score: prev.score + SCORE_VALUES.SOFT_DROP,
        };
      }
      return prev;
    });
  }, []);

  // ハードドロップ
  const hardDrop = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.isGameOver || !prev.isPlaying) return prev;

      const distance = calculateDropDistance(prev.board, prev.currentPiece);
      const droppedPiece = {
        ...prev.currentPiece,
        position: {
          ...prev.currentPiece.position,
          y: prev.currentPiece.position.y + distance,
        },
      };

      // ボードに固定
      const mergedBoard = mergePieceToBoard(prev.board, droppedPiece);
      const { newBoard, linesCleared } = clearLines(mergedBoard);

      // スコア計算
      let lineScore = 0;
      switch (linesCleared) {
        case 1:
          lineScore = SCORE_VALUES.SINGLE_LINE;
          break;
        case 2:
          lineScore = SCORE_VALUES.DOUBLE_LINE;
          break;
        case 3:
          lineScore = SCORE_VALUES.TRIPLE_LINE;
          break;
        case 4:
          lineScore = SCORE_VALUES.TETRIS;
          break;
      }

      const dropScore = distance * SCORE_VALUES.HARD_DROP;
      const newScore = prev.score + dropScore + lineScore;

      // 次のピースを生成
      const newCurrentPiece = prev.nextPiece;
      const newNextPiece = createRandomTetromino();

      // ゲームオーバー判定
      if (newCurrentPiece && checkCollision(newBoard, newCurrentPiece, 0, 0)) {
        return {
          ...prev,
          board: newBoard,
          currentPiece: null,
          isGameOver: true,
          isPlaying: false,
          score: newScore,
        };
      }

      return {
        ...prev,
        board: newBoard,
        currentPiece: newCurrentPiece,
        nextPiece: newNextPiece,
        score: newScore,
      };
    });
  }, []);

  // 自動落下処理
  const drop = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.isGameOver || !prev.isPlaying) return prev;

      // 下に移動できるか確認
      if (!checkCollision(prev.board, prev.currentPiece, 0, 1)) {
        return {
          ...prev,
          currentPiece: {
            ...prev.currentPiece,
            position: {
              ...prev.currentPiece.position,
              y: prev.currentPiece.position.y + 1,
            },
          },
        };
      }

      // 移動できない場合、ボードに固定
      const mergedBoard = mergePieceToBoard(prev.board, prev.currentPiece);
      const { newBoard, linesCleared } = clearLines(mergedBoard);

      // スコア計算
      let lineScore = 0;
      switch (linesCleared) {
        case 1:
          lineScore = SCORE_VALUES.SINGLE_LINE;
          break;
        case 2:
          lineScore = SCORE_VALUES.DOUBLE_LINE;
          break;
        case 3:
          lineScore = SCORE_VALUES.TRIPLE_LINE;
          break;
        case 4:
          lineScore = SCORE_VALUES.TETRIS;
          break;
      }

      const newScore = prev.score + lineScore;

      // 次のピースを生成
      const newCurrentPiece = prev.nextPiece;
      const newNextPiece = createRandomTetromino();

      // ゲームオーバー判定
      if (newCurrentPiece && checkCollision(newBoard, newCurrentPiece, 0, 0)) {
        return {
          ...prev,
          board: newBoard,
          currentPiece: null,
          isGameOver: true,
          isPlaying: false,
          score: newScore,
        };
      }

      return {
        ...prev,
        board: newBoard,
        currentPiece: newCurrentPiece,
        nextPiece: newNextPiece,
        score: newScore,
      };
    });
  }, []);

  // ゲームループ
  // useEffectが必要な理由: タイマー（外部システム）との同期
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    const intervalId = setInterval(() => {
      drop();
    }, dropSpeedRef.current);

    return () => {
      clearInterval(intervalId);
    };
  }, [gameState.isPlaying, gameState.isGameOver, drop]);

  return {
    gameState,
    startGame,
    moveLeft,
    moveRight,
    rotate,
    softDrop,
    hardDrop,
  };
}
