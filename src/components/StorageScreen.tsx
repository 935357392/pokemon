import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Unlock, Trash2, RefreshCw } from 'lucide-react';
import useGameStore from '../store/gameStore';

const StorageScreen: React.FC = () => {
  const setScene = useGameStore(state => state.setScene);
  const gold = useGameStore(state => state.gold);
  const storage = useGameStore(state => state.storage);
  const storageCapacity = useGameStore(state => state.storageCapacity);
  const playerTeam = useGameStore(state => state.playerTeam);
  const unlockStorageSlot = useGameStore(state => state.unlockStorageSlot);
  const moveStorageToTeam = useGameStore(state => state.moveStorageToTeam);
  const swapStorageWithTeam = useGameStore(state => state.swapStorageWithTeam);
  const releaseStoragePokemon = useGameStore(state => state.releaseStoragePokemon);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);

  const selectedPokemon = selectedIndex !== null ? storage[selectedIndex] : null;
  const canUnlock = storageCapacity < 120;
  const nextUnlockCost = useMemo(() => {
    const unlocked = Math.max(0, storageCapacity - 12);
    return (unlocked + 1) * 10;
  }, [storageCapacity]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full min-h-screen bg-zinc-950 text-white relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />

      <header className="relative z-10 flex items-center justify-between p-6 border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScene('MapSelection')}
            className="px-4 py-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-700 font-black flex items-center gap-2"
          >
            <ArrowLeft size={18} /> 返回
          </button>
          <div className="flex items-center gap-3">
            <Package size={22} className="text-indigo-300" />
            <div className="text-2xl font-black tracking-wider">宝可梦仓库</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-black text-zinc-200">
            金币 <span className="text-yellow-400 text-2xl ml-1">{gold}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 p-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="bg-zinc-900/70 border border-zinc-700 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-black tracking-[0.2em] text-zinc-400 uppercase">CAPACITY</div>
              <div className="text-2xl font-black mt-1">
                {storage.length}/{storageCapacity}
              </div>
            </div>
            {canUnlock ? (
              <button
                onClick={() => unlockStorageSlot()}
                className={`px-4 py-3 rounded-xl font-black flex items-center gap-2 border transition-colors ${
                  gold >= nextUnlockCost
                    ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/40'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 cursor-not-allowed'
                }`}
                disabled={gold < nextUnlockCost}
              >
                <Unlock size={18} /> 解锁 +1（{nextUnlockCost} 金币）
              </button>
            ) : (
              <div className="text-sm font-black text-emerald-300">已满级 120 格</div>
            )}
          </div>
          <div className="text-sm text-zinc-400 font-bold">
            队伍满 6 只时，新获得的宝可梦会自动进入仓库（最多 120 格）。
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: storageCapacity }).map((_, idx) => {
            const p = storage[idx];
            if (!p) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-32 rounded-2xl bg-zinc-900/40 border border-zinc-800"
                />
              );
            }
            return (
              <button
                key={p.uniqueId || `${p.id}-${idx}`}
                onClick={() => {
                  setSelectedIndex(idx);
                  setSwapIndex(null);
                }}
                className="h-32 rounded-2xl bg-zinc-900/70 border border-zinc-700 hover:border-indigo-400/40 hover:bg-zinc-900 transition-colors flex flex-col items-center justify-center"
              >
                <img
                  src={p.spriteUrl}
                  alt={p.name}
                  className="w-16 h-16 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div className="mt-2 text-xs font-black text-zinc-200 text-center px-2 line-clamp-1">
                  {p.name}
                </div>
                <div className="text-[10px] font-bold text-zinc-500">Lv.{p.level}</div>
              </button>
            );
          })}
        </div>
      </main>

      {selectedPokemon && selectedIndex !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-zinc-950/80 border border-zinc-700 flex items-center justify-center shadow-inner">
                  <img
                    src={selectedPokemon.spriteUrl}
                    alt={selectedPokemon.name}
                    className="w-16 h-16 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <div>
                  <div className="text-2xl font-black">{selectedPokemon.name}</div>
                  <div className="text-sm font-bold text-zinc-400">Lv.{selectedPokemon.level}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedIndex(null);
                  setSwapIndex(null);
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-black"
              >
                关闭
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4">
                <div className="text-sm font-black tracking-[0.2em] text-zinc-400 uppercase mb-3">ACTIONS</div>
                <div className="flex flex-wrap gap-3">
                  {playerTeam.length < 6 ? (
                    <button
                      onClick={() => {
                        moveStorageToTeam(selectedIndex);
                        setSelectedIndex(null);
                      }}
                      className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black border border-emerald-400/40"
                    >
                      加入队伍
                    </button>
                  ) : (
                    <button
                      onClick={() => setSwapIndex(selectedIndex)}
                      className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black border border-indigo-400/40 flex items-center gap-2"
                    >
                      <RefreshCw size={18} /> 替换进队伍
                    </button>
                  )}
                  <button
                    onClick={() => {
                      releaseStoragePokemon(selectedIndex);
                      setSelectedIndex(null);
                    }}
                    className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black border border-red-400/40 flex items-center gap-2"
                  >
                    <Trash2 size={18} /> 放生
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4">
                <div className="text-sm font-black tracking-[0.2em] text-zinc-400 uppercase mb-3">TEAM</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {playerTeam.map((p, idx) => (
                    <button
                      key={p.uniqueId || `${p.id}-${idx}`}
                      onClick={() => {
                        if (swapIndex !== null && selectedIndex !== null) {
                          swapStorageWithTeam(selectedIndex, idx);
                          setSelectedIndex(null);
                          setSwapIndex(null);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-colors ${
                        swapIndex !== null ? 'bg-zinc-900/70 border-zinc-700 hover:border-indigo-400/50' : 'bg-zinc-900/40 border-zinc-800'
                      }`}
                      disabled={swapIndex === null}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={p.spriteUrl}
                          alt={p.name}
                          className="w-10 h-10 object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="flex-1 text-left">
                          <div className="text-xs font-black text-white line-clamp-1">{p.name}</div>
                          <div className="text-[10px] font-bold text-zinc-500">Lv.{p.level}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {swapIndex !== null ? (
                  <div className="mt-3 text-xs font-bold text-indigo-300">
                    请选择队伍中要被替换的宝可梦
                  </div>
                ) : (
                  <div className="mt-3 text-xs font-bold text-zinc-500">
                    队伍未满时可直接加入；队伍已满时可进行替换。
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StorageScreen;

