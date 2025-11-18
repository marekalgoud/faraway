// --- Modèle de SCÈNE ---
export const SCENE_CLASS_NAMES = [ 'card', 'temple' ];

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
];

// Helpers pour le mapping des CARTES
export const CARD_COLOR_CLASSES = CARD_ELEMENT_CLASSES.filter(name => name.startsWith('card_'));
export const CARD_VALUE_CLASSES = CARD_ELEMENT_CLASSES.filter(name => name.startsWith('value_'));
export const CARD_CONDITION_CLASSES = CARD_ELEMENT_CLASSES.filter(name => name.startsWith('condition_'));
export const CARD_OPTION_CLASSES = ['chimera', 'gem', 'hint', 'night', 'thistle'];
export const CARD_MULTIPLIER_CLASSES = CARD_ELEMENT_CLASSES.filter(name => name.startsWith('each_'));

// --- Modèle d'ANALYSE DE TEMPLE ---
// (Basé sur vos listes)
export const TEMPLE_COLOR_CLASSES = ['card_blue', 'card_gray', 'card_green', 'card_red', 'card_yellow'];
export const TEMPLE_VALUE_CLASSES = ['value_1', 'value_2', 'value_4', 'value_5'];
export const TEMPLE_MULTIPLIER_CLASSES = [
  'each_all_colors', 'each_blue', 'each_blue_or_yellow', 'each_chimera', 'each_gem', 'each_green',
  'each_green_or_blue', 'each_green_or_red', 'each_hint', 'each_night', 'each_red', 'each_red_or_blue',
  'each_red_or_yellow', 'each_thistle', 'each_yellow', 'each_yellow_or_green'
];

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
