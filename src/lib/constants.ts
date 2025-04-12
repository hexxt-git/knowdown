// Game Timing
export const CARD_TIME = 50000; // Time before a card expires (in ms)
export const POWER_TICK_INTERVAL = 1000;
export const ENEMY_DECISION_INTERVAL = 1000;

// Game Limits
export const MAX_HEALTH = 100;
export const MAX_POWER = 100;

// Card Costs
export const CARD_COST_MULTIPLIER = 10; // Cost = level * this value

// Damage Calculations
export const WRONG_ANSWER_DAMAGE_MULTIPLIER = 10; // Damage = level * this value
// Expired cards should use the same damage calculation as wrong answers
export const calculateWrongAnswerDamage = (level: number): number => {
  return level * WRONG_ANSWER_DAMAGE_MULTIPLIER;
};

// Use the same damage calculation for expired cards
export const calculateExpiredCardDamage = calculateWrongAnswerDamage;

// Power Generation
export const POWER_GAIN_PER_TICK = 1;

// AI Parameters
export const ENEMY_CARD_ANSWER_TIMES = {
  LOW_LEVEL_BASE: 5000, // Base time for level 1-3 cards (in ms)
  HIGH_LEVEL_BASE: 15000, // Base time for level 4-5 cards (in ms)
  RANDOM_VARIATION: 10000, // Random variation added to base time (in ms)
  CORRECT_ANSWER_CHANCE: 0.6, // 60% chance for enemy to answer correctly
};

// Game Balance Functions
export const calculateCardCost = (level: number): number => {
  return level * CARD_COST_MULTIPLIER;
};

export const calculateEnemyAnswerTime = (level: number): number => {
  const baseTime =
    level > 3
      ? ENEMY_CARD_ANSWER_TIMES.HIGH_LEVEL_BASE
      : ENEMY_CARD_ANSWER_TIMES.LOW_LEVEL_BASE;

  return baseTime + Math.random() * ENEMY_CARD_ANSWER_TIMES.RANDOM_VARIATION;
};
