import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { getRandomPokemons } from '../api/pokeApi';
import { getRandomEquipment } from '../data/equipments';
import { Pokemon, Equipment } from '../types';

const GachaScreen: React.FC = () => {
  const setScene = useGameStore(state => state.setScene);
  const addPokemonToTeam = useGameStore(state => state.addPokemonToTeam);
  const addEquipment = useGameStore(state => state.addEquipment);
  const playerTeam = useGameStore(state => state.playerTeam);
  const currentLevel = useGameStore(state => state.currentLevel);

  const [pokemonOptions, setPokemonOptions] = useState<Pokemon[]>([]);
  const [equipOptions, setEquipOptions] = useState<Equipment[]>([]);
  const [viewedItem, setViewedItem] = useState<Pokemon | Equipment | null>(null);
  const [confirmedItem, setConfirmedItem] = useState<Pokemon | Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [goldReward, setGoldReward] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const reward = Math.floor(Math.random() * 8) + 8 + currentLevel * 2;
        setGoldReward(reward);
        
        const pokes = await getRandomPokemons(2, currentLevel);
        const equipReward = getRandomEquipment(currentLevel);
        if (isMounted) {
          setPokemonOptions(pokes);
          setEquipOptions([equipReward]);
        }
      } catch(e) {
        console.error(e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [currentLevel]);

  const handleSelect = (item: Pokemon | Equipment, isEquip: boolean) => {
    if (confirmedItem) return; // 防止重复点击
    setConfirmedItem(item);
    
    // 无论选什么，都能拿到金币
    const currentGold = useGameStore.getState().gold;
    useGameStore.getState().setGold(currentGold + goldReward);

    setTimeout(() => {
        if (isEquip) {
          addEquipment(item as Equipment);
          setScene('MapSelection');
        } else {
          addPokemonToTeam(item as Pokemon);
          setScene('MapSelection');
        }
      }, 1500);
  };

  if (loading) {
    return <div className="flex w-full h-screen bg-zinc-900 text-white items-center justify-center text-3xl font-bold">正在生成战利品...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center w-full h-screen text-white relative overflow-hidden"
    >
      {/* 极光背景 */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-zinc-900 to-black"></div>
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>

      <motion.h1 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-4xl md:text-5xl font-black mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(255,222,0,0.8)] text-yellow-400 z-10"
      >
        战斗胜利！选择战利品
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="text-2xl font-bold mb-12 z-10 flex items-center gap-2 bg-yellow-900/80 px-8 py-3 rounded-full border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
      >
        额外获得: 💰 <span className="text-yellow-400">{goldReward}</span> 金币
      </motion.p>

      {playerTeam.length >= 6 && (
        <p className="text-yellow-300 mb-8 font-bold z-10 bg-black/50 px-4 py-2 rounded">
          队伍已满 (6/6)，选择新的宝可梦将自动进入仓库。
        </p>
      )}

      <div className="flex flex-col md:flex-row gap-8 md:gap-8 z-10 relative mt-4 md:mt-8 overflow-y-auto md:overflow-visible pb-12 pt-4 px-4 items-center w-full max-h-[60vh] md:max-h-none justify-start md:justify-center custom-scrollbar">
        {pokemonOptions.map((pokemon, index) => (
          <motion.div
            key={pokemon.id + index}
            initial={{ scale: 0, opacity: 0, rotateY: 180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ delay: index * 0.2, type: 'spring', stiffness: 100 }}
            whileHover={confirmedItem ? {} : viewedItem === pokemon ? {} : { y: -10, scale: 1.02 }}
            whileTap={confirmedItem ? {} : { scale: 0.98 }}
            onClick={() => !confirmedItem && setViewedItem(pokemon)}
            className={`relative flex flex-col items-center p-6 rounded-2xl border-[3px] cursor-pointer transition-all bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 w-64 shrink-0 ${
              confirmedItem === pokemon || viewedItem === pokemon 
                ? 'border-yellow-400 shadow-[0_0_40px_rgba(255,222,0,0.6)] transform scale-105 z-20' 
                : confirmedItem 
                  ? 'border-zinc-700 opacity-40 grayscale'
                  : 'border-zinc-600 hover:border-blue-400 hover:shadow-[0_10px_30px_rgba(59,130,246,0.3)]'
            }`}
          >
            {/* 稀有度闪光背景 */}
            {(confirmedItem === pokemon || viewedItem === pokemon) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-yellow-400/20 rounded-xl"
              />
            )}

            <div className="w-32 h-32 mb-4 bg-zinc-900/50 rounded-full flex items-center justify-center border-2 border-zinc-600 shadow-inner overflow-hidden relative shrink-0">
               <img src={pokemon.spriteUrl} alt={pokemon.name} className="w-24 h-24 object-contain pixelated z-10" style={{ imageRendering: 'pixelated' }} />
               {/* 背景光效 */}
               <div className={`absolute inset-0 opacity-20 type-${pokemon.types[0]}`}></div>
            </div>
            
            <h3 className="text-2xl font-bold mb-2 tracking-tight flex items-center gap-1 justify-center text-white drop-shadow-md">
              {pokemon.name}
              {pokemon.gender === 'male' && <span className="text-blue-400 font-black">♂</span>}
              {pokemon.gender === 'female' && <span className="text-pink-400 font-black">♀</span>}
              {pokemon.isShiny && <span className="text-yellow-400 text-lg">✨</span>}
            </h3>
            <span className="text-sm font-bold text-yellow-400 mb-2">Lv.{pokemon.level}</span>
            
            <div className="flex gap-2 mb-4 flex-wrap justify-center">
              {pokemon.types.map(t => (
                <span key={t} className={`text-xs px-3 py-1 rounded-full type-${t} uppercase font-bold shadow-sm`}>{t}</span>
              ))}
            </div>

            <div className="w-full text-sm text-zinc-300 grid grid-cols-2 gap-2 bg-zinc-900/40 p-3 rounded-lg border border-zinc-700/50">
              <div className="flex justify-between"><span>HP</span><span className="font-bold text-green-400">{pokemon.maxHp}</span></div>
              <div className="flex justify-between"><span>攻击</span><span className="font-bold text-red-400">{pokemon.attack}</span></div>
              <div className="flex justify-between"><span>防御</span><span className="font-bold text-blue-400">{pokemon.defense}</span></div>
              <div className="flex justify-between"><span>速度</span><span className="font-bold text-yellow-400">{pokemon.speed}</span></div>
            </div>

            {viewedItem === pokemon && !confirmedItem && (
              <motion.button 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(pokemon, false);
                }}
                className="absolute -bottom-6 bg-yellow-400 text-zinc-900 font-black px-8 py-2.5 rounded-full border-4 border-white shadow-xl text-lg hover:bg-yellow-300 active:bg-yellow-500 z-30"
              >
                获得！
              </motion.button>
            )}
            {confirmedItem === pokemon && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-[2px] z-30"
              >
                <span className="text-4xl drop-shadow-md">✅</span>
              </motion.div>
            )}
          </motion.div>
        ))}

        {equipOptions.map((eq, index) => (
           <motion.div
            key={eq.id + index}
            initial={{ scale: 0, opacity: 0, rotateY: 180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 100 }}
            whileHover={confirmedItem ? {} : viewedItem === eq ? {} : { y: -10, scale: 1.02 }}
            whileTap={confirmedItem ? {} : { scale: 0.98 }}
            onClick={() => !confirmedItem && setViewedItem(eq)}
            className={`relative flex flex-col items-center p-6 rounded-2xl border-[3px] cursor-pointer transition-all w-64 shrink-0 ${
              confirmedItem === eq || viewedItem === eq
                ? 'border-yellow-400 shadow-[0_0_40px_rgba(255,222,0,0.6)] bg-gradient-to-br from-purple-900/90 to-indigo-900/90 transform scale-105 z-20' 
                : confirmedItem 
                  ? 'border-zinc-700 opacity-40 grayscale bg-zinc-800/95'
                  : eq.rarity === 'artifact' ? 'border-red-500 bg-gradient-to-br from-red-900/90 to-red-950/95 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_10px_30px_rgba(239,68,68,0.6)]'
                  : eq.rarity === 'legendary' ? 'border-yellow-500 bg-gradient-to-br from-yellow-900/90 to-yellow-950/95 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_10px_30px_rgba(234,179,8,0.6)]'
                  : eq.rarity === 'epic' ? 'border-purple-500 bg-gradient-to-br from-purple-900/90 to-purple-950/95 hover:shadow-[0_10px_30px_rgba(168,85,247,0.4)]'
                  : eq.rarity === 'rare' ? 'border-blue-500 bg-gradient-to-br from-blue-900/90 to-blue-950/95 hover:shadow-[0_10px_30px_rgba(59,130,246,0.4)]'
                  : 'border-zinc-500 bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 hover:shadow-[0_10px_30px_rgba(161,161,170,0.3)] hover:border-zinc-300'
            }`}
          >
            {(confirmedItem === eq || viewedItem === eq) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-yellow-400/20 rounded-xl"
              />
            )}

            <div className="w-32 h-32 mb-4 bg-zinc-900/50 rounded-full flex items-center justify-center border-2 border-zinc-600 shadow-inner overflow-hidden relative shrink-0">
               <span className="text-6xl">🎁</span>
            </div>
            
            <h3 className={`text-2xl font-bold mb-2 tracking-tight drop-shadow-md ${
              eq.rarity === 'artifact' ? 'text-red-400' :
              eq.rarity === 'legendary' ? 'text-yellow-400' :
              eq.rarity === 'epic' ? 'text-purple-400' :
              eq.rarity === 'rare' ? 'text-blue-400' :
              'text-white'
            }`}>{eq.name}</h3>
            <span className={`text-sm font-bold mb-2 ${
              eq.rarity === 'artifact' ? 'text-red-400' :
              eq.rarity === 'legendary' ? 'text-yellow-400' :
              eq.rarity === 'epic' ? 'text-purple-400' :
              eq.rarity === 'rare' ? 'text-blue-400' :
              'text-zinc-400'
            }`}>
              {eq.rarity === 'artifact' ? '神器' :
               eq.rarity === 'legendary' ? '传说' :
               eq.rarity === 'epic' ? '史诗' :
               eq.rarity === 'rare' ? '稀有' :
               '普通装备'}
            </span>
            
            <div className="w-full mt-4 text-sm text-zinc-200 bg-black/60 p-4 rounded-lg border border-zinc-700/50 h-24 flex items-center justify-center text-center shadow-inner">
              {eq.description}
            </div>

            {viewedItem === eq && !confirmedItem && (
              <motion.button 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(eq, true);
                }}
                className="absolute -bottom-6 bg-yellow-400 text-zinc-900 font-black px-8 py-2.5 rounded-full border-4 border-white shadow-xl text-lg hover:bg-yellow-300 active:bg-yellow-500 z-30"
              >
                获得！
              </motion.button>
            )}
            {confirmedItem === eq && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-[2px] z-30"
              >
                <span className="text-4xl drop-shadow-md">✅</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {!confirmedItem && (
          <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (confirmedItem) return;
            setConfirmedItem({} as any);
            const currentGold = useGameStore.getState().gold;
            useGameStore.getState().setGold(currentGold + goldReward);
            setScene('MapSelection');
          }}
          className="mt-6 md:mt-16 px-8 py-3 bg-zinc-800/95 text-zinc-300 font-bold rounded-full border-2 border-zinc-600 hover:bg-zinc-700 hover:text-white transition-all shadow-[0_5px_0_rgba(39,39,42,1)] active:shadow-none active:translate-y-[5px] z-10 relative shrink-0 mb-8 md:mb-0"
        >
          🏃 只带走金币并继续
        </motion.button>
      )}
    </motion.div>
  );
};

export default GachaScreen;
