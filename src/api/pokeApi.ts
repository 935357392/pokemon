import { Pokemon, Move, RegionId } from '../types';
import useGameStore from '../store/gameStore';

const legendaryIds = new Set([
  144, 145, 146, 150, 151, // Gen 1
  243, 244, 245, 249, 250, 251, // Gen 2
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386, // Gen 3
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493 // Gen 4
]);

const isLegendary = (id: number) => legendaryIds.has(id);

const typeTranslation: Record<string, string> = {
  normal: '一般',
  fighting: '格斗',
  flying: '飞行',
  poison: '毒',
  ground: '地面',
  rock: '岩石',
  bug: '虫',
  ghost: '幽灵',
  steel: '钢',
  fire: '火',
  water: '水',
  grass: '草',
  electric: '电',
  psychic: '超能力',
  ice: '冰',
  dragon: '龙',
  dark: '恶',
  fairy: '妖精',
  stellar: '星晶',
  unknown: '未知',
};

const statTranslation: Record<string, string> = {
  attack: '攻击',
  defense: '防御',
  'special-attack': '特攻',
  'special-defense': '特防',
  speed: '速度',
  accuracy: '命中',
  evasion: '闪避'
};

export async function fetchPokemonById(id: number, level: number = 1, forceShiny: boolean = false): Promise<Pokemon> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  
  const speciesRes = await fetch(data.species.url);
  const speciesData = await speciesRes.json();
  
  // 强制优先使用简体中文 'zh-Hans' 或 'zh-hans'
  let zhNameObj = speciesData.names.find((n: any) => n.language.name === 'zh-Hans' || n.language.name === 'zh-hans');
  
  // 如果没有简体中文，退而求其次找繁体中文
  if (!zhNameObj) {
    zhNameObj = speciesData.names.find((n: any) => n.language.name === 'zh-Hant' || n.language.name === 'zh-hant');
  }

  const zhName = zhNameObj ? zhNameObj.name : data.name.toUpperCase();
  
  let evolvesTo: number | undefined = undefined;
  let evolutionLevel: number | undefined = undefined;
  let gender: 'male' | 'female' | 'genderless' = 'genderless';
  
  if (speciesData.gender_rate !== -1) {
    // gender_rate 是女性的比例（满分8），例如 4 代表 50%
    const rand = Math.floor(Math.random() * 8);
    gender = rand < speciesData.gender_rate ? 'female' : 'male';
  }
  
  try {
    const evoRes = await fetch(speciesData.evolution_chain.url);
    const evoData = await evoRes.json();
    
    const findEvo = (chain: any): any => {
      if (chain.species.name === data.name || chain.species.url === data.species.url) {
        return chain.evolves_to[0];
      }
      for (const next of chain.evolves_to) {
        const found = findEvo(next);
        if (found) return found;
      }
      return null;
    };
    
    const nextEvo = findEvo(evoData.chain);
    if (nextEvo) {
      const urlParts = nextEvo.species.url.split('/');
      evolvesTo = parseInt(urlParts[urlParts.length - 2]);
      
      // 尝试获取官方进化等级
      const details = nextEvo.evolution_details[0];
      if (details) {
        if (details.min_level) {
          evolutionLevel = details.min_level;
        } else if (details.trigger?.name === 'use-item') {
          // 使用道具进化，这里我们简化为默认20级或30级
          evolutionLevel = 25;
        } else if (details.trigger?.name === 'trade') {
          // 通信进化，简化为较高等级
          evolutionLevel = 35;
        } else if (details.min_happiness) {
          // 亲密度进化
          evolutionLevel = 20;
        } else {
          evolutionLevel = 30; // 兜底
        }
      } else {
        evolutionLevel = level + 10;
      }
    }
  } catch (e) {
    console.error("Failed to fetch evolution data", e);
  }

  const baseStats = {
    hp: data.stats.find((s: any) => s.stat.name === 'hp').base_stat,
    attack: data.stats.find((s: any) => s.stat.name === 'attack').base_stat,
    defense: data.stats.find((s: any) => s.stat.name === 'defense').base_stat,
    specialAttack: data.stats.find((s: any) => s.stat.name === 'special-attack')?.base_stat ?? 0,
    specialDefense: data.stats.find((s: any) => s.stat.name === 'special-defense')?.base_stat ?? 0,
    speed: data.stats.find((s: any) => s.stat.name === 'speed').base_stat,
  };

  const moves: Move[] = [];
  
  // 从返回的技能列表中，筛选出等级学习且 <= 当前等级的技能
  const levelUpMoves = data.moves
    .filter((m: any) => {
      const details = m.version_group_details[0];
      return details && details.move_learn_method.name === 'level-up' && details.level_learned_at <= level;
    })
    .sort((a: any, b: any) => b.version_group_details[0].level_learned_at - a.version_group_details[0].level_learned_at);

  // 取最近学习的 4 个技能（如果没有足够的真实技能，再用基础兜底）
  const selectedMoves = levelUpMoves.slice(0, 4).map((m: any) => ({
    url: m.move.url,
    learnLevel: m.version_group_details[0].level_learned_at
  }));

  // 根据招式威力推断官方惯例 PP 值（威力越高，PP 越低）
  // 参考宝可梦官方：撞击 35 / 水枪 25 / 十万伏特 15 / 冲浪 15 / 破坏死光 5
  const inferOfficialPp = (power: number | null | undefined): number => {
    const p = power || 0;
    if (p === 0) return 20;       // 变化招式（如叫声、瞪眼）
    if (p <= 40) return 35;       // 撞击、电光一闪 等
    if (p <= 60) return 25;       // 水枪、喷射火焰弱化版
    if (p <= 80) return 20;       // 泡沫光线、碎岩 等
    if (p <= 95) return 15;       // 十万伏特、冲浪、喷射火焰 等
    if (p <= 110) return 10;      // 高威力主力技
    return 5;                     // 破坏死光、巨声波 等大招
  };

  // 兜底基础技能逻辑
  if (selectedMoves.length === 0) {
    data.types.forEach((t: any) => {
      const typeName = t.type.name;
      const translatedType = typeTranslation[typeName] || typeName;
      const power = 40 + Math.floor(Math.random() * 40);
      const officialPp = inferOfficialPp(power);
      moves.push({
        id: `${typeName}-attack`,
        name: `${translatedType}攻击`,
        type: typeName,
        power,
        accuracy: 95,
        pp: officialPp,
        maxPp: officialPp,
        basePp: officialPp,
        description: `基础的 ${translatedType} 属性攻击`
      });
    });
    moves.push({
      id: 'tackle',
      name: '撞击',
      type: 'normal',
      power: 40,
      accuracy: 100,
      pp: 35, // 官方撞击 PP = 35
      maxPp: 35,
      basePp: 35,
      description: '基础普通攻击'
    });
  } else {
    // 异步获取真实的技能详细数据（如威力、命中、属性、中文名）
    for (const selected of selectedMoves) {
      try {
        const moveRes = await fetch(selected.url);
        const moveData = await moveRes.json();
        
        let zhNameObj = moveData.names.find((n: any) => n.language.name === 'zh-Hans' || n.language.name === 'zh-hans');
        if (!zhNameObj) {
          zhNameObj = moveData.names.find((n: any) => n.language.name === 'zh-Hant' || n.language.name === 'zh-hant');
        }
        const moveName = zhNameObj ? zhNameObj.name : moveData.name;

        const zhFlavorObj = (moveData.flavor_text_entries || []).find((t: any) => t.language?.name === 'zh-Hans' || t.language?.name === 'zh-hans')
          || (moveData.flavor_text_entries || []).find((t: any) => t.language?.name === 'zh-Hant' || t.language?.name === 'zh-hant');
        const zhFlavor = zhFlavorObj?.flavor_text ? String(zhFlavorObj.flavor_text).replace(/\s+/g, ' ') : '';

        const statChanges = (moveData.stat_changes || []).map((s: any) => ({
          stat: statTranslation[s.stat?.name] || s.stat?.name,
          change: s.change
        })).filter((s: any) => s.stat);
        const changeText = statChanges.length > 0
          ? `属性变化：${statChanges.map((s: any) => `${s.stat}${s.change > 0 ? `+${s.change}` : s.change}级`).join('，')}`
          : '';
        
        // PokeAPI 的 moveData.pp 即为宝可梦官方 PP 值；若缺失则根据威力推断
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

        moves.push({
          id: moveData.name,
          name: moveName,
          type: moveData.type.name,
          power,
          accuracy: moveData.accuracy || 100,
          pp: officialPp,
          maxPp: officialPp,
          basePp: officialPp,
          description,
          learnLevel: selected.learnLevel,
          recoilPercent,
          damageClass,
          statChanges,
          healingPercent
        });
      } catch (e) {
        console.error("Failed to fetch move data", e);
      }
    }
  }

  // Apply shiny rate skill if applicable
  const charId = useGameStore.getState().playerCharacter?.id;
  const unlockedSkills = charId ? (useGameStore.getState().characterProgress[charId]?.unlockedSkills || []) : [];
  const shinyRate = unlockedSkills.includes('shiny_rate') ? 0.05 : 0.01; // 1% -> 5%
  
  const isShiny = forceShiny || Math.random() < shinyRate;

  let spriteUrl = data.sprites.front_default;
  let backSpriteUrl = data.sprites.back_default;

  if (isShiny) {
    if (gender === 'female' && data.sprites.front_shiny_female) {
      spriteUrl = data.sprites.front_shiny_female;
      backSpriteUrl = data.sprites.back_shiny_female || data.sprites.back_shiny || spriteUrl;
    } else {
      spriteUrl = data.sprites.front_shiny || spriteUrl;
      backSpriteUrl = data.sprites.back_shiny || backSpriteUrl || spriteUrl;
    }
  } else {
    if (gender === 'female' && data.sprites.front_female) {
      spriteUrl = data.sprites.front_female;
      backSpriteUrl = data.sprites.back_female || data.sprites.back_default || spriteUrl;
    } else {
      spriteUrl = spriteUrl || data.sprites.other['official-artwork'].front_default;
      backSpriteUrl = backSpriteUrl || spriteUrl;
    }
  }
  
  if (!spriteUrl) spriteUrl = data.sprites.other['official-artwork'].front_default;
  if (!backSpriteUrl) backSpriteUrl = spriteUrl;

  const pokemon: Pokemon = {
    id: data.id,
    name: zhName,
    types: data.types.map((t: any) => typeTranslation[t.type.name] || t.type.name),
    level,
    exp: 0,
    maxExp: Math.pow(level, 2) * 10,
    baseStats,
    maxHp: 1, currentHp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1,
    moves: moves.slice(0, 4),
    learnedMoves: moves.slice(0, 4).map(m => m.id),
    lastMoveCheckLevel: level,
    spriteUrl,
    backSpriteUrl,
    equipments: [null, null, null],
    evolvesTo,
    evolutionLevel,
    isShiny,
    gender
  };

  const calcStat = (base: number, lvl: number, isHp: boolean) => {
    if (isHp) return Math.floor(0.01 * (2 * base) * lvl) + lvl + 10;
    return Math.floor(0.01 * (2 * base) * lvl) + 5;
  };
  
  pokemon.maxHp = calcStat(baseStats.hp, level, true);
  pokemon.currentHp = pokemon.maxHp;
  pokemon.attack = calcStat(baseStats.attack, level, false);
  pokemon.defense = calcStat(baseStats.defense, level, false);
  pokemon.specialAttack = calcStat(baseStats.specialAttack || 0, level, false);
  pokemon.specialDefense = calcStat(baseStats.specialDefense || 0, level, false);
  pokemon.speed = calcStat(baseStats.speed, level, false);

  return pokemon;
}

