import { Equipment, Rarity } from '../types';

export const allEquipments: Equipment[] = [
  // 普通 (Common)
  { id: 'c_1', name: '力量护腕', description: '攻击力提升 10%', type: 'stat_boost', stat: 'attack', value: 1.1, rarity: 'common' },
  { id: 'c_2', name: '铁壁铠甲', description: '防御力提升 10%', type: 'stat_boost', stat: 'defense', value: 1.1, rarity: 'common' },
  { id: 'c_3', name: '轻盈靴', description: '速度提升 10%', type: 'stat_boost', stat: 'speed', value: 1.1, rarity: 'common' },
  { id: 'c_4', name: '生命护身符', description: '最大HP提升 10%', type: 'stat_boost', stat: 'maxHp', value: 1.1, rarity: 'common' },
  
  // 稀有 (Rare)
  { id: 'r_1', name: '力量头带', description: '攻击力提升 20%', type: 'stat_boost', stat: 'attack', value: 1.2, rarity: 'rare' },
  { id: 'r_2', name: '金属膜', description: '防御力提升 20%', type: 'stat_boost', stat: 'defense', value: 1.2, rarity: 'rare' },
  { id: 'r_3', name: '讲究围巾', description: '速度提升 20%', type: 'stat_boost', stat: 'speed', value: 1.2, rarity: 'rare' },
  { id: 'r_4', name: '剩饭', description: '每回合回复 5% HP', type: 'heal', value: 0.05, rarity: 'rare' },
  
  // 史诗 (Epic)
  { id: 'e_1', name: '讲究头带', description: '攻击力提升 35%', type: 'stat_boost', stat: 'attack', value: 1.35, rarity: 'epic' },
  { id: 'e_2', name: '坚硬铁甲', description: '防御力提升 35%', type: 'stat_boost', stat: 'defense', value: 1.35, rarity: 'epic' },
  { id: 'e_3', name: '生命宝珠', description: '最大HP提升 35%', type: 'stat_boost', stat: 'maxHp', value: 1.35, rarity: 'epic' },
  { id: 'e_4', name: '黑淤泥', description: '每回合回复 10% HP', type: 'heal', value: 0.1, rarity: 'epic' },
  
  // 传说 (Legendary)
  { id: 'l_1', name: '王者之证', description: '攻击力提升 60%', type: 'stat_boost', stat: 'attack', value: 1.6, rarity: 'legendary' },
  { id: 'l_2', name: '突击背心', description: '防御力提升 60%', type: 'stat_boost', stat: 'defense', value: 1.6, rarity: 'legendary' },
  { id: 'l_3', name: '先制之爪', description: '速度提升 60%', type: 'stat_boost', stat: 'speed', value: 1.6, rarity: 'legendary' },
  { id: 'l_4', name: '光之黏土', description: '每回合回复 20% HP', type: 'heal', value: 0.2, rarity: 'legendary' },
  
  // 神器 (Artifact)
  { id: 'a_1', name: '阿尔宙斯石板', description: '全属性(HP/攻/防/速)各提升50%', type: 'special', value: 1.5, rarity: 'artifact' },
  { id: 'a_2', name: '凤王之羽', description: '每回合回复 50% HP', type: 'heal', value: 0.5, rarity: 'artifact' },
];

export const getRandomEquipment = (level: number = 1): Equipment => {
  // 根据当前层数（level）动态调整概率
  let pCommon = 60, pRare = 30, pEpic = 9.9, pLeg = 0, pArt = 0.1;
  
  if (level >= 10) { pCommon = 40; pRare = 40; pEpic = 15; pLeg = 4.9; }
  if (level >= 20) { pCommon = 20; pRare = 40; pEpic = 25; pLeg = 14.9; }
  if (level >= 30) { pCommon = 10; pRare = 30; pEpic = 35; pLeg = 24.9; }
  if (level >= 40) { pCommon = 5; pRare = 25; pEpic = 40; pLeg = 29.8; pArt = 0.2; }
  if (level >= 50) { pCommon = 0; pRare = 15; pEpic = 45; pLeg = 39.5; pArt = 0.5; }

  const roll = Math.random() * 100;
  let targetRarity: Rarity = 'common';
  
  if (roll < pArt) targetRarity = 'artifact';
  else if (roll < pArt + pLeg) targetRarity = 'legendary';
  else if (roll < pArt + pLeg + pEpic) targetRarity = 'epic';
  else if (roll < pArt + pLeg + pEpic + pRare) targetRarity = 'rare';
  else targetRarity = 'common';

  const itemsOfRarity = allEquipments.filter(e => e.rarity === targetRarity);
  if (itemsOfRarity.length === 0) return allEquipments[0]; // fallback
  return itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
};
