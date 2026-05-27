import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { allEquipments } from '../data/equipments';
import { Sparkles, HelpCircle, ArrowRight, Coins } from 'lucide-react';

const RandomEventScreen: React.FC = () => {
  const setScene = useGameStore(state => state.setScene);
  const addEquipment = useGameStore(state => state.addEquipment);
  const setGold = useGameStore(state => state.setGold);
  const gold = useGameStore(state => state.gold);
  const gainExp = useGameStore(state => state.gainExp);

  const [eventType, setEventType] = useState<'chest' | 'merchant' | 'trainer' | 'catch' | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    const rand = Math.random();
    if (rand < 0.25) {
      setEventType('chest');
      setEventData({ amount: Math.floor(Math.random() * 25) + 20 });
    } else if (rand < 0.5) {
      setEventType('merchant');
      const epicOrLegendary = allEquipments.filter(e => e.rarity === 'epic' || e.rarity === 'legendary');
      const eq = epicOrLegendary[Math.floor(Math.random() * epicOrLegendary.length)];
      setEventData({ eq, price: eq.rarity === 'legendary' ? 20 : 12 });
    } else if (rand < 0.75) {
      setEventType('trainer');
    } else {
      setEventType('catch');
      import('../api/pokeApi').then(({ getRandomPokemonsByRegion }) => {
        getRandomPokemonsByRegion(1, useGameStore.getState().currentLevel, useGameStore.getState().currentRegion).then(p => {
          setEventData({ pokemon: p[0], caught: false, escaped: false });
        });
      });
    }
  }, []);

  const handleClaimChest = () => {
    if (rewardClaimed) return;
    setGold(gold + eventData.amount);
    setRewardClaimed(true);
  };

  const handleBuy = () => {
    if (rewardClaimed || gold < eventData.price) return;
    setGold(gold - eventData.price);
    addEquipment(eventData.eq);
    setRewardClaimed(true);
  };

  const handleTrain = () => {
    if (rewardClaimed) return;
    gainExp(300); // 给予300点经验
    setRewardClaimed(true);
  };

  const handleLeave = () => {
    useGameStore.getState().advanceNode('MapSelection');
  };

  const [turnCount, setTurnCount] = useState(1);

  const handleThrowBall = (ballId: string) => {
    if (rewardClaimed || eventData.escaped || eventData.caught) return;
    
    const store = useGameStore.getState();
    if (!store.usePokeBall(ballId)) return;

    // 根据不同精灵球计算捕获倍率
    let multiplier = 1;
    switch (ballId) {
      case 'greatball': multiplier = 1.5; break;
      case 'ultraball': multiplier = 2; break;
      case 'masterball': multiplier = 999; break;
      case 'quickball': multiplier = turnCount === 1 ? 5 : 1; break;
      case 'timerball': multiplier = 1 + Math.min(turnCount * 0.3, 3); break; // 最大 4 倍
      case 'duskball': multiplier = 3; break; // 设定奇遇层默认符合洞窟/暗处环境
      default: multiplier = 1;
    }

    // 计算捕获率 (简化公式：基础 30% * multiplier)
    const charId = useGameStore.getState().playerCharacter.id;
    const unlockedSkills = useGameStore.getState().characterProgress[charId]?.unlockedSkills || [];

    const baseRate = 0.3;
    let finalRate = baseRate * multiplier;
    if (unlockedSkills.includes('catch_rate')) {
      finalRate += 0.2;
    }

    let success = false;
    if (ballId === 'masterball') {
      success = true;
    } else {
      success = Math.random() < finalRate;
    }

    if (success) {
      setEventData({ ...eventData, caught: true, catchMessage: '抓到了！' });
      setTimeout(() => {
        store.addPokemonToTeam(eventData.pokemon);
        store.progressQuest('catch');
        setRewardClaimed(true);
      }, 1500);
    } else {
      // 没抓到有概率逃跑
      const isEscaped = Math.random() < 0.4;
      if (isEscaped) {
        setEventData({ ...eventData, escaped: true, catchMessage: '哎呀！宝可梦逃跑了💨' });
      } else {
        setEventData({ ...eventData, catchMessage: '捕捉失败！宝可梦挣脱了！' });
        setTurnCount(prev => prev + 1); // 增加回合数
        
        // 3秒后清除提示
        setTimeout(() => {
          setEventData(prev => prev ? { ...prev, catchMessage: null } : null);
        }, 2000);
      }
    }
  };

  if (!eventType) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen w-full bg-zinc-900 text-zinc-100 overflow-hidden relative items-center justify-center"
    >
      {/* 极光与星空背景 */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-zinc-900 to-black pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
      
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative z-10 bg-zinc-800/95 border-4 border-indigo-500/50 p-12 rounded-3xl max-w-2xl w-full text-center shadow-[0_0_50px_rgba(99,102,241,0.2)]"
      >
        <div className="flex justify-center mb-6">
          <HelpCircle className="w-24 h-24 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)] animate-pulse" />
        </div>
        
        <h2 className="text-4xl font-black mb-12 text-white tracking-widest drop-shadow-sm">未知奇遇</h2>

        {!rewardClaimed ? (
          <div className="min-h-[200px] flex flex-col justify-center items-center">
            {eventType === 'chest' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                <p className="text-xl text-zinc-300 mb-8 font-bold">你在探索时发现了一个被遗弃的金币箱！</p>
                <button 
                  onClick={handleClaimChest}
                  className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-black rounded-xl text-2xl transition-all shadow-[0_6px_0_#ca8a04] active:shadow-none active:translate-y-[6px] flex items-center gap-2"
                >
                  <Coins size={28} /> 打开宝箱 (+{eventData.amount} 金币)
                </button>
              </motion.div>
            )}

            {eventType === 'merchant' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                <p className="text-xl text-zinc-300 mb-6 font-bold">一位神秘的行商向你展示了一件珍贵的装备：</p>
                
                <div className="bg-zinc-900 border-2 border-indigo-500/30 p-6 rounded-xl mb-8 flex flex-col items-center shadow-inner">
                  <span className="text-4xl mb-3">🎁</span>
                  <span className={`text-2xl font-black mb-2 ${eventData.eq.rarity === 'legendary' ? 'text-yellow-400' : 'text-purple-400'}`}>
                    {eventData.eq.name}
                  </span>
                  <span className="text-zinc-400">{eventData.eq.description}</span>
                </div>

                <div className="flex gap-4 items-center">
                  <button 
                    onClick={handleBuy}
                    disabled={gold < eventData.price}
                    className={`px-8 py-4 font-black rounded-xl text-xl transition-all flex items-center gap-2 ${
                      gold >= eventData.price 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_6px_0_#4338ca] active:shadow-none active:translate-y-[6px]' 
                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed border-2 border-zinc-600'
                    }`}
                  >
                    购买 (-{eventData.price} 金币)
                  </button>
                  {gold < eventData.price && (
                    <span className="text-red-400 font-bold ml-2">金币不足 (拥有: {gold})</span>
                  )}
                </div>
              </motion.div>
            )}

            {eventType === 'trainer' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                <p className="text-xl text-zinc-300 mb-8 font-bold">你遇到了一位隐居的宝可梦大师，他愿意指导你的队伍！</p>
                <button 
                  onClick={handleTrain}
                  className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl text-2xl transition-all shadow-[0_6px_0_#16a34a] active:shadow-none active:translate-y-[6px] flex items-center gap-2"
                >
                  <Sparkles size={28} /> 接受特训 (全体+300经验)
                </button>
              </motion.div>
            )}

            {eventType === 'catch' && eventData?.pokemon && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center w-full">
                <p className="text-xl text-zinc-300 mb-4 font-bold">草丛中突然窜出了一只野生的宝可梦！</p>
                
                <div className="bg-zinc-900 border-4 border-zinc-700 p-6 rounded-full w-48 h-48 flex items-center justify-center relative overflow-hidden shadow-inner mb-2">
                  {eventData.caught ? (
                    <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-6xl">✨</motion.div>
                  ) : eventData.escaped ? (
                    <motion.div initial={{ x: 0 }} animate={{ x: 200, opacity: 0 }} className="text-4xl text-zinc-500 font-bold">逃跑了💨</motion.div>
                  ) : (
                    <>
                      <motion.img 
                        initial={{ scale: 1 }}
                        animate={{ scale: eventData.catchMessage === '捕捉失败！宝可梦挣脱了！' ? [1, 1.2, 0.9, 1.1, 1] : 1 }}
                        transition={{ duration: 0.5 }}
                        src={eventData.pokemon.spriteUrl} 
                        alt={eventData.pokemon.name} 
                        className="w-32 h-32 object-contain z-10" 
                        style={{ imageRendering: 'pixelated' }} 
                      />
                      <div className={`absolute inset-0 opacity-20 type-${eventData.pokemon.types[0]}`}></div>
                    </>
                  )}
                </div>

                {/* 捕捉提示文字 */}
                <div className="h-8 mb-4 flex items-center justify-center">
                  {eventData.catchMessage && (
                    <motion.span 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`font-bold text-lg ${
                        eventData.catchMessage.includes('抓到了') ? 'text-green-400' :
                        eventData.catchMessage.includes('逃跑') ? 'text-red-400' :
                        'text-yellow-400'
                      }`}
                    >
                      {eventData.catchMessage}
                    </motion.span>
                  )}
                </div>
                
                {!eventData.caught && !eventData.escaped && (
                  <h3 className="text-2xl font-black text-white mb-6 tracking-wider">野生 {eventData.pokemon.name} <span className="text-yellow-400 text-sm">Lv.{eventData.pokemon.level}</span></h3>
                )}

                {!eventData.caught && !eventData.escaped && (
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {[
                      { id: 'pokeball', name: '精灵球', color: 'bg-red-600 hover:bg-red-500 shadow-[0_4px_0_#991b1b]' },
                      { id: 'greatball', name: '超级球', color: 'bg-blue-600 hover:bg-blue-500 shadow-[0_4px_0_#1e40af]' },
                      { id: 'ultraball', name: '高级球', color: 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950 shadow-[0_4px_0_#a16207]' },
                      { id: 'masterball', name: '大师球', color: 'bg-purple-600 hover:bg-purple-500 shadow-[0_4px_0_#6b21a8]' },
                      { id: 'quickball', name: '先机球', color: 'bg-sky-500 hover:bg-sky-400 shadow-[0_4px_0_#0284c7]' },
                      { id: 'timerball', name: '计时球', color: 'bg-orange-500 hover:bg-orange-400 shadow-[0_4px_0_#c2410c]' },
                      { id: 'duskball', name: '黑暗球', color: 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_4px_0_#047857]' },
                    ].map(ball => {
                      const count = useGameStore.getState().pokeBalls[ball.id] || 0;
                      if (count <= 0) return null; // 只显示拥有的球
                      return (
                        <button
                          key={ball.id}
                          onClick={() => handleThrowBall(ball.id)}
                          disabled={count <= 0}
                          className={`px-6 py-3 font-bold rounded-xl text-lg transition-all active:translate-y-[4px] active:shadow-none flex flex-col items-center ${
                            count > 0 ? `${ball.color} text-white` : 'bg-zinc-800 text-zinc-500 border-2 border-zinc-700 shadow-none cursor-not-allowed'
                          }`}
                        >
                          <span>{ball.name}</span>
                          <span className="text-xs opacity-80 mt-1">剩余: {count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!eventData.caught && !eventData.escaped && (
                  <button 
                    onClick={handleLeave}
                    className="mt-8 text-zinc-400 hover:text-zinc-200 font-bold underline underline-offset-4 transition-colors"
                  >
                    逃跑并离开
                  </button>
                )}
                
                {eventData.caught && <p className="text-2xl font-black text-green-400 mt-4">抓到了！{eventData.pokemon.name} 加入了队伍！</p>}
                {eventData.escaped && (
                  <div className="mt-4 flex flex-col items-center">
                    <p className="text-2xl font-black text-red-400 mb-4">哎呀！野生的 {eventData.pokemon.name} 逃跑了...</p>
                    <button 
                      onClick={handleLeave}
                      className="px-8 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-xl transition-all"
                    >
                      只能继续前进了
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="min-h-[200px] flex flex-col justify-center items-center"
          >
            <h3 className="text-3xl font-black text-green-400 mb-8 flex items-center gap-2 drop-shadow-md">
              <Sparkles className="animate-spin-slow" /> 事件完成！
            </h3>
            <button 
              onClick={handleLeave}
              className="px-10 py-4 bg-zinc-700 hover:bg-zinc-600 text-white font-black rounded-xl text-xl transition-all shadow-[0_6px_0_#3f3f46] active:shadow-none active:translate-y-[6px] flex items-center gap-2"
            >
              继续前进 <ArrowRight />
            </button>
          </motion.div>
        )}

        {!rewardClaimed && eventType !== 'catch' && (
          <button 
            onClick={handleLeave}
            className="mt-12 text-zinc-500 hover:text-zinc-300 font-bold underline underline-offset-4 transition-colors"
          >
            无视并离开
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RandomEventScreen;
