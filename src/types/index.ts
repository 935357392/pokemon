export interface Move {
  id: string;
  name: string;
  type: string;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  basePp?: number;
  description: string;
  learnLevel?: number;
  recoilPercent?: number;
  damageClass?: string;
  statChanges?: { stat: string; change: number }[];
  healingPercent?: number;
}

export interface BonusStats {
  maxHp?: number;
  attack?: number;
  defense?: number;
  specialAttack?: number;
  specialDefense?: number;
  speed?: number;
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'artifact';

export type RegionId = 'kanto' | 'johto' | 'hoenn' | 'sinnoh' | 'unova' | 'kalos' | 'alola' | 'galar' | 'paldea';

export type WeatherType = 'clear' | 'rain' | 'sun' | 'thunder' | 'sandstorm' | 'hail';

export interface TrainerCharacter {
  id: string;
  name: string;
  spriteUrl: string;
}

export interface PokemonEgg {
  id: string;
  pokemonId: number;
  pokemonName: string;
  stepsRemaining: number;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  type: 'stat_boost' | 'heal' | 'special';
  stat?: 'attack' | 'defense' | 'speed' | 'maxHp';
  value?: number;
  rarity: Rarity;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  kind: 'win' | 'catch';
  target: number;
  progress: number;
  reward: {
    gold?: number;
    balls?: Record<string, number>;
    materials?: {
      megaStone?: number;
      dynamaxBand?: number;
      teraOrb?: number;
    };
  };
  isLegendary?: boolean;
  legendaryId?: number;
  storyTitle?: string;
  storyText?: string[];
}

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  level: number;
  exp: number;
  maxExp: number;
  
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack?: number;
    specialDefense?: number;
    speed: number;
  };
  
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  specialAttack?: number;
  specialDefense?: number;
  speed: number;
  
  moves: Move[];
  learnedMoves?: string[];
  bonusStats?: BonusStats;
  lastMoveCheckLevel?: number;
  spriteUrl: string;
  backSpriteUrl?: string;
  
  equipments: (Equipment | null)[];
  evolvesTo?: number;
  evolutionLevel?: number;
  
  cost?: number; // 招募花费的金币
  uniqueId?: string; // 用于在列表中区分同种宝可梦的唯一标识
  isShiny?: boolean; // 是否是异色(闪光)宝可梦
  gender?: 'male' | 'female' | 'genderless'; // 性别
  
  extraForm?: 'mega' | 'dynamax' | 'tera'; // 额外进化形态
  teraType?: string; // 太晶化属性
}

export type Scene = 'MainMenu' | 'MapSelection' | 'BattleArena' | 'GachaScreen' | 'TeamManagement' | 'ShopScreen' | 'GameOver' | 'GameWon' | 'RandomEvent' | 'QuestScreen' | 'LegendaryEvent' | 'SkillTree' | 'MoveLearn' | 'Storage' | 'PermanentShop';

export type SkillId = 'hp_up' | 'atk_up' | 'def_up' | 'speed_up' | 'exp_up' | 'egg_rate' | 'gold_start' | 'legendary_rate' | 'catch_rate' | 'shiny_rate' | 'heal_up';

export type RouteType = 'battle' | 'elite' | 'event' | 'shop' | 'rest';

export interface RouteNode {
  id: string;
  type: RouteType;
  title: string;
  description: string;
  enemyTeam?: Pokemon[];
  enemyCharacter?: TrainerCharacter;
  knownTypes?: string[];
  layer: number;
  row: number;
  status: 'locked' | 'available' | 'completed' | 'current';
}

export interface MapEdge {
  source: string;
  target: string;
}

export interface GameMap {
  nodes: RouteNode[];
  edges: MapEdge[];
  activeNodeId: string | null;
}

export interface SaveSlot {
  id: string;
  label: string;
  timestamp: number;
  level: number;
  characterName: string;
  version?: string;
  stateData: string;
}

export interface CharacterProgress {
  skillPoints: number;
  unlockedSkills: SkillId[];
}

