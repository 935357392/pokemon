import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { fetchPokemonById } from '../api/pokeApi';

const LegendaryEventScreen: React.FC = () => {
  const readyLegendaryQuest = useGameStore(state => state.readyLegendaryQuest);
  const setScene = useGameStore(state => state.setScene);
  const startBattle = useGameStore(state => state.startBattle);
  const currentLevel = useGameStore(state => state.currentLevel);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // 如果没有任务，直接回 Map
  useEffect(() => {
    if (!readyLegendaryQuest) {
      setScene('MapSelection');
    }
  }, [readyLegendaryQuest, setScene]);

  if (!readyLegendaryQuest) return null;

  const storyText = readyLegendaryQuest.storyText || ['传说中的宝可梦出现了！'];

  const handleNext = async () => {
    if (step < storyText.length - 1) {
      setStep(prev => prev + 1);
    } else {
      if (loading) return;
      setLoading(true);
      try {
        const enemyLevel = Math.max(1, currentLevel + 5); // 神兽等级比当前层数高5级，作为Boss
        const legendaryPokemon = await fetchPokemonById(readyLegendaryQuest.legendaryId || 150, enemyLevel);
        
        // 增加神兽的属性作为Boss
        legendaryPokemon.maxHp = Math.floor(legendaryPokemon.maxHp * 1.5);
        legendaryPokemon.currentHp = legendaryPokemon.maxHp;
        legendaryPokemon.attack = Math.floor(legendaryPokemon.attack * 1.2);
        legendaryPokemon.defense = Math.floor(legendaryPokemon.defense * 1.2);
        
        // 使用特殊的 startBattle，不需要敌人训练家
        startBattle([legendaryPokemon]);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black text-zinc-100 overflow-hidden relative items-center justify-center font-sans cursor-pointer" onClick={handleNext}>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-black to-black pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full max-w-4xl p-8 flex flex-col items-center"
      >
        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-16 tracking-widest drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">
          {readyLegendaryQuest.storyTitle}
        </h2>

        <div className="h-40 flex items-center justify-center text-center w-full px-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-2xl md:text-3xl font-bold text-white leading-relaxed drop-shadow-lg"
            >
              {storyText[step]}
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mt-16 text-zinc-500 font-bold tracking-widest flex items-center gap-2"
        >
          {loading ? '正在召唤神兽...' : '点击继续 (CLICK TO CONTINUE)'}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LegendaryEventScreen;