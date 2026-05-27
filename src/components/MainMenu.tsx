import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { getInitialPoolPokemons } from '../api/pokeApi';
import { Pokemon, TrainerCharacter, SaveSlot } from '../types';
import { ALL_CHARACTERS } from '../data/characters';
import GameGuideModal from './GameGuideModal';
import { Play, Sparkles, Download, Save, Trash2 } from 'lucide-react';
import { getAllSaves, deleteFromDB } from '../db';
import { APP_VERSION } from '../constants/version';

const MainMenu: React.FC = () => {
  const [showStarters, setShowStarters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pool, setPool] = useState<Pokemon[]>([]);
  const [selectedPokes, setSelectedPokes] = useState<Pokemon[]>([]);
  const [refreshCount, setRefreshCount] = useState(2); // 提供两次免费刷新
  const [showGuide, setShowGuide] = useState(false);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const { playerCharacterLocal, setScene, setPlayerTeam, setGold, loadGame, setPlayerCharacter } = useGameStore(
    useShallow((state) => ({
      playerCharacterLocal: state.playerCharacter,
      setScene: state.setScene,
      setPlayerTeam: state.setPlayerTeam,
      setGold: state.setGold,
      loadGame: state.loadGame,
      setPlayerCharacter: state.setPlayerCharacter
    }))
  );

  const openSaveModal = async () => {
    const allSaves = await getAllSaves();
    setSaves(allSaves);
    setShowSaveModal(true);
  };

  const handleLoad = async (id: string) => {
    if (await loadGame(id)) {
      setShowSaveModal(false);
    }
  };

  const handleDeleteSave = async (id: string) => {
    if (confirm('确定要删除这个存档吗？此操作不可恢复！')) {
      await deleteFromDB(id);
      const allSaves = await getAllSaves();
      setSaves(allSaves);
    }
  };

  const MAX_TEAM_SIZE = 6;

  const [remainingCoins, setRemainingCoins] = useState(10); // UI 层面独立维护招募资金
  const [MAX_COINS, setMaxCoins] = useState(10);
  const selectedIdSet = useMemo(() => new Set(selectedPokes.map(p => p.uniqueId)), [selectedPokes]);

  const handleRefresh = async () => {
    if (refreshCount <= 0 || loading) return;
    setLoading(true);
    try {
      const data = await getInitialPoolPokemons(20);
      data.sort((a, b) => (a.cost || 0) - (b.cost || 0));
      setPool(data);
      setSelectedPokes([]); // 刷新会清空已选择
      setRemainingCoins(MAX_COINS);
      setRefreshCount(prev => prev - 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    
    // resetGame internally handles the "gold_start" skill logic
    useGameStore.getState().resetGame();
    const startGold = useGameStore.getState().gold;
    const initialCoins = startGold + 10;
    
    setRemainingCoins(initialCoins);
    setMaxCoins(initialCoins);
    setRefreshCount(2);
    try {
      const data = await getInitialPoolPokemons(20);
      // 按造价(cost)从小到大排序
      data.sort((a, b) => (a.cost || 0) - (b.cost || 0));
      setPool(data);
      setShowStarters(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (pokemon: Pokemon) => {
    const isSelected = selectedPokes.some(p => p.uniqueId === pokemon.uniqueId);
    if (isSelected) {
      setSelectedPokes(selectedPokes.filter(p => p.uniqueId !== pokemon.uniqueId));
      setRemainingCoins(prev => prev + (pokemon.cost || 0));
    } else {
      if (selectedPokes.length >= MAX_TEAM_SIZE) {
        alert(`队伍已满！最多只能选择 ${MAX_TEAM_SIZE} 只宝可梦。`);
        return;
      }
      if (remainingCoins < (pokemon.cost || 0)) {
        alert(`金币不足！还差 ${(pokemon.cost || 0) - remainingCoins} 金币。`);
        return;
      }
      setSelectedPokes([...selectedPokes, pokemon]);
      setRemainingCoins(prev => prev - (pokemon.cost || 0));
    }
  };

  const handleConfirmTeam = () => {
    if (selectedPokes.length === 0) return;
    setPlayerTeam(selectedPokes.map(p => ({ ...p }))); // clone
    setGold(remainingCoins);
    setScene('MapSelection');
  };

  if (showStarters) {
    return (
      <div className="flex flex-col w-full h-screen bg-zinc-900 text-zinc-100 overflow-hidden relative">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900/20 to-zinc-900 pointer-events-none"></div>

        <header className="flex flex-wrap justify-between items-center gap-4 p-6 bg-gradient-to-b from-zinc-800 to-zinc-900 border-b-4 border-zinc-700 shadow-[0_6px_20px_rgba(0,0,0,0.4)] relative z-10">
          <h1 className="text-2xl font-black tracking-widest bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">⚔️ 组建初始队伍</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="badge-chip !text-sm !px-4 !py-1.5 bg-gradient-to-b from-yellow-500/30 to-yellow-700/30 border-yellow-400/50">
              💰 <span className="text-yellow-300 text-lg font-black ml-1">{remainingCoins}</span><span className="text-yellow-500/70"> / {MAX_COINS}</span>
            </div>
            <div className="badge-chip !text-sm !px-4 !py-1.5 bg-gradient-to-b from-blue-500/30 to-blue-700/30 border-blue-400/50">
              👥 <span className="text-blue-300 text-lg font-black ml-1">{selectedPokes.length}</span><span className="text-blue-500/70"> / {MAX_TEAM_SIZE}</span>
            </div>
            <motion.button
              whileHover={refreshCount > 0 && !loading ? { scale: 1.05 } : {}}
              whileTap={refreshCount > 0 && !loading ? { scale: 0.95 } : {}}
              disabled={refreshCount <= 0 || loading}
              onClick={handleRefresh}
              className="btn-game from-purple-500 to-purple-800 border-purple-300/60"
              style={{ boxShadow: '0 6px 0 rgba(88,28,135,1), 0 8px 18px rgba(168,85,247,0.45), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 2px rgba(0,0,0,0.2)' }}
            >
              🔄 刷新池子 ({refreshCount})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={selectedPokes.length === 0}
              onClick={handleConfirmTeam}
              className="btn-game btn-green"
            >
              ✅ 确认阵容
            </motion.button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-7xl mx-auto pb-12">
            {pool.map((pokemon, idx) => {
              const isSelected = selectedIdSet.has(pokemon.uniqueId);
              const canAfford = remainingCoins >= (pokemon.cost || 0);
              const canSelect = isSelected || (canAfford && selectedPokes.length < MAX_TEAM_SIZE);

              return (
                <div
                  key={pokemon.uniqueId}
                  onClick={() => canSelect && toggleSelection(pokemon)}
                  className={`group relative flex flex-col items-center rounded-3xl transition-all duration-300 overflow-visible active:scale-[0.99] ${
                    isSelected 
                      ? 'cursor-pointer scale-[1.02] z-20' 
                      : canSelect
                        ? 'hover:scale-[1.05] hover:z-20 cursor-pointer'
                        : 'opacity-50 grayscale cursor-not-allowed'
                  }`}
                >
                  {/* 卡片背景层 - 玻璃拟物 */}
                  <div className={`absolute inset-0 rounded-3xl backdrop-blur-none border-2 transition-all duration-300 ${
                    isSelected 
                      ? 'bg-gradient-to-b from-blue-900/80 to-blue-800/90 border-blue-400/80 shadow-[0_0_30px_rgba(59,130,246,0.4),inset_0_2px_10px_rgba(255,255,255,0.2)]' 
                      : 'bg-gradient-to-br from-zinc-800/90 to-zinc-900/95 border-zinc-700/60 shadow-[0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:border-zinc-500/80 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)]'
                  }`}></div>

                  {/* 顶部金币标识 */}
                  <div className="absolute top-0 right-0 translate-x-2 -translate-y-2 bg-gradient-to-b from-yellow-400 to-yellow-600 text-zinc-950 font-black px-3 py-1 rounded-full text-xs shadow-[0_4px_10px_rgba(234,179,8,0.5),inset_0_1px_2px_rgba(255,255,255,0.8)] border border-yellow-300 flex items-center gap-1 z-30">
                    <span>💰</span> {pokemon.cost}
                  </div>

                  {/* 闪光特效 */}
                  {pokemon.isShiny && (
                    <>
                      {!isSelected && (
                        <motion.div 
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute top-2 left-2 text-yellow-400 font-black text-xl drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] z-20"
                          title="异色(闪光)宝可梦"
                        >
                          ✨
                        </motion.div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 via-transparent to-transparent rounded-3xl pointer-events-none z-10"></div>
                    </>
                  )}

                  {/* 精灵展示区 */}
                  <div className="relative w-full pt-8 pb-4 flex items-center justify-center z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-b from-white/5 to-transparent rounded-full blur-lg"></div>
                    <img 
                      src={pokemon.spriteUrl} 
                      alt={pokemon.name} 
                      loading="lazy"
                      className="w-24 h-24 object-contain drop-shadow-[0_10px_8px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:-translate-y-2" 
                      style={{ imageRendering: 'pixelated' }} 
                    />
                    {/* 脚下小阴影 */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/40 rounded-full blur-[3px]"></div>
                  </div>

                  {/* 名称与性别 */}
                  <h3 className="relative font-black text-xl text-center tracking-tight flex items-center justify-center gap-1 text-white drop-shadow-md z-10">
                    {pokemon.name}
                    {pokemon.gender === 'male' && <span className="text-blue-400 text-lg drop-shadow-[0_0_4px_rgba(96,165,250,0.8)]">♂</span>}
                    {pokemon.gender === 'female' && <span className="text-pink-400 text-lg drop-shadow-[0_0_4px_rgba(244,114,182,0.8)]">♀</span>}
                  </h3>
                  
                  {/* 属性标签 */}
                  <div className="flex gap-1.5 mt-2 mb-4 relative z-10">
                    {pokemon.types.map(t => (
                      <span key={t} className={`text-[10px] px-2.5 py-0.5 rounded-full type-${t} uppercase font-bold shadow-md border border-white/20`}>{t}</span>
                    ))}
                  </div>

                  {/* 属性网格区 */}
                  <div className="w-full bg-black/40 rounded-b-3xl p-3 border-t border-white/5 relative z-10">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-red-400/80 mb-0.5">HP</span>
                        <span className="text-xs font-mono font-bold text-white">{pokemon.baseStats.hp}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-orange-400/80 mb-0.5">ATK</span>
                        <span className="text-xs font-mono font-bold text-white">{pokemon.baseStats.attack}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-blue-400/80 mb-0.5">DEF</span>
                        <span className="text-xs font-mono font-bold text-white">{pokemon.baseStats.defense}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-yellow-400/80 mb-0.5">SPD</span>
                        <span className="text-xs font-mono font-bold text-white">{pokemon.baseStats.speed}</span>
                      </div>
                    </div>
                  </div>

                  {/* 选中打勾特效 */}
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-3 -left-3 bg-gradient-to-br from-blue-400 to-blue-600 text-white font-black w-10 h-10 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)] border-2 border-blue-200 z-30"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen overflow-hidden relative bg-black">
      <div className="absolute inset-0 z-0 opacity-70 bg-gray-900 bg-[url('/dynamax-battle.png')] bg-cover bg-center"
           style={{ filter: 'saturate(1.15) contrast(1.1)', transform: 'scale(1.02)' }} />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-900/30 via-transparent to-zinc-900/80 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none z-0"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="relative text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] mb-6 text-center tracking-widest animate-float"
          style={{ WebkitTextStroke: '2.5px #2563EB' }}
        >
          <div className="absolute -inset-8 bg-yellow-400/10 blur-3xl rounded-full pointer-events-none -z-10" />
          POKÉMON
          <br/>
          <span className="text-5xl text-white drop-shadow-xl tracking-normal mt-4 inline-block" style={{ WebkitTextStroke: '1px #000' }}>ROGUELIKE</span>
        </motion.div>

        <div className="mt-2 flex items-center gap-4 panel-glass px-6 py-3 rounded-full cursor-pointer hover:bg-zinc-800/80 transition-colors border-2 border-white/10" onClick={() => setShowCharacterSelect(true)}>
          <span className="text-zinc-300 font-bold text-lg">主角</span>
          <div className="flex items-center gap-3 bg-zinc-800 px-4 py-2 rounded-full border-2 border-blue-500">
            <img src={playerCharacterLocal.spriteUrl} alt={playerCharacterLocal.name} className="w-10 h-10 object-contain" style={{ imageRendering: 'pixelated' }} />
            <span className="text-white font-black text-xl">{playerCharacterLocal.name}</span>
          </div>
          <span className="text-blue-400 font-bold text-sm ml-2">点击更换角色 ✏️</span>
        </div>

        <div className="flex gap-4 relative z-10 mt-12 w-full max-w-[800px] px-6 justify-center flex-wrap sm:flex-nowrap">
          <motion.button
            whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleStart}
            disabled={loading}
            className="w-full sm:flex-[1.2] relative overflow-hidden px-4 py-5 bg-gradient-to-b from-red-500 to-red-700 text-white text-lg sm:text-xl font-black rounded-full shadow-[0_8px_0_rgba(153,27,27,1),0_15px_20px_rgba(0,0,0,0.4)] border-4 border-red-900 transition-all active:shadow-[0_0px_0_rgba(153,27,27,1),0_0px_0_rgba(0,0,0,0.4)] active:translate-y-[8px] disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <div className="absolute top-0 left-0 w-full h-1/3 bg-white/20 rounded-t-full pointer-events-none"></div>
            <span className="relative z-10 drop-shadow-md flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-full border-4 border-zinc-900 flex items-center justify-center shadow-inner group-hover:rotate-180 transition-transform duration-500 shrink-0">
                <div className="w-2 h-2 bg-zinc-900 rounded-full"></div>
              </div>
              {loading ? '召唤中...' : '开始冒险'}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={openSaveModal}
            className="w-full sm:flex-1 relative overflow-hidden px-4 py-5 bg-gradient-to-b from-emerald-500 to-emerald-700 text-white text-lg sm:text-xl font-black rounded-full shadow-[0_8px_0_rgba(6,95,70,1),0_15px_20px_rgba(0,0,0,0.4)] border-4 border-emerald-900 transition-all active:shadow-[0_0px_0_rgba(6,95,70,1),0_0px_0_rgba(0,0,0,0.4)] active:translate-y-[8px] group flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <div className="absolute top-0 left-0 w-full h-1/3 bg-white/20 rounded-t-full pointer-events-none"></div>
            <span className="relative z-10 drop-shadow-md flex items-center gap-2">
              <Download className="w-6 h-6 text-white shrink-0" />
              读取进度
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => setScene('SkillTree')}
            className="w-full sm:flex-1 relative overflow-hidden px-4 py-5 bg-gradient-to-b from-blue-500 to-blue-700 text-white text-lg sm:text-xl font-black rounded-full shadow-[0_8px_0_rgba(30,58,138,1),0_15px_20px_rgba(0,0,0,0.4)] border-4 border-blue-900 transition-all active:shadow-[0_0px_0_rgba(30,58,138,1),0_0px_0_rgba(0,0,0,0.4)] active:translate-y-[8px] group flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <div className="absolute top-0 left-0 w-full h-1/3 bg-white/20 rounded-t-full pointer-events-none"></div>
            <span className="relative z-10 drop-shadow-md flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-300 group-hover:rotate-12 transition-transform duration-500 shrink-0" />
              天赋树
            </span>
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => setShowGuide(true)}
          className="btn-game btn-dark mt-8 px-10 py-3 text-lg rounded-2xl"
        >
          📖 游戏说明 · Game Guide
        </motion.button>
      </div>

      <div className="absolute bottom-4 right-4 z-20 text-xs font-black text-zinc-400 tracking-widest bg-black/40 border border-white/10 px-3 py-1.5 rounded-full">
        v{APP_VERSION}
      </div>

      <GameGuideModal open={showGuide} onClose={() => setShowGuide(false)} closeText="我已了解，开始冒险！" />

      {/* Save Modal */}
      {showSaveModal && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm" onClick={() => setShowSaveModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl border-4 border-zinc-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-zinc-800 flex items-center gap-3">
                <Download className="text-blue-500 w-8 h-8" /> 读取进度
              </h2>
              <button onClick={() => setShowSaveModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
              {['auto', 'slot_1', 'slot_2', 'slot_3'].map(slot => {
                const save = saves.find(s => s.id === slot);
                const isAuto = slot === 'auto';
                if (!save && isAuto) return null; // Hide empty auto save

                return (
                  <div key={slot} className={`flex items-center justify-between p-5 rounded-2xl border-2 shadow-sm transition-colors ${isAuto ? 'bg-indigo-50 border-indigo-200 hover:border-indigo-400' : 'bg-zinc-50 border-zinc-200 hover:border-blue-300'}`}>
                    <div>
                      <div className={`font-black text-xl mb-1 ${isAuto ? 'text-indigo-800' : 'text-zinc-800'}`}>
                        {save ? save.label : `存档位 ${slot.replace('slot_', '')}`}
                      </div>
                      <div className="text-sm font-bold text-zinc-500">
                        {save ? new Date(save.timestamp).toLocaleString() : '空槽位'}
                      </div>
                      {save && (
                        <div className="text-xs font-bold text-blue-600 mt-1">
                          {save.characterName} - 第 {save.level} 层
                        </div>
                      )}
                      {save?.version && (
                        <div className="text-[10px] font-black text-zinc-500 mt-1">
                          版本 v{save.version}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {save && (
                        <>
                          <button
                            onClick={() => handleLoad(slot)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-400 transition-colors flex items-center gap-2 shadow-sm"
                          >
                            <Download size={18} /> 读取
                          </button>
                          <button
                            onClick={() => handleDeleteSave(slot)}
                            className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                            title="删除存档"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showCharacterSelect && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setShowCharacterSelect(false)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            onClick={e => e.stopPropagation()}
            className="panel-glass border-4 border-blue-500/70 p-6 max-w-5xl w-full max-h-[85vh] flex flex-col shadow-[0_0_60px_rgba(59,130,246,0.35)] text-zinc-200 relative animate-glow-pulse"
          >
            <button onClick={() => setShowCharacterSelect(false)} className="modal-close">×</button>
            <h2 className="relative text-3xl font-black mb-4 text-center pb-4 bg-gradient-to-r from-cyan-200 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
              <span className="inline-block drop-shadow-[0_2px_8px_rgba(96,165,250,0.5)]">⚔️ 选择你的角色</span>
              <div className="divider-fancy mt-4" />
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {ALL_CHARACTERS.map(char => (
                <div 
                  key={char.id}
                  onClick={() => {
                      setPlayerCharacter(char);
                      setShowCharacterSelect(false);
                    }}
                  className={`cursor-pointer rounded-xl border-4 transition-all flex flex-col items-center p-3 gap-3 ${
                    playerCharacterLocal.id === char.id 
                      ? 'border-blue-500 bg-blue-900/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                      : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-800'
                  }`}
                >
                  <img src={char.spriteUrl} alt={char.name} className="w-16 h-16 object-contain drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                  <span className="font-bold text-center text-sm">{char.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;