export async function getRandomPokemons(count: number, level: number): Promise<Pokemon[]> {
  const promises = [];
  const selectedIds = new Set<number>();

  for (let i = 0; i < count; i++) {
    let randomId;
    do {
      randomId = Math.floor(Math.random() * 493) + 1;
    } while (isLegendary(randomId) || selectedIds.has(randomId));
    
    selectedIds.add(randomId);
    promises.push(fetchPokemonById(randomId, level));
  }
  return Promise.all(promises);
}

export async function getRandomPokemonsByRegion(count: number, level: number, region: RegionId): Promise<Pokemon[]> {
  const ranges: Record<RegionId, [number, number]> = {
    kanto: [1, 151],
    johto: [152, 251],
    hoenn: [252, 386],
    sinnoh: [387, 493],
    unova: [494, 649],
    kalos: [650, 721],
    alola: [722, 809],
    galar: [810, 898],
    paldea: [906, 1025]
  };

  const [minId, maxId] = ranges[region];
  const promises = [];
  const selectedIds = new Set<number>();

  for (let i = 0; i < count; i++) {
    let randomId;
    do {
      randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
    } while (isLegendary(randomId) || selectedIds.has(randomId));

    selectedIds.add(randomId);
    promises.push(fetchPokemonById(randomId, level));
  }
  return Promise.all(promises);
}

