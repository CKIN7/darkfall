/**
 * Enum: HeroClass
 *
 * PATRÓN: Enum (TypeScript const enum alternative)
 * POR QUÉ: Define clases de héroe disponibles.
 * Usamos object as const para type safety y tree-shaking.
 *
 * DECISIÓN: Object as const + type inference.
 * ALTERNATIVAS DESCARTADAS:
 * - enum nativo: compila a IIFE, no tree-shakeable, problemas con const enum
 * - string union type: 'WARRIOR' | 'MAGE' | 'ROGUE' - sin runtime values
 * - Class con static readonly: más verbose
 */
export const HeroClass = {
  WARRIOR: 'WARRIOR',
  MAGE: 'MAGE',
  ROGUE: 'ROGUE',
} as const;

export type HeroClassType = (typeof HeroClass)[keyof typeof HeroClass];

/**
 * Valida si un string es una clase válida
 */
export function isValidHeroClass(value: string): value is HeroClassType {
  return Object.values(HeroClass).includes(value as HeroClassType);
}

/**
 * Stats base por clase (para futuro balance)
 * Extensible sin modificar Hero entity
 */
export const BASE_STATS_BY_CLASS: Record<HeroClassType, { strength: number; dexterity: number; vitality: number; energy: number }> = {
  [HeroClass.WARRIOR]: { strength: 12, dexterity: 8, vitality: 12, energy: 8 },
  [HeroClass.MAGE]: { strength: 6, dexterity: 8, vitality: 8, energy: 18 },
  [HeroClass.ROGUE]: { strength: 8, dexterity: 14, vitality: 8, energy: 10 },
};