import React, { useState } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { ArrowLeft, Trash2, PackagePlus, PackageMinus, GripHorizontal, ShieldAlert } from 'lucide-react';
import { Pokemon, Equipment } from '../types';

const DraggablePokemonCard = ({ pokemon, idx, selectedIdx, setSelectedIdx, handleRemove, getHpColorClass, applyExtraEvolution, evolutionMaterials, showInventoryFor, setShowInventoryFor, unequipItem, inventory, equipItem }: any) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item 
      value={pokemon}
      dragListener={false}
      dragControls={dragControls}
      className="list-none relative z-0 h-full shrink-0 flex flex-col"
    >
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: idx * 0.1 }}
        onClick={() => setSelectedIdx(idx === selectedIdx ? null : idx)}
        className={`flex flex-col gap-4 p-6 rounded-3xl border-4 transition-colors cursor-pointer w-72 h-[34rem] relative overflow-hidden ${
          selectedIdx === idx 
            ? 'bg-blue-900/50 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
            : 'bg-zinc-800 border-zinc-600 hover:border-zinc-400 shadow-md'
        }`}
      >
        {/* 拖拽把手 */}
        <div 
          className="absolute top-4 right-4 flex items-center justify-center cursor-grab active:cursor-grabbing text-zinc-400 hover:text-white bg-black/40 p-2 rounded-xl backdrop-blur-sm z-20 transition-colors hover:bg-black/60"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripHorizontal size={24} />
        </div>

        {/* 序号 */}
        <span className="absolute top-4 left-4 text-4xl font-black text-zinc-500 opacity-20 z-0">#{idx + 1}</span>

        {/* 头像 */}
        <div className="flex flex-col items-center justify-center mt-8 z-10">
          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center overflow-hidden shrink-0 shadow-inner mb-4 ${
            pokemon.extraForm === 'mega' ? 'bg-red-900/30 border-red-500 shadow-[0_0_15px_red]' :
            pokemon.extraForm === 'dynamax' ? 'bg-pink-900/30 border-pink-500 shadow-[0_0_15px_pink]' :
            pokemon.extraForm === 'tera' ? 'bg-teal-900/30 border-teal-500 shadow-[0_0_15px_teal]' :
            'bg-zinc-700/50 border-zinc-500'
          }`}>
            <img 
              src={pokemon.spriteUrl} 
              alt={pokemon.name} 
              className={`object-contain transition-all ${
                pokemon.extraForm === 'dynamax' ? 'w-40 h-40 scale-125' : 
                pokemon.extraForm === 'tera' ? 'w-24 h-24 drop-shadow-[0_0_8px_cyan]' :
                'w-24 h-24'
              }`} 
              style={{ imageRendering: 'pixelated' }} 
            />
          </div>

          {/* 名字与属性 */}
          <h2 className="text-2xl font-bold mb-1 flex items-center justify-center gap-1 w-full truncate px-2">
            <span className="truncate">{pokemon.name}</span>
            {pokemon.gender === 'male' && <span className="text-blue-400 font-black shrink-0">♂</span>}
            {pokemon.gender === 'female' && <span className="text-pink-400 font-black shrink-0">♀</span>}
            {pokemon.isShiny && <span className="text-yellow-400 text-lg shrink-0">✨</span>}
            {pokemon.extraForm === 'mega' && <span className="text-[10px] bg-red-600 text-white px-1 py-0.5 rounded shadow-[0_0_5px_red] shrink-0">MEGA</span>}
            {pokemon.extraForm === 'dynamax' && <span className="text-[10px] bg-pink-600 text-white px-1 py-0.5 rounded shadow-[0_0_5px_pink] shrink-0">极巨化</span>}
            {pokemon.extraForm === 'tera' && <span className="text-[10px] bg-teal-500 text-white px-1 py-0.5 rounded shadow-[0_0_5px_teal] shrink-0">太晶化</span>}
          </h2>
          <div className="text-sm font-bold text-yellow-400 mb-2">
            Lv.{pokemon.level} 
            <span className="text-zinc-500 ml-2 font-normal text-xs">EXP: {pokemon.exp}/{pokemon.maxExp}</span>
          </div>
          <div className="flex gap-2 mb-4 justify-center flex-wrap">
            {pokemon.types.map((t: string) => (
              <span key={t} className={`text-[10px] px-2 py-0.5 rounded-md type-${t} uppercase font-bold shadow-sm`}>{t}</span>
            ))}
          </div>
        </div>

        {/* 血量条与装备 */}
        <div className="flex flex-col justify-end flex-1 w-full mt-auto">
          <div className="flex justify-between text-sm font-bold text-zinc-300 mb-1">
            <span>HP</span>
            <span>{pokemon.currentHp} / {pokemon.maxHp}</span>
          </div>
          <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border-2 border-zinc-700 mb-4">
            <div 
              className={`h-full transition-all duration-500 ${getHpColorClass(pokemon.currentHp, pokemon.maxHp)}`}
              style={{ width: `${(pokemon.currentHp / pokemon.maxHp) * 100}%` }}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <span className="text-xs text-zinc-400 font-bold">携带道具:</span>
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((slotIdx) => {
                const eq = (pokemon.equipments || [])[slotIdx];
                return (
                  <div key={slotIdx} className="w-full">
                    {eq ? (
                      <span 
                        className="text-xs px-2 py-1.5 bg-purple-900/50 text-purple-300 border border-purple-500/30 rounded-lg flex items-center justify-center gap-1 cursor-pointer hover:bg-purple-800/50 transition-colors w-full truncate"
                        onClick={(e) => { e.stopPropagation(); unequipItem(idx, slotIdx); }}
                        title={`点击卸下: ${eq.name}`}
                      >
                        <PackageMinus size={14} className="shrink-0" /> <span className="truncate">{eq.name}</span>
                      </span>
                    ) : (
                      <span 
                        className="text-xs px-2 py-1.5 bg-zinc-700 text-zinc-400 border border-zinc-600 rounded-lg flex items-center justify-center gap-1 cursor-pointer hover:bg-zinc-600 transition-colors w-full"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setShowInventoryFor(showInventoryFor?.pokemonIdx === idx && showInventoryFor?.slotIdx === slotIdx ? null : { pokemonIdx: idx, slotIdx }); 
                        }}
                        title="点击穿戴装备"
                      >
                        <PackagePlus size={14} /> 空槽位
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 放生按钮 */}
        {selectedIdx === idx && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
              className="p-2 bg-red-900/80 text-red-300 rounded-xl hover:bg-red-800 border border-red-500 shadow-lg backdrop-blur-md"
              title="放生此宝可梦"
            >
              <Trash2 size={20} />
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* 底部操作区 (进化/穿戴) */}
      <div className="mt-4 flex flex-col gap-2 w-full">
        {selectedIdx === idx && !pokemon.extraForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-800/80 border-t-4 border-yellow-500/50 p-4 rounded-2xl flex flex-col gap-2 w-full shadow-lg"
          >
            <div className="text-yellow-400 font-bold text-xs text-center mb-1">特殊进化</div>
            <button
              onClick={() => applyExtraEvolution(idx, 'mega')}
              disabled={evolutionMaterials.megaStone <= 0}
              className={`px-2 py-1.5 rounded-lg font-black text-xs w-full transition-all ${
                evolutionMaterials.megaStone > 0 
                  ? 'bg-gradient-to-r from-red-600 to-red-400 hover:from-red-500 hover:to-red-300 text-white shadow-[0_0_10px_rgba(248,113,113,0.3)]' 
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Mega ({evolutionMaterials.megaStone})
            </button>
            <button
              onClick={() => applyExtraEvolution(idx, 'dynamax')}
              disabled={evolutionMaterials.dynamaxBand <= 0}
              className={`px-2 py-1.5 rounded-lg font-black text-xs w-full transition-all ${
                evolutionMaterials.dynamaxBand > 0 
                  ? 'bg-gradient-to-r from-pink-600 to-rose-400 hover:from-pink-500 hover:to-rose-300 text-white shadow-[0_0_10px_rgba(244,114,182,0.3)]' 
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              极巨化 ({evolutionMaterials.dynamaxBand})
            </button>
            <button
              onClick={() => applyExtraEvolution(idx, 'tera')}
              disabled={evolutionMaterials.teraOrb <= 0}
              className={`px-2 py-1.5 rounded-lg font-black text-xs w-full transition-all ${
                evolutionMaterials.teraOrb > 0 
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-white shadow-[0_0_10px_rgba(45,212,191,0.3)]' 
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              太晶化 ({evolutionMaterials.teraOrb})
            </button>
          </motion.div>
        )}

        {showInventoryFor?.pokemonIdx === idx && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-800/90 border-2 border-purple-500/50 rounded-2xl p-4 w-full shadow-lg"
          >
            <h3 className="text-purple-300 font-bold text-xs mb-3 flex items-center justify-center gap-1">
              <PackagePlus size={14} /> 槽位 {showInventoryFor.slotIdx + 1}
            </h3>
            {inventory.length === 0 ? (
              <p className="text-xs text-zinc-500 italic text-center">无装备</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {inventory.map((eq: any, i: number) => (
                  <div key={eq.id + i} 
                       onClick={() => { equipItem(idx, showInventoryFor.slotIdx, eq); setShowInventoryFor(null); }}
                       className={`bg-zinc-900 border rounded-lg p-2 w-full cursor-pointer transition-all ${
                         eq.rarity === 'artifact' ? 'border-red-500 hover:bg-red-900/20' :
                         eq.rarity === 'legendary' ? 'border-yellow-500 hover:bg-yellow-900/20' :
                         eq.rarity === 'epic' ? 'border-purple-500 hover:bg-purple-900/20' :
                         eq.rarity === 'rare' ? 'border-blue-500 hover:bg-blue-900/20' :
                         'border-zinc-600 hover:bg-zinc-800'
                       }`}>
                    <div className={`font-bold text-xs truncate ${
                      eq.rarity === 'artifact' ? 'text-red-400' :
                      eq.rarity === 'legendary' ? 'text-yellow-400' :
                      eq.rarity === 'epic' ? 'text-purple-400' :
                      eq.rarity === 'rare' ? 'text-blue-400' :
                      'text-zinc-200'
                    }`}>{eq.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2 leading-tight">{eq.description}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Reorder.Item>
  );
};

const TeamManagement: React.FC = () => {
  const setScene = useGameStore(state => state.setScene);
  const playerTeam = useGameStore(state => state.playerTeam);
  const inventory = useGameStore(state => state.inventory);
  const evolutionMaterials = useGameStore(state => state.evolutionMaterials);
  const setPlayerTeam = useGameStore(state => state.setPlayerTeam);
  const removePokemonFromTeam = useGameStore(state => state.removePokemonFromTeam);
  const equipItem = useGameStore(state => state.equipItem);
  const unequipItem = useGameStore(state => state.unequipItem);
  const applyExtraEvolution = useGameStore(state => state.applyExtraEvolution);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showInventoryFor, setShowInventoryFor] = useState<{ pokemonIdx: number, slotIdx: number } | null>(null);

  const handleReorder = (newOrder: Pokemon[]) => {
    // We shouldn't recalculate stats here, just pass the new order since they are already calculated
    // Wait, `setPlayerTeam` recalculates. So it's fine.
    setPlayerTeam(newOrder);
    setSelectedIdx(null); // 拖拽时重置选中状态
  };

  const handleRemove = (idx: number) => {
    if (playerTeam.length <= 1) {
      alert("队伍中至少需要保留一只宝可梦！");
      return;
    }
    if (confirm(`确定要放生 ${playerTeam[idx].name} 吗？此操作不可逆！`)) {
      playerTeam[idx].equipments?.forEach((eq, slotIdx) => {
        if (eq) unequipItem(idx, slotIdx); // 先把装备卸下
      });
      removePokemonFromTeam(idx);
      setSelectedIdx(null);
    }
  };

  const getHpColorClass = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio > 0.5) return 'hp-green';
    if (ratio > 0.2) return 'hp-yellow';
    return 'hp-red';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col w-full h-screen bg-zinc-800 text-zinc-100 overflow-hidden relative"
    >
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2560&auto=format&fit=crop')] bg-cover bg-center opacity-10 pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900/60 to-purple-900/60 pointer-events-none"></div>

      {/* 头部导航 */}
      <header className="flex items-center justify-between p-6 bg-zinc-900 border-b-4 border-zinc-700 shadow-xl relative z-10">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (playerTeam.length > 6) {
                alert("队伍人数超限 (最多 6 只)！请放生多余的宝可梦后再返回。");
                return;
              }
              setScene('MapSelection');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors border-2 ${
              playerTeam.length > 6 
                ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                : 'bg-zinc-700 text-white border-zinc-500 hover:bg-zinc-600'
            }`}
          >
            <ArrowLeft size={24} /> 返回地图
          </motion.button>
          <h1 className="text-3xl font-black tracking-widest ml-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            队伍管理 
            <span className={`ml-2 ${playerTeam.length > 6 ? 'text-red-500' : 'text-zinc-400'}`}>
              ({playerTeam.length}/6)
            </span>
          </h1>
        </div>

        {playerTeam.length > 6 && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-lg font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
            ⚠️ 队伍已满载，请选择放生！
          </div>
        )}
      </header>

      {/* 内容区域 */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden relative z-10 custom-scrollbar flex items-center">
        <Reorder.Group 
          axis="x" 
          values={playerTeam} 
          onReorder={handleReorder} 
          className="flex gap-6 h-full items-start min-w-max mx-auto px-12 py-12"
        >
          {playerTeam.map((pokemon, idx) => (
            <DraggablePokemonCard
              key={pokemon.uniqueId || `${pokemon.id}-${idx}`}
              pokemon={pokemon}
              idx={idx}
              selectedIdx={selectedIdx}
              setSelectedIdx={setSelectedIdx}
              handleRemove={handleRemove}
              getHpColorClass={getHpColorClass}
              applyExtraEvolution={applyExtraEvolution}
              evolutionMaterials={evolutionMaterials}
              showInventoryFor={showInventoryFor}
              setShowInventoryFor={setShowInventoryFor}
              unequipItem={unequipItem}
              inventory={inventory}
              equipItem={equipItem}
            />
          ))}
        </Reorder.Group>
      </main>
    </motion.div>
  );
};

export default TeamManagement;
