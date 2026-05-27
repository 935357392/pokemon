import { Pokemon } from '../types';
import useGameStore from '../store/gameStore';

export const calculateStats = (pokemon: Pokemon, isPlayer: boolean = false): Pokemon => {
  const calcStat = (base: number, lvl: number, isHp: boolean) => {
    if (isHp) return Math.floor(0.01 * (2 * base) * lvl) + lvl + 10;
    return Math.floor(0.01 * (2 * base) * lvl) + 5;
  };

  let maxHpMultiplier = 1;
  let attackMultiplier = 1;
  let defenseMultiplier = 1;
  let specialAttackMultiplier = 1;
  let specialDefenseMultiplier = 1;
  let speedMultiplier = 1;

  const activeEquipments = (pokemon.equipments || []).filter(e => e !== null);
  
  activeEquipments.forEach(eq => {
    if (!eq) return;
    if (eq.type === 'special' && eq.id === 'a_1') { // 阿尔宙斯石板
      maxHpMultiplier *= eq.value || 1;
      attackMultiplier *= eq.value || 1;
      defenseMultiplier *= eq.value || 1;
      specialAttackMultiplier *= eq.value || 1;
      specialDefenseMultiplier *= eq.value || 1;
      speedMultiplier *= eq.value || 1;
    } else if (eq.type === 'stat_boost') {
      if (eq.stat === 'maxHp') maxHpMultiplier *= (eq.value || 1);
      if (eq.stat === 'attack') attackMultiplier *= (eq.value || 1);
      if (eq.stat === 'defense') defenseMultiplier *= (eq.value || 1);
      if (eq.stat === 'speed') speedMultiplier *= (eq.value || 1);
    }
  });

  // Apply Skill Tree Modifiers only for player
  if (isPlayer) {
    const charId = useGameStore.getState().playerCharacter?.id;
    const unlockedSkills = charId ? (useGameStore.getState().characterProgress[charId]?.unlockedSkills || []) : [];
    if (unlockedSkills.includes('hp_up')) maxHpMultiplier += 0.1;
    if (unlockedSkills.includes('atk_up')) attackMultiplier += 0.1;
    if (unlockedSkills.includes('def_up')) defenseMultiplier += 0.1;
    if (unlockedSkills.includes('speed_up')) speedMultiplier += 0.1;
  }

  let maxHp = Math.floor(calcStat(pokemon.baseStats.hp, pokemon.level, true) * maxHpMultiplier);
  let attack = Math.floor(calcStat(pokemon.baseStats.attack, pokemon.level, false) * attackMultiplier);
  let defense = Math.floor(calcStat(pokemon.baseStats.defense, pokemon.level, false) * defenseMultiplier);
  let specialAttack = Math.floor(calcStat(pokemon.baseStats.specialAttack || 0, pokemon.level, false) * specialAttackMultiplier);
  let specialDefense = Math.floor(calcStat(pokemon.baseStats.specialDefense || 0, pokemon.level, false) * specialDefenseMultiplier);
  let speed = Math.floor(calcStat(pokemon.baseStats.speed, pokemon.level, false) * speedMultiplier);

  // Apply extra form boosts
  if (pokemon.extraForm === 'mega') {
    attack = Math.floor(attack * 1.3);
    defense = Math.floor(defense * 1.3);
    specialAttack = Math.floor(specialAttack * 1.3);
    specialDefense = Math.floor(specialDefense * 1.3);
    speed = Math.floor(speed * 1.3);
    maxHp = Math.floor(maxHp * 1.2);
  } else if (pokemon.extraForm === 'dynamax') {
    maxHp = maxHp * 2;
    attack = Math.floor(attack * 1.1);
    specialAttack = Math.floor(specialAttack * 1.1);
  } else if (pokemon.extraForm === 'tera') {
    attack = Math.floor(attack * 1.4);
    defense = Math.floor(defense * 1.1);
    specialAttack = Math.floor(specialAttack * 1.4);
    specialDefense = Math.floor(specialDefense * 1.1);
  }

  const bonus = pokemon.bonusStats || {};
  maxHp += bonus.maxHp || 0;
  attack += bonus.attack || 0;
  defense += bonus.defense || 0;
  specialAttack += bonus.specialAttack || 0;
  specialDefense += bonus.specialDefense || 0;
  speed += bonus.speed || 0;

  const hpPercent = pokemon.maxHp > 0 ? pokemon.currentHp / pokemon.maxHp : 1;
  
  return {
    ...pokemon,
    maxHp,
    currentHp: pokemon.currentHp === pokemon.maxHp ? maxHp : Math.min(maxHp, Math.ceil(maxHp * hpPercent)),
    attack,
    defense,
    specialAttack,
    specialDefense,
    speed
  };
};
