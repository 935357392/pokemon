import { create } from 'zustand';

import { GameState, Pokemon, Scene, Equipment, RegionId, WeatherType, TrainerCharacter, Quest, PokemonEgg, SkillId, SaveSlot, RouteNode, RouteType, GameMap, MapEdge, BonusStats } from '../types';
import { getRandomTypePreviewByRegion } from '../api/pokeApi';
import { calculateStats } from '../utils/statCalc';
import { fetchPokemonById } from '../api/pokeApi';
import { ALL_CHARACTERS } from '../data/characters';
import { saveToDB, getFromDB } from '../db';
import { APP_VERSION } from '../constants/version';

const getWeatherForLevel = (): WeatherType => {
  const pool: WeatherType[] = ['clear', 'rain', 'sun', 'thunder', 'sandstorm', 'hail'];
  return pool[Math.floor(Math.random() * pool.length)];
};

const getUnlockedRegionsForLevel = (level: number): RegionId[] => {
  const regions: RegionId[] = ['kanto'];
  if (level >= 11) regions.push('johto');
  if (level >= 21) regions.push('hoenn');
  if (level >= 31) regions.push('sinnoh');
  if (level >= 41) regions.push('unova');
  if (level >= 51) regions.push('kalos');
  if (level >= 61) regions.push('alola');
  if (level >= 71) regions.push('galar');
  if (level >= 81) regions.push('paldea');
  return regions;
};

const getLatestUnlockedRegionForLevel = (level: number): RegionId => {
  if (level >= 81) return 'paldea';
  if (level >= 71) return 'galar';
  if (level >= 61) return 'alola';
  if (level >= 51) return 'kalos';
  if (level >= 41) return 'unova';
  if (level >= 31) return 'sinnoh';
  if (level >= 21) return 'hoenn';
  if (level >= 11) return 'johto';
  return 'kanto';
};

const pokemonMoveListCache = new Map<number, any[]>();
const moveDetailCache = new Map<string, any>();

const getSerializableState = (state: GameState) => ({
  characterProgress: state.characterProgress,
  currentScene: state.currentScene,
  playerTeam: state.playerTeam,
  enemyTeam: state.enemyTeam,
  currentLevel: state.currentLevel,
  playerCharacter: state.playerCharacter,
  enemyCharacter: state.enemyCharacter,
  currentRegion: state.currentRegion,
  unlockedRegions: state.unlockedRegions,
  currentWeather: state.currentWeather,
  npcAvailable: state.npcAvailable,
  activeQuest: state.activeQuest,
  readyLegendaryQuest: state.readyLegendaryQuest,
  gold: state.gold,
  pendingExpReward: state.pendingExpReward,
  pendingMoveLearn: state.pendingMoveLearn,
  moveLearnReturnScene: state.moveLearnReturnScene,
  storage: state.storage,
  storageCapacity: state.storageCapacity,
  inventory: state.inventory,
  gameMap: state.gameMap,
  pokeBalls: state.pokeBalls,
  evolutionMaterials: state.evolutionMaterials,
  battleLog: state.battleLog,
  incubator: state.incubator,
  localEnemyTeam: state.localEnemyTeam
});

