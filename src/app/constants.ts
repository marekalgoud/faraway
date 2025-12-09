// --- Modèle de SCÈNE ---
export const SCENE_CLASS_NAMES = [ 'card', 'temple' ] as const;
export type SceneClassName = typeof SCENE_CLASS_NAMES[number];

// --- Types pour les options ---
export const CARD_OPTION_CLASSES = ['chimera', 'gem', 'hint', 'night', 'thistle'] as const;
export type CardOption = typeof CARD_OPTION_CLASSES[number];

export const TEMPLE_OPTION_CLASSES = ['chimera', 'gem', 'hint', 'night', 'thistle'] as const;
export type TempleOption = typeof TEMPLE_OPTION_CLASSES[number];

// --- Modèle d'ANALYSE DE CARTE (43 classes) ---
export const CARD_ELEMENT_CLASSES = [
  'card_blue', 'card_green', 'card_red', 'card_yellow', // 0-3 (Colors)
  'chimera', // 4 (Option)
  'condition_chimera', 'condition_gem', 'condition_thistle', // 5-7 (Conditions)
  'each_all_colors', 'each_blue', 'each_chimera', 'each_gem', 'each_green', 'each_hint', 'each_night', 'each_red', 'each_thistle', 'each_yellow_or_blue', 'each_yellow_or_green', 'each_yellow_or_red', // 8-19 (Multipliers)
  'gem', // 20 (Option)
  'hint', // 21 (Option)
  'night', // 22 (Option)
  'thistle', // 23 (Option)
  'value_1', 'value_10', 'value_12', 'value_13', 'value_14', 'value_15', 'value_16', 'value_17', 'value_18', 'value_19', 'value_2', 'value_20', 'value_24', 'value_3', 'value_4', 'value_5', 'value_7', 'value_8', 'value_9' // 24-42 (Values)
] as const;
export type CardElementClass = typeof CARD_ELEMENT_CLASSES[number];

// Helpers pour le mapping des CARTES
export const CARD_COLOR_CLASSES = CARD_ELEMENT_CLASSES.filter(name => name.startsWith('card_')) as readonly string[];
export type CardColor = 'card_blue' | 'card_green' | 'card_red' | 'card_yellow';

export const CARD_VALUE_CLASSES = CARD_ELEMENT_CLASSES.filter(name => name.startsWith('value_')) as readonly string[];
export type CardValue = 'value_1' | 'value_2' | 'value_3' | 'value_4' | 'value_5' | 'value_7' | 'value_8' | 'value_9' | 'value_10' | 'value_12' | 'value_13' | 'value_14' | 'value_15' | 'value_16' | 'value_17' | 'value_18' | 'value_19' | 'value_20' | 'value_24';

export const CARD_CONDITION_CLASSES = CARD_ELEMENT_CLASSES.filter(name => name.startsWith('condition_')) as readonly string[];
export type CardCondition = 'condition_chimera' | 'condition_gem' | 'condition_thistle';

export const CARD_MULTIPLIER_CLASSES = CARD_ELEMENT_CLASSES.filter(name => name.startsWith('each_')) as readonly string[];
export type CardMultiplier = 'each_all_colors' | 'each_blue' | 'each_chimera' | 'each_gem' | 'each_green' | 'each_hint' | 'each_night' | 'each_red' | 'each_thistle' | 'each_yellow_or_blue' | 'each_yellow_or_green' | 'each_yellow_or_red';

// Type guards pour vérifier les types
export function isCardColor(value: string): value is CardColor {
  return CARD_COLOR_CLASSES.includes(value);
}

export function isCardValue(value: string): value is CardValue {
  return CARD_VALUE_CLASSES.includes(value);
}

export function isCardCondition(value: string): value is CardCondition {
  return CARD_CONDITION_CLASSES.includes(value);
}

export function isCardOption(value: string): value is CardOption {
  return CARD_OPTION_CLASSES.includes(value as CardOption);
}

export function isCardMultiplier(value: string): value is CardMultiplier {
  return CARD_MULTIPLIER_CLASSES.includes(value);
}

// --- Modèle d'ANALYSE DE TEMPLE ---
// (Basé sur vos listes)
export const TEMPLE_COLOR_CLASSES = ['card_blue', 'card_gray', 'card_green', 'card_red', 'card_yellow'] as const;
export type TempleColor = typeof TEMPLE_COLOR_CLASSES[number];

export const TEMPLE_VALUE_CLASSES = ['value_1', 'value_2', 'value_4', 'value_5'] as const;
export type TempleValue = typeof TEMPLE_VALUE_CLASSES[number];

export const TEMPLE_MULTIPLIER_CLASSES = [
  'each_all_colors', 'each_blue', 'each_blue_or_yellow', 'each_chimera', 'each_gem', 'each_green',
  'each_green_or_blue', 'each_green_or_red', 'each_hint', 'each_night', 'each_red', 'each_red_or_blue',
  'each_red_or_yellow', 'each_thistle', 'each_yellow', 'each_yellow_or_green'
] as const;
export type TempleMultiplier = typeof TEMPLE_MULTIPLIER_CLASSES[number];

// Type guards pour les temples
export function isTempleColor(value: string): value is TempleColor {
  return TEMPLE_COLOR_CLASSES.includes(value as TempleColor);
}

export function isTempleValue(value: string): value is TempleValue {
  return TEMPLE_VALUE_CLASSES.includes(value as TempleValue);
}

export function isTempleMultiplier(value: string): value is TempleMultiplier {
  return TEMPLE_MULTIPLIER_CLASSES.includes(value as TempleMultiplier);
}

export function isTempleOption(value: string): value is TempleOption {
  return TEMPLE_OPTION_CLASSES.includes(value as TempleOption);
}

// (Hypothèse sur le mapping des classes du modèle Temple)
// !! IMPORTANT: L'ordre de ce tableau DOIT correspondre aux IDs 0, 1, 2... de votre 3ème modèle
export const TEMPLE_ELEMENT_CLASSES_MAPPING = [
  // Mapping matching the model metadata (indices 0..29)
  'card_blue',
  'card_gray',
  'card_green',
  'card_red',
  'card_yellow',
  'chimera',
  'each_all_colors',
  'each_blue',
  'each_blue_or_yellow',
  'each_chimera',
  'each_gem',
  'each_green',
  'each_green_or_blue',
  'each_green_or_red',
  'each_hint',
  'each_night',
  'each_red',
  'each_red_or_blue',
  'each_red_or_yellow',
  'each_thistle',
  'each_yellow',
  'each_yellow_or_green',
  'gem',
  'hint',
  'night',
  'thistle',
  'value_1',
  'value_2',
  'value_4',
  'value_5'
];
