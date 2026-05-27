import { TrainerCharacter } from '../types';

export const ALL_CHARACTERS: TrainerCharacter[] = [
  { id: 'red', name: '赤红 (Red)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/red.png' },
  { id: 'blue', name: '青绿 (Blue)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/blue.png' },
  { id: 'leaf', name: '叶子 (Leaf)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/leaf-gen3.png' },
  { id: 'ethan', name: '响也 (Ethan)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/ethan.png' },
  { id: 'lyra', name: '琴音 (Lyra)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/lyra.png' },
  { id: 'brendan', name: '佑树 (Brendan)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/brendan.png' },
  { id: 'may', name: '小遥 (May)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/may.png' },
  { id: 'lucas', name: '明辉 (Lucas)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/lucas.png' },
  { id: 'dawn', name: '小光 (Dawn)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/dawn.png' },
  { id: 'hilbert', name: '斗也 (Hilbert)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/hilbert.png' },
  { id: 'hilda', name: '斗子 (Hilda)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/hilda.png' },
  { id: 'nate', name: '共平 (Nate)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/nate.png' },
  { id: 'rosa', name: '鸣依 (Rosa)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/rosa.png' },
  { id: 'calem', name: '卡勒姆 (Calem)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/calem.png' },
  { id: 'serena', name: '莎莉娜 (Serena)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/serena.png' },
  { id: 'ash', name: '小智 (Ash)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/ash.png' },
  { id: 'cynthia', name: '竹兰 (Cynthia)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/cynthia.png' },
  { id: 'steven', name: '大吾 (Steven)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/steven.png' },
  { id: 'lance', name: '渡 (Lance)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/lance.png' },
  { id: 'leon', name: '丹帝 (Leon)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/leon.png' },
  { id: 'diantha', name: '卡露乃 (Diantha)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/diantha.png' },
  { id: 'alder', name: '阿戴克 (Alder)', spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/alder.png' },
];

export const getRandomCharacter = (excludeId?: string): TrainerCharacter => {
  const available = excludeId ? ALL_CHARACTERS.filter(c => c.id !== excludeId) : ALL_CHARACTERS;
  return available[Math.floor(Math.random() * available.length)];
};
