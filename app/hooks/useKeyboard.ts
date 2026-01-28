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
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlers.onLeft?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handlers.onRight?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          handlers.onDown?.();
          break;
        case 'ArrowUp':
          event.preventDefault();
          handlers.onUp?.();
          break;
        case ' ':
          event.preventDefault();
          handlers.onSpace?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // クリーンアップ関数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers, enabled]);
}
