import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import useGameStore from '../store/gameStore';
import { BonusStats, Pokemon } from '../types';

type ItemMeta = {
  name: string;
  desc: string;
  spriteUrl?: string;
};

type ShopItem =
  | { slug: string; price: number; target: 'pokemon'; kind: 'target_exp'; amount: number }
  | { slug: string; price: number; target: 'pokemon'; kind: 'target_level'; levels: number }
  | { slug: string; price: number; target: 'pokemon'; kind: 'target_bonus'; bonus: BonusStats }
  | { slug: string; price: number; target: 'pokemon'; kind: 'heal'; percent?: number }
  | { slug: string; price: number; target: 'pokemon'; kind: 'restore_pp' }
  | { slug: string; price: number; target: 'pokemon'; kind: 'pp_up' }
  | { slug: string; price: number; target: 'pokemon'; kind: 'pp_max' }
  | { slug: string; price: number; target: 'player'; kind: 'skill_point'; amount: number };

const PermanentShopScreen: React.FC = () => {
  const setScene = useGameStore(state => state.setScene);
  const gold = useGameStore(state => state.gold);
  const setGold = useGameStore(state => state.setGold);
  const playerTeam = useGameStore(state => state.playerTeam);
  const storage = useGameStore(state => state.storage);
  const gainExpToPokemon = useGameStore(state => state.gainExpToPokemon);
  const levelUpPokemon = useGameStore(state => state.levelUpPokemon);
  const applyPokemonBonus = useGameStore(state => state.applyPokemonBonus);
  const addSkillPoints = useGameStore(state => state.addSkillPoints);
  const healPokemon = useGameStore(state => state.healPokemon);
  const restorePokemonPP = useGameStore(state => state.restorePokemonPP);
  const boostPokemonMovePP = useGameStore(state => state.boostPokemonMovePP);

  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [itemMeta, setItemMeta] = useState<Record<string, ItemMeta>>({});
  const [selectedTargetUid, setSelectedTargetUid] = useState<string | null>(null);
  const [selectedMoveId, setSelectedMoveId] = useState<string | null>(null);

  const items: ShopItem[] = useMemo(() => ([
    { slug: 'exp-candy-xs', price: 6, target: 'pokemon', kind: 'target_exp', amount: 300 },
    { slug: 'exp-candy-s', price: 12, target: 'pokemon', kind: 'target_exp', amount: 800 },
    { slug: 'exp-candy-m', price: 25, target: 'pokemon', kind: 'target_exp', amount: 2000 },
    { slug: 'exp-candy-l', price: 45, target: 'pokemon', kind: 'target_exp', amount: 6000 },
    { slug: 'exp-candy-xl', price: 80, target: 'pokemon', kind: 'target_exp', amount: 16000 },
    { slug: 'rare-candy', price: 120, target: 'pokemon', kind: 'target_level', levels: 1 },
    { slug: 'protein', price: 90, target: 'pokemon', kind: 'target_bonus', bonus: { attack: 5 } },
    { slug: 'iron', price: 90, target: 'pokemon', kind: 'target_bonus', bonus: { defense: 5 } },
    { slug: 'carbos', price: 90, target: 'pokemon', kind: 'target_bonus', bonus: { speed: 5 } },
    { slug: 'calcium', price: 90, target: 'pokemon', kind: 'target_bonus', bonus: { specialAttack: 5 } },
    { slug: 'zinc', price: 90, target: 'pokemon', kind: 'target_bonus', bonus: { specialDefense: 5 } },
    { slug: 'hp-up', price: 90, target: 'pokemon', kind: 'target_bonus', bonus: { maxHp: 10 } },
    { slug: 'health-feather', price: 30, target: 'pokemon', kind: 'target_bonus', bonus: { maxHp: 2 } },
    { slug: 'muscle-feather', price: 30, target: 'pokemon', kind: 'target_bonus', bonus: { attack: 2 } },
    { slug: 'resist-feather', price: 30, target: 'pokemon', kind: 'target_bonus', bonus: { defense: 2 } },
    { slug: 'genius-feather', price: 30, target: 'pokemon', kind: 'target_bonus', bonus: { specialAttack: 2 } },
    { slug: 'clever-feather', price: 30, target: 'pokemon', kind: 'target_bonus', bonus: { specialDefense: 2 } },
    { slug: 'swift-feather', price: 30, target: 'pokemon', kind: 'target_bonus', bonus: { speed: 2 } },
    { slug: 'max-potion', price: 60, target: 'pokemon', kind: 'heal' },
    { slug: 'max-ether', price: 60, target: 'pokemon', kind: 'restore_pp' },
    { slug: 'pp-up', price: 40, target: 'pokemon', kind: 'pp_up' },
    { slug: 'pp-max', price: 90, target: 'pokemon', kind: 'pp_max' },
    { slug: 'ability-capsule', price: 150, target: 'player', kind: 'skill_point', amount: 1 }
  ]), []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const slugs = Array.from(new Set(items.map(i => i.slug)));
      const next: Record<string, ItemMeta> = {};
      await Promise.all(slugs.map(async (slug) => {
        try {
          const res = await fetch(`https://pokeapi.co/api/v2/item/${slug}`);
          const data = await res.json();
          const zhNameObj = (data.names || []).find((n: any) => n.language?.name === 'zh-Hans' || n.language?.name === 'zh-hans')
            || (data.names || []).find((n: any) => n.language?.name === 'zh-Hant' || n.language?.name === 'zh-hant');
          const name = zhNameObj?.name || data.name || slug;

          const zhFlavorObj = (data.flavor_text_entries || []).find((t: any) => t.language?.name === 'zh-Hans' || t.language?.name === 'zh-hans')
            || (data.flavor_text_entries || []).find((t: any) => t.language?.name === 'zh-Hant' || t.language?.name === 'zh-hant');
          const zhFlavor = zhFlavorObj?.text ? String(zhFlavorObj.text).replace(/\s+/g, ' ') : '';

          const enEffectObj = (data.effect_entries || []).find((t: any) => t.language?.name === 'en');
          const enEffect = enEffectObj?.short_effect ? String(enEffectObj.short_effect).replace(/\s+/g, ' ') : '';

          next[slug] = {
            name,
            desc: zhFlavor || enEffect || '',
            spriteUrl: data.sprites?.default
          };
        } catch (e) {
          next[slug] = { name: slug, desc: '' };
        }
      }));
      if (active) setItemMeta(next);
    };
    void load();
    return () => { active = false; };
  }, [items]);

  const allTargets: { uid: string; label: string; pokemon: Pokemon }[] = useMemo(() => {
    const teamTargets = playerTeam.map((p, i) => ({
      uid: p.uniqueId || `${p.id}-${i}`,
      label: '队伍',
      pokemon: p
    }));
    const storageTargets = storage.map((p, i) => ({
      uid: p.uniqueId || `${p.id}-${i}`,
      label: '仓库',
      pokemon: p
    }));
    return [...teamTargets, ...storageTargets];
  }, [playerTeam, storage]);

  const getGameEffectText = (item: ShopItem) => {
    if (item.kind === 'target_exp') return `本作效果：获得经验 ${item.amount}`;
    if (item.kind === 'target_level') return `本作效果：提升等级 ${item.levels}`;
    if (item.kind === 'heal') return `本作效果：回复HP ${item.percent ? `${Math.floor(item.percent * 100)}%` : '100%'}`;
    if (item.kind === 'restore_pp') return '本作效果：恢复全部PP';
    if (item.kind === 'pp_up') return '本作效果：指定招式最大PP +20%（最多+60%）';
    if (item.kind === 'pp_max') return '本作效果：指定招式最大PP 提升至上限（+60%）';
    if (item.kind === 'skill_point') return `本作效果：获得技能点 ${item.amount}`;
    const parts: string[] = [];
    if (item.bonus.maxHp) parts.push(`最大HP +${item.bonus.maxHp}`);
    if (item.bonus.attack) parts.push(`攻击 +${item.bonus.attack}`);
    if (item.bonus.defense) parts.push(`防御 +${item.bonus.defense}`);
    if (item.bonus.specialAttack) parts.push(`特攻 +${item.bonus.specialAttack}`);
    if (item.bonus.specialDefense) parts.push(`特防 +${item.bonus.specialDefense}`);
    if (item.bonus.speed) parts.push(`速度 +${item.bonus.speed}`);
    return `本作效果：永久 ${parts.join('，')}`;
  };

  const buy = (item: ShopItem) => {
    if (gold < item.price) return;
    if (item.kind === 'skill_point') {
      setGold(gold - item.price);
      addSkillPoints(item.amount);
      return;
    }
    setSelectedTargetUid(null);
    setSelectedMoveId(null);
    setSelectedItem(item);
  };

  const applyToTarget = (uid: string) => {
    if (!selectedItem) return;
    setSelectedTargetUid(uid);
    setSelectedMoveId(null);
  };

  const ppTarget = useMemo(() => {
    if (!selectedTargetUid) return null;
    return allTargets.find(t => t.uid === selectedTargetUid) || null;
  }, [allTargets, selectedTargetUid]);

  const applyToMove = (moveId: string) => {
    if (!selectedItem) return;
    if (selectedItem.kind !== 'pp_up' && selectedItem.kind !== 'pp_max') return;
    setSelectedMoveId(moveId);
  };

  const canPurchase = useMemo(() => {
    if (!selectedItem) return false;
    if (gold < selectedItem.price) return false;
    if (selectedItem.kind === 'pp_up' || selectedItem.kind === 'pp_max') {
      return !!selectedTargetUid && !!selectedMoveId;
    }
    return !!selectedTargetUid;
  }, [gold, selectedItem, selectedMoveId, selectedTargetUid]);

  const confirmPurchase = () => {
    if (!selectedItem) return;
    if (!canPurchase) return;
    if (!selectedTargetUid) return;
    setGold(gold - selectedItem.price);

    if (selectedItem.kind === 'target_exp') gainExpToPokemon(selectedTargetUid, selectedItem.amount);
    if (selectedItem.kind === 'target_level') levelUpPokemon(selectedTargetUid, selectedItem.levels);
    if (selectedItem.kind === 'target_bonus') applyPokemonBonus(selectedTargetUid, selectedItem.bonus);
    if (selectedItem.kind === 'heal') healPokemon(selectedTargetUid, selectedItem.percent);
    if (selectedItem.kind === 'restore_pp') restorePokemonPP(selectedTargetUid);
    if ((selectedItem.kind === 'pp_up' || selectedItem.kind === 'pp_max') && selectedMoveId) {
      boostPokemonMovePP(selectedTargetUid, selectedMoveId, selectedItem.kind);
    }

    setSelectedItem(null);
    setSelectedTargetUid(null);
    setSelectedMoveId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen bg-zinc-950 text-white relative overflow-y-auto overflow-x-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/10 via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />

      <header className="sticky top-0 z-20 flex items-center justify-between p-6 border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScene('MapSelection')}
            className="px-4 py-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-700 font-black flex items-center gap-2"
          >
            <ArrowLeft size={18} /> 返回
          </button>
          <div className="flex items-center gap-3">
            <ShoppingBag size={22} className="text-yellow-300" />
            <div className="text-2xl font-black tracking-wider">永久商店</div>
          </div>
        </div>
        <div className="font-black text-zinc-200">
          金币 <span className="text-yellow-400 text-2xl ml-1">{gold}</span>
        </div>
      </header>

      <main className="relative z-10 p-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => {
            const affordable = gold >= item.price;
            const meta = itemMeta[item.slug];
            const title = meta?.name || item.slug;
            const desc = meta?.desc || '';
            const gameEffect = getGameEffectText(item);

            return (
              <button
                key={`${item.slug}-${item.kind}`}
                onClick={() => buy(item)}
                disabled={!affordable}
                className={`p-5 rounded-2xl border text-left transition-colors ${
                  affordable
                    ? 'bg-zinc-900/70 border-zinc-700 hover:border-yellow-400/40 hover:bg-zinc-900'
                    : 'bg-zinc-900/30 border-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                      {meta?.spriteUrl ? (
                        <img src={meta.spriteUrl} alt={title} className="w-10 h-10 object-contain" />
                      ) : (
                        <ShoppingBag size={22} className="text-yellow-300" />
                      )}
                    </div>
                    <div>
                      <div className="text-xl font-black">{title}</div>
                      <div className="text-sm font-bold text-zinc-400 mt-1">{gameEffect}</div>
                      {desc ? <div className="text-xs font-bold text-zinc-500 mt-2 line-clamp-2">{desc}</div> : null}
                    </div>
                  </div>
                  <div className="text-lg font-black text-yellow-400 whitespace-nowrap">
                    {item.price}💰
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {selectedItem && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <div className="text-2xl font-black">{itemMeta[selectedItem.slug]?.name || selectedItem.slug}</div>
                <div className="text-sm font-bold text-zinc-400 mt-1">{getGameEffectText(selectedItem)}</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={confirmPurchase}
                  disabled={!canPurchase}
                  className={`px-4 py-2 rounded-xl font-black border transition-colors ${
                    canPurchase
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                  }`}
                >
                  购买
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setSelectedTargetUid(null);
                    setSelectedMoveId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-black"
                >
                  取消
                </button>
              </div>
            </div>

            <div className="text-sm font-black tracking-[0.2em] text-zinc-400 uppercase mb-3">SELECT TARGET</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {allTargets.map(t => (
                <button
                  key={t.uid}
                  onClick={() => applyToTarget(t.uid)}
                  className={`p-3 rounded-2xl border transition-colors ${
                    selectedTargetUid === t.uid
                      ? 'bg-zinc-950 border-yellow-400/50'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-yellow-400/40 hover:bg-zinc-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={t.pokemon.spriteUrl}
                      alt={t.pokemon.name}
                      className="w-12 h-12 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="flex-1 text-left">
                      <div className="text-xs font-black text-white line-clamp-1">{t.pokemon.name}</div>
                      <div className="text-[10px] font-bold text-zinc-500">
                        {t.label} · Lv.{t.pokemon.level}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {ppTarget && (selectedItem.kind === 'pp_up' || selectedItem.kind === 'pp_max') && (
              <div className="mt-6">
                <div className="text-sm font-black tracking-[0.2em] text-zinc-400 uppercase mb-3">
                  SELECT MOVE · {ppTarget.pokemon.name}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(ppTarget.pokemon.moves || []).map((m) => {
                    const base = m.basePp ?? m.maxPp ?? 10;
                    const cap = Math.floor(base * 1.6);
                    const atCap = (m.maxPp ?? base) >= cap;
                    return (
                      <button
                        key={m.id}
                        onClick={() => applyToMove(m.id)}
                        disabled={atCap}
                        className={`p-4 rounded-2xl border text-left transition-colors ${
                          atCap
                            ? 'bg-zinc-900/30 border-zinc-800 text-zinc-500 cursor-not-allowed'
                            : (selectedMoveId === m.id
                              ? 'bg-zinc-950 border-yellow-400/50'
                              : 'bg-zinc-950/60 border-zinc-800 hover:border-yellow-400/40 hover:bg-zinc-950')
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-black text-white">{m.name}</div>
                          <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-black type-${m.type}`}>
                            {m.type}
                          </span>
                        </div>
                        <div className="mt-2 text-xs font-bold text-zinc-400 flex flex-wrap gap-2">
                          <span>PP {m.pp ?? m.maxPp ?? base}/{m.maxPp ?? base}</span>
                          <span>上限 {cap}</span>
                          {atCap ? <span className="text-emerald-300">已满</span> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PermanentShopScreen;
