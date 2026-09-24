// 6 predefined multi-player cursor colors matching design.md specifications
export const CURSOR_COLORS = [
  '#E5484D', // Red
  '#F5A623', // Orange
  '#2E7D5B', // Green
  '#0EA5E9', // Blue
  '#D946A0', // Pink
  '#9333EA', // Purple
];

const ADJECTIVES = [
  'Anonymous', 'Sneaky', 'Brave', 'Clever', 'Quick', 'Sleepy',
  'Happy', 'Fierce', 'Gentle', 'Lively', 'Quiet', 'Mighty'
];

const ANIMALS = [
  'Panda', 'Tiger', 'Lion', 'Bear', 'Falcon', 'Wolf',
  'Otter', 'Fox', 'Koala', 'Leopard', 'Penguin', 'Owl'
];

/**
 * Returns a random name like "Anonymous Panda"
 */
function getRandomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}

/**
 * Returns a color sequentially or randomly from the defined palette
 */
function getRandomColor() {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
}

/**
 * Generates a user profile object suitable for Yjs awareness
 */
export function generateRandomUser() {
  return {
    name: getRandomName(),
    color: getRandomColor(),
  };
}
