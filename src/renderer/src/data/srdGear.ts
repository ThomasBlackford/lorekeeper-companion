import type { InventoryCategory } from '../types'

// Standard weapons, armor and adventuring gear (SRD 5.1 values). Picking one
// fills the item form's fields — weapons with a damage die automatically show
// up in the Actions tab like any other item with damage.
export interface GearEntry {
  name: string
  group: 'Weapons' | 'Armor' | 'Gear'
  category: InventoryCategory
  weight: number // lb
  cost: number // gp
  damage?: string
  damage_type?: string
  range?: string
  notes: string
}

const W = (
  name: string, damage: string, damage_type: string, weight: number, cost: number, notes: string, range = 'Melee'
): GearEntry => ({ name, group: 'Weapons', category: 'equipment', weight, cost, damage, damage_type, range, notes })

const A = (name: string, weight: number, cost: number, notes: string): GearEntry => ({
  name, group: 'Armor', category: 'equipment', weight, cost, notes
})

const G = (name: string, weight: number, cost: number, notes = ''): GearEntry => ({
  name, group: 'Gear', category: 'backpack', weight, cost, notes
})

export const SRD_GEAR: GearEntry[] = [
  // Simple melee
  W('Club', '1d4', 'bludgeoning', 2, 0.1, 'Simple · Light'),
  W('Dagger', '1d4', 'piercing', 1, 2, 'Simple · Finesse, light, thrown (20/60)'),
  W('Greatclub', '1d8', 'bludgeoning', 10, 0.2, 'Simple · Two-handed'),
  W('Handaxe', '1d6', 'slashing', 2, 5, 'Simple · Light, thrown (20/60)'),
  W('Javelin', '1d6', 'piercing', 2, 0.5, 'Simple · Thrown (30/120)'),
  W('Light Hammer', '1d4', 'bludgeoning', 2, 2, 'Simple · Light, thrown (20/60)'),
  W('Mace', '1d6', 'bludgeoning', 4, 5, 'Simple'),
  W('Quarterstaff', '1d6', 'bludgeoning', 4, 0.2, 'Simple · Versatile (1d8)'),
  W('Sickle', '1d4', 'slashing', 2, 1, 'Simple · Light'),
  W('Spear', '1d6', 'piercing', 3, 1, 'Simple · Thrown (20/60), versatile (1d8)'),
  // Simple ranged
  W('Light Crossbow', '1d8', 'piercing', 5, 25, 'Simple · Ammunition, loading, two-handed', '80/320 ft'),
  W('Dart', '1d4', 'piercing', 0.25, 0.05, 'Simple · Finesse, thrown', '20/60 ft'),
  W('Shortbow', '1d6', 'piercing', 2, 25, 'Simple · Ammunition, two-handed', '80/320 ft'),
  W('Sling', '1d4', 'bludgeoning', 0, 0.1, 'Simple · Ammunition', '30/120 ft'),
  // Martial melee
  W('Battleaxe', '1d8', 'slashing', 4, 10, 'Martial · Versatile (1d10)'),
  W('Flail', '1d8', 'bludgeoning', 2, 10, 'Martial'),
  W('Glaive', '1d10', 'slashing', 6, 20, 'Martial · Heavy, reach, two-handed'),
  W('Greataxe', '1d12', 'slashing', 7, 30, 'Martial · Heavy, two-handed'),
  W('Greatsword', '2d6', 'slashing', 6, 50, 'Martial · Heavy, two-handed'),
  W('Halberd', '1d10', 'slashing', 6, 20, 'Martial · Heavy, reach, two-handed'),
  W('Lance', '1d12', 'piercing', 6, 10, 'Martial · Reach, special'),
  W('Longsword', '1d8', 'slashing', 3, 15, 'Martial · Versatile (1d10)'),
  W('Maul', '2d6', 'bludgeoning', 10, 10, 'Martial · Heavy, two-handed'),
  W('Morningstar', '1d8', 'piercing', 4, 15, 'Martial'),
  W('Pike', '1d10', 'piercing', 18, 5, 'Martial · Heavy, reach, two-handed'),
  W('Rapier', '1d8', 'piercing', 2, 25, 'Martial · Finesse'),
  W('Scimitar', '1d6', 'slashing', 3, 25, 'Martial · Finesse, light'),
  W('Shortsword', '1d6', 'piercing', 2, 10, 'Martial · Finesse, light'),
  W('Trident', '1d6', 'piercing', 4, 5, 'Martial · Thrown (20/60), versatile (1d8)'),
  W('War Pick', '1d8', 'piercing', 2, 5, 'Martial'),
  W('Warhammer', '1d8', 'bludgeoning', 2, 15, 'Martial · Versatile (1d10)'),
  W('Whip', '1d4', 'slashing', 3, 2, 'Martial · Finesse, reach'),
  // Martial ranged
  W('Blowgun', '1', 'piercing', 1, 10, 'Martial · Ammunition, loading', '25/100 ft'),
  W('Hand Crossbow', '1d6', 'piercing', 3, 75, 'Martial · Ammunition, light, loading', '30/120 ft'),
  W('Heavy Crossbow', '1d10', 'piercing', 18, 50, 'Martial · Ammunition, heavy, loading, two-handed', '100/400 ft'),
  W('Longbow', '1d8', 'piercing', 2, 50, 'Martial · Ammunition, heavy, two-handed', '150/600 ft'),

  // Armor
  A('Padded Armor', 8, 5, 'Light · AC 11 + Dex · Disadvantage on Stealth'),
  A('Leather Armor', 10, 10, 'Light · AC 11 + Dex'),
  A('Studded Leather Armor', 13, 45, 'Light · AC 12 + Dex'),
  A('Hide Armor', 12, 10, 'Medium · AC 12 + Dex (max 2)'),
  A('Chain Shirt', 20, 50, 'Medium · AC 13 + Dex (max 2)'),
  A('Scale Mail', 45, 50, 'Medium · AC 14 + Dex (max 2) · Disadvantage on Stealth'),
  A('Breastplate', 20, 400, 'Medium · AC 14 + Dex (max 2)'),
  A('Half Plate', 40, 750, 'Medium · AC 15 + Dex (max 2) · Disadvantage on Stealth'),
  A('Ring Mail', 40, 30, 'Heavy · AC 14 · Disadvantage on Stealth'),
  A('Chain Mail', 55, 75, 'Heavy · AC 16 · Str 13 · Disadvantage on Stealth'),
  A('Splint Armor', 60, 200, 'Heavy · AC 17 · Str 15 · Disadvantage on Stealth'),
  A('Plate Armor', 65, 1500, 'Heavy · AC 18 · Str 15 · Disadvantage on Stealth'),
  A('Shield', 6, 10, 'Shield · +2 AC'),

  // Adventuring gear
  G('Backpack', 5, 2, 'Holds 1 cubic foot / 30 lb'),
  G('Bedroll', 7, 1),
  G('Rations (1 day)', 2, 0.5),
  G('Waterskin', 5, 0.2, 'Holds 4 pints'),
  G('Rope, hempen (50 ft)', 10, 1),
  G('Torch', 1, 0.01, 'Bright light 20 ft for 1 hour'),
  G('Tinderbox', 1, 0.5),
  G('Crowbar', 5, 2),
  G('Grappling Hook', 4, 2),
  G('Lantern, hooded', 2, 5),
  G('Oil (flask)', 1, 0.1),
  G('Healing Potion', 0.5, 50, 'Regain 2d4 + 2 hit points'),
  G("Thieves' Tools", 1, 25),
  G("Healer's Kit", 3, 5, '10 uses; stabilize a creature without a Medicine check'),
  G('Spellbook', 3, 50),
  G('Holy Symbol', 1, 5),
  G('Component Pouch', 2, 25)
]
