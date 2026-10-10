// Dice rolling for the whole app: expression parsing ("2d6+3", "1d8 + 1d6 + 2"),
// d20 rolls with advantage/disadvantage, and critical-hit damage (dice count
// doubled, flat bonuses unchanged — the standard 5E rule).

export type RollMode = 'normal' | 'adv' | 'dis'

// Uniform integer in [1, sides] without modulo bias.
export function dieRoll(sides: number): number {
  const s = Math.max(1, Math.floor(sides))
  const limit = Math.floor(0x100000000 / s) * s
  const buf = new Uint32Array(1)
  let n: number
  do {
    crypto.getRandomValues(buf)
    n = buf[0]
  } while (n >= limit)
  return (n % s) + 1
}

export interface DiceTerm {
  count: number
  sides: number
  sign: 1 | -1
}

export interface ParsedDice {
  terms: DiceTerm[]
  flat: number
}

const MAX_DICE = 200
const MAX_SIDES = 1000

// Accepts dice terms and flat numbers joined by + or -: "d20", "3d6+4",
// "2d8 + 1d6 - 1". Returns null for anything it can't read, so callers can
// show "couldn't read that" instead of rolling nonsense.
export function parseDice(input: string): ParsedDice | null {
  const src = input.replace(/\s+/g, '').toLowerCase()
  if (!src) return null
  const re = /([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/gy
  const terms: DiceTerm[] = []
  let flat = 0
  let pos = 0
  while (pos < src.length) {
    re.lastIndex = pos
    const m = re.exec(src)
    if (!m || m.index !== pos) return null
    pos = re.lastIndex
    if (m[3] !== undefined) {
      const count = m[2] === '' ? 1 : parseInt(m[2], 10)
      const sides = parseInt(m[3], 10)
      if (count < 1 || count > MAX_DICE || sides < 1 || sides > MAX_SIDES) return null
      terms.push({ count, sides, sign: m[1] === '-' ? -1 : 1 })
    } else {
      // A bare number only makes sense after a sign, except as the first token.
      if (m[4] === '' && pos !== m[5].length) return null
      flat += (m[4] === '-' ? -1 : 1) * parseInt(m[5], 10)
    }
  }
  return terms.length === 0 && flat === 0 ? null : { terms, flat }
}

export interface DiceRoll {
  expression: string
  total: number
  parts: { text: string; rolls: number[]; sign: 1 | -1 }[]
  flat: number
  crit: boolean
}

export function rollDice(expression: string, opts: { crit?: boolean } = {}): DiceRoll | null {
  const parsed = parseDice(expression)
  if (!parsed) return null
  let total = parsed.flat
  const parts = parsed.terms.map((t) => {
    const count = opts.crit ? t.count * 2 : t.count
    const rolls = Array.from({ length: count }, () => dieRoll(t.sides))
    total += t.sign * rolls.reduce((a, b) => a + b, 0)
    return { text: `${count}d${t.sides}`, rolls, sign: t.sign }
  })
  return { expression, total, parts, flat: parsed.flat, crit: !!opts.crit }
}

export interface D20Roll {
  natural: number // the die that counts
  other: number | null // the discarded die under advantage/disadvantage
  modifier: number
  total: number
  mode: RollMode
}

export function rollD20(modifier = 0, mode: RollMode = 'normal'): D20Roll {
  const a = dieRoll(20)
  if (mode === 'normal') return { natural: a, other: null, modifier, total: a + modifier, mode }
  const b = dieRoll(20)
  const natural = mode === 'adv' ? Math.max(a, b) : Math.min(a, b)
  return { natural, other: natural === a ? b : a, modifier, total: natural + modifier, mode }
}

export function describeRoll(r: DiceRoll): string {
  const bits = r.parts.map((p) => `${p.sign < 0 ? '−' : ''}${p.text} [${p.rolls.join(', ')}]`)
  if (r.flat) bits.push(`${r.flat > 0 ? '+' : '−'}${Math.abs(r.flat)}`)
  return bits.join(' ')
}

// ── XP / levelling (PHB p.15) ───────────────────────────────────────────────
// XP required to *reach* each level; index 0 = level 1.
export const XP_FOR_LEVEL = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
]

export function levelForXp(xp: number): number {
  let level = 1
  for (let i = 0; i < XP_FOR_LEVEL.length; i++) if (xp >= XP_FOR_LEVEL[i]) level = i + 1
  return level
}

export function xpToNext(level: number): number | null {
  return level >= 20 ? null : XP_FOR_LEVEL[level]
}