const useGameStore = create<GameState>()((set, get) => ({
      characterProgress: {},
      currentScene: 'MainMenu',
      playerTeam: [],
      enemyTeam: [],
      currentLevel: 1,
      playerCharacter: ALL_CHARACTERS[0],
      enemyCharacter: null,
      currentRegion: 'kanto',
      unlockedRegions: ['kanto'],
      currentWeather: getWeatherForLevel(),
      npcAvailable: false,
      activeQuest: null,
      readyLegendaryQuest: null,
      gold: 0,
      pendingExpReward: 0,
      pendingMoveLearn: [],
      moveLearnReturnScene: null,
      storage: [],
      storageCapacity: 12,
      inventory: [],
      gameMap: null,
      pokeBalls: { pokeball: 5, greatball: 0, ultraball: 0, masterball: 0, quickball: 0, timerball: 0, duskball: 0 },
      evolutionMaterials: {
        megaStone: 0,
        dynamaxBand: 0,
        teraOrb: 0,
      },
      battleLog: [],
      incubator: [],
      localEnemyTeam: [],

      saveGame: async (id: string, label: string) => {
        const state = get();
        const serializable = getSerializableState(state);
        const saveData: SaveSlot = {
          id,
          label,
          timestamp: Date.now(),
          level: state.currentLevel,
          characterName: state.playerCharacter.name,
          version: APP_VERSION,
          stateData: JSON.stringify(serializable)
        };
        await saveToDB(saveData);
      },

      loadGame: async (id: string) => {
        const save = await getFromDB(id);
        if (save) {
          const parsed = JSON.parse(save.stateData);
          const currentProgress = get().characterProgress;
          // Restore game state but keep meta-progression for all characters
          set({ ...parsed, characterProgress: currentProgress });
          
          if (!parsed.gameMap) {
            await get().generateRoutes();
          }
          return true;
        }
        return false;
      },

      unlockSkill: (id: SkillId, cost: number) => {
        let success = false;
        set((state) => {
          const charId = state.playerCharacter.id;
          const currentProgress = state.characterProgress[charId] || { skillPoints: 0, unlockedSkills: [] };

          if (currentProgress.skillPoints >= cost && !currentProgress.unlockedSkills.includes(id)) {
            success = true;
            return {
              characterProgress: {
                ...state.characterProgress,
                [charId]: {
                  skillPoints: currentProgress.skillPoints - cost,
                  unlockedSkills: [...currentProgress.unlockedSkills, id]
                }
              }
            };
          }
          return state;
        });
        return success;
      },

      setScene: (scene: Scene) => set({ currentScene: scene }),
      setPlayerTeam: (team: Pokemon[]) => set({
        playerTeam: team.map(p => {
          const prepared = calculateStats(p, true);
          const learnedMoves = prepared.learnedMoves && prepared.learnedMoves.length > 0
            ? prepared.learnedMoves
            : (prepared.moves || []).map(m => m.id);
          return { ...prepared, learnedMoves };
        })
      }), // Reverting to not double calculate, but making sure they are calculated upon fetch
      setPlayerCharacter: (character: TrainerCharacter) => set({ playerCharacter: character }),
      setRegion: (region: RegionId) => set((state) => ({
        currentRegion: state.unlockedRegions.includes(region) ? region : state.currentRegion
      })),
      addPokemonToTeam: (pokemon: Pokemon) => 
        set((state) => {
          const prepared = calculateStats(pokemon, true);
          const learnedMoves = prepared.learnedMoves && prepared.learnedMoves.length > 0
            ? prepared.learnedMoves
            : (prepared.moves || []).map(m => m.id);
          const normalized = { ...prepared, learnedMoves };

          if (state.playerTeam.length < 6) {
            return { playerTeam: [...state.playerTeam, normalized] };
          }

          const storage = state.storage || [];
          const cap = state.storageCapacity || 12;
          if (storage.length < cap) {
            return { storage: [...storage, normalized] };
          }

          return state;
        }),
      removePokemonFromTeam: (index: number) => 
        set((state) => {
          const p = state.playerTeam[index];
          const returnEqs = (p.equipments || []).filter(e => e !== null) as Equipment[];
          const bst = p.baseStats
            ? (p.baseStats.hp || 0) + (p.baseStats.attack || 0) + (p.baseStats.defense || 0) +
              (p.baseStats.specialAttack || 0) + (p.baseStats.specialDefense || 0) + (p.baseStats.speed || 0)
            : 300;
          const releaseGold = Math.floor(p.level * 4 + bst / 30);
          return { 
            playerTeam: state.playerTeam.filter((_, i) => i !== index),
            inventory: [...state.inventory, ...returnEqs],
            gold: state.gold + releaseGold
          };
        }),
      healTeam: () => 
        set((state) => ({
          playerTeam: state.playerTeam.map(p => ({ ...p, currentHp: p.maxHp }))
        })),
      restoreTeamPP: () =>
        set((state) => ({
          playerTeam: state.playerTeam.map(p => ({
            ...p,
            moves: (p.moves || []).map(m => ({
              ...m,
              maxPp: m.maxPp ?? 10,
              pp: m.maxPp ?? 10
            }))
          }))
        })),
      startBattle: (enemyTeam: Pokemon[], enemyCharacter?: TrainerCharacter) => {
        const scaledEnemyTeam = enemyTeam.map((p) => {
          const prepared = calculateStats(p, false);
          const hp = Math.floor(prepared.maxHp * 1.20);
          return {
            ...prepared,
            maxHp: hp,
            currentHp: prepared.currentHp === prepared.maxHp ? hp : Math.min(hp, prepared.currentHp),
            attack: Math.floor(prepared.attack * 1.18),
            specialAttack: Math.floor((prepared.specialAttack || prepared.attack) * 1.18),
            defense: Math.floor(prepared.defense * 1.12),
            specialDefense: Math.floor((prepared.specialDefense || prepared.defense) * 1.12),
            speed: Math.floor(prepared.speed * 1.08)
          };
        });
        set({
          enemyTeam: scaledEnemyTeam,
          localEnemyTeam: JSON.parse(JSON.stringify(scaledEnemyTeam)),
          enemyCharacter: enemyCharacter || null,
          currentScene: 'BattleArena',
          battleLog: []
        });
      },
  addBattleLogs: (logs: string[]) =>
    set((state) => {
      const next = [...state.battleLog, ...logs];
      return { battleLog: next.length > 120 ? next.slice(-120) : next };
    }),
  addBattleLog: (log: string) => get().addBattleLogs([log]),
  clearBattleLog: () => set({ battleLog: [] }),
  setPendingExpReward: (amount: number) => set({ pendingExpReward: amount }),
  prepareMoveLearning: async (returnScene: Scene) => {
    const state = get();
    const nextQueue: { pokemonUniqueId: string; newMove: any }[] = [];
    const nextTeam = [...state.playerTeam];
    let teamUpdated = false;

    const inferOfficialPp = (power: number | null | undefined): number => {
      const p = power || 0;
      if (p === 0) return 20;
      if (p <= 40) return 35;
      if (p <= 60) return 25;
      if (p <= 80) return 20;
      if (p <= 95) return 15;
      if (p <= 110) return 10;
      return 5;
    };

    for (let i = 0; i < state.playerTeam.length; i++) {
      const p = state.playerTeam[i];
      if (p.lastMoveCheckLevel === p.level) continue;
      nextTeam[i] = { ...p, lastMoveCheckLevel: p.level };
      teamUpdated = true;
      const uid = p.uniqueId || `${p.id}-${i}`;
      const learnedIdSet = new Set<string>(
        p.learnedMoves && p.learnedMoves.length > 0 ? p.learnedMoves : p.moves.map(m => m.id)
      );
      const learnedNameSet = new Set<string>(p.moves.map(m => m.name));
      p.moves.forEach(m => learnedIdSet.add(m.id));
      (p.learnedMoves || []).forEach(m => learnedIdSet.add(m));

      try {
        const cachedMoves = pokemonMoveListCache.get(p.id);
        let rawMoves: any[] = cachedMoves || [];
        if (!cachedMoves) {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
          const data = await res.json();
          rawMoves = data.moves || [];
          pokemonMoveListCache.set(p.id, rawMoves);
        }

        const allLevelUpMoves = rawMoves
          .flatMap((m: any) => {
            const entries = (m.version_group_details || [])
              .filter((d: any) => d && d.move_learn_method?.name === 'level-up' && typeof d.level_learned_at === 'number')
              .map((d: any) => ({ name: m.move.name, url: m.move.url, level: d.level_learned_at }));
            return entries;
          })
          .filter((m: any) => m.level <= p.level)
          .sort((a: any, b: any) => a.level - b.level);

        const newCandidates = allLevelUpMoves.filter((m: any) => !learnedIdSet.has(m.name));
        const limitedCandidates = newCandidates.slice(0, 2);

        for (const c of limitedCandidates) {
          const cachedMoveData = moveDetailCache.get(c.url);
          let moveData = cachedMoveData;
          if (!cachedMoveData) {
            const moveRes = await fetch(c.url);
            moveData = await moveRes.json();
            moveDetailCache.set(c.url, moveData);
          }
          let zhNameObj = moveData.names.find((n: any) => n.language.name === 'zh-Hans' || n.language.name === 'zh-hans');
          if (!zhNameObj) {
            zhNameObj = moveData.names.find((n: any) => n.language.name === 'zh-Hant' || n.language.name === 'zh-hant');
          }
          const moveName = zhNameObj ? zhNameObj.name : moveData.name;

          const zhFlavorObj = (moveData.flavor_text_entries || []).find((t: any) => t.language?.name === 'zh-Hans' || t.language?.name === 'zh-hans')
            || (moveData.flavor_text_entries || []).find((t: any) => t.language?.name === 'zh-Hant' || t.language?.name === 'zh-hant');
          const zhFlavor = zhFlavorObj?.flavor_text ? String(zhFlavorObj.flavor_text).replace(/\s+/g, ' ') : '';

          const statTranslation: Record<string, string> = {
            attack: '攻击',
            defense: '防御',
            'special-attack': '特攻',
            'special-defense': '特防',
            speed: '速度',
            accuracy: '命中',
            evasion: '闪避'
          };
          const statChanges = (moveData.stat_changes || []).map((s: any) => ({
            stat: statTranslation[s.stat?.name] || s.stat?.name,
            change: s.change
          })).filter((s: any) => s.stat);
          const changeText = statChanges.length > 0
            ? `属性变化：${statChanges.map((s: any) => `${s.stat}${s.change > 0 ? `+${s.change}` : s.change}级`).join('，')}`
            : '';

          if (learnedIdSet.has(moveData.name) || learnedNameSet.has(moveName)) {
            continue;
          }

          const officialPp = (typeof moveData.pp === 'number' && moveData.pp > 0)
            ? moveData.pp
            : inferOfficialPp(moveData.power);

          const recoilPercent = (typeof moveData.meta?.drain === 'number' && moveData.meta.drain < 0)
            ? Math.abs(moveData.meta.drain)
            : undefined;

          const damageClass = moveData.damage_class?.name;
          const power = typeof moveData.power === 'number' ? moveData.power : 0;
          const isStatus = damageClass === 'status' || power === 0;
          const healingPercent = (typeof moveData.meta?.healing === 'number' && moveData.meta.healing > 0)
            ? moveData.meta.healing
            : undefined;
          const description = isStatus
            ? `变化（无伤害）${changeText ? ` · ${changeText}` : ''}${healingPercent ? ` · 回复HP ${healingPercent}%` : ''}${zhFlavor ? ` · ${zhFlavor}` : ''}`
            : zhFlavor;

          nextQueue.push({
            pokemonUniqueId: uid,
            newMove: {
              id: moveData.name,
              name: moveName,
              type: moveData.type.name,
              power,
              accuracy: moveData.accuracy || 100,
              pp: officialPp,
              maxPp: officialPp,
              basePp: officialPp,
              description,
              learnLevel: c.level,
              recoilPercent,
              damageClass,
              statChanges,
              healingPercent
            }
          });
          learnedIdSet.add(moveData.name);
          learnedNameSet.add(moveName);
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (teamUpdated) {
      set({ playerTeam: nextTeam });
    }
    if (nextQueue.length > 0) {
      set({ pendingMoveLearn: nextQueue, moveLearnReturnScene: returnScene, currentScene: 'MoveLearn' });
    }
  },
  resolveMoveLearning: (forgetMoveId: string | null) => set((state) => {
    if (!state.pendingMoveLearn.length) return state;
    const [head, ...rest] = state.pendingMoveLearn;
    const nextTeam = [...state.playerTeam];
    const idx = nextTeam.findIndex((p, i) => (p.uniqueId || `${p.id}-${i}`) === head.pokemonUniqueId);
    if (idx === -1) {
      const nextScene = rest.length === 0 ? (state.moveLearnReturnScene || 'MapSelection') : 'MoveLearn';
      return { pendingMoveLearn: rest, currentScene: nextScene, moveLearnReturnScene: rest.length === 0 ? null : state.moveLearnReturnScene };
    }

    const pokemon = { ...nextTeam[idx] };
    const learned = new Set<string>(pokemon.learnedMoves && pokemon.learnedMoves.length > 0 ? pokemon.learnedMoves : pokemon.moves.map(m => m.id));
    const alreadyKnown = pokemon.moves.some(m => m.id === head.newMove.id || m.name === head.newMove.name);
    learned.add(head.newMove.id);

    if (!alreadyKnown) {
      if (pokemon.moves.length < 4 && !forgetMoveId) {
        pokemon.moves = [...pokemon.moves, head.newMove];
      } else if (forgetMoveId) {
        const replaced = pokemon.moves.some(m => m.id === forgetMoveId);
        pokemon.moves = replaced ? pokemon.moves.map(m => (m.id === forgetMoveId ? head.newMove : m)) : pokemon.moves;
      }
    }

    pokemon.learnedMoves = Array.from(learned);
    nextTeam[idx] = pokemon;

    const nextScene = rest.length === 0 ? (state.moveLearnReturnScene || 'MapSelection') : 'MoveLearn';
    return { playerTeam: nextTeam, pendingMoveLearn: rest, currentScene: nextScene, moveLearnReturnScene: rest.length === 0 ? null : state.moveLearnReturnScene };
  }),
  unlockStorageSlot: () => {
    const state = get();
    const cap = state.storageCapacity || 12;
    if (cap >= 120) return false;
    const unlocked = Math.max(0, cap - 12);
    const cost = (unlocked + 1) * 10;
    if (state.gold < cost) return false;
    set({ gold: state.gold - cost, storageCapacity: cap + 1 });
    return true;
  },
  moveStorageToTeam: (storageIndex: number) => set((state) => {
    if (state.playerTeam.length >= 6) return state;
    if (storageIndex < 0 || storageIndex >= state.storage.length) return state;
    const poke = state.storage[storageIndex];
    return {
      storage: state.storage.filter((_, i) => i !== storageIndex),
      playerTeam: [...state.playerTeam, poke]
    };
  }),
  swapStorageWithTeam: (storageIndex: number, teamIndex: number) => set((state) => {
    if (storageIndex < 0 || storageIndex >= state.storage.length) return state;
    if (teamIndex < 0 || teamIndex >= state.playerTeam.length) return state;
    const nextStorage = [...state.storage];
    const nextTeam = [...state.playerTeam];
    const tmp = nextTeam[teamIndex];
    nextTeam[teamIndex] = nextStorage[storageIndex];
    nextStorage[storageIndex] = tmp;
    return { storage: nextStorage, playerTeam: nextTeam };
  }),
  releaseStoragePokemon: (storageIndex: number) => set((state) => {
    if (storageIndex < 0 || storageIndex >= state.storage.length) return state;
    const p = state.storage[storageIndex];
    const returnEqs = (p.equipments || []).filter(e => e !== null) as Equipment[];
    const bst = p.baseStats
      ? (p.baseStats.hp || 0) + (p.baseStats.attack || 0) + (p.baseStats.defense || 0) +
        (p.baseStats.specialAttack || 0) + (p.baseStats.specialDefense || 0) + (p.baseStats.speed || 0)
      : 300;
    const releaseGold = Math.floor(p.level * 4 + bst / 30);
    return {
      storage: state.storage.filter((_, i) => i !== storageIndex),
      inventory: [...state.inventory, ...returnEqs],
      gold: state.gold + releaseGold
    };
  }),
  addSkillPoints: (amount: number) => set((state) => {
    const charId = state.playerCharacter.id;
    const currentProgress = state.characterProgress[charId] || { skillPoints: 0, unlockedSkills: [] };
    return {
      characterProgress: {
        ...state.characterProgress,
        [charId]: {
          ...currentProgress,
          skillPoints: currentProgress.skillPoints + amount
        }
      }
    };
  }),
  gainExpToPokemon: (pokemonUniqueId: string, amount: number) => {
    const applyExp = (p: Pokemon): Pokemon => {
      let newExp = p.exp + amount;
      let newLevel = p.level;
      let maxExp = p.maxExp;

      while (newExp >= maxExp) {
        newExp -= maxExp;
        newLevel += 1;
        maxExp += 100;
      }

      const updated = calculateStats({ ...p, exp: newExp, level: newLevel, maxExp }, true);
      return updated;
    };

    set((state) => {
      const nextTeam = state.playerTeam.map((p, i) => ((p.uniqueId || `${p.id}-${i}`) === pokemonUniqueId ? applyExp(p) : p));
      const nextStorage = state.storage.map((p, i) => ((p.uniqueId || `${p.id}-${i}`) === pokemonUniqueId ? applyExp(p) : p));
      return { playerTeam: nextTeam, storage: nextStorage };
    });
    void get().prepareMoveLearning(get().currentScene);
  },
  levelUpPokemon: (pokemonUniqueId: string, levels: number) => {
    const applyLevel = (p: Pokemon): Pokemon => {
      const nextLevel = Math.max(1, p.level + levels);
      const levelDiff = nextLevel - p.level;
      const nextMaxExp = p.maxExp + levelDiff * 100;
      const updated = calculateStats({ ...p, level: nextLevel, maxExp: nextMaxExp }, true);
      return updated;
    };

    set((state) => {
      const nextTeam = state.playerTeam.map((p, i) => ((p.uniqueId || `${p.id}-${i}`) === pokemonUniqueId ? applyLevel(p) : p));
      const nextStorage = state.storage.map((p, i) => ((p.uniqueId || `${p.id}-${i}`) === pokemonUniqueId ? applyLevel(p) : p));
      return { playerTeam: nextTeam, storage: nextStorage };
    });
    void get().prepareMoveLearning(get().currentScene);
  },
  applyPokemonBonus: (pokemonUniqueId: string, bonus: BonusStats) => {
    const applyBonus = (p: Pokemon): Pokemon => {
      const current = p.bonusStats || {};
      const merged = {
        maxHp: (current.maxHp || 0) + (bonus.maxHp || 0),
        attack: (current.attack || 0) + (bonus.attack || 0),
        defense: (current.defense || 0) + (bonus.defense || 0),
        specialAttack: (current.specialAttack || 0) + (bonus.specialAttack || 0),
        specialDefense: (current.specialDefense || 0) + (bonus.specialDefense || 0),
        speed: (current.speed || 0) + (bonus.speed || 0)
      };
      return calculateStats({ ...p, bonusStats: merged }, true);
    };

    set((state) => {
      const nextTeam = state.playerTeam.map((p, i) => ((p.uniqueId || `${p.id}-${i}`) === pokemonUniqueId ? applyBonus(p) : p));
      const nextStorage = state.storage.map((p, i) => ((p.uniqueId || `${p.id}-${i}`) === pokemonUniqueId ? applyBonus(p) : p));
      return { playerTeam: nextTeam, storage: nextStorage };
    });
  },
  healPokemon: (pokemonUniqueId: string, percent?: number) => set((state) => {
    const heal = (p: Pokemon): Pokemon => {
      const ratio = typeof percent === 'number' ? Math.max(0, Math.min(1, percent)) : 1;
      const amount = Math.floor(p.maxHp * ratio);
      return { ...p, currentHp: Math.min(p.maxHp, p.currentHp + amount) };
    };
    const nextTeam = state.playerTeam.map((p, i) => ((p.uniqueId || `${p.id}-${i}`) === pokemonUniqueId ? heal(p) : p));
    const nextStorage = state.storage.map((p, i) => ((p.uniqueId || `${p.id}-${i}`) === pokemonUniqueId ? heal(p) : p));
    return { playerTeam: nextTeam, storage: nextStorage };
  }),
  restorePokemonPP: (pokemonUniqueId: string) => set((state) => {
    const restore = (p: Pokemon): Pokemon => ({
      ...p,
      moves: (p.moves || []).map((m) => {
        const maxPp = m.maxPp ?? 10;
        return { ...m, maxPp, pp: maxPp };
      })
    });
    const nextTeam = state.playerTeam.map((p, i) => ((p.uniqueId || `${p.id}-${i}`) === pokemonUniqueId ? restore(p) : p));
    const nextStorage = state.storage.map((p, i) => ((p.uniqueId || `${p.id}-${i}`) === pokemonUniqueId ? restore(p) : p));
    return { playerTeam: nextTeam, storage: nextStorage };
  }),
  boostPokemonMovePP: (pokemonUniqueId: string, moveId: string, kind: 'pp_up' | 'pp_max') => set((state) => {
    const apply = (p: Pokemon): Pokemon => {
      const moves = (p.moves || []).map((m) => {
        if (m.id !== moveId) return m;
        const base = m.basePp ?? m.maxPp ?? 10;
        const currentMax = m.maxPp ?? base;
        const currentPp = m.pp ?? currentMax;
        const cap = Math.floor(base * 1.6);
        if (cap <= 0) return m;
        const inc = Math.max(1, Math.floor(base * 0.2));
        const nextMax = kind === 'pp_max' ? cap : Math.min(cap, currentMax + inc);
        const nextPp = Math.min(nextMax, currentPp + (nextMax - currentMax));
        return { ...m, basePp: base, maxPp: nextMax, pp: nextPp };
      });
      return { ...p, moves };
    };

    const nextTeam = state.playerTeam.map((p, i) => ((p.uniqueId || `${p.id}-${i}`) === pokemonUniqueId ? apply(p) : p));
    const nextStorage = state.storage.map((p, i) => ((p.uniqueId || `${p.id}-${i}`) === pokemonUniqueId ? apply(p) : p));
    return { playerTeam: nextTeam, storage: nextStorage };
  }),
  advanceLevel: () => set((state) => {
    const nextLevel = state.currentLevel + 1;
    const unlockedRegions = getUnlockedRegionsForLevel(nextLevel);
    const currentRegion = unlockedRegions.includes(state.currentRegion) ? state.currentRegion : getLatestUnlockedRegionForLevel(nextLevel);
    
    const charId = state.playerCharacter.id;
    const currentProgress = state.characterProgress[charId] || { skillPoints: 0, unlockedSkills: [] };
    
    // Apply legendary_rate skill to increase NPC (quest) appearance chance
    const baseChance = 0.2;
    const npcChance = currentProgress.unlockedSkills.includes('legendary_rate') ? baseChance + 0.1 : baseChance;
    const npcAvailable = state.activeQuest ? false : Math.random() < npcChance;

    return { currentLevel: nextLevel, unlockedRegions, currentRegion, currentWeather: getWeatherForLevel(), npcAvailable };
  }),
  resetGame: async () => {
    const state = get();
    const charId = state.playerCharacter.id;
    const currentProgress = state.characterProgress[charId] || { skillPoints: 0, unlockedSkills: [] };
    const newProgress = {
      ...currentProgress,
      skillPoints: currentProgress.skillPoints + state.currentLevel
    };

    set({
      characterProgress: {
        ...state.characterProgress,
        [charId]: newProgress
      },
      currentLevel: 1,
      playerCharacter: state.playerCharacter,
      enemyCharacter: null,
      currentRegion: 'kanto',
      unlockedRegions: ['kanto'],
      currentWeather: getWeatherForLevel(),
      npcAvailable: false,
      activeQuest: null,
      readyLegendaryQuest: null,
      gold: newProgress.unlockedSkills.includes('gold_start') ? 500 : 10,
      pendingExpReward: 0,
      pendingMoveLearn: [],
      moveLearnReturnScene: null,
      storage: [],
      storageCapacity: 12,
      playerTeam: [],
      enemyTeam: [],
      localEnemyTeam: [],
      inventory: [],
      pokeBalls: { pokeball: 5, greatball: 0, ultraball: 0, masterball: 0, quickball: 0, timerball: 0, duskball: 0 },
      evolutionMaterials: { megaStone: 0, dynamaxBand: 0, teraOrb: 0 },
      currentScene: 'MainMenu',
      battleLog: [],
      incubator: [],
      gameMap: null // Clear before generate
    });

    await get().generateRoutes();
  },
  setGold: (amount: number) => set({ gold: amount }),
  setNpcAvailable: (available: boolean) => set({ npcAvailable: available }),
  setActiveQuest: (quest: Quest | null) => set({ activeQuest: quest }),
  setReadyLegendaryQuest: (quest: Quest | null) => set({ readyLegendaryQuest: quest }),
  setActiveNode: (nodeId: string) => set((state) => {
    if (!state.gameMap) return {};
    const newNodes = state.gameMap.nodes.map(n => {
      if (n.id === nodeId) return { ...n, status: 'current' as const };
      if (n.layer === state.gameMap!.nodes.find(node => node.id === nodeId)?.layer && n.id !== nodeId) {
        return { ...n, status: 'locked' as const };
      }
      return n;
    });
    return { gameMap: { ...state.gameMap, nodes: newNodes, activeNodeId: nodeId } };
  }),
  generateRoutes: async () => {
    const state = get();
    // Only generate a new map if we don't have one or if we just beat layer 9 (so currentLevel % 10 === 1)
    if (state.gameMap && state.currentLevel % 10 !== 1) {
      // Just update available nodes based on current level and edges
      const currentLayer = (state.currentLevel - 1) % 10;
      const { nodes, edges, activeNodeId } = state.gameMap;
      
      const newNodes = [...nodes];
      const inferredActiveNodeId =
        activeNodeId || newNodes.find((n) => n.status === 'current')?.id || null;

      if (inferredActiveNodeId) {
        const activeNodeIndex = newNodes.findIndex((n) => n.id === inferredActiveNodeId);
        if (activeNodeIndex !== -1) {
          newNodes[activeNodeIndex] = { ...newNodes[activeNodeIndex], status: 'completed' };
        }
      }

      // Mark next layer as available if there's an edge from activeNodeId, else locked
      // Wait, if it's layer 0 (no activeNodeId usually), all layer 0 are available.
      for (let i = 0; i < newNodes.length; i++) {
        const n = newNodes[i];
        if (n.layer === currentLayer) {
          if (currentLayer === 0) {
             newNodes[i] = { ...n, status: 'available' };
          } else if (inferredActiveNodeId) {
             const hasEdge = edges.some(e => e.source === inferredActiveNodeId && e.target === n.id);
             newNodes[i] = { ...n, status: hasEdge ? 'available' : 'locked' };
          }
        }
      }

      if (currentLayer !== 0) {
        const availableCount = newNodes.filter(
          (n) => n.layer === currentLayer && n.status === 'available'
        ).length;
        if (availableCount === 0) {
          for (let i = 0; i < newNodes.length; i++) {
            const n = newNodes[i];
            if (n.layer === currentLayer) {
              newNodes[i] = { ...n, status: 'available' };
            }
          }
        }
      }

      const needTypeNodeIds = newNodes
        .filter((n) => n.status === 'available' && n.type === 'battle' && (!n.knownTypes || n.knownTypes.length === 0))
        .map((n) => n.id);

      set({ gameMap: { ...state.gameMap, nodes: newNodes, activeNodeId: null } });

      if (needTypeNodeIds.length > 0) {
        void (async () => {
          for (const nodeId of needTypeNodeIds) {
            try {
              const knownTypes = await getRandomTypePreviewByRegion(2, get().currentRegion);
              set((s) => {
                if (!s.gameMap) return {};
                const nodes = s.gameMap.nodes.map((n) =>
                  n.id === nodeId
                    ? { ...n, knownTypes, description: `遭遇野生宝可梦或训练家。已知属性: ${knownTypes.join('、')}。` }
                    : n
                );
                return { gameMap: { ...s.gameMap, nodes } };
              });
            } catch (e) {
              set((s) => {
                if (!s.gameMap) return {};
                const nodes = s.gameMap.nodes.map((n) =>
                  n.id === nodeId ? { ...n, knownTypes: [], description: '遭遇未知野生宝可梦或普通训练家。' } : n
                );
                return { gameMap: { ...s.gameMap, nodes } };
              });
            }
          }
        })();
      }
      return;
    }

    // Generate a full new map
    const nodes: RouteNode[] = [];
    const edges: MapEdge[] = [];
    const timestamp = Date.now();
    
    const getRandomType = (layer: number): RouteType => {
      if (layer === 9) return 'elite'; // Boss layer
      if (layer === 0) return 'battle';
      const rand = Math.random();
      if (rand < 0.5) return 'battle';
      if (rand < 0.65) return 'elite';
      if (rand < 0.85) return 'event';
      if (rand < 0.95) return 'shop';
      return 'rest';
    };

    for (let l = 0; l < 10; l++) {
      // 1 node for boss layer, 2-3 for others
      const nodeCount = (l === 9) ? 1 : (Math.random() < 0.4 ? 2 : 3);
      // rows: if 1 node -> row 1. if 2 nodes -> row 0, 2. if 3 nodes -> row 0, 1, 2
      const rows = nodeCount === 1 ? [1] : nodeCount === 2 ? [0, 2] : [0, 1, 2];
      
      for (let n = 0; n < nodeCount; n++) {
        let type = getRandomType(l);
        nodes.push({
          id: `node-${timestamp}-${l}-${n}`,
          layer: l,
          row: rows[n],
          type,
          title: '',
          description: '',
          status: l === 0 ? 'available' : 'locked'
        });
      }
    }

    // Assign titles and initial descriptions
    for (const route of nodes) {
      switch (route.type) {
        case 'battle':
        case 'elite':
          route.title = route.type === 'elite' ? '精英对战' : '普通对战';
          if (route.layer === 9) route.title = '层级领主';
          route.description = '遭遇野生宝可梦或普通训练家。';
          break;
        case 'event':
          route.title = '未知事件';
          route.description = '可能会有奇遇，也可能会遭遇陷阱...';
          break;
        case 'shop':
          route.title = '旅行商人';
          route.description = '花费金币购买道具和精灵球。';
          break;
        case 'rest':
          route.title = '营地休息';
          route.description = '恢复全体宝可梦HP和PP。';
          break;
      }
    }

    // Connect edges
    for (let l = 0; l < 9; l++) {
      const currentNodes = nodes.filter(n => n.layer === l);
      const nextNodes = nodes.filter(n => n.layer === l + 1);
      
      // Special logic: limit cross connections to prevent too many lines
      // Ensure every next node has at least one incoming from a reachable row
      nextNodes.forEach(nextN => {
         // Prefer connecting to nodes in the same row or adjacent rows
         const validSources = currentNodes.filter(n => Math.abs(n.row - nextN.row) <= 1);
         const sourcePool = validSources.length > 0 ? validSources : currentNodes;
         const source = sourcePool[Math.floor(Math.random() * sourcePool.length)];
         edges.push({ source: source.id, target: nextN.id });
      });
      
      // Ensure every current node has at least one outgoing to a reachable row
      currentNodes.forEach(currN => {
         if (!edges.some(e => e.source === currN.id)) {
            const validTargets = nextNodes.filter(n => Math.abs(n.row - currN.row) <= 1);
            const targetPool = validTargets.length > 0 ? validTargets : nextNodes;
            const target = targetPool[Math.floor(Math.random() * targetPool.length)];
            edges.push({ source: currN.id, target: target.id });
         }
      });
    }

    const needTypeNodeIds = nodes
      .filter((n) => n.layer === 0 && n.type === 'battle')
      .map((n) => n.id);

    set({ gameMap: { nodes, edges, activeNodeId: null } });

    if (needTypeNodeIds.length > 0) {
      void (async () => {
        for (const nodeId of needTypeNodeIds) {
          try {
            const knownTypes = await getRandomTypePreviewByRegion(2, get().currentRegion);
            set((s) => {
              if (!s.gameMap) return {};
              const nodes = s.gameMap.nodes.map((n) =>
                n.id === nodeId
                  ? { ...n, knownTypes, description: `遭遇野生宝可梦或训练家。已知属性: ${knownTypes.join('、')}。` }
                  : n
              );
              return { gameMap: { ...s.gameMap, nodes } };
            });
          } catch (e) {
            set((s) => {
              if (!s.gameMap) return {};
              const nodes = s.gameMap.nodes.map((n) =>
                n.id === nodeId ? { ...n, knownTypes: [], description: '遭遇未知野生宝可梦或普通训练家。' } : n
              );
              return { gameMap: { ...s.gameMap, nodes } };
            });
          }
        }
      })();
    }
  },
  advanceNode: async (nextScene: Scene = 'MapSelection', showDelay: boolean = false) => {
    const store = get();
    store.advanceLevel();
    const expReward = get().pendingExpReward;
    if (expReward > 0) {
      get().gainExp(expReward);
      set({ pendingExpReward: 0 });
    }
    const nodeGold = Math.floor(Math.random() * 6) + 5 + Math.floor(get().currentLevel * 1.5);
    set((s) => ({ gold: s.gold + nodeGold }));
    get().addBattleLog(`💰 过关奖励 +${nodeGold} 金币`);
    await get().generateRoutes();
    
    // We get the fresh state after advanceLevel
    const updatedStore = get();
    const hasEvolution = await updatedStore.checkEvolutions();
    const hatchedPokemons = await updatedStore.progressEggs();
    const nextLevel = updatedStore.currentLevel;

    if (nextLevel % 3 === 0) {
      await updatedStore.saveGame('auto', `自动存档 (第${nextLevel}层)`);
      updatedStore.addBattleLog(`💾 游戏已自动保存。`);
    }

    const navigateNext = async () => {
      if (updatedStore.playerTeam.length > 6) {
        updatedStore.setScene('TeamManagement');
      } else {
        await updatedStore.prepareMoveLearning(nextScene);
        if (!get().pendingMoveLearn.length) {
          updatedStore.setScene(nextScene);
        }
      }
    };

    if (showDelay && (hasEvolution || hatchedPokemons.length > 0)) {
      setTimeout(() => { navigateNext(); }, 4000);
    } else {
      await navigateNext();
    }
  },
  progressQuest: (kind: 'win' | 'catch') => set((state) => {
    if (!state.activeQuest) return state;
    if (state.activeQuest.kind !== kind) return state;
    const nextProgress = state.activeQuest.progress + 1;
    const finished = nextProgress >= state.activeQuest.target;
    const updatedQuest = { ...state.activeQuest, progress: nextProgress };
    
    if (!finished) {
      return { 
        activeQuest: updatedQuest,
        battleLog: [...state.battleLog, `📜 支线进度更新：${updatedQuest.title} (${nextProgress}/${updatedQuest.target})`]
      };
    }

    if (updatedQuest.isLegendary) {
      return { 
        activeQuest: null, 
        readyLegendaryQuest: updatedQuest,
        battleLog: [...state.battleLog, `🎉 【${updatedQuest.title}】前置任务已完成！特殊层已开启。`]
      };
    }

    const rewardGold = updatedQuest.reward.gold || 0;
    const ballsReward = updatedQuest.reward.balls || {};
    const materialsReward = updatedQuest.reward.materials || {};
    
    const nextBalls = { ...state.pokeBalls };
    Object.keys(ballsReward).forEach((k) => {
      nextBalls[k] = (nextBalls[k] || 0) + (ballsReward[k] || 0);
    });

    const nextMaterials = { ...state.evolutionMaterials };
    Object.keys(materialsReward).forEach((k) => {
      const matKey = k as keyof typeof nextMaterials;
      nextMaterials[matKey] = (nextMaterials[matKey] || 0) + (materialsReward[matKey] || 0);
    });

    const rewardTextParts: string[] = [];
    if (rewardGold > 0) rewardTextParts.push(`💰${rewardGold}`);
    Object.keys(ballsReward).forEach((k) => {
      const v = ballsReward[k];
      if (!v) return;
      const name = k === 'pokeball' ? '精灵球' : k === 'greatball' ? '超级球' : k === 'ultraball' ? '高级球' : k === 'masterball' ? '大师球' : k === 'quickball' ? '先机球' : k === 'timerball' ? '计时球' : k === 'duskball' ? '黑暗球' : k;
      rewardTextParts.push(`${name}x${v}`);
    });
    Object.keys(materialsReward).forEach((k) => {
      const v = materialsReward[k as keyof typeof materialsReward];
      if (!v) return;
      const name = k === 'megaStone' ? 'Mega石' : k === 'dynamaxBand' ? '极巨腕带' : k === 'teraOrb' ? '太晶珠' : k;
      rewardTextParts.push(`💎${name}x${v}`);
    });

    const rewardText = rewardTextParts.length ? `获得奖励：${rewardTextParts.join('，')}` : '获得奖励！';
    return { 
      activeQuest: null, 
      gold: state.gold + rewardGold, 
      pokeBalls: nextBalls, 
      evolutionMaterials: nextMaterials,
      battleLog: [...state.battleLog, `🎉 支线完成：${updatedQuest.title}，${rewardText}`] 
    };
  }),
  
  addPokeBall: (type: string, amount: number) => set((state) => ({
    pokeBalls: { ...state.pokeBalls, [type]: (state.pokeBalls[type] || 0) + amount }
  })),
  usePokeBall: (type: string) => {
    const state = get();
    if ((state.pokeBalls[type] || 0) > 0) {
      set({ pokeBalls: { ...state.pokeBalls, [type]: state.pokeBalls[type] - 1 } });
      return true;
    }
    return false;
  },

  addEvolutionMaterial: (type, amount) => set((state) => ({
    evolutionMaterials: {
      ...state.evolutionMaterials,
      [type]: state.evolutionMaterials[type] + amount
    }
  })),

  applyExtraEvolution: (pokemonIndex, form) => {
    let success = false;
    set((state) => {
      const materials = { ...state.evolutionMaterials };
      const materialMap = {
        'mega': 'megaStone',
        'dynamax': 'dynamaxBand',
        'tera': 'teraOrb'
      } as const;
      
      const materialType = materialMap[form];
      if (materials[materialType] > 0) {
        const newTeam = [...state.playerTeam];
        const pokemon = { ...newTeam[pokemonIndex] };
        
        if (pokemon.extraForm) {
          return state; // Already evolved
        }

        materials[materialType] -= 1;
        pokemon.extraForm = form;
        
        if (form === 'tera') {
          pokemon.teraType = pokemon.types[0]; // Set default tera type
        }

        const evolvedPokemon = calculateStats(pokemon, true);
        // Mega进化时直接回满血
        if (form === 'mega') {
          evolvedPokemon.currentHp = evolvedPokemon.maxHp;
        }

        newTeam[pokemonIndex] = evolvedPokemon;
        success = true;
        return {
          playerTeam: newTeam,
          evolutionMaterials: materials,
          battleLog: [...state.battleLog, `你的 ${pokemon.name} 进行了 ${form === 'mega' ? 'Mega进化' : form === 'dynamax' ? '极巨化' : '太晶化'}!`]
        };
      }
      return state;
    });
    return success;
  },

  addEquipment: (eq: Equipment) => set((state) => ({ inventory: [...state.inventory, eq] })),
  equipItem: (pokemonIndex: number, slotIndex: number, equipment: Equipment) => set((state) => {
    const team = [...state.playerTeam];
    const pokemon = { ...team[pokemonIndex], equipments: [...(team[pokemonIndex].equipments || [null, null, null])] };
    const newInventory = state.inventory.filter(e => e.id !== equipment.id); // 从背包移除该物品
    
    if (pokemon.equipments[slotIndex]) {
      newInventory.push(pokemon.equipments[slotIndex] as Equipment); // 把原位置装备放回背包
    }
    pokemon.equipments[slotIndex] = equipment;
    
    team[pokemonIndex] = calculateStats(pokemon, true);
    return { playerTeam: team, inventory: newInventory };
  }),
  unequipItem: (pokemonIndex: number, slotIndex: number) => set((state) => {
    const team = [...state.playerTeam];
    const pokemon = { ...team[pokemonIndex], equipments: [...(team[pokemonIndex].equipments || [null, null, null])] };
    if (!pokemon.equipments[slotIndex]) return state;
    
    const newInventory = [...state.inventory, pokemon.equipments[slotIndex] as Equipment];
    pokemon.equipments[slotIndex] = null;
    
    team[pokemonIndex] = calculateStats(pokemon, true);
    return { playerTeam: team, inventory: newInventory };
  }),
  
  gainExp: (amount: number) => set((state) => {
    const team = [...state.playerTeam].map(p => {
      let newExp = p.exp + amount;
      let newLevel = p.level;
      let maxExp = p.maxExp;
      let leveledUp = false;

      // 防止等级溢出，这里暂定上限 100 级
      while (newExp >= maxExp && newLevel < 100) {
        newExp -= maxExp;
        newLevel++;
        maxExp = Math.pow(newLevel, 2) * 10;
        leveledUp = true;
      }

      let updated = { ...p, exp: newExp, level: newLevel, maxExp };
      if (leveledUp) {
        updated = calculateStats(updated, true);
        // 升级时恢复一定状态，或者直接满血，为了体验这里给它满血
        updated.currentHp = updated.maxHp;
      }
      return updated;
    });
    return { playerTeam: team };
  }),

  evolvePokemon: (index: number, newPokemonData: Partial<Pokemon>) => set((state) => {
    const team = [...state.playerTeam];
    const oldP = team[index];
    const evolved = {
      ...oldP,
      id: newPokemonData.id!,
      name: newPokemonData.name!,
      baseStats: newPokemonData.baseStats!,
      spriteUrl: newPokemonData.spriteUrl!,
      backSpriteUrl: newPokemonData.backSpriteUrl!,
      types: newPokemonData.types!,
      evolvesTo: newPokemonData.evolvesTo,
      evolutionLevel: newPokemonData.evolutionLevel,
    };
    team[index] = calculateStats(evolved, true);
    return { playerTeam: team };
  }),

  checkEvolutions: async () => {
    const { playerTeam, evolvePokemon, addBattleLog } = get();
    let evolved = false;

    for (let i = 0; i < playerTeam.length; i++) {
      const p = playerTeam[i];

      if (p.evolvesTo && p.level >= (p.evolutionLevel || 100)) {
        addBattleLog(`${p.name} 正在进化！`);
        try {
          const newData = await fetchPokemonById(p.evolvesTo, p.level);
          evolvePokemon(i, newData);
          addBattleLog(`进化成了 ${newData.name}！`);
          evolved = true;
          Object.assign(p, newData);
        } catch (e) {
          console.error("Evolution failed", e);
        }
      }
    }

    return evolved;
  },

  addEgg: (egg: PokemonEgg) => set((state) => ({ incubator: [...state.incubator, egg] })),
  
  progressEggs: async () => {
    const state = get();
    const newIncubator: PokemonEgg[] = [];
    const hatchedEggs: PokemonEgg[] = [];

    for (const egg of state.incubator) {
      const newSteps = egg.stepsRemaining - 1;
      if (newSteps <= 0) {
        hatchedEggs.push(egg);
      } else {
        newIncubator.push({ ...egg, stepsRemaining: newSteps });
      }
    }

    set({ incubator: newIncubator });

    const hatchedPokemons: Pokemon[] = [];
    if (hatchedEggs.length > 0) {
      const maxLevel = Math.max(1, ...state.playerTeam.map(p => p.level));
      for (const egg of hatchedEggs) {
        try {
          const p = await fetchPokemonById(egg.pokemonId, maxLevel);
          p.uniqueId = `${p.id}-${Date.now()}-${Math.random()}`;
          hatchedPokemons.push(calculateStats(p, true));
          get().addBattleLog(`🎊 孵蛋箱传来动静... ${egg.pokemonName} 的蛋孵化了！获得了 Lv.${maxLevel} ${p.name}！`);
        } catch (e) {
          console.error("Egg hatch failed", e);
        }
      }
      if (hatchedPokemons.length > 0) {
        hatchedPokemons.forEach(p => get().addPokemonToTeam(p));
      }
    }
    return hatchedPokemons;
  }
}));

export default useGameStore;
