import { describe, expect, it } from 'vitest'
import {
  DEFAULT_XP_FOR_FIRST_EVOLUTION,
  DEFAULT_XP_FOR_POKEBALL,
  DEFAULT_XP_FOR_SECOND_EVOLUTION,
  getRequiredXPForLevel,
  trimXPDecimals,
} from './xp'

// V2: the XP curve shared by the background and the pet's bar.
describe('getRequiredXPForLevel', () => {
  it('level 0 is the Pokeball hatch threshold', () => {
    expect(getRequiredXPForLevel(0)).toBe(DEFAULT_XP_FOR_POKEBALL)
    expect(getRequiredXPForLevel(0)).toBe(500)
  })

  it('levels 1 and 2 use the fixed evolution thresholds', () => {
    expect(getRequiredXPForLevel(1)).toBe(DEFAULT_XP_FOR_FIRST_EVOLUTION)
    expect(getRequiredXPForLevel(1)).toBe(1000)
    expect(getRequiredXPForLevel(2)).toBe(DEFAULT_XP_FOR_SECOND_EVOLUTION)
    expect(getRequiredXPForLevel(2)).toBe(2000)
  })

  it('levels above 2 grow by 50 XP per level', () => {
    expect(getRequiredXPForLevel(3)).toBe(DEFAULT_XP_FOR_SECOND_EVOLUTION + 50)
    expect(getRequiredXPForLevel(10)).toBe(DEFAULT_XP_FOR_SECOND_EVOLUTION + 8 * 50)
  })

  it('is strictly increasing', () => {
    let previous = 0
    for (let level = 0; level <= 20; level++) {
      const required = getRequiredXPForLevel(level)
      expect(required).toBeGreaterThan(previous)
      previous = required
    }
  })
})

describe('trimXPDecimals', () => {
  it('leaves integers and short decimals untouched', () => {
    expect(trimXPDecimals(13)).toBe(13)
    expect(trimXPDecimals(6.5)).toBe(6.5)
    expect(trimXPDecimals(9.1)).toBe(9.1)
  })

  it('cuts float dust from fractional multipliers to 2 decimals', () => {
    expect(trimXPDecimals(7 * 2.3)).toBe(16.1)
    expect(trimXPDecimals(16.099999999999998)).toBe(16.1)
    expect(`${trimXPDecimals(7 * 2.3)}`).toBe('16.1')
  })
})