export interface GameState {
  characterProgress: Record<string, CharacterProgress>;
  currentScene: Scene;
  playerTeam: Pokemon[];
  enemyTeam: Pokemon[];
  currentLevel: number;
  playerCharacter: TrainerCharacter;
  enemyCharacter: TrainerCharacter | null;
  currentRegion: RegionId;
  unlockedRegions: RegionId[];
  currentWeather: WeatherType;
  npcAvailable: boolean;
  activeQuest: Quest | null;
  readyLegendaryQuest: Quest | null;
  gold: number;
  pendingExpReward: number;
  pendingMoveLearn: { pokemonUniqueId: string; newMove: Move }[];
  moveLearnReturnScene: Scene | null;
  storage: Pokemon[];
  storageCapacity: number;
  inventory: Equipment[];
  gameMap: GameMap | null;
  pokeBalls: Record<string, number>;
  evolutionMaterials: {
    megaStone: number;
    dynamaxBand: number;
    teraOrb: number;
  };
  battleLog: string[];
  incubator: PokemonEgg[];
  localEnemyTeam: Pokemon[]; // 战斗中敌人的动态状态
  
  setScene: (scene: Scene) => void;
  setPlayerTeam: (team: Pokemon[]) => void;
  setPlayerCharacter: (character: TrainerCharacter) => void;
  setRegion: (region: RegionId) => void;
  addPokemonToTeam: (pokemon: Pokemon) => void;
  removePokemonFromTeam: (index: number) => void;
  healTeam: () => void;
  restoreTeamPP: () => void;
  startBattle: (enemyTeam: Pokemon[], enemyCharacter?: TrainerCharacter) => void;
  addBattleLog: (log: string) => void;
  addBattleLogs: (logs: string[]) => void;
  clearBattleLog: () => void;
  setPendingExpReward: (amount: number) => void;
  prepareMoveLearning: (returnScene: Scene) => Promise<void>;
  resolveMoveLearning: (forgetMoveId: string | null) => void;
  unlockStorageSlot: () => boolean;
  moveStorageToTeam: (storageIndex: number) => void;
  swapStorageWithTeam: (storageIndex: number, teamIndex: number) => void;
  releaseStoragePokemon: (storageIndex: number) => void;
  addSkillPoints: (amount: number) => void;
  gainExpToPokemon: (pokemonUniqueId: string, amount: number) => void;
  levelUpPokemon: (pokemonUniqueId: string, levels: number) => void;
  applyPokemonBonus: (pokemonUniqueId: string, bonus: BonusStats) => void;
  healPokemon: (pokemonUniqueId: string, percent?: number) => void;
  restorePokemonPP: (pokemonUniqueId: string) => void;
  boostPokemonMovePP: (pokemonUniqueId: string, moveId: string, kind: 'pp_up' | 'pp_max') => void;
  advanceLevel: () => void;
  resetGame: () => void;
  setGold: (amount: number) => void;
  setNpcAvailable: (available: boolean) => void;
  setActiveQuest: (quest: Quest | null) => void;
  setReadyLegendaryQuest: (quest: Quest | null) => void;
  generateRoutes: () => Promise<void>;
  setActiveNode: (nodeId: string) => void;
  advanceNode: (nextScene?: Scene, showDelay?: boolean) => Promise<void>;
  progressQuest: (kind: 'win' | 'catch') => void;
  
  addPokeBall: (type: string, amount: number) => void;
  usePokeBall: (type: string) => boolean;

  addEvolutionMaterial: (type: 'megaStone' | 'dynamaxBand' | 'teraOrb', amount: number) => void;
  applyExtraEvolution: (pokemonIndex: number, form: 'mega' | 'dynamax' | 'tera') => boolean;

  addEquipment: (eq: Equipment) => void;
  equipItem: (pokemonIndex: number, slotIndex: number, equipment: Equipment) => void;
  unequipItem: (pokemonIndex: number, slotIndex: number) => void;
  
  gainExp: (amount: number) => void;
  evolvePokemon: (index: number, newPokemonData: Partial<Pokemon>) => void;
  checkEvolutions: () => Promise<boolean>;
  addEgg: (egg: PokemonEgg) => void;
  progressEggs: () => Promise<Pokemon[]>;

  saveGame: (id: string, label: string) => Promise<void>;
  loadGame: (id: string) => Promise<boolean>;
  unlockSkill: (id: SkillId, cost: number) => boolean;
}
