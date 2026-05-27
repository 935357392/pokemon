import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { Quest } from '../types';
import { ArrowRight, ScrollText, Sparkles } from 'lucide-react';
import { getRandomLegendaryQuest } from '../data/legendaryQuests';

const QuestScreen: React.FC = () => {
  const setScene = useGameStore(state => state.setScene);
  const setNpcAvailable = useGameStore(state => state.setNpcAvailable);
  const setActiveQuest = useGameStore(state => state.setActiveQuest);
  const currentLevel = useGameStore(state => state.currentLevel);
  const currentRegion = useGameStore(state => state.currentRegion);
  const activeQuest = useGameStore(state => state.activeQuest);

  const regionName: Record<string, string> = {
    kanto: '关都',
    johto: '城都',
    hoenn: '丰缘',
    sinnoh: '神奥'
  };

  const offers = useMemo(() => {
    const baseGold = 35 + Math.floor(currentLevel * 4);
    const winQuest: Quest = {
      id: `q_win_${currentLevel}`,
      title: '讨伐委托',
      description: `在 ${regionName[currentRegion] || currentRegion} 连胜 3 场对战。`,
      kind: 'win',
      target: 3,
      progress: 0,
      reward: { gold: baseGold }
    };
    const catchQuest: Quest = {
      id: `q_catch_${currentLevel}`,
      title: '捕获委托',
      description: '在抓宠奇遇中成功捕获 1 只野生宝可梦。',
      kind: 'catch',
      target: 1,
      progress: 0,
      reward: { balls: { greatball: 2, pokeball: 3 } }
    };
    
    const legQuest = { ...getRandomLegendaryQuest() };
    legQuest.id = `${legQuest.id}_${currentLevel}`; // Ensure unique ID per generation

    const hardQuestMaterials = ['megaStone', 'dynamaxBand', 'teraOrb'] as const;
    const randomMaterial = hardQuestMaterials[Math.floor(Math.random() * hardQuestMaterials.length)];
    const materialNameMap = {
      megaStone: 'Mega石',
      dynamaxBand: '极巨腕带',
      teraOrb: '太晶珠'
    };

    const hardQuest: Quest = {
      id: `q_hard_${currentLevel}`,
      title: '高难挑战',
      description: `在 ${regionName[currentRegion] || currentRegion} 连胜 10 场对战。`,
      kind: 'win',
      target: 10,
      progress: 0,
      reward: { 
        gold: baseGold * 2,
        materials: {
          [randomMaterial]: 1
        }
      }
    };

    return [winQuest, catchQuest, hardQuest, legQuest];
  }, [currentLevel, currentRegion]);

  const handleLeave = () => {
    setNpcAvailable(false);
    setScene('MapSelection');
  };

  const handleAccept = (quest: Quest) => {
    setActiveQuest(quest);
    setNpcAvailable(false);
    setScene('MapSelection');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen w-full bg-zinc-900 text-zinc-100 overflow-hidden relative items-center justify-center"
    >
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-zinc-900 to-black pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative z-10 bg-zinc-800/95 border-4 border-indigo-500/50 p-10 rounded-3xl max-w-3xl w-full text-center shadow-[0_0_50px_rgba(99,102,241,0.2)]"
      >
        <div className="flex justify-center mb-6">
          <ScrollText className="w-20 h-20 text-indigo-300 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
        </div>
        <h2 className="text-4xl font-black mb-6 text-white tracking-widest drop-shadow-sm">支线委托</h2>

        {activeQuest ? (
          <div className="bg-zinc-900/60 border-2 border-zinc-700 rounded-2xl p-6 relative overflow-hidden shadow-inner">
            {activeQuest.progress >= activeQuest.target && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-0 right-0 bg-green-500 px-6 py-2 rounded-bl-2xl text-white font-black shadow-lg flex items-center gap-2 z-10"
              >
                <Sparkles size={16} className="animate-spin-slow" /> 任务已完成！
              </motion.div>
            )}
            <div className={`text-3xl font-black mb-4 drop-shadow-sm ${activeQuest.isLegendary ? 'text-pink-400' : 'text-indigo-300'}`}>
              {activeQuest.title}
            </div>
            <div className="text-zinc-300 font-bold mb-8 text-lg">{activeQuest.description}</div>
            
            <div className="w-full bg-zinc-800 rounded-full h-8 mb-4 border-2 border-zinc-600 overflow-hidden relative shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (activeQuest.progress / activeQuest.target) * 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full ${activeQuest.progress >= activeQuest.target ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
              />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-white drop-shadow-md">
                {activeQuest.progress} / {activeQuest.target} {activeQuest.kind === 'win' ? '场对战' : '只宝可梦'}
              </div>
            </div>

            {activeQuest.progress >= activeQuest.target ? (
              <div className="text-green-400 font-black text-lg animate-pulse text-center mt-6 bg-green-900/30 py-3 rounded-xl border border-green-500/50">
                🎉 请返回地图界面，奖励将在本场结束后自动发放！
              </div>
            ) : (
              <div className="text-zinc-400 font-bold text-center mt-6 bg-zinc-800/50 py-3 rounded-xl border border-zinc-700">
                加油，还差 {activeQuest.target - activeQuest.progress} 个目标即可完成委托！
              </div>
            )}

            <button 
              onClick={handleLeave}
              className="w-full mt-4 bg-zinc-700 hover:bg-zinc-600 text-white font-black text-xl py-4 rounded-xl shadow-[0_6px_0_#3f3f46] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
            >
              返回路线 <ArrowRight />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {offers.map((q) => (
              <motion.button
                key={q.id}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAccept(q)}
                className={`text-left border-2 rounded-2xl p-6 transition-all shadow-inner relative overflow-hidden ${
                  q.isLegendary 
                    ? 'bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border-purple-500 hover:border-pink-400 hover:shadow-[0_0_20px_rgba(216,180,254,0.3)]' 
                    : 'bg-zinc-900/60 border-zinc-700 hover:border-indigo-400'
                }`}
              >
                {q.isLegendary && (
                  <div className="absolute top-0 right-0 bg-gradient-to-bl from-pink-500 to-purple-600 px-4 py-1 rounded-bl-xl text-xs font-black text-white shadow-md flex items-center gap-1">
                    <Sparkles size={12} /> 特殊任务
                  </div>
                )}
                <div className={`text-2xl font-black mb-2 ${q.isLegendary ? 'text-pink-300' : 'text-indigo-200'}`}>
                  {q.title}
                </div>
                <div className="text-zinc-300 font-bold mb-4">{q.description}</div>
                <div className="text-sm text-zinc-400 font-bold">目标：{q.target} {q.kind === 'win' ? '场对战' : '只宝可梦'}</div>
                {!q.isLegendary && (
                  <div className="text-sm text-zinc-400 font-bold mt-2">
                    奖励：
                    {q.reward.gold ? ` 💰${q.reward.gold}` : ''}
                    {q.reward.balls ? ` 🎾${Object.keys(q.reward.balls).map(k => `${k}x${q.reward.balls?.[k]}`).join(' ')}` : ''}
                    {q.reward.materials && Object.keys(q.reward.materials).map(k => {
                      const v = q.reward.materials![k as keyof typeof q.reward.materials];
                      const name = k === 'megaStone' ? 'Mega石' : k === 'dynamaxBand' ? '极巨腕带' : k === 'teraOrb' ? '太晶珠' : k;
                      return ` 💎${name}x${v}`;
                    })}
                  </div>
                )}
                {q.isLegendary && (
                  <div className="text-sm text-yellow-300 font-black mt-2 flex items-center gap-1">
                    🎁 解锁专属剧情：{q.storyTitle}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {!activeQuest && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={handleLeave}
              className="px-10 py-4 bg-zinc-700 hover:bg-zinc-600 text-white font-black rounded-xl text-xl transition-all shadow-[0_6px_0_#3f3f46] active:shadow-none active:translate-y-[6px] flex items-center gap-2"
            >
              返回 <ArrowRight />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default QuestScreen;

