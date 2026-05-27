import { Quest } from '../types';

export const LEGENDARY_QUESTS: Quest[] = [
  {
    id: 'lq_mewtwo',
    title: '前置：新岛的邀请函',
    description: '连胜 3 场对战，证明你有资格前往新岛，挑战最强。',
    target: 3,
    kind: 'win',
    progress: 0,
    reward: {}, // 神兽特殊层无需直接发金币
    isLegendary: true,
    legendaryId: 150, // Mewtwo
    storyTitle: '超梦的逆袭',
    storyText: [
      '你乘着狂风暴雨，来到了传说中的新岛...',
      '在这里，你看到了被克隆出来的最强宝可梦——超梦。',
      '“人类，以及被人类奴役的宝可梦们...”',
      '“我将在这里，证明谁才是真正的强者！”',
      '为了阻止超梦的野心，你必须在这里击败它！'
    ]
  },
  {
    id: 'lq_lugia',
    title: '前置：海之神的神社',
    description: '在奇遇中成功捕获 2 只野生宝可梦，收集三神鸟的线索。',
    target: 2,
    kind: 'catch',
    progress: 0,
    reward: {},
    isLegendary: true,
    legendaryId: 249, // Lugia
    storyTitle: '洛奇亚爆诞',
    storyText: [
      '传说中，当冰之神、雷之神、火之神发生冲突时...',
      '海之神洛奇亚将会现身平息愤怒。',
      '你收集齐了三只神鸟的宝藏，深海中卷起了巨大的漩涡！',
      '“人类，感谢你为平息自然之怒所做的努力...”',
      '“现在，让我看看你是否拥有驾驭海洋力量的资格吧！”'
    ]
  },
  {
    id: 'lq_rayquaza',
    title: '前置：天空之柱的呼唤',
    description: '连胜 4 场对战，寻找通往天空之柱的阶梯。',
    target: 4,
    kind: 'win',
    progress: 0,
    reward: {},
    isLegendary: true,
    legendaryId: 384, // Rayquaza
    storyTitle: '裂空的访问者',
    storyText: [
      '为了平息大地的异变，你攀登上了高耸入云的天空之柱。',
      '在云层的最顶端，你感受到了巨大的气流波动...',
      '一道绿色的巨大身影从臭氧层中降临！',
      '“嗷嗷嗷——！”',
      '天空的霸主烈空坐，正在测试你是否有资格与它同行！'
    ]
  },
  {
    id: 'lq_entei',
    title: '前置：结晶塔的帝王',
    description: '在奇遇中成功捕获 1 只野生宝可梦，解开未知图腾的秘密。',
    target: 1,
    kind: 'catch',
    progress: 0,
    reward: {},
    isLegendary: true,
    legendaryId: 244, // Entei
    storyTitle: '结晶塔的帝王',
    storyText: [
      '被未知图腾力量包围的结晶塔，正在不断吞噬周围的土地。',
      '你在塔的深处，见到了幻化而成的炎之帝王——炎帝。',
      '“这是她的愿望，我将守护她创造的这个世界。”',
      '“如果想要打破这个幻境，就用实力来打倒我吧！”',
      '为了拯救被困的女孩，你向炎帝发起了挑战！'
    ]
  }
];

export const getRandomLegendaryQuest = (): Quest => {
  return LEGENDARY_QUESTS[Math.floor(Math.random() * LEGENDARY_QUESTS.length)];
};