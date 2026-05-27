import React from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';

const GameOver: React.FC = () => {
  const resetGame = useGameStore(state => state.resetGame);
  const currentLevel = useGameStore(state => state.currentLevel);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-black text-white relative overflow-hidden">
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 1.5, bounce: 0.4 }}
        className="text-center z-10"
      >
        <h1 className="text-6xl md:text-8xl font-black text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] tracking-widest mb-6">
          GAME OVER
        </h1>
        <p className="text-2xl text-zinc-400 mb-4">
          你到达了第 <span className="font-bold text-yellow-400 text-3xl">{currentLevel}</span> 层
        </p>
        <p className="text-xl text-blue-300 font-bold mb-12 flex items-center justify-center gap-2">
          {useGameStore.getState().playerCharacter.name} 获得技能点(SP): <span className="text-yellow-400 text-3xl">+{currentLevel}</span>
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0px 0px 20px rgba(255,255,255,0.5)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => resetGame()}
          className="px-12 py-4 bg-zinc-100 text-black font-black text-2xl rounded-full uppercase tracking-wider"
        >
          重新开始
        </motion.button>
      </motion.div>

      {/* 噪点特效 */}
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30"></div>
    </div>
  );
};

export default GameOver;
