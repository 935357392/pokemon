import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { APP_VERSION } from '../constants/version';

type Props = {
  open: boolean;
  onClose: () => void;
  closeText?: string;
};

const GameGuideModal: React.FC<Props> = ({ open, onClose, closeText }) => {
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[110] bg-black/90 p-4"
          style={{ display: 'grid', placeItems: 'center' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="panel-glass border-4 border-yellow-500/70 p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto text-zinc-200 relative shadow-[0_0_60px_rgba(234,179,8,0.3)]"
          >
            <button onClick={onClose} className="modal-close">×</button>
            <h2 className="relative text-3xl font-black mb-6 text-center pb-4 bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
              <span className="inline-block drop-shadow-[0_2px_8px_rgba(234,179,8,0.6)]">📖 游戏详细说明</span>
              <div className="mt-2 text-sm font-black text-zinc-400 tracking-widest">v{APP_VERSION}</div>
              <div className="divider-fancy mt-4" />
            </h2>

            <div className="space-y-4 text-lg leading-relaxed">
              <p><strong className="text-white text-xl">🎮 核心玩法</strong><br />这是一款肉鸽式宝可梦爬塔：你在地图上选择路线节点前进（战斗/精英/事件/休息/商店）。通关节点后获得战利品与金币，并持续成长。</p>

              <p><strong className="text-cyan-400 text-xl">🧑‍🤝‍🧑 角色与对手</strong><br />开局可从多位历代主角/冠军中选择形象；对手也会从角色池中随机出现。</p>

              <p><strong className="text-sky-400 text-xl">🗺️ 九世代全地图解锁</strong><br />地区会随进度解锁：<span className="text-yellow-300 font-bold">每击败一个 10 层 Boss</span>解锁一个新地区（关都→城都→丰缘→神奥→合众→卡洛斯→阿罗拉→伽勒尔→帕底亚）。你可以在路线页随时切换地区，遭遇对应世代的宝可梦。</p>

              <p><strong className="text-indigo-400 text-xl">🌦️ 天气系统</strong><br />每层有随机天气，不同天气会强化特定属性：如雷暴强化电系，下雨强化水系并削弱火系，晴天强化火系并削弱水系等。</p>

              <p><strong className="text-green-400 text-xl">⚔️ 战斗、PP 与招式类型</strong><br />战斗为回合制，招式使用会消耗 PP。<span className="text-green-300 font-bold">变化招式无伤害</span>，会在招式后展示说明（如提升防御/降低命中/回复HP 等）。伤害招式会区分<span className="text-green-300 font-bold">物理/特殊</span>，分别使用攻击/防御与特攻/特防进行计算。</p>

              <p><strong className="text-emerald-400 text-xl">📈 经验、升级、进化与学新招式</strong><br />经验结算在<span className="text-emerald-300 font-bold">通关节点后</span>触发（阵亡宝可梦同样获得经验），并会自动满血与回满 PP。升级可能触发进化；当升级后出现新招式时，会进入“学招式”界面：若超过 4 个招式需要选择遗忘一个替换。</p>

              <p><strong className="text-purple-400 text-xl">🎁 战利品与金币</strong><br />大多数战斗胜利后会出现战利品选择（宝可梦/装备等），并额外获得金币。</p>

              <p><strong className="text-yellow-400 text-xl">🏪 永久商店（随时购买）</strong><br />路线页右上角可进入永久商店。商品完全使用宝可梦官方道具，并会显示“本作效果”：例如经验糖、神奇糖果、营养剂（Protein/Iron/Calcium/Zinc 等）、羽毛、全满药、PP 回复类道具等。</p>

              <p><strong className="text-amber-400 text-xl">📦 宝可梦仓库（120 格）</strong><br />队伍上限 6 只。队伍满时，新获得宝可梦会自动进入仓库。仓库初始 12 格，最高 120 格，可用金币按 10/20/30…递增价格逐格解锁。</p>

              <p><strong className="text-red-400 text-xl">👊 反作用力与风险招式</strong><br />部分强力招式会附带反作用力（反伤），会在招式信息中明确标注百分比，并在战斗日志中提示扣血。</p>

              <p><strong className="text-sky-400 text-xl">🎲 事件与抓宠</strong><br />地图上会出现未知事件与抓宠机会。抓宠需要消耗精灵球，不同球有不同捕获修正。</p>
            </div>

            <div className="mt-8 flex justify-center">
              <button onClick={onClose} className="btn-game btn-gold px-10 py-3 text-lg rounded-2xl">
                {closeText || '✨ 关闭'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GameGuideModal;
