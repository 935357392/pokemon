import React, { useMemo, useState, useEffect, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { Pokemon, Move } from '../types';
import clsx from 'clsx';
import { RefreshCw } from 'lucide-react';

const BattleArena: React.FC = () => {
  const {
    playerTeam,
    enemyTeam,
    localEnemyTeam,
    setPlayerTeam,
    setScene,
    battleLog,
    addBattleLog,
    addBattleLogs,
    advanceLevel,
    currentWeather,
    playerCharacter,
    enemyCharacter
  } = useGameStore(
    useShallow((state) => ({
      playerTeam: state.playerTeam,
      enemyTeam: state.enemyTeam,
      localEnemyTeam: state.localEnemyTeam,
      setPlayerTeam: state.setPlayerTeam,
      setScene: state.setScene,
      battleLog: state.battleLog,
      addBattleLog: state.addBattleLog,
      addBattleLogs: state.addBattleLogs,
      advanceLevel: state.advanceLevel,
      currentWeather: state.currentWeather,
      playerCharacter: state.playerCharacter,
      enemyCharacter: state.enemyCharacter
    }))
  );
  const deferredBattleLog = useDeferredValue(battleLog);

  const pushLogs = (logs: string[]) => {
    if (logs.length === 0) return;
    requestAnimationFrame(() => addBattleLogs(logs));
  };

  const [activePlayerIdx, setActivePlayerIdx] = useState(() => {
    // 刷新时，找到第一个还没死的宝可梦作为开场
    const team = useGameStore.getState().playerTeam;
    const idx = team.findIndex(p => p.currentHp > 0);
    return idx !== -1 ? idx : 0;
  });
  const [activeEnemyIdx, setActiveEnemyIdx] = useState(() => {
    const localEnemyTeam = useGameStore.getState().localEnemyTeam || [];
    const idx = localEnemyTeam.findIndex(e => e.currentHp > 0);
    return idx !== -1 ? idx : 0;
  });
  const [turn, setTurn] = useState<'player' | 'enemy' | 'waiting'>('player');
  const [freeSwitch, setFreeSwitch] = useState(false);

  const [playerAnim, setPlayerAnim] = useState('');
  const [enemyAnim, setEnemyAnim] = useState('');

  const [showTeamModal, setShowTeamModal] = useState(false);

  // Handle battle log on mount if it's empty
  useEffect(() => {
    if (battleLog.length === 0 && enemyTeam.length > 0) {
      if (enemyCharacter) {
        addBattleLog(`训练家 ${enemyCharacter.name} 发起了挑战！`);
        addBattleLog(`对手派出了 ${enemyTeam[0].name}！`);
      } else {
        addBattleLog(`野生的 ${enemyTeam[0].name} 出现了！`);
      }
    }
  }, []);

  const activePlayer = playerTeam[activePlayerIdx];
  const activeEnemy = localEnemyTeam?.[activeEnemyIdx] || localEnemyTeam?.[0]; // 防御性取值

  // 关键：防止刷新后由于状态恢复时间差导致的白屏崩溃
  if (!activePlayer || !activeEnemy) {
    return <div className="bg-zinc-900 w-full h-screen text-white p-4 flex items-center justify-center font-black text-2xl animate-pulse">Loading Battle...</div>;
  }

  const typeZh: Record<string, string> = {
    electric: '电',
    water: '水',
    fire: '火',
    ice: '冰',
    ground: '地面',
    rock: '岩石',
    steel: '钢'
  };

  const getWeatherMultipliers = (weather: string, attacker: Pokemon, move: Move) => {
    let atkMult = 1;
    let moveMult = 1;
    const attackerTypes = attacker.types || [];
    const boostedTypeZh = typeZh[move.type];
    const isSameType = boostedTypeZh ? attackerTypes.includes(boostedTypeZh) : false;

    if (weather === 'rain') {
      if (move.type === 'water') moveMult = 1.2;
      if (move.type === 'fire') moveMult = 0.85;
      if (isSameType && boostedTypeZh === '水') atkMult = 1.05;
    }
    if (weather === 'sun') {
      if (move.type === 'fire') moveMult = 1.2;
      if (move.type === 'water') moveMult = 0.85;
      if (isSameType && boostedTypeZh === '火') atkMult = 1.05;
    }
    if (weather === 'thunder') {
      if (move.type === 'electric') moveMult = 1.25;
      if (isSameType && boostedTypeZh === '电') atkMult = 1.08;
    }
    if (weather === 'sandstorm') {
      if (move.type === 'ground' || move.type === 'rock' || move.type === 'steel') moveMult = 1.15;
      if (isSameType && (boostedTypeZh === '地面' || boostedTypeZh === '岩石' || boostedTypeZh === '钢')) atkMult = 1.05;
    }
    if (weather === 'hail') {
      if (move.type === 'ice') moveMult = 1.2;
      if (isSameType && boostedTypeZh === '冰') atkMult = 1.05;
    }
    return { atkMult, moveMult };
  };

  const calcDamage = (attacker: Pokemon, defender: Pokemon, move: Move) => {
    if (move.damageClass === 'status' || move.power <= 0) return 0;
    const { atkMult, moveMult } = getWeatherMultipliers(currentWeather, attacker, move);
    const lvl = 50;
    const atkBase = move.damageClass === 'special'
      ? (attacker.specialAttack ?? attacker.attack ?? 1)
      : (attacker.attack ?? 1);
    const defBase = move.damageClass === 'special'
      ? (defender.specialDefense ?? defender.defense ?? 1)
      : (defender.defense ?? 1);
    const atkStat = Math.max(1, atkBase) * atkMult;
    const defStat = Math.max(1, defBase);
    const baseDamage = ((2 * lvl / 5 + 2) * move.power * (atkStat / defStat)) / 50 + 2;
    const modifier = (Math.random() * 0.15 + 0.85); // 0.85 - 1.00
    const dmg = Math.floor(baseDamage * modifier * moveMult);
    const cap = Math.max(1, Math.floor((defender.maxHp || 1) * 1.5));
    return Math.min(dmg, cap);
  };

  const getStatusMoveHint = (move: Move) => {
    const parts: string[] = [];
    if (move.healingPercent && move.healingPercent > 0) {
      parts.push(`回复HP ${move.healingPercent}%`);
    }
    if (move.statChanges && move.statChanges.length > 0) {
      parts.push(
        move.statChanges
          .slice(0, 2)
          .map((s) => `${s.change > 0 ? '提升' : '降低'}${s.stat}${Math.abs(s.change)}级`)
          .join('，')
      );
    }
    return parts.join(' · ');
  };

  const checkBattleEnd = () => {
    if (!activePlayer) return;
    
    // 检查玩家队伍是否全灭
    const isPlayerWiped = playerTeam.every(p => p.currentHp <= 0);
    if (isPlayerWiped) {
      addBattleLog('你的宝可梦全部倒下了...');
      setTimeout(() => setScene('GameOver'), 2000);
      return true;
    }

    // 检查敌人是否全灭
    const isEnemyWiped = localEnemyTeam?.every(e => e.currentHp <= 0);
    if (isEnemyWiped) {
      addBattleLog('你战胜了所有对手！');
      
      const charId = useGameStore.getState().playerCharacter?.id || 'ash';
      const unlockedSkills = useGameStore.getState().characterProgress?.[charId]?.unlockedSkills || [];
      const expMultiplier = unlockedSkills.includes('exp_up') ? 1.2 : 1;
      const totalExpGain = Math.floor(localEnemyTeam.reduce((acc, enemy) => acc + Math.floor((enemy.level * 100) / playerTeam.filter(p => p.currentHp > 0).length), 0) * expMultiplier);
      addBattleLog(`战斗结束，获得了 ${totalExpGain} 点经验值（通关节点后结算），全体宝可梦恢复了体力！`);
      
      // 检查是否是神兽战
      const readyLegendaryQuest = useGameStore.getState().readyLegendaryQuest;
      const isLegendaryBoss = readyLegendaryQuest && localEnemyTeam.length === 1 && localEnemyTeam[0].id === readyLegendaryQuest.legendaryId;

      const eggDropChance = 0.20 + (unlockedSkills.includes('egg_rate') ? 0.15 : 0);

      if (isLegendaryBoss) {
        addBattleLog(`✨ 传说中的 ${localEnemyTeam[0].name} 认可了你的实力！它自愿加入了你的队伍！`);
        // 给它满血、重新分配ID
        useGameStore.getState().addPokemonToTeam({
          ...localEnemyTeam[0], 
          currentHp: localEnemyTeam[0].maxHp,
          uniqueId: `${localEnemyTeam[0].id}-legendary-${Date.now()}`
        });
        useGameStore.getState().setReadyLegendaryQuest(null);
      } else if (Math.random() < eggDropChance) {
        // 从一阶宝可梦的池子里随机获取一只作为蛋的种类（不从当前敌方队伍获取）
        const firstStageIds = [1, 4, 7, 10, 13, 16, 19, 21, 23, 25, 27, 29, 32, 37, 39, 41, 43, 46, 48, 50, 52, 54, 56, 58, 60, 63, 66, 69, 72, 74, 77, 79, 81, 84, 86, 88, 90, 92, 96, 98, 100, 102, 104, 108, 109, 111, 114, 116, 118, 120, 129, 133, 137, 138, 140, 143, 147, 152, 155, 158, 161, 163, 165, 167, 170, 172, 173, 174, 175, 177, 179, 183, 187, 190, 191, 193, 194, 198, 200, 204, 206, 207, 209, 213, 215, 216, 218, 220, 223, 227, 228, 231, 234, 236, 238, 239, 240, 246, 252, 255, 258, 261, 263, 265, 270, 273, 276, 278, 280, 283, 285, 287, 290, 293, 296, 298, 299, 304, 307, 309, 311, 312, 316, 318, 320, 322, 325, 328, 331, 333, 339, 341, 343, 345, 347, 349, 353, 355, 357, 359, 361, 363, 366, 371, 374, 387, 390, 393, 396, 399, 401, 403, 406, 408, 410, 412, 415, 417, 418, 420, 422, 425, 427, 431, 434, 436, 438, 440, 443, 446, 447, 449, 451, 453, 456, 458, 459];
        const randomEggId = firstStageIds[Math.floor(Math.random() * firstStageIds.length)];
        
        useGameStore.getState().addEgg({
          id: Math.random().toString(36).substring(2, 9),
          pokemonId: randomEggId,
          pokemonName: '神秘', // 隐藏真实名字
          stepsRemaining: 3
        });
        addBattleLog(`🥚 获得了一个神秘的蛋！已放入孵蛋箱。`);
      }

      useGameStore.getState().setPendingExpReward(totalExpGain);
      useGameStore.getState().healTeam();
      useGameStore.getState().restoreTeamPP();
      useGameStore.getState().progressQuest('win');

      setTimeout(() => {
        useGameStore.getState().advanceNode('GachaScreen', true);
      }, 2000);
      return true;
    }

    // 如果当前宝可梦死亡，需要换人
    if (activePlayer.currentHp <= 0) {
      const nextIdx = playerTeam.findIndex(p => p.currentHp > 0);
      if (nextIdx !== -1) {
        setActivePlayerIdx(nextIdx);
        addBattleLog(`去吧！${playerTeam[nextIdx].name}！`);
      }
    }

    // 单个敌人死亡，但不是全灭
    if (activeEnemy && activeEnemy.currentHp <= 0) {
      const nextIdx = localEnemyTeam?.findIndex(e => e.currentHp > 0);
      if (nextIdx !== -1) {
        setActiveEnemyIdx(nextIdx);
        addBattleLog(`对手派出了 ${localEnemyTeam[nextIdx].name}！`);
      }
    }

    return false;
  };

  useEffect(() => {
    if (!activePlayer || !activeEnemy) return;

    if (turn === 'enemy') {
      setTimeout(() => {
        // 敌人随机技能
        const move = activeEnemy.moves[Math.floor(Math.random() * activeEnemy.moves.length)];
        const isStatus = move.damageClass === 'status' || move.power <= 0;
        const damage = isStatus ? 0 : calcDamage(activeEnemy, activePlayer, move);
        
        setEnemyAnim('attack');
        pushLogs([`敌方 ${activeEnemy.name} 使用了 ${move.name}！`]);

        setTimeout(() => {
          if (isStatus) {
            pushLogs([move.description || '变化招式（无伤害）。']);
          } else {
            setPlayerAnim('hurt');
            const newTeam = [...playerTeam];
            newTeam[activePlayerIdx].currentHp = Math.max(0, newTeam[activePlayerIdx].currentHp - damage);
            setPlayerTeam(newTeam);
            pushLogs([`${activePlayer.name} 受到了 ${damage} 点伤害。`]);
          }

          if (move.recoilPercent && damage > 0) {
            const recoil = Math.max(1, Math.floor((damage * move.recoilPercent) / 100));
            const newEnemyTeam = [...useGameStore.getState().localEnemyTeam];
            const attacker = newEnemyTeam[activeEnemyIdx];
            if (attacker) {
              attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
              useGameStore.setState({ localEnemyTeam: newEnemyTeam });
              pushLogs([`${activeEnemy.name} 受到了反作用力，损失了 ${recoil} HP。`]);
            }
          }

          setTimeout(() => {
            setEnemyAnim('');
            setPlayerAnim('');
            setTurn('player');
            checkBattleEnd();
          }, 800);
        }, 400);

      }, 1000);
    }
  }, [turn]);

  const handlePlayerMove = (moveIdx: number) => {
    if (turn !== 'player') return;
    const move = activePlayer.moves[moveIdx];
    const moveMaxPp = move?.maxPp ?? 10;
    const movePp = move?.pp ?? moveMaxPp;
    if (!move || movePp <= 0) return;

    const teamWithPp = [...playerTeam];
    const current = teamWithPp[activePlayerIdx];
    teamWithPp[activePlayerIdx] = {
      ...current,
      moves: current.moves.map((m, i) => {
        if (i !== moveIdx) return m;
        const maxPp = m.maxPp ?? 10;
        const pp = m.pp ?? maxPp;
        return { ...m, maxPp, pp: Math.max(0, pp - 1) };
      })
    };
    setPlayerTeam(teamWithPp);

    setTurn('waiting');
    
    setPlayerAnim('attack');
    pushLogs([`${activePlayer.name} 使用了 ${move.name}！`]);

    setTimeout(() => {
      const isStatus = move.damageClass === 'status' || move.power <= 0;
      const damage = isStatus ? 0 : calcDamage(activePlayer, activeEnemy, move);
      let isEnemyDead = false;
      
      if (isStatus) {
        pushLogs([move.description || '变化招式（无伤害）。']);
      } else {
        setEnemyAnim('hurt');
        const newEnemyTeam = [...localEnemyTeam];
        newEnemyTeam[activeEnemyIdx].currentHp = Math.max(0, newEnemyTeam[activeEnemyIdx].currentHp - damage);
        isEnemyDead = newEnemyTeam[activeEnemyIdx].currentHp <= 0;
        useGameStore.setState({ localEnemyTeam: newEnemyTeam });
        pushLogs([`对 ${activeEnemy.name} 造成了 ${damage} 点伤害。`]);
      }

      if (move.recoilPercent && damage > 0) {
        const recoil = Math.max(1, Math.floor((damage * move.recoilPercent) / 100));
        const newTeam = [...useGameStore.getState().playerTeam];
        const attacker = newTeam[activePlayerIdx];
        if (attacker) {
          attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
          useGameStore.getState().setPlayerTeam(newTeam);
          pushLogs([`${activePlayer.name} 受到了反作用力，损失了 ${recoil} HP。`]);
        }
      }

      setTimeout(() => {
        setPlayerAnim('');
        setEnemyAnim('');
        
        // 剩饭等回合结束回复效果
        const newTeam = [...useGameStore.getState().playerTeam];
        const charId = useGameStore.getState().playerCharacter.id;
        const unlockedSkills = useGameStore.getState().characterProgress[charId]?.unlockedSkills || [];
        
        let healed = false;
        const activeP = newTeam[activePlayerIdx];
        if (activeP && activeP.currentHp < activeP.maxHp) {
           let totalHealPercent = 0;
           (activeP.equipments || []).forEach(eq => {
             if (eq && eq.type === 'heal' && eq.value) {
               totalHealPercent += eq.value;
             }
           });
           
           if (totalHealPercent > 0) {
             const healMultiplier = unlockedSkills.includes('heal_up') ? 1.5 : 1;
             const healAmount = Math.floor(activeP.maxHp * totalHealPercent * healMultiplier);
             activeP.currentHp = Math.min(activeP.maxHp, activeP.currentHp + healAmount);
             pushLogs([`${activeP.name} 通过装备恢复了HP！`]);
             healed = true;
           }
        }
        if(healed) useGameStore.getState().setPlayerTeam(newTeam);

        if (!checkBattleEnd()) {
          if (isEnemyDead) {
            setTurn('player');
            setFreeSwitch(true);
          } else {
            setTurn('enemy');
          }
        }
      }, 800);
    }, 400);
  };

  const handleSwitchPokemon = (idx: number) => {
    if (turn !== 'player') return;
    if (idx === activePlayerIdx) return;
    const target = playerTeam[idx];
    if (target.currentHp <= 0) return;

    setActivePlayerIdx(idx);
    setShowTeamModal(false);
    
    pushLogs([`回来吧，${activePlayer.name}！去吧！${target.name}！`]);
    
    if (freeSwitch) {
      setFreeSwitch(false);
      // 换完之后依然是玩家回合
    } else {
      setTurn('enemy');
    }
  };

  const getHpColorClass = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio > 0.5) return 'hp-green';
    if (ratio > 0.2) return 'hp-yellow';
    return 'hp-red';
  };

  const weatherConfig: Record<string, {
    label: string;
    icon: string;
    gradient: string;
    overlay: string;
    tint: string;
    accent: string;
    effect: 'rain' | 'sun' | 'thunder' | 'sand' | 'hail' | 'clear';
  }> = {
    clear: {
      label: '晴朗',
      icon: '☀️',
      gradient: 'from-sky-300 via-blue-200 to-cyan-200',
      overlay: 'bg-gradient-to-t from-emerald-900/10 to-transparent',
      tint: 'bg-white/5',
      accent: 'from-yellow-200 to-amber-300',
      effect: 'clear',
    },
    rain: {
      label: '下雨',
      icon: '🌧️',
      gradient: 'from-slate-500 via-slate-400 to-indigo-400',
      overlay: 'bg-gradient-to-t from-blue-900/30 to-transparent',
      tint: 'bg-blue-500/10',
      accent: 'from-blue-200 to-cyan-300',
      effect: 'rain',
    },
    sun: {
      label: '烈日',
      icon: '☀️',
      gradient: 'from-rose-300 via-orange-200 to-amber-100',
      overlay: 'bg-gradient-to-t from-red-800/10 to-transparent',
      tint: 'bg-orange-400/10',
      accent: 'from-red-300 to-yellow-200',
      effect: 'sun',
    },
    thunder: {
      label: '雷暴',
      icon: '⚡',
      gradient: 'from-zinc-700 via-indigo-800 to-zinc-600',
      overlay: 'bg-gradient-to-t from-black/40 to-transparent',
      tint: 'bg-yellow-300/5',
      accent: 'from-yellow-300 to-indigo-300',
      effect: 'thunder',
    },
    sandstorm: {
      label: '沙暴',
      icon: '🌪️',
      gradient: 'from-amber-600 via-yellow-600 to-stone-500',
      overlay: 'bg-gradient-to-t from-stone-900/40 to-amber-900/20',
      tint: 'bg-yellow-900/20',
      accent: 'from-amber-200 to-orange-300',
      effect: 'sand',
    },
    hail: {
      label: '冰雹',
      icon: '❄️',
      gradient: 'from-cyan-100 via-sky-200 to-blue-300',
      overlay: 'bg-gradient-to-t from-sky-900/20 to-transparent',
      tint: 'bg-cyan-200/10',
      accent: 'from-cyan-200 to-sky-300',
      effect: 'hail',
    },
  };

  const wCfg = weatherConfig[currentWeather] || weatherConfig.clear;

  const weatherParticles = useMemo(() => {
    switch (wCfg.effect) {
      case 'rain':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-[2px] h-6 bg-gradient-to-b from-cyan-200/80 to-transparent"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10%`,
                  animation: `rainFall ${0.5 + Math.random() * 0.6}s linear ${Math.random() * 1.5}s infinite`,
                  transform: 'rotate(12deg)',
                }}
              />
            ))}
          </div>
        );
      case 'sun':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            {/* 大太阳 - 减弱阴影模糊提升性能 */}
            <div className="absolute top-8 right-20 w-28 h-28 rounded-full bg-gradient-to-br from-yellow-100 via-yellow-300 to-orange-400 shadow-[0_0_40px_20px_rgba(253,224,71,0.5)] animate-pulse" />
            <div className="absolute top-12 right-24 w-20 h-20 rounded-full bg-yellow-100 blur-md opacity-80" />
            {/* 烤热波纹 */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 via-orange-400/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-orange-600/20 via-transparent to-transparent" style={{ animation: 'heatWave 4s ease-in-out infinite' }} />
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-yellow-200"
                style={{
                  width: `${2 + Math.random() * 2}px`,
                  height: `${2 + Math.random() * 2}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 70}%`,
                  animation: `sunShimmer ${1.5 + Math.random()}s ease-in-out ${Math.random()}s infinite`,
                  boxShadow: '0 0 4px rgba(254, 240, 138, 0.6)',
                }}
              />
            ))}
          </div>
        );
      case 'thunder':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            <div className="absolute inset-0 bg-yellow-100" style={{ animation: 'lightningFlash 5s ease-in-out infinite', opacity: 0 }} />
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-[2px] h-5 bg-gradient-to-b from-indigo-200/70 to-transparent"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10%`,
                  animation: `rainFall ${0.4 + Math.random() * 0.5}s linear ${Math.random()}s infinite`,
                  transform: 'rotate(8deg)',
                }}
              />
            ))}
          </div>
        );
      case 'sand':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            {/* 扬尘薄雾层 */}
            <div className="absolute inset-0 bg-amber-700/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/30 via-amber-700/10 to-stone-900/30" />
            {/* 横飞的尘雾云带 (移除 blur-2xl 优化性能，改用透明度渐变) */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`cloud-${i}`}
                className="absolute rounded-full bg-amber-200/10"
                style={{
                  width: `${120 + Math.random() * 150}px`,
                  height: `${40 + Math.random() * 40}px`,
                  left: `-20%`,
                  top: `${Math.random() * 80}%`,
                  animation: `cloudDrift ${8 + Math.random() * 6}s linear ${Math.random() * 5}s infinite`,
                  filter: 'blur(8px)',
                }}
              />
            ))}
            {/* 飞沙颗粒 */}
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={`grain-${i}`}
                className="absolute rounded-full bg-amber-300/80"
                style={{
                  width: `${1 + Math.random() * 3}px`,
                  height: `${1 + Math.random() * 3}px`,
                  left: `-5%`,
                  top: `${Math.random() * 100}%`,
                  animation: `sandBlow ${1.5 + Math.random() * 1.5}s linear ${Math.random() * 2}s infinite`,
                }}
              />
            ))}
          </div>
        );
      case 'hail':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            {Array.from({ length: 45 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white shadow-[0_0_4px_rgba(186,230,253,0.8)]"
                style={{
                  width: `${3 + Math.random() * 3}px`,
                  height: `${3 + Math.random() * 3}px`,
                  left: `${Math.random() * 100}%`,
                  top: `-10%`,
                  animation: `hailFall ${0.9 + Math.random() * 0.6}s linear ${Math.random() * 1.5}s infinite`,
                }}
              />
            ))}
          </div>
        );
      case 'clear':
      default:
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            <div className="absolute top-10 right-20 w-32 h-32 rounded-full bg-yellow-100 blur-2xl opacity-50" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/70"
                style={{
                  width: `${40 + Math.random() * 30}px`,
                  height: `${20 + Math.random() * 15}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${5 + Math.random() * 30}%`,
                  filter: 'blur(10px)',
                  animation: `cloudDrift ${30 + Math.random() * 20}s linear ${Math.random() * 10}s infinite`,
                }}
              />
            ))}
          </div>
        );
    }
  }, [wCfg.effect]);

  return (
    <div className="flex flex-col h-screen w-full bg-black text-zinc-100 overflow-hidden relative font-sans">
      <style>{`
        @keyframes rainFall {
          0% { transform: translateY(-10vh) rotate(12deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(12deg); opacity: 0.3; }
        }
        @keyframes hailFall {
          0% { transform: translateY(-10vh); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(110vh); opacity: 0.8; }
        }
        @keyframes sandBlow {
          0% { transform: translateX(0) translateY(0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateX(110vw) translateY(-20px); opacity: 0; }
        }
        @keyframes sunShimmer {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes lightningFlash {
          0%, 92%, 94%, 96%, 100% { opacity: 0; }
          93% { opacity: 0.6; }
          95% { opacity: 0.9; }
        }
        @keyframes cloudDrift {
          0% { transform: translateX(-20vw); }
          100% { transform: translateX(120vw); }
        }
        @keyframes heatWave {
          0%, 100% { opacity: 0.6; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.1); }
        }
      `}</style>
      {/* 战斗背景 - 根据天气动态切换 */}
      <div className={`absolute inset-0 z-0 bg-gradient-to-b ${wCfg.gradient} pointer-events-none transition-colors duration-1000`}></div>
      <div className={`absolute inset-0 z-0 ${wCfg.overlay} pointer-events-none`}></div>
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 pointer-events-none"></div>
      {/* 天气动态特效 */}
      {weatherParticles}

      {/* ========== 对战场地（参考珍钻复刻 / 朱紫，3D 球面战场） ========== */}
      {/* 柔和的地面大气晕染（无硬分界线，从上往下逐渐变暖/变暗） */}
      <div
        className="absolute inset-0 z-[5] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 120% 60% at 50% 95%, rgba(108,168,96,0.55) 0%, rgba(86,142,78,0.35) 35%, rgba(48,84,46,0.15) 60%, rgba(0,0,0,0) 85%)',
        }}
      />
      {/* 整体边缘暗角（vignette），模仿朱紫战斗镜头 */}
      <div
        className="absolute inset-0 z-[7] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 90%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* 天气 HUD 标识（金属拟真 + 扫光） */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fade-in-up">
        <div className="relative flex items-center gap-1 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 bg-gradient-to-b from-zinc-800/90 to-zinc-900/95 backdrop-blur-md rounded-full border-2 border-white/20 shadow-[0_6px_24px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.25)] overflow-hidden">
          <span className="text-xl md:text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] animate-float">{wCfg.icon}</span>
          <span className={`text-xs md:text-sm font-black uppercase tracking-[0.1em] md:tracking-[0.2em] bg-gradient-to-r ${wCfg.accent} bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}>
            {wCfg.label}
          </span>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: 'shimmer 4s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
      
      {/* 战斗场景区 */}
      <div className="flex-1 flex flex-col justify-between relative z-10 p-2 md:p-8 h-[calc(100vh-256px)]">
        
        {/* 敌方区域 (右上)：精灵在左、血条在右 */}
        <div className="flex flex-col-reverse md:flex-row justify-end items-end md:items-center w-full z-20 relative gap-2 md:gap-4 pr-2 md:pr-16 mt-4 md:mt-0">
          {/* 敌方精灵模型（紧挨血条左侧） */}
          <motion.div 
              initial={{ x: 200, opacity: 0 }}
              animate={
                enemyAnim === 'attack' ? { x: -30, scale: 1.1, opacity: 1, filter: 'brightness(1)' } :
                enemyAnim === 'hurt' ? { opacity: [1, 0, 1, 0, 1], filter: 'brightness(2)', x: 0, scale: 1 } :
                { x: 0, opacity: 1, filter: 'brightness(1)', scale: 1 }
              }
              transition={
                enemyAnim ? { duration: 0.3 } :
                { type: 'spring', stiffness: 50 }
              }
              className="flex items-end gap-2 relative"
            >
            {enemyCharacter && (
              <motion.img 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                src={enemyCharacter.spriteUrl} 
                alt={enemyCharacter.name} 
                className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-[0_8px_6px_rgba(0,0,0,0.5)] opacity-90 relative z-10"
                style={{ imageRendering: 'pixelated' }}
              />
            )}
            <div className="flex flex-col items-center relative">
              {activeEnemy.extraForm === 'mega' && <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-pulse" />}
              <img 
                src={activeEnemy.spriteUrl} 
                alt={activeEnemy.name} 
                className={`object-contain drop-shadow-[0_10px_6px_rgba(0,0,0,0.5)] z-10 transition-all ${
                  activeEnemy.extraForm === 'dynamax' ? 'w-24 h-24 md:w-40 md:h-40 scale-110' : 
                  activeEnemy.extraForm === 'tera' ? 'w-20 h-20 md:w-32 md:h-32 drop-shadow-[0_0_18px_cyan]' :
                  activeEnemy.extraForm === 'mega' ? 'w-20 h-20 md:w-36 md:h-36 drop-shadow-[0_0_15px_red]' :
                  'w-20 h-20 md:w-32 md:h-32'
                }`}
                style={{ imageRendering: 'pixelated' }}
              />
              {/* 脚下椭圆阴影 */}
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-16 md:w-28 h-3 md:h-5 bg-black/40 rounded-[50%] blur-sm z-0" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-48 md:w-80 bg-white/95 border-2 md:border-4 border-zinc-800 rounded-xl p-2 md:p-4 shadow-xl transform -skew-x-2"
          >
            <div className="flex justify-between items-end mb-1 md:mb-2 skew-x-2">
              <h2 className="text-sm md:text-xl font-bold text-zinc-900 uppercase tracking-tighter flex items-center gap-1">
                {activeEnemy.name}
                {activeEnemy.gender === 'male' && <span className="text-blue-600 font-black">♂</span>}
                {activeEnemy.gender === 'female' && <span className="text-pink-600 font-black">♀</span>}
                {activeEnemy.isShiny && <span className="text-yellow-500 text-xs md:text-lg" title="异色">✨</span>}
                {activeEnemy.extraForm === 'mega' && <span className="text-[8px] md:text-[10px] bg-red-600 text-white px-1 py-0.5 rounded shadow-[0_0_5px_red] ml-1">MEGA</span>}
                {activeEnemy.extraForm === 'dynamax' && <span className="text-[8px] md:text-[10px] bg-pink-600 text-white px-1 py-0.5 rounded shadow-[0_0_5px_pink] ml-1">极巨化</span>}
                {activeEnemy.extraForm === 'tera' && <span className="text-[8px] md:text-[10px] bg-teal-500 text-white px-1 py-0.5 rounded shadow-[0_0_5px_teal] ml-1">太晶化</span>}
              </h2>
              <span className="text-xs md:text-sm font-bold text-zinc-600">Lv.{activeEnemy.level}</span>
            </div>
            <div className="w-full bg-zinc-300 h-2 md:h-4 rounded-full overflow-hidden border md:border-2 border-zinc-700 shadow-inner skew-x-2 relative">
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: `${(activeEnemy.currentHp / activeEnemy.maxHp) * 100}%` }}
                className={`h-full ${getHpColorClass(activeEnemy.currentHp, activeEnemy.maxHp)}`}
              />
            </div>
            <div className="text-right text-[10px] md:text-xs font-bold text-zinc-500 mt-1 skew-x-2">
              {activeEnemy.currentHp} / {activeEnemy.maxHp}
            </div>
          </motion.div>
        </div>

        {/* 我方区域 (左下)：血条在左、精灵在血条右侧 */}
        <div className="flex flex-col md:flex-row justify-start items-start md:items-center w-full mt-auto z-20 relative gap-2 md:gap-4 pl-2 md:pl-24 mb-4 md:mb-0">
          
          {/* 左侧管理按钮 */}
          <div className="absolute right-0 md:-left-4 md:right-auto bottom-0 md:bottom-0 z-30">
            <button 
              onClick={() => setShowTeamModal(true)}
              disabled={turn !== 'player'}
              className={clsx(
                "flex flex-col items-center justify-center p-2 md:p-3 rounded-xl md:rounded-2xl border-2 md:border-4 transition-all shadow-xl backdrop-blur-md",
                turn === 'player' 
                  ? "bg-blue-600/90 border-blue-400 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 cursor-pointer"
                  : "bg-zinc-800/80 border-zinc-600 text-zinc-500 cursor-not-allowed"
              )}
            >
              <RefreshCw size={16} className="mb-0.5 md:mb-1 drop-shadow-md md:w-6 md:h-6" />
              <span className="font-black text-[8px] md:text-xs tracking-widest drop-shadow-md">更换</span>
              <span className="font-black text-[8px] md:text-xs tracking-widest drop-shadow-md">宝可梦</span>
            </button>
          </div>

          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-48 md:w-80 bg-white/95 border-2 md:border-4 border-zinc-800 rounded-xl p-2 md:p-4 shadow-xl transform -skew-x-2"
          >
            <div className="flex justify-between items-end mb-1 md:mb-2 skew-x-2">
              <h2 className="text-sm md:text-xl font-bold text-zinc-900 uppercase tracking-tighter flex items-center gap-1">
                {activePlayer.name}
                {activePlayer.gender === 'male' && <span className="text-blue-600 font-black">♂</span>}
                {activePlayer.gender === 'female' && <span className="text-pink-600 font-black">♀</span>}
                {activePlayer.isShiny && <span className="text-yellow-500 text-xs md:text-lg" title="异色">✨</span>}
              </h2>
              <span className="text-xs md:text-sm font-bold text-zinc-600">Lv.{activePlayer.level}</span>
            </div>
            <div className="w-full bg-zinc-300 h-2 md:h-4 rounded-full overflow-hidden border md:border-2 border-zinc-700 shadow-inner skew-x-2 relative mb-1">
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: `${(activePlayer.currentHp / activePlayer.maxHp) * 100}%` }}
                className={`h-full ${getHpColorClass(activePlayer.currentHp, activePlayer.maxHp)}`}
              />
            </div>
            <div className="flex justify-between items-center mt-2 skew-x-2">
              <div className="flex gap-1">
                {activePlayer.equipments?.map((eq, i) => eq && (
                  <span key={i} className="text-[10px] bg-purple-100 text-purple-800 px-1 rounded font-bold border border-purple-300" title={eq.name}>
                    E
                  </span>
                ))}
              </div>
              <div className="text-sm font-black text-zinc-800 tracking-wider">
                {activePlayer.currentHp} / {activePlayer.maxHp}
              </div>
            </div>
          </motion.div>

          {/* 我方精灵模型（紧挨血条右侧） */}
          <motion.div 
              initial={{ x: -200, opacity: 0 }}
              animate={
                playerAnim === 'attack' ? { x: 30, scale: 1.1, opacity: 1, filter: 'brightness(1)' } :
                playerAnim === 'hurt' ? { opacity: [1, 0, 1, 0, 1], filter: 'brightness(2)', x: 0, scale: 1 } :
                { x: 0, opacity: 1, filter: 'brightness(1)', scale: 1 }
              }
              transition={
                playerAnim ? { duration: 0.3 } :
                { type: 'spring', stiffness: 50 }
              }
              className="flex items-end gap-2 relative"
            >
            {playerCharacter && (
              <motion.img 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                src={playerCharacter.spriteUrl} 
                alt={playerCharacter.name} 
                className="w-28 h-28 object-contain drop-shadow-[0_8px_6px_rgba(0,0,0,0.5)] relative z-10"
                style={{ imageRendering: 'pixelated', transform: 'scaleX(-1)' }}
              />
            )}
            <div className="flex flex-col items-center relative">
              {activePlayer.extraForm === 'mega' && <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-pulse" />}
              <img 
                src={activePlayer.backSpriteUrl || activePlayer.spriteUrl} 
                alt={activePlayer.name} 
                className={`object-contain drop-shadow-[0_12px_8px_rgba(0,0,0,0.55)] z-10 transition-all ${
                  activePlayer.extraForm === 'dynamax' ? 'w-48 h-48 scale-110' : 
                  activePlayer.extraForm === 'tera' ? 'w-40 h-40 drop-shadow-[0_0_20px_cyan]' :
                  activePlayer.extraForm === 'mega' ? 'w-44 h-44 drop-shadow-[0_0_15px_red]' :
                  'w-40 h-40'
                }`}
                style={{ imageRendering: 'pixelated' }}
              />
              {/* 脚下椭圆阴影 */}
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-36 h-6 bg-black/40 rounded-[50%] blur-md z-0" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* 底部操作区 (控制台风格) */}
      <div className="h-auto md:h-64 bg-zinc-100 border-t-4 md:border-t-8 border-zinc-400 flex flex-col md:flex-row relative z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
        {/* 左侧战斗日志 */}
        <div className="w-full md:w-1/2 p-3 md:p-6 border-b-4 md:border-b-0 md:border-r-8 border-zinc-400 bg-white/50 font-mono text-sm md:text-lg text-zinc-800 overflow-hidden flex flex-col justify-end leading-relaxed shadow-inner min-h-[80px]">
          {deferredBattleLog.slice(-3).map((log, i) => (
            <div
              key={i + log}
              className={clsx(
                "text-xs md:text-2xl font-bold mb-1 md:mb-2 tracking-tight",
                i === 2 ? "text-zinc-900" : "text-zinc-500"
              )}
            >
              {log}
            </div>
          ))}
        </div>

        {/* 右侧技能按钮 */}
        <div className="w-full md:w-1/2 p-3 md:p-6 bg-zinc-200">
          {freeSwitch ? (
            <div className="flex flex-col items-center justify-center h-full py-4 md:py-0">
              <div className="text-sm md:text-xl font-black text-zinc-800 mb-2 md:mb-4 text-center">敌方宝可梦已倒下，你获得了免费换人的机会！</div>
              <button 
                onClick={() => setFreeSwitch(false)}
                className="px-4 py-2 md:px-8 md:py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-[0_4px_0_#1d4ed8] active:translate-y-[4px] active:shadow-none transition-all text-xs md:text-base"
              >
                跳过，继续使用当前宝可梦
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:gap-4 h-full">
              {activePlayer.moves.map((move, i) => (
                (() => {
                  const currentPp = move.pp ?? move.maxPp ?? 10;
                  const maxPp = move.maxPp ?? 10;
                  return (
                    <button
                      key={move.id + i}
                      onClick={() => handlePlayerMove(i)}
                      disabled={turn !== 'player' || activePlayer.currentHp <= 0 || currentPp <= 0}
                  className={clsx(
                    "relative border-2 rounded-lg md:rounded-xl p-2 md:p-4 flex flex-col justify-center items-start transition-all group overflow-hidden",
                    turn === 'player' && activePlayer.currentHp > 0 && currentPp > 0
                      ? "bg-gradient-to-b from-white to-zinc-100 border-zinc-300 shadow-[0_4px_0_rgba(161,161,170,1)] md:shadow-[0_6px_0_rgba(161,161,170,1)] hover:bg-zinc-50 active:shadow-none active:translate-y-[4px] md:active:translate-y-[6px] cursor-pointer"
                      : "bg-zinc-300 border-zinc-400 shadow-none translate-y-[4px] md:translate-y-[6px] opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className={`absolute right-0 top-0 bottom-0 w-2 md:w-3 opacity-80 type-${move.type}`}></div>
                  <span className={clsx(
                    "font-black text-xs md:text-xl text-zinc-800 uppercase tracking-tighter mb-1 z-10 transition-colors drop-shadow-sm pr-2 md:pr-0",
                    turn === 'player' && "group-hover:text-blue-600"
                  )}>
                    {move.name}
                  </span>
                  <div className="flex flex-col md:flex-row gap-1 md:gap-2 items-start md:items-center z-10">
                    <span className={`text-[8px] md:text-xs px-1.5 md:px-2 py-0.5 rounded font-bold uppercase shadow-sm type-${move.type} text-white`}>
                      {move.type}
                    </span>
                    <span className="text-[8px] md:text-xs font-bold text-zinc-500 bg-zinc-200/50 px-1.5 md:px-2 py-0.5 rounded flex gap-1 md:gap-2">
                      <span>PP {currentPp}/{maxPp}</span>
                      <span className="border-l border-zinc-400 pl-1 md:pl-2">{move.damageClass === 'status' || move.power <= 0 ? '变化 无伤害' : `威力 ${move.power}`}</span>
                      {move.recoilPercent ? (
                        <span className="border-l border-zinc-400 pl-1 md:pl-2 text-red-600">反伤 {move.recoilPercent}%</span>
                      ) : null}
                      {(move.damageClass === 'status' || move.power <= 0) ? (
                        (getStatusMoveHint(move) ? (
                          <span className="border-l border-zinc-400 pl-1 md:pl-2">{getStatusMoveHint(move)}</span>
                        ) : null)
                      ) : (
                        <span className="hidden md:inline border-l border-zinc-400 pl-2">~{calcDamage(activePlayer, activeEnemy, move)}</span>
                      )}
                    </span>
                  </div>
                    </button>
                  );
                })()
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 队伍管理模态框 */}
      <AnimatePresence>
        {showTeamModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm"
            onClick={() => setShowTeamModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-800 border-4 border-blue-500 rounded-3xl p-8 max-w-4xl w-full shadow-[0_0_50px_rgba(59,130,246,0.3)] flex flex-col max-h-[80vh]"
            >
              <h2 className="text-3xl font-black text-white mb-6 text-center tracking-widest flex items-center justify-center gap-3">
                <RefreshCw size={32} className="text-blue-400" /> 选择要换上的宝可梦
              </h2>
              
              <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {playerTeam.map((pokemon, idx) => (
                  <button
                    key={pokemon.uniqueId || pokemon.id + '-' + idx}
                    onClick={() => handleSwitchPokemon(idx)}
                    disabled={pokemon.currentHp <= 0 || idx === activePlayerIdx}
                    className={clsx(
                      "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      idx === activePlayerIdx
                        ? "bg-blue-900/50 border-blue-500 cursor-default opacity-80"
                        : pokemon.currentHp <= 0
                        ? "bg-red-900/30 border-red-900/50 cursor-not-allowed opacity-50 grayscale"
                        : "bg-zinc-700/50 border-zinc-500 hover:border-blue-400 hover:bg-zinc-600/80 cursor-pointer active:scale-[0.98]"
                    )}
                  >
                    <div className="w-16 h-16 bg-black/30 rounded-full flex items-center justify-center shrink-0 border border-zinc-600">
                      <img src={pokemon.spriteUrl} alt={pokemon.name} className="w-12 h-12 object-contain" style={{ imageRendering: 'pixelated' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-lg text-white truncate pr-2">
                          {pokemon.name}
                          {idx === activePlayerIdx && <span className="ml-2 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded shadow-sm">战斗中</span>}
                          {pokemon.currentHp <= 0 && <span className="ml-2 text-xs bg-red-600 text-white px-1.5 py-0.5 rounded shadow-sm">濒死</span>}
                        </span>
                        <span className="text-sm font-bold text-yellow-400 shrink-0">Lv.{pokemon.level}</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-700">
                        <div 
                          className={`h-full ${getHpColorClass(pokemon.currentHp, pokemon.maxHp)}`}
                          style={{ width: `${(pokemon.currentHp / pokemon.maxHp) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-zinc-400 mt-1 font-bold">
                        HP: {pokemon.currentHp} / {pokemon.maxHp}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => {
                  setShowTeamModal(false);
                  setFreeSwitch(false); // 如果取消了免费换人，那么依然是玩家回合继续选择技能
                }}
                className="mt-8 bg-zinc-700 hover:bg-zinc-600 text-white font-black text-xl py-4 rounded-xl shadow-[0_6px_0_#3f3f46] active:shadow-none active:translate-y-[6px] transition-all w-full"
              >
                取消返回
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleArena;
