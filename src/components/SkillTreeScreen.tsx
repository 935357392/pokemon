import React, { useState, useMemo } from 'react';
import useGameStore from '../store/gameStore';
import { getSkillTreeForCharacter, ALL_SKILLS } from '../data/skills';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Check, Lock, ChevronRight, Zap, Heart, Sparkles, Coins, HelpCircle, Shield, FastForward, Crosshair, Sparkles as ShinyIcon, Activity } from 'lucide-react';

const SkillTreeScreen: React.FC = () => {
  const playerCharacter = useGameStore(state => state.playerCharacter);
  const characterProgress = useGameStore(state => state.characterProgress);
  const charId = playerCharacter.id;
  const currentProgress = characterProgress[charId] || { skillPoints: 0, unlockedSkills: [] };
  
  const skillPoints = currentProgress.skillPoints;
  const unlockedSkills = currentProgress.unlockedSkills;
  const unlockSkill = useGameStore(state => state.unlockSkill);
  const setScene = useGameStore(state => state.setScene);

  // Automatically select the first skill in the tree when changing characters
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  React.useEffect(() => {
    const tree = getSkillTreeForCharacter(charId);
    if (tree.length > 0 && tree[0].length > 0) {
      setSelectedSkill(tree[0][0].id);
    }
  }, [charId]);

  const handleUnlock = (id: string, cost: number) => {
    if (skillPoints >= cost && !unlockedSkills.includes(id as any)) {
      unlockSkill(id as any, cost);
    }
  };

  const treeLevels = useMemo(() => getSkillTreeForCharacter(charId), [charId]);

  const getSkillIcon = (id: string, className: string) => {
    switch (id) {
      case 'gold_start': return <Coins className={className} />;
      case 'hp_up': return <Heart className={className} />;
      case 'atk_up': return <Zap className={className} />;
      case 'def_up': return <Shield className={className} />;
      case 'speed_up': return <FastForward className={className} />;
      case 'exp_up': return <Activity className={className} />;
      case 'egg_rate': return <Star className={className} />;
      case 'catch_rate': return <Crosshair className={className} />;
      case 'shiny_rate': return <ShinyIcon className={className} />;
      case 'heal_up': return <Heart className={className} />;
      case 'legendary_rate': return <Star className={className} />;
      default: return <HelpCircle className={className} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-white overflow-hidden relative font-sans">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-6 bg-zinc-900/80 backdrop-blur-md border-b-4 border-zinc-800">
        <button 
          onClick={() => setScene('MainMenu')}
          className="p-3 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-all border-2 border-zinc-700 hover:border-zinc-500 shadow-lg group"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 mb-1">
            <img src={playerCharacter.spriteUrl} alt={playerCharacter.name} className="w-10 h-10 object-contain drop-shadow-md bg-zinc-800 rounded-full border-2 border-zinc-700" style={{ imageRendering: 'pixelated' }} />
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-widest uppercase">
              {playerCharacter.name} 的专属天赋
            </h1>
          </div>
          <p className="text-zinc-400 text-sm font-bold">不同角色的天赋进度互相独立</p>
        </div>

        <div className="bg-zinc-800 border-2 border-yellow-500/50 rounded-2xl px-6 py-2 shadow-[0_0_20px_rgba(234,179,8,0.2)] flex items-center gap-3">
          <Star className="text-yellow-400 w-6 h-6" />
          <div className="text-lg font-black text-zinc-300">SP <span className="text-yellow-400 text-2xl ml-1">{skillPoints}</span></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Left: Tree View */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="min-h-full flex flex-col items-center py-16 gap-16 relative">
            
            {/* Connection Lines (Simplified SVG Background) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <line x1="50%" y1="120" x2="35%" y2="280" stroke="#3f3f46" strokeWidth="4" strokeDasharray="8 8" />
              <line x1="50%" y1="120" x2="65%" y2="280" stroke="#3f3f46" strokeWidth="4" strokeDasharray="8 8" />
              <line x1="35%" y1="360" x2="35%" y2="520" stroke="#3f3f46" strokeWidth="4" strokeDasharray="8 8" />
              <line x1="65%" y1="360" x2="65%" y2="520" stroke="#3f3f46" strokeWidth="4" strokeDasharray="8 8" />
              <line x1="35%" y1="600" x2="50%" y2="760" stroke="#3f3f46" strokeWidth="4" strokeDasharray="8 8" />
              <line x1="65%" y1="600" x2="50%" y2="760" stroke="#3f3f46" strokeWidth="4" strokeDasharray="8 8" />
            </svg>

            {treeLevels.map((level, levelIdx) => (
              <div key={levelIdx} className="flex justify-center w-full relative z-10" style={{ gap: level.length === 1 ? '0' : '20%' }}>
                {level.map(skill => {
                  if (!skill) return null;
                  const isUnlocked = unlockedSkills.includes(skill.id);
                  const isSelected = selectedSkill === skill.id;
                  
                  return (
                    <motion.button
                      key={skill.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSkill(skill.id)}
                      className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all ${
                        isUnlocked 
                          ? 'bg-blue-900 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.6)]' 
                          : 'bg-zinc-800 border-zinc-600 hover:border-zinc-400 shadow-lg'
                      } ${isSelected ? 'ring-4 ring-yellow-400 ring-offset-4 ring-offset-zinc-950' : ''}`}
                    >
                      {isUnlocked ? (
                        <div className="relative">
                          {getSkillIcon(skill.id, "w-10 h-10 text-blue-300 drop-shadow-md")}
                          <Check className="absolute -bottom-2 -right-2 w-5 h-5 text-green-400 bg-black rounded-full" />
                        </div>
                      ) : (
                        <div className="relative opacity-50">
                           {getSkillIcon(skill.id, "w-10 h-10 text-zinc-400")}
                           <Lock className="absolute -bottom-2 -right-2 w-5 h-5 text-zinc-500 bg-black rounded-full" />
                        </div>
                      )}
                      
                      {/* Name Label */}
                      <div className={`absolute -bottom-8 whitespace-nowrap font-black text-sm px-3 py-1 rounded-full border-2 ${
                        isUnlocked ? 'bg-blue-900/80 border-blue-500 text-blue-200' : 'bg-zinc-800 border-zinc-600 text-zinc-400'
                      }`}>
                        {skill.name}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Details Panel */}
        <div className="w-96 bg-zinc-900 border-l-4 border-zinc-800 p-8 flex flex-col shadow-2xl relative z-20">
          {selectedSkill ? (() => {
            const skill = ALL_SKILLS[selectedSkill as keyof typeof ALL_SKILLS];
            if (!skill) return null;
            const isUnlocked = unlockedSkills.includes(skill.id);
            const canAfford = skillPoints >= skill.cost;

            return (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={skill.id}
                className="flex flex-col h-full"
              >
                <div className={`w-20 h-20 rounded-2xl border-4 mb-6 flex items-center justify-center relative ${
                  isUnlocked ? 'bg-blue-900 border-blue-400' : 'bg-zinc-800 border-zinc-600'
                }`}>
                  {getSkillIcon(skill.id, isUnlocked ? "w-10 h-10 text-blue-400" : "w-10 h-10 text-zinc-500")}
                  {isUnlocked && <Check className="absolute -bottom-3 -right-3 w-8 h-8 text-green-400 bg-black rounded-full border-2 border-zinc-900 p-1" />}
                </div>

                <h2 className="text-3xl font-black mb-2">{skill.name}</h2>
                
                <div className="inline-block px-3 py-1 bg-zinc-800 rounded-lg text-yellow-400 font-bold text-sm self-start mb-6 border border-zinc-700">
                  解锁消耗: {skill.cost} SP
                </div>

                <div className="bg-zinc-950 p-6 rounded-2xl border-2 border-zinc-800 mb-auto">
                  <h3 className="text-zinc-500 font-bold mb-2 uppercase tracking-wider text-sm">节点效果</h3>
                  <p className="text-lg text-zinc-300 leading-relaxed font-bold">{skill.desc}</p>
                </div>

                {isUnlocked ? (
                  <div className="w-full py-5 rounded-2xl font-black bg-blue-900/30 text-blue-400 text-center border-2 border-blue-900/50 flex items-center justify-center gap-2">
                    <Check size={20} /> 已永久解锁
                  </div>
                ) : (
                  <motion.button 
                    whileHover={canAfford ? { scale: 1.02 } : {}}
                    whileTap={canAfford ? { scale: 0.98 } : {}}
                    onClick={() => handleUnlock(skill.id, skill.cost)}
                    disabled={!canAfford}
                    className={`w-full py-5 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                      canAfford 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 border-b-4 border-blue-700 active:border-b-0 active:translate-y-[4px]' 
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-2 border-zinc-700'
                    }`}
                  >
                    {canAfford ? (
                      <>确认解锁 <ChevronRight size={24} /></>
                    ) : (
                      '技能点不足'
                    )}
                  </motion.button>
                )}
              </motion.div>
            );
          })() : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 opacity-50">
              <Star className="w-24 h-24 mb-6" />
              <p className="text-xl font-black">在左侧选择一个天赋节点</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SkillTreeScreen;