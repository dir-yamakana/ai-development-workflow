'use client';

/**
 * テトリスゲームページ
 *
 * このコンポーネントはクライアントサイドで実行されます（静的エクスポート環境対応）
 * useEffectの使用: キーボードイベントとゲームループ（外部システムとの同期）のため必須
 */

import { useTetrisGame } from '@/app/hooks/useTetrisGame';
import { useKeyboard } from '@/app/hooks/useKeyboard';
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/app/constants/tetris';

export default function TetrisPage() {
  const {
    gameState,
    startGame,
    moveLeft,
    moveRight,
    rotate,
    softDrop,
    hardDrop,
  } = useTetrisGame();

  // キーボード操作
  useKeyboard(
    {
      onLeft: moveLeft,
      onRight: moveRight,
      onDown: softDrop,
      onUp: rotate,
      onSpace: hardDrop,
    },
    gameState.isPlaying && !gameState.isGameOver
  );

  // ボードを描画用に変換（現在のピースを含む）
  const renderBoard = () => {
    const displayBoard = gameState.board.map(row => [...row]);

    // 現在のピースを描画
    if (gameState.currentPiece) {
      const { shape, position, color } = gameState.currentPiece;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (
              boardY >= 0 &&
              boardY < BOARD_HEIGHT &&
              boardX >= 0 &&
              boardX < BOARD_WIDTH
            ) {
              displayBoard[boardY][boardX] = color;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  // Nextピース表示用のミニボード
  const renderNextPiece = () => {
    if (!gameState.nextPiece) return null;

    const { shape, color } = gameState.nextPiece;
    const size = shape.length;

    return (
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {shape.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className="w-6 h-6 border border-slate-700/30"
              style={{
                backgroundColor: cell ? color : 'transparent',
              }}
            />
          ))
        )}
      </div>
    );
  };

  const displayBoard = renderBoard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">TETRIS</h1>
          <p className="text-slate-400">
            矢印キー: 移動・回転 | スペース: ハードドロップ
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr_auto_300px] gap-8 items-start">
          {/* 左側: スコア */}
          <div className="bg-slate-800/50 rounded-2xl shadow-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-4">Score</h2>
            <div className="text-5xl font-bold text-blue-400">
              {gameState.score.toLocaleString()}
            </div>
          </div>

          {/* 中央: ゲームボード */}
          <div className="flex flex-col items-center">
            <div
              className="bg-slate-900 rounded-2xl shadow-2xl p-4 border-4 border-slate-700"
              style={{
                width: 'fit-content',
              }}
            >
              <div
                className="grid gap-[1px] bg-slate-800"
                style={{
                  gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
                }}
              >
                {displayBoard.map((row, y) =>
                  row.map((cell, x) => (
                    <div
                      key={`${y}-${x}`}
                      className="w-8 h-8 border border-slate-700/30 transition-colors"
                      style={{
                        backgroundColor: cell || '#1e293b',
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            {/* ゲームオーバー/スタートボタン */}
            <div className="mt-6">
              {gameState.isGameOver && (
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-red-400 mb-2">GAME OVER</p>
                  <p className="text-slate-400">最終スコア: {gameState.score.toLocaleString()}</p>
                </div>
              )}
              {!gameState.isPlaying && (
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  {gameState.isGameOver ? 'リトライ' : 'スタート'}
                </button>
              )}
            </div>
          </div>

          {/* 右側: Nextピース */}
          <div className="bg-slate-800/50 rounded-2xl shadow-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-4">Next</h2>
            <div className="flex items-center justify-center bg-slate-900 rounded-xl p-6">
              {renderNextPiece()}
            </div>

            {/* 操作説明 */}
            <div className="mt-6 text-sm text-slate-400 space-y-2">
              <div className="flex items-center justify-between">
                <span>移動</span>
                <span className="text-slate-300">← →</span>
              </div>
              <div className="flex items-center justify-between">
                <span>回転</span>
                <span className="text-slate-300">↑</span>
              </div>
              <div className="flex items-center justify-between">
                <span>ソフトドロップ</span>
                <span className="text-slate-300">↓</span>
              </div>
              <div className="flex items-center justify-between">
                <span>ハードドロップ</span>
                <span className="text-slate-300">Space</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
