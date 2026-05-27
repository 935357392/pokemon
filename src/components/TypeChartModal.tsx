import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Props = {
  open: boolean;
  onClose: () => void;
};

type TypeInfo = { key: string; name: string; color: string };

const TYPES: TypeInfo[] = [
  { key: 'normal', name: '一般', color: '#A8A77A' },
  { key: 'fire', name: '火', color: '#EE8130' },
  { key: 'water', name: '水', color: '#6390F0' },
  { key: 'electric', name: '电', color: '#F7D02C' },
  { key: 'grass', name: '草', color: '#7AC74C' },
  { key: 'ice', name: '冰', color: '#96D9D6' },
  { key: 'fighting', name: '格斗', color: '#C22E28' },
  { key: 'poison', name: '毒', color: '#A33EA1' },
  { key: 'ground', name: '地面', color: '#E2BF65' },
  { key: 'flying', name: '飞行', color: '#A98FF3' },
  { key: 'psychic', name: '超能力', color: '#F95587' },
  { key: 'bug', name: '虫', color: '#A6B91A' },
  { key: 'rock', name: '岩石', color: '#B6A136' },
  { key: 'ghost', name: '幽灵', color: '#735797' },
  { key: 'dragon', name: '龙', color: '#6F35FC' },
  { key: 'dark', name: '恶', color: '#705746' },
  { key: 'steel', name: '钢', color: '#B7B7CE' },
  { key: 'fairy', name: '妖精', color: '#D685AD' },
];

// 攻击方(行) -> 防守方(列): 2=效果拔群, 0.5=效果不佳, 0=无效, 1=普通
const CHART: Record<string, Record<string, number>> = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

const getCell = (atk: string, def: string): number => {
  const row = CHART[atk];
  if (!row) return 1;
  const v = row[def];
  return v === undefined ? 1 : v;
};

const cellStyle = (v: number): React.CSSProperties => {
  if (v === 2) return { background: '#16a34a', color: 'white' };
  if (v === 0.5) return { background: '#dc2626', color: 'white' };
  if (v === 0) return { background: '#1f2937', color: '#f3f4f6' };
  return { background: '#f3f4f6', color: '#374151' };
};

const cellText = (v: number): string => {
  if (v === 2) return '2';
  if (v === 0.5) return '½';
  if (v === 0) return '0';
  return '';
};

const TypeChartModal: React.FC<Props> = ({ open, onClose }) => {
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
            className="panel-glass border-4 border-blue-500/70 p-6 max-w-6xl w-full max-h-[85vh] overflow-y-auto text-zinc-200 relative flex flex-col items-center animate-glow-pulse"
          >
            <button onClick={onClose} className="modal-close">×</button>
            <h2 className="relative text-3xl font-black mb-4 text-center pb-4 w-full bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
              <span className="inline-block drop-shadow-[0_2px_8px_rgba(96,165,250,0.5)]">⚔️ 宝可梦属性克制表</span>
              <div className="divider-fancy mt-4" />
            </h2>

            <div className="w-full bg-zinc-900 rounded-xl p-3 overflow-auto">
              <div className="inline-block min-w-full">
                <table className="border-collapse mx-auto" style={{ fontFamily: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' }}>
                  <thead>
                    <tr>
                      <th className="p-1 text-xs text-zinc-400" style={{ minWidth: 72 }}>
                        <div className="flex flex-col leading-tight">
                          <span>攻 ↓</span>
                          <span>防 →</span>
                        </div>
                      </th>
                      {TYPES.map(t => (
                        <th
                          key={t.key}
                          className="p-1 text-white font-bold text-xs border border-zinc-700"
                          style={{ background: t.color, minWidth: 42, writingMode: 'vertical-rl', height: 68 }}
                        >
                          {t.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TYPES.map(atk => (
                      <tr key={atk.key}>
                        <th
                          className="p-1 text-white font-bold text-xs border border-zinc-700 text-center"
                          style={{ background: atk.color, minWidth: 72 }}
                        >
                          {atk.name}
                        </th>
                        {TYPES.map(def => {
                          const v = getCell(atk.key, def.key);
                          return (
                            <td
                              key={def.key}
                              className="text-center text-sm font-black border border-zinc-700"
                              style={{ ...cellStyle(v), width: 42, height: 32 }}
                              title={`${atk.name} → ${def.name}：${v === 1 ? '1×' : v === 2 ? '2×（效果拔群）' : v === 0.5 ? '½×（效果不佳）' : '0×（无效）'}`}
                            >
                              {cellText(v)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 text-zinc-300 text-sm bg-zinc-900 p-4 rounded-xl w-full border-2 border-zinc-700">
              <p className="font-bold mb-2 text-yellow-400">📊 图表阅读说明：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><span className="text-white font-bold">左侧行</span> 代表 <span className="text-red-400 font-bold">攻击方</span> 的招式属性。</li>
                <li><span className="text-white font-bold">上方列</span> 代表 <span className="text-blue-400 font-bold">防守方</span> 的宝可梦属性。</li>
                <li><span className="inline-block px-2 py-0.5 rounded font-bold" style={{ background: '#16a34a', color: 'white' }}>2</span>：效果拔群（伤害 ×2）</li>
                <li><span className="inline-block px-2 py-0.5 rounded font-bold" style={{ background: '#dc2626', color: 'white' }}>½</span>：效果不佳（伤害 ×0.5）</li>
                <li><span className="inline-block px-2 py-0.5 rounded font-bold" style={{ background: '#1f2937', color: 'white' }}>0</span>：没有效果（伤害为 0）</li>
                <li><span className="inline-block px-2 py-0.5 rounded font-bold" style={{ background: '#f3f4f6', color: '#374151' }}>空白</span>：正常伤害（伤害 ×1）</li>
              </ul>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TypeChartModal;
