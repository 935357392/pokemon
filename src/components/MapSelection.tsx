import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { getRandomPokemonsByRegion } from '../api/pokeApi';
import { Shield, Settings, CloudRain, Sun, CloudLightning, CloudSnow, Wind, Users, Save, Download, Trash2, Swords, Skull, HelpCircle, ShoppingCart, Coffee, ChevronRight, Star, Zap, Package } from 'lucide-react';
import { getRandomCharacter } from '../data/characters';
import { SaveSlot } from '../types';
import { getAllSaves, deleteFromDB } from '../db';

const MapSelection: React.FC = () => {
  const {
    setScene,
    startBattle,
    currentLevel,
    gold,
    currentRegion,
    unlockedRegions,
    currentWeather,
    npcAvailable,
    activeQuest,
    readyLegendaryQuest,
    setRegion,
    playerCharacter,
    playerTeam,
    incubator,
    gameMap,
    setActiveNode,
    healTeam,
    restoreTeamPP,
    advanceNode,
    saveGame,
    loadGame
  } = useGameStore(
    useShallow((state) => ({
      setScene: state.setScene,
      startBattle: state.startBattle,
      currentLevel: state.currentLevel,
      gold: state.gold,
      currentRegion: state.currentRegion,
      unlockedRegions: state.unlockedRegions,
      currentWeather: state.currentWeather,
      npcAvailable: state.npcAvailable,
      activeQuest: state.activeQuest,
      readyLegendaryQuest: state.readyLegendaryQuest,
      setRegion: state.setRegion,
      playerCharacter: state.playerCharacter,
      playerTeam: state.playerTeam,
      incubator: state.incubator,
      gameMap: state.gameMap,
      setActiveNode: state.setActiveNode,
      healTeam: state.healTeam,
      restoreTeamPP: state.restoreTeamPP,
      advanceNode: state.advanceNode,
      saveGame: state.saveGame,
      loadGame: state.loadGame
    }))
  );
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapContainerRef.current && gameMap) {
      const currentLayer = (currentLevel - 1) % 10;
      // Scroll to current layer (layer width is 260px, center it in the view)
      const targetScroll = Math.max(0, currentLayer * 260 - window.innerWidth / 2 + 100);
      mapContainerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  }, [currentLevel, gameMap]);

  const openSaveModal = async () => {
    const allSaves = await getAllSaves();
    setSaves(allSaves);
    setShowSaveModal(true);
  };

  const handleSave = async (id: string) => {
    await saveGame(id, `手动存档 - ${new Date().toLocaleString()}`);
    const allSaves = await getAllSaves();
    setSaves(allSaves);
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

  const handleStartBattle = async (isElite: boolean = false, routeId: string = '') => {
    if (loading) return;
    setLoading(true);
    try {
      const isBoss = currentLevel > 0 && currentLevel % 10 === 0;
      const currentRoute = gameMap?.nodes.find(r => r.id === routeId);

      let enemyTeam;
      let enemyChar;

      if (isBoss) {
        const enemyCount = 3;
        const enemyLevel = Math.max(1, currentLevel + Math.floor(Math.random() * 3) - 1);
        enemyTeam = await getRandomPokemonsByRegion(enemyCount, enemyLevel, currentRegion);
        
        if (enemyTeam.length > 0) {
          const boss = enemyTeam[enemyTeam.length - 1];
          boss.level += 2;
          const forms = ['mega', 'dynamax', 'tera'] as const;
          const form = forms[Math.floor(Math.random() * forms.length)];
          boss.extraForm = form;
          
          if (form === 'mega') {
            boss.attack = Math.floor(boss.attack * 1.3);
            boss.defense = Math.floor(boss.defense * 1.3);
            boss.speed = Math.floor(boss.speed * 1.3);
            boss.maxHp = Math.floor(boss.maxHp * 1.2);
            boss.currentHp = boss.maxHp;
          } else if (form === 'dynamax') {
            boss.maxHp = boss.maxHp * 2;
            boss.currentHp = boss.currentHp * 2;
            boss.attack = Math.floor(boss.attack * 1.1);
          } else if (form === 'tera') {
            boss.attack = Math.floor(boss.attack * 1.4);
            boss.defense = Math.floor(boss.defense * 1.1);
            boss.teraType = boss.types[0];
          }
        }
        enemyChar = getRandomCharacter(playerCharacter.id);
      } else {
        // Use pre-generated team if available, otherwise generate fallback
        if (currentRoute?.enemyTeam) {
          enemyTeam = currentRoute.enemyTeam;
          enemyChar = currentRoute.enemyCharacter;
        } else {
          const enemyCount = Math.min(3, Math.ceil(currentLevel / 3));
          const levelBonus = isElite ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 3) - 1;
          const enemyLevel = Math.max(1, currentLevel + levelBonus);
          enemyTeam = await getRandomPokemonsByRegion(enemyCount, enemyLevel, currentRegion);
          enemyChar = getRandomCharacter(playerCharacter.id);
        }
      }

      startBattle(enemyTeam, enemyChar);
    } catch (e) {
      console.error(e);
      setLoading(false); // Only set to false on error, startBattle changes scene so no need to reset if successful
    }
  };

  const regionName: Record<string, string> = {
    kanto: '关都',
    johto: '城都',
    hoenn: '丰缘',
    sinnoh: '神奥',
    unova: '合众',
    kalos: '卡洛斯',
    alola: '阿罗拉',
    galar: '伽勒尔',
    paldea: '帕底亚'
  };

  const weatherInfo: Record<string, { name: string; icon: any; desc: string }> = {
    clear: { name: '晴朗', icon: Sun, desc: '无额外加成' },
    rain: { name: '下雨', icon: CloudRain, desc: '水系更强，火系更弱' },
    sun: { name: '晴天', icon: Sun, desc: '火系更强，水系更弱' },
    thunder: { name: '雷暴', icon: CloudLightning, desc: '电系更强' },
    sandstorm: { name: '沙暴', icon: Wind, desc: '地面/岩石/钢更强' },
    hail: { name: '冰雹', icon: CloudSnow, desc: '冰系更强' }
  };

  const WeatherIcon = weatherInfo[currentWeather]?.icon || Sun;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen w-full text-zinc-100 overflow-hidden relative"
    >
      {/* 沉浸式暗黑背景 - 调亮版 */}
      <div
        className="absolute inset-0 z-0 bg-[url('/dynamax-battle.png')] bg-cover bg-center opacity-70"
        style={{ filter: 'saturate(1.15) contrast(1.05)', transform: 'scale(1.02)' }}
      />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-zinc-950/30 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-overlay" />
      
      {/* 左侧大尺寸宝可梦立绘作为背景装饰 */}
      {playerTeam.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 0.1, x: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute -left-24 -bottom-16 pointer-events-none z-0"
        >
          <img 
            src={playerTeam[0].spriteUrl} 
            alt={playerTeam[0].name} 
            className="w-[640px] h-[640px] object-contain opacity-40"
            style={{ imageRendering: 'pixelated' }}
          />
        </motion.div>
      )}
      
      <header className="flex justify-between items-center p-6 bg-black/40  border-b border-white/10 shadow-lg relative z-10">
        <h1 className="text-3xl font-black tracking-widest text-white drop-shadow-md">
          第 <span className="text-indigo-400 text-4xl mx-1">{currentLevel}</span> 层
        </h1>
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold text-zinc-300">
            金币: <span className="text-yellow-400 text-3xl ml-1">{gold}</span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openSaveModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-lg shadow-sm border border-indigo-400/50 font-bold transition-colors "
          >
            <Save size={20} /> 存档/读档
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setScene('Storage')}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-lg shadow-sm border border-zinc-600/50 font-bold transition-colors"
          >
            <Package size={20} /> 仓库
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setScene('PermanentShop')}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600/80 hover:bg-yellow-500 text-white rounded-lg shadow-sm border border-yellow-400/50 font-bold transition-colors"
          >
            <ShoppingCart size={20} /> 永久商店
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setScene('TeamManagement')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-500 text-white rounded-lg shadow-sm border border-blue-400/50 font-bold transition-colors "
          >
            <Settings size={20} /> 队伍管理
          </motion.button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center relative z-10 p-8">
        {incubator && incubator.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-8 right-8 bg-zinc-900/80 border-2 border-zinc-600 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col gap-3 z-20 "
          >
            <h3 className="text-white font-black text-sm flex items-center gap-2 drop-shadow-md">
              <span className="text-xl">🥚</span> 孵蛋箱
            </h3>
            <div className="flex gap-3">
              {incubator.map(egg => (
                <div key={egg.id} className="flex flex-col items-center bg-zinc-800 p-2 rounded-xl border border-zinc-700 w-16 shadow-inner relative group">
                  <div className="absolute inset-0 bg-yellow-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="text-2xl animate-pulse drop-shadow-lg">🥚</span>
                  <div className="w-8 h-3 bg-zinc-900 rounded-sm mt-2 border border-zinc-600 shadow-inner"></div>
                  <span className="text-[10px] font-bold text-yellow-400 mt-1">{egg.stepsRemaining} 战后</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        <div className="w-full max-w-5xl">
          <div className="flex flex-col gap-8 mb-12">
            <h2 className="text-3xl font-black text-center text-white tracking-widest drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">选择前进的路线</h2>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-3 bg-zinc-900/80  text-white px-5 py-2.5 rounded-full border border-zinc-700/50 shadow-lg">
                <span className="font-black text-zinc-400">地区</span>
                <div className="flex gap-2">
                  {unlockedRegions.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRegion(r)}
                      className={`px-4 py-1 rounded-full font-bold text-sm transition-all ${
                        currentRegion === r ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                      }`}
                    >
                      {regionName[r] || r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/80  text-white px-5 py-2.5 rounded-full border border-zinc-700/50 shadow-lg">
                <WeatherIcon size={20} className="text-sky-400 drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]" />
                <span className="font-black">{weatherInfo[currentWeather]?.name || currentWeather}</span>
                <span className="text-sm text-zinc-400 font-bold">{weatherInfo[currentWeather]?.desc || ''}</span>
              </div>
              {activeQuest && (
                <div className="flex items-center gap-3 bg-indigo-900/80  text-white px-5 py-2.5 rounded-full border border-indigo-500/50 relative group cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:bg-indigo-800 transition-colors" onClick={() => setScene('QuestScreen')}>
                  <Users size={20} className={activeQuest.progress >= activeQuest.target ? "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]" : "text-indigo-400"} />
                  <span className="font-black text-indigo-200">支线</span>
                  <span className={`text-sm font-bold ${activeQuest.progress >= activeQuest.target ? 'text-green-300' : 'text-indigo-100'}`}>
                    {activeQuest.title}
                  </span>
                  
                  {/* 小型进度条 */}
                  <div className="w-20 h-3 bg-black/50 rounded-full overflow-hidden border border-white/10 ml-2 relative shadow-inner">
                    <div 
                      className={`h-full ${activeQuest.progress >= activeQuest.target ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(100, (activeQuest.progress / activeQuest.target) * 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-md leading-none">
                      {activeQuest.progress}/{activeQuest.target}
                    </div>
                  </div>

                  {activeQuest.progress >= activeQuest.target && (
                    <>
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></span>
                    </>
                  )}

                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none z-50 border border-white/10">
                    点击查看任务详情
                  </div>
                </div>
              )}
            </div>
          </div>
          {readyLegendaryQuest ? (
            <div className="flex justify-center w-full mt-10">
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setScene('LegendaryEvent')}
                className="flex flex-col items-start justify-between p-8 border border-pink-500/50 rounded-xl transition-all group relative overflow-hidden h-64 bg-zinc-900/90 hover:bg-zinc-800/95 shadow-[0_0_30px_rgba(219,39,119,0.2)]  max-w-lg w-full"
              >
                <div className="absolute left-0 top-0 bottom-0 w-2 transition-all group-hover:w-3 bg-pink-500 shadow-[0_0_15px_rgba(219,39,119,0.8)]" />
                <div className="absolute -right-8 -top-8 w-64 h-64 opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all  rounded-full bg-pink-600" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none mix-blend-overlay"></div>

                <div className="flex items-center gap-4 w-full border-b border-pink-900/50 pb-4 relative z-10">
                  <div className="p-3 rounded-lg border border-pink-500/30 bg-pink-500/20 text-pink-400 shadow-[0_0_20px_rgba(219,39,119,0.4)] group-hover:bg-pink-500/30 transition-colors">
                    <Star size={32} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] font-black tracking-[0.2em] text-pink-500/70 uppercase mb-1">
                      LEGENDARY ENCOUNTER
                    </span>
                    <h2 className="text-3xl font-black tracking-wider text-pink-300 drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]">
                      ✨ 特殊层：{readyLegendaryQuest.storyTitle}
                    </h2>
                  </div>
                </div>

                <div className="mt-4 text-left relative z-10 flex-1">
                  <p className="font-bold text-base text-pink-100/80 leading-relaxed">
                    前置任务已达成，传说中的宝可梦正在等待你的挑战！
                  </p>
                </div>

                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                  <ChevronRight size={28} className="text-pink-400" />
                </div>
              </motion.button>
            </div>
          ) : (
            <div ref={mapContainerRef} className="w-full overflow-x-auto pb-12 custom-scrollbar">
              <div className="relative mx-auto" style={{ width: 10 * 260 + 200, height: 460 }}>
              {/* Edges */}
              <svg className="absolute inset-0 pointer-events-none z-0" width={10 * 260 + 200} height={460}>
                {gameMap?.edges.map(edge => {
                  const src = gameMap.nodes.find(n => n.id === edge.source);
                  const tgt = gameMap.nodes.find(n => n.id === edge.target);
                  if (!src || !tgt) return null;
                  const x1 = src.layer * 260 + 200;
                  const y1 = src.row * 150 + 60;
                  const x2 = tgt.layer * 260;
                  const y2 = tgt.row * 150 + 60;
                  
                  const isSrcActive = src.status === 'completed' || src.status === 'current';
                  const isTgtActive = tgt.status === 'completed' || tgt.status === 'current' || tgt.status === 'available';
                  const isPathActive = isSrcActive && isTgtActive;
                  
                  return (
                    <path 
                      key={`${edge.source}-${edge.target}`} 
                      d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`} 
                      stroke={isPathActive ? 'rgba(129,140,248,0.8)' : 'rgba(255,255,255,0.1)'} 
                      strokeWidth={isPathActive ? "4" : "2"} 
                      fill="none" 
                      className={`transition-all duration-500 ${isPathActive ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : ''}`}
                    />
                  );
                })}
              </svg>

              {/* Nodes */}
              {gameMap?.nodes.map((route, idx) => {
                const isLocked = route.status === 'locked';
                const isCompleted = route.status === 'completed';
                const isCurrent = route.status === 'current';
                
                return (
                  <motion.button
                    key={route.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
                    whileHover={!isLocked && !isCompleted ? { scale: 1.05, y: -2 } : {}}
                    whileTap={!isLocked && !isCompleted ? { scale: 0.95 } : {}}
                    onClick={() => {
                      if (isLocked || isCompleted) return;
                      setActiveNode(route.id);
                      if (route.type === 'battle') handleStartBattle(false, route.id);
                      else if (route.type === 'elite') handleStartBattle(true, route.id);
                      else if (route.type === 'event') setScene('RandomEvent');
                      else if (route.type === 'shop') setScene('ShopScreen');
                      else if (route.type === 'rest') {
                        healTeam();
                        restoreTeamPP();
                        advanceNode('MapSelection');
                      }
                    }}
                    disabled={isLocked || isCompleted}
                    className={`absolute flex items-center justify-between p-4 border rounded-xl transition-all group overflow-hidden w-[200px] h-[100px] ${
                      isCompleted ? 'bg-zinc-900/40 border-zinc-800/50 opacity-50 grayscale' :
                      isCurrent ? 'bg-indigo-900/80 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]' :
                      isLocked ? 'bg-zinc-950/80 border-zinc-800 opacity-40 cursor-not-allowed' :
                      'bg-zinc-900/90 border-zinc-700/50 hover:bg-zinc-800/95 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:border-zinc-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-pointer'
                    } `}
                    style={{ left: route.layer * 260, top: route.row * 150 + 10 }}
                  >
                    {/* Left Accent Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all ${
                      route.type === 'battle' ? 'bg-red-600' :
                      route.type === 'elite' ? 'bg-rose-500' :
                      route.type === 'event' ? 'bg-indigo-500' :
                      route.type === 'shop' ? 'bg-yellow-500' :
                      'bg-emerald-500'
                    } ${!isLocked && !isCompleted ? 'group-hover:w-2' : ''}`} />

                    <div className="flex flex-col items-start w-full h-full pl-2">
                      <div className="flex items-center gap-2 mb-1 w-full">
                        <div className={`p-1.5 rounded-lg border transition-colors ${
                          route.type === 'battle' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                          route.type === 'elite' ? 'bg-rose-600/10 border-rose-500/30 text-rose-500' :
                          route.type === 'event' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                          route.type === 'shop' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {route.type === 'battle' && <Swords size={16} strokeWidth={2.5} />}
                          {route.type === 'elite' && <Skull size={16} strokeWidth={2.5} />}
                          {route.type === 'event' && <HelpCircle size={16} strokeWidth={2.5} />}
                          {route.type === 'shop' && <ShoppingCart size={16} strokeWidth={2.5} />}
                          {route.type === 'rest' && <Coffee size={16} strokeWidth={2.5} />}
                        </div>
                        <div className="flex flex-col items-start text-left">
                          <span className={`text-[8px] font-black tracking-widest uppercase leading-none ${
                            route.type === 'battle' ? 'text-red-500/70' :
                            route.type === 'elite' ? 'text-rose-500/70' :
                            route.type === 'event' ? 'text-indigo-500/70' :
                            route.type === 'shop' ? 'text-yellow-500/70' :
                            'text-emerald-500/70'
                          }`}>
                            {route.type === 'battle' ? 'COMBAT' :
                             route.type === 'elite' ? 'ELITE' :
                             route.type === 'event' ? 'UNKNOWN' :
                             route.type === 'shop' ? 'MERCHANT' :
                             'SAFE ZONE'}
                          </span>
                          <h2 className={`text-sm font-black tracking-wider leading-none mt-1 ${
                            route.type === 'elite' ? 'text-rose-400' : 
                            route.type === 'shop' ? 'text-yellow-400' :
                            route.type === 'rest' ? 'text-emerald-400' :
                            route.type === 'event' ? 'text-indigo-300' :
                            'text-zinc-100'
                          }`}>
                            {loading && (route.type === 'battle' || route.type === 'elite') && !isLocked && !isCompleted ? '加载中...' : route.title}
                          </h2>
                        </div>
                      </div>

                      {/* Bottom: Enemy Types Preview for Battles */}
                      <div className="mt-auto flex gap-1 flex-wrap w-full">
                        {route.status === 'available' && route.type === 'battle' && route.knownTypes && route.knownTypes.length > 0 ? (
                          route.knownTypes.slice(0, 3).map(type => (
                            <span key={type} className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold type-${type}`}>
                              {type}
                            </span>
                          ))
                        ) : (route.status === 'locked' || (route.status === 'available' && route.type === 'elite')) ? (
                          <span className="text-[10px] text-zinc-600 font-bold">未知情报</span>
                        ) : null}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
          )}
        </div>
      </main>

      <div className="absolute bottom-8 left-8 z-20 flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-zinc-900/80 border-4 border-white/70 shadow-xl flex items-center justify-center overflow-hidden">
          <img src={playerCharacter.spriteUrl} alt={playerCharacter.name} className="w-12 h-12 object-contain" style={{ imageRendering: 'pixelated' }} />
        </div>
        <div className="text-sm font-black text-white drop-shadow-md">{playerCharacter.name}</div>
      </div>

      {npcAvailable && !activeQuest && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setScene('QuestScreen')}
          className="absolute bottom-8 right-8 z-20 flex flex-col items-center gap-2"
        >
          <div className="w-16 h-16 rounded-full bg-indigo-900/90 border-4 border-white/70 shadow-[0_0_20px_rgba(99,102,241,0.6)] flex items-center justify-center text-3xl relative">
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-indigo-900 z-10 animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-indigo-900 z-10"></span>
            🧑‍💼
          </div>
          <div className="text-sm font-black text-white drop-shadow-md">新委托可用！</div>
        </motion.button>
      )}

      {showSaveModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 ">
          <div className="bg-zinc-900 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 w-[500px] border border-zinc-700 flex flex-col gap-6">
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <Save className="text-indigo-400 w-8 h-8" /> 游戏存档
              </h2>
              <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {['auto', 'slot_1', 'slot_2', 'slot_3'].map(slot => {
                  const save = saves.find(s => s.id === slot);
                  const isAuto = slot === 'auto';
                  return (
                    <div key={slot} className={`flex items-center justify-between p-5 rounded-xl border shadow-inner transition-colors ${isAuto ? 'bg-indigo-950/30 border-indigo-500/30 hover:border-indigo-400' : 'bg-zinc-800/50 border-zinc-700 hover:border-indigo-400/50'}`}>
                      <div>
                        <div className={`font-black text-xl mb-1 ${isAuto ? 'text-indigo-300' : 'text-zinc-200'}`}>
                          {save ? save.label : (isAuto ? '自动存档' : `存档位 ${slot.replace('slot_', '')}`)}
                        </div>
                        <div className="text-sm font-bold text-zinc-500">
                          {save ? new Date(save.timestamp).toLocaleString() : '空槽位'}
                        </div>
                        {save?.version && (
                          <div className="text-[10px] font-black text-zinc-600 mt-1">
                            版本 v{save.version}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {save && (
                          <button
                            onClick={() => handleLoad(slot)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors flex items-center gap-2 shadow-sm"
                          >
                            <Download size={18} /> 读取
                          </button>
                        )}
                        {!isAuto && (
                          <button
                            onClick={() => handleSave(slot)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors flex items-center gap-2 shadow-sm"
                          >
                            <Save size={18} /> {save ? '覆盖' : '存档'}
                          </button>
                        )}
                        {save && (
                          <button
                            onClick={() => handleDeleteSave(slot)}
                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                            title="删除存档"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            <button
              onClick={() => setShowSaveModal(false)}
              className="mt-2 px-4 py-4 bg-zinc-800 text-zinc-300 rounded-xl font-black text-lg hover:bg-zinc-700 transition-colors w-full border border-zinc-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MapSelection;
