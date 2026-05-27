import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import useGameStore from './store/gameStore';
import { getFromDB } from './db';
import MainMenu from './components/MainMenu';
import MapSelection from './components/MapSelection';
import BattleArena from './components/BattleArena';
import GachaScreen from './components/GachaScreen';
import TeamManagement from './components/TeamManagement';
import ShopScreen from './components/ShopScreen';
import GameOver from './components/GameOver';
import RandomEventScreen from './components/RandomEventScreen';
import QuestScreen from './components/QuestScreen';
import LegendaryEventScreen from './components/LegendaryEventScreen';
import GameGuideModal from './components/GameGuideModal';
import TypeChartModal from './components/TypeChartModal';
import SkillTreeScreen from './components/SkillTreeScreen';
import MoveLearnScreen from './components/MoveLearnScreen';
import StorageScreen from './components/StorageScreen';
import PermanentShopScreen from './components/PermanentShopScreen';

function App() {
  const currentScene = useGameStore(state => state.currentScene);
  const [showGuide, setShowGuide] = useState(false);
  const [showTypeChart, setShowTypeChart] = useState(false);
  const [initLoaded, setInitLoaded] = useState(false);

  useEffect(() => {
    // 启动时自动读取上次的自动存档（如果存在）
    const loadAutoSave = async () => {
      const autoSave = await getFromDB('auto');
      if (autoSave) {
        const parsed = JSON.parse(autoSave.stateData);
        // 恢复所有状态，但是强制回退到主菜单
        useGameStore.setState({ ...parsed, currentScene: 'MainMenu' });
      } else {
        useGameStore.setState({ currentScene: 'MainMenu' });
      }
      setInitLoaded(true);
    };
    loadAutoSave();
  }, []);

  if (!initLoaded) {
    return <div className="w-full h-screen bg-black flex items-center justify-center text-white font-black text-2xl">加载中...</div>;
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden font-sans text-white relative">
      {currentScene !== 'MainMenu' && (
        <div className="absolute left-0 top-[40%] -translate-y-1/2 flex flex-col gap-3 z-[100]">
          <button
            onClick={() => setShowTypeChart(true)}
            className="btn-sidebar btn-sidebar-blue group"
          >
            <span className="text-blue-400 group-hover:text-blue-300 drop-shadow-md">⚔️</span>
            <span className="drop-shadow-md">属性克制</span>
          </button>
          
          <button
            onClick={() => setShowGuide(true)}
            className="btn-sidebar group"
          >
            <span className="text-zinc-400 group-hover:text-zinc-300 drop-shadow-md">📖</span>
            <span className="drop-shadow-md">说明</span>
          </button>
        </div>
      )}

      <GameGuideModal open={showGuide} onClose={() => setShowGuide(false)} closeText="关闭" />
      <TypeChartModal open={showTypeChart} onClose={() => setShowTypeChart(false)} />

      <AnimatePresence mode="sync" initial={false}>
        {currentScene === 'MainMenu' && <MainMenu />}
        {currentScene === 'MapSelection' && <MapSelection />}
        {currentScene === 'BattleArena' && <BattleArena />}
        {currentScene === 'GachaScreen' && <GachaScreen />}
        {currentScene === 'TeamManagement' && <TeamManagement />}
        {currentScene === 'ShopScreen' && <ShopScreen />}
        {currentScene === 'RandomEvent' && <RandomEventScreen />}
        {currentScene === 'QuestScreen' && <QuestScreen />}
        {currentScene === 'LegendaryEvent' && <LegendaryEventScreen />}
        {currentScene === 'SkillTree' && <SkillTreeScreen />}
        {currentScene === 'MoveLearn' && <MoveLearnScreen />}
        {currentScene === 'Storage' && <StorageScreen />}
        {currentScene === 'PermanentShop' && <PermanentShopScreen />}
        {currentScene === 'GameOver' && <GameOver />}
      </AnimatePresence>
    </div>
  );
}

export default App;