export async function getRandomTypePreviewByRegion(sampleCount: number, region: RegionId): Promise<string[]> {
  const ranges: Record<RegionId, [number, number]> = {
    kanto: [1, 151],
    johto: [152, 251],
    hoenn: [252, 386],
    sinnoh: [387, 493],
    unova: [494, 649],
    kalos: [650, 721],
    alola: [722, 809],
    galar: [810, 898],
    paldea: [906, 1025]
  };

  const [minId, maxId] = ranges[region];
  const selectedIds = new Set<number>();
  const known = new Set<string>();

  for (let i = 0; i < sampleCount; i++) {
    let randomId;
    do {
      randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
    } while (isLegendary(randomId) || selectedIds.has(randomId));
    selectedIds.add(randomId);

    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
      const data = await res.json();
      (data.types || []).forEach((t: any) => {
        const typeName = t.type?.name;
        if (typeName) known.add(typeTranslation[typeName] || typeName);
      });
    } catch (e) {
      console.error(e);
    }
  }

  return Array.from(known).slice(0, 3);
}

export async function getInitialPoolPokemons(count: number = 20): Promise<Pokemon[]> {
  const promises = [];
  const selectedIds = new Set<number>();
  
  // 必定包含的宝可梦：皮卡丘(25), 呆呆兽(79), 小火龙(4), 妙蛙种子(1), 杰尼龟(7)
  const guaranteedIds = [25, 79, 4, 1, 7];
  guaranteedIds.forEach(id => selectedIds.add(id));
  
  const finalIds = [...guaranteedIds];

  // 补充剩余的随机宝可梦
  while (finalIds.length < count) {
    const randomId = Math.floor(Math.random() * 386) + 1;
    if (!isLegendary(randomId) && !selectedIds.has(randomId)) {
      selectedIds.add(randomId);
      finalIds.push(randomId);
    }
  }
  
  // 决定哪一个位置是必定闪光的
  const forcedShinyIndex = Math.floor(Math.random() * count);

  for (let i = 0; i < finalIds.length; i++) {
    const randomId = finalIds[i];
    const level = 1;
    const shouldForceShiny = i === forcedShinyIndex;
    
    promises.push(fetchPokemonById(randomId, level, shouldForceShiny).then(p => {
      // 根据种族值总和(BST)评估费用
      const bst = p.baseStats.hp + p.baseStats.attack + p.baseStats.defense + p.baseStats.speed;
      let cost = 2; // 默认造价 2 金币
      if (bst > 250) cost = 3;
      if (bst > 350) cost = 4;
      
      p.cost = cost;
      p.uniqueId = `${p.id}-${Math.random().toString(36).substr(2, 9)}`;
      return p;
    }));
  }
  const results = await Promise.all(promises);
  return results;
}
