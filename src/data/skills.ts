import { SkillId } from '../types';

export interface SkillDef {
  id: SkillId;
  name: string;
  desc: string;
  cost: number;
}

export const ALL_SKILLS: Record<SkillId, SkillDef> = {
  hp_up: { id: 'hp_up', name: '体力特化', desc: '所有宝可梦最大HP提升10%', cost: 10 },
  atk_up: { id: 'atk_up', name: '力量特化', desc: '所有宝可梦攻击提升10%', cost: 10 },
  def_up: { id: 'def_up', name: '防御特化', desc: '所有宝可梦防御提升10%', cost: 10 },
  speed_up: { id: 'speed_up', name: '速度特化', desc: '所有宝可梦速度提升10%', cost: 10 },
  exp_up: { id: 'exp_up', name: '经验加成', desc: '战斗获得的经验值提升20%', cost: 15 },
  egg_rate: { id: 'egg_rate', name: '培育专家', desc: '战斗后掉落蛋的概率提升15%', cost: 20 },
  gold_start: { id: 'gold_start', name: '初始资金', desc: '每次重新开始游戏时获得500金币', cost: 25 },
  legendary_rate: { id: 'legendary_rate', name: '传说雷达', desc: '神兽任务出现概率提升10%', cost: 30 },
  catch_rate: { id: 'catch_rate', name: '捕获专家', desc: '抓宠奇遇成功率提升20%', cost: 20 },
  shiny_rate: { id: 'shiny_rate', name: '闪耀护符', desc: '遇到异色宝可梦的概率提升', cost: 35 },
  heal_up: { id: 'heal_up', name: '恢复提升', desc: '装备回复效果提升50%', cost: 15 },
};

export const getSkillTreeForCharacter = (charId: string): SkillDef[][] => {
  // 定义三大类流派
  const battlerIds = ['red', 'ash', 'leon', 'ethan', 'brendan', 'lucas', 'hilbert', 'nate', 'calem'];
  const collectorIds = ['leaf', 'dawn', 'may', 'lyra', 'hilda', 'rosa', 'serena'];
  const tacticianIds = ['blue', 'cynthia', 'steven', 'lance', 'diantha', 'alder'];

  if (battlerIds.includes(charId)) {
    // 战斗狂流派：偏向直接攻击和速度，以及经验获取
    return [
      [ALL_SKILLS.gold_start],
      [ALL_SKILLS.atk_up, ALL_SKILLS.speed_up],
      [ALL_SKILLS.exp_up, ALL_SKILLS.heal_up],
      [ALL_SKILLS.legendary_rate]
    ];
  } else if (collectorIds.includes(charId)) {
    // 收集者流派：偏向抓宠、孵蛋、闪光概率
    return [
      [ALL_SKILLS.gold_start],
      [ALL_SKILLS.catch_rate, ALL_SKILLS.egg_rate],
      [ALL_SKILLS.shiny_rate, ALL_SKILLS.hp_up],
      [ALL_SKILLS.legendary_rate]
    ];
  } else if (tacticianIds.includes(charId)) {
    // 战术家流派：偏向防御、续航和特殊增益
    return [
      [ALL_SKILLS.gold_start],
      [ALL_SKILLS.def_up, ALL_SKILLS.hp_up],
      [ALL_SKILLS.heal_up, ALL_SKILLS.exp_up],
      [ALL_SKILLS.legendary_rate]
    ];
  }

  // 默认流派
  return [
    [ALL_SKILLS.gold_start],
    [ALL_SKILLS.hp_up, ALL_SKILLS.atk_up],
    [ALL_SKILLS.exp_up, ALL_SKILLS.egg_rate],
    [ALL_SKILLS.legendary_rate]
  ];
};