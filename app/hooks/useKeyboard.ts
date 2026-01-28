/**
 * キーボードイベントハンドリングのカスタムフック
 */

import { useEffect } from 'react';

interface KeyboardHandlers {
  onLeft?: () => void;
  onRight?: () => void;
  onDown?: () => void;
  onUp?: () => void;
  onSpace?: () => void;
}

/**
 * キーボードイベントリスナーを設定するカスタムフック
 * useEffectが必要な理由: 外部システム（DOM）との同期
 */
export function useKeyboard(handlers: KeyboardHandlers, enabled = true): void {
  // 個別のハンドラー関数を分解して依存配列に含める
  const { onLeft, onRight, onDown, onUp, onSpace } = handlers;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          onLeft?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onRight?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onDown?.();
          break;
        case 'ArrowUp':
          event.preventDefault();
          onUp?.();
          break;
        case ' ':
          event.preventDefault();
          onSpace?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // クリーンアップ関数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onLeft, onRight, onDown, onUp, onSpace, enabled]);
}
