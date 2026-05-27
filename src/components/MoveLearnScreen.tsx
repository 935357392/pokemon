import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';

const MoveLearnScreen: React.FC = () => {
  const pendingMoveLearn = useGameStore(state => state.pendingMoveLearn);
  const playerTeam = useGameStore(state => state.playerTeam);
  const resolveMoveLearning = useGameStore(state => state.resolveMoveLearning);

  const current = pendingMoveLearn[0];
  const pokemon = current
    ? playerTeam.find((p, i) => (p.uniqueId || `${p.id}-${i}`) === current.pokemonUniqueId)
    : null;

  if (!current || !pokemon) {
    return (
      <div className="w-full h-screen bg-zinc-950 text-white flex items-center justify-center text-xl font-black">
        正在整理技能数据...
      </div>
    );
  }

  const canAppend = (pokemon.moves?.length || 0) < 4;
  const [selectedForgetMoveId, setSelectedForgetMoveId] = useState<string | null>(null);
  const selectedForgetMove = useMemo(() => {
    if (!selectedForgetMoveId) return null;
    return pokemon.moves.find(m => m.id === selectedForgetMoveId) || null;
  }, [pokemon.moves, selectedForgetMoveId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen bg-zinc-950 text-white flex items-center justify-center p-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />

      <div className="relative z-10 w-full max-w-3xl bg-zinc-900/90 border border-zinc-700 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-2xl bg-zinc-950/80 border border-zinc-700 flex items-center justify-center shadow-inner">
            <img
              src={pokemon.spriteUrl}
              alt={pokemon.name}
              className="w-20 h-20 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="flex-1">
            <div className="text-sm font-black tracking-[0.3em] text-zinc-400 uppercase mb-2">
              LEVEL UP MOVE
            </div>
            <div className="text-3xl font-black tracking-wider">
              {pokemon.name} 想学会新招式
            </div>
          </div>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-700 rounded-2xl p-6 mb-8 shadow-inner">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="text-2xl font-black text-white">
                {current.newMove.name}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <span className={`text-xs px-3 py-1 rounded-full uppercase font-black shadow-sm type-${current.newMove.type}`}>
                  {current.newMove.type}
                </span>
                <span className="text-xs font-bold text-zinc-300 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                  威力 {current.newMove.power > 0 ? current.newMove.power : '-'}
                </span>
                <span className="text-xs font-bold text-zinc-300 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                  命中 {current.newMove.accuracy}
                </span>
                <span className="text-xs font-bold text-zinc-300 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                  PP {current.newMove.pp}/{current.newMove.maxPp}
                </span>
                {current.newMove.recoilPercent ? (
                  <span className="text-xs font-black text-red-300 bg-red-900/30 px-3 py-1 rounded-full border border-red-500/30">
                    反伤 {current.newMove.recoilPercent}%
                  </span>
                ) : null}
              </div>
              {current.newMove.description ? (
                <div className="mt-3 text-sm font-bold text-zinc-300 leading-relaxed">
                  {current.newMove.description}
                </div>
              ) : null}
            </div>

            {canAppend ? (
              <button
                onClick={() => resolveMoveLearning(null)}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black border border-emerald-400/40 shadow-[0_6px_0_rgba(5,150,105,0.6)] active:translate-y-[6px] active:shadow-none transition-all"
              >
                学会
              </button>
            ) : null}
          </div>
        </div>

        {!canAppend && (
          <div className="mb-6">
            <div className="text-lg font-black text-zinc-200 mb-3">
              选择要遗忘的招式
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pokemon.moves.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedForgetMoveId(m.id)}
                  className={`w-full text-left p-4 rounded-2xl bg-zinc-950/70 border transition-colors shadow-inner ${
                    selectedForgetMoveId === m.id
                      ? 'border-indigo-300 bg-zinc-950'
                      : 'border-zinc-700 hover:border-indigo-400/50 hover:bg-zinc-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-black text-white">{m.name}</div>
                    <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-black type-${m.type}`}>
                      {m.type}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-bold text-zinc-400 flex flex-wrap gap-2">
                    <span>威力 {m.power > 0 ? m.power : '-'}</span>
                    <span>命中 {m.accuracy}</span>
                    <span>PP {m.pp}/{m.maxPp}</span>
                    {m.recoilPercent ? <span className="text-red-300">反伤 {m.recoilPercent}%</span> : null}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 text-xs font-bold text-zinc-500">
              {selectedForgetMove ? `将遗忘：${selectedForgetMove.name}` : '未选择遗忘招式'}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              if (canAppend) {
                resolveMoveLearning(null);
              } else if (selectedForgetMoveId) {
                resolveMoveLearning(selectedForgetMoveId);
              }
            }}
            disabled={!canAppend && !selectedForgetMoveId}
            className={`px-5 py-3 rounded-xl font-black border transition-colors ${
              canAppend || selectedForgetMoveId
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40'
                : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
            }`}
          >
            确认学习
          </button>
          <button
            onClick={() => resolveMoveLearning(null)}
            className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-black border border-zinc-700 transition-colors"
          >
            放弃学习
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MoveLearnScreen;
