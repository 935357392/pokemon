import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { allEquipments, getRandomEquipment } from '../data/equipments';
import { Equipment } from '../types';
import { ArrowRight, Disc } from 'lucide-react';

const ShopScreen: React.FC = () => {
  const setScene = useGameStore(state => state.setScene);
  const gold = useGameStore(state => state.gold);
  const setGold = useGameStore(state => state.setGold);
  const addEquipment = useGameStore(state => state.addEquipment);
  const addPokeBall = useGameStore(state => state.addPokeBall);
  const pokeBalls = useGameStore(state => state.pokeBalls);

  const [shopItems, setShopItems] = useState<(Equipment & { price: number; uniqueShopId: string })[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());

  const ballShop = [
    { id: 'pokeball', name: '精灵球', price: 5, color: 'text-red-500', desc: '基础捕获率的普通球' },
    { id: 'greatball', name: '超级球', price: 10, color: 'text-blue-500', desc: '1.5倍捕获率的高级球' },
    { id: 'ultraball', name: '高级球', price: 20, color: 'text-yellow-500', desc: '2倍捕获率的高级球' },
    { id: 'masterball', name: '大师球', price: 100, color: 'text-purple-500', desc: '100%必定捕获的神奇球' },
    { id: 'quickball', name: '先机球', price: 15, color: 'text-sky-400', desc: '第一回合使用有高捕获率' },
    { id: 'timerball', name: '计时球', price: 15, color: 'text-orange-400', desc: '回合数越多捕获率越高' },
    { id: 'duskball', name: '黑暗球', price: 15, color: 'text-green-500', desc: '在夜间或洞窟中捕获率高' },
  ];

  useEffect(() => {
    const currentLevel = useGameStore.getState().currentLevel;
    // 随机生成 3 件装备，并赋予价格
    const items = [];
    for(let i=0; i<3; i++) {
       const eq = getRandomEquipment(currentLevel);
       let basePrice = 5;
       if (eq.rarity === 'common') basePrice = Math.floor(Math.random() * 5) + 5; // 5-9
       if (eq.rarity === 'rare') basePrice = Math.floor(Math.random() * 10) + 15; // 15-24
       if (eq.rarity === 'epic') basePrice = Math.floor(Math.random() * 20) + 40; // 40-59
       if (eq.rarity === 'legendary') basePrice = Math.floor(Math.random() * 50) + 100; // 100-149
       if (eq.rarity === 'artifact') basePrice = 999;
       
       items.push({
         ...eq,
         uniqueShopId: `${eq.id}-${i}-${Date.now()}`,
         price: basePrice
       });
    }
    setShopItems(items);
  }, []);

  const handlePurchase = (item: Equipment & { price: number; uniqueShopId: string }) => {
    if (gold >= item.price && !purchasedIds.has(item.uniqueShopId)) {
      setGold(gold - item.price);
      addEquipment(item);
      setPurchasedIds(new Set(purchasedIds).add(item.uniqueShopId));
    }
  };

  const handleBuyBall = (id: string, price: number) => {
    if (gold >= price) {
      setGold(gold - price);
      addPokeBall(id, 1);
    }
  };

  const handleLeave = () => {
    useGameStore.getState().advanceNode('MapSelection');
  };

  return (
    <div className="flex flex-col w-full h-screen bg-black text-zinc-100 overflow-hidden relative">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-purple-900/40 to-black"></div>
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 pointer-events-none"></div>
      
      <header className="flex justify-between items-center p-6 bg-zinc-800 border-b-4 border-yellow-600 shadow-md relative z-10">
        <h1 className="text-3xl font-black tracking-widest text-yellow-500 flex items-center gap-2">
          🏪 友好商店
        </h1>
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold">
            你的金币: <span className="text-yellow-400 text-3xl ml-1">{gold}</span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLeave}
            className="flex items-center gap-2 px-6 py-2 bg-zinc-700 rounded-lg shadow border-2 border-zinc-500 font-bold hover:bg-zinc-600"
          >
            离开商店 <ArrowRight size={20} />
          </motion.button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <motion.h2 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-bold mb-12 text-zinc-100 drop-shadow-md bg-black/40 px-8 py-3 rounded-full border border-yellow-500/30"
        >
          "欢迎光临！看看有什么需要的吧。"
        </motion.h2>
        
        <div className="flex flex-col md:flex-row gap-12 w-full max-w-6xl">
          {/* 左侧：装备区 */}
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-4 text-zinc-400 border-b border-zinc-700 pb-2">精选装备</h3>
            <div className="flex gap-6 overflow-x-auto pb-4">
              {shopItems.map((item, idx) => {
                const isPurchased = purchasedIds.has(item.uniqueShopId);
                const canAfford = gold >= item.price;

                return (
                  <motion.div
                    key={item.uniqueShopId}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`shrink-0 relative flex flex-col items-center p-6 rounded-2xl border-4 w-64 ${
                      isPurchased 
                        ? 'bg-zinc-800 border-zinc-700 opacity-50 grayscale'
                        : item.rarity === 'artifact' ? 'bg-gradient-to-br from-red-900 to-red-800 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                        : item.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                        : item.rarity === 'epic' ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-500 shadow-lg'
                        : item.rarity === 'rare' ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-500 shadow-md'
                        : 'bg-gradient-to-br from-zinc-800 to-zinc-700 border-zinc-500 shadow-sm'
                    }`}
                  >
                    <div className="w-24 h-24 mb-4 bg-zinc-900/50 rounded-full flex items-center justify-center border-2 border-zinc-600 shadow-inner overflow-hidden">
                      <span className="text-5xl">🎁</span>
                    </div>
                    
                    <h3 className={`text-xl font-bold mb-1 tracking-tight ${
                      item.rarity === 'artifact' ? 'text-red-400' :
                      item.rarity === 'legendary' ? 'text-yellow-400' :
                      item.rarity === 'epic' ? 'text-purple-400' :
                      item.rarity === 'rare' ? 'text-blue-400' :
                      'text-zinc-200'
                    }`}>{item.name}</h3>
                    <span className={`text-xs font-bold mb-2 ${
                      item.rarity === 'artifact' ? 'text-red-400' :
                      item.rarity === 'legendary' ? 'text-yellow-400' :
                      item.rarity === 'epic' ? 'text-purple-400' :
                      item.rarity === 'rare' ? 'text-blue-400' :
                      'text-zinc-400'
                    }`}>
                      {item.rarity === 'artifact' ? '神器' :
                       item.rarity === 'legendary' ? '传说' :
                       item.rarity === 'epic' ? '史诗' :
                       item.rarity === 'rare' ? '稀有' :
                       '普通装备'}
                    </span>
                    
                    <div className="w-full mt-1 text-sm text-zinc-300 bg-black/40 p-3 rounded-lg border border-purple-500/50 h-20 flex items-center justify-center text-center">
                      {item.description}
                    </div>

                    <div className="mt-6 w-full">
                      {isPurchased ? (
                        <div className="w-full text-center py-2 font-bold text-zinc-500 bg-zinc-900 rounded-lg">
                          已售出 (SOLD)
                        </div>
                      ) : (
                        <motion.button
                          whileHover={canAfford ? { scale: 1.05 } : {}}
                          whileTap={canAfford ? { scale: 0.95 } : {}}
                          onClick={() => handlePurchase(item)}
                          disabled={!canAfford}
                          className={`w-full py-2 rounded-lg font-bold flex justify-center items-center gap-2 border-2 ${
                            canAfford 
                              ? 'bg-yellow-500 text-zinc-900 border-yellow-600 hover:bg-yellow-400' 
                              : 'bg-zinc-700 text-zinc-400 border-zinc-600 cursor-not-allowed'
                          }`}
                        >
                          <span>💰</span> {item.price} 金币
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 右侧：精灵球区 */}
          <div className="w-full md:w-96 flex flex-col">
            <h3 className="text-xl font-bold mb-4 text-zinc-400 border-b border-zinc-700 pb-2">捕获道具</h3>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
              {ballShop.map((ball) => {
                const canAfford = gold >= ball.price;
                return (
                  <div key={ball.id} className="bg-zinc-800/80 border-2 border-zinc-600 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-zinc-500 flex shrink-0 items-center justify-center bg-zinc-900">
                        <Disc size={20} className={ball.color} />
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {ball.name} 
                          <span className="text-xs text-zinc-500 font-normal">拥:{pokeBalls[ball.id] || 0}</span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 leading-tight">{ball.desc}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBuyBall(ball.id, ball.price)}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded font-bold border-2 ${
                        canAfford ? 'bg-yellow-500 text-yellow-950 border-yellow-600 hover:bg-yellow-400' : 'bg-zinc-700 text-zinc-500 border-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      {ball.price}G
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShopScreen;
