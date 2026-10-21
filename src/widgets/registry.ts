import type { ComponentType } from 'react'
import { BlackBox, Clamp, Kcl, Kvl, Power, Rms } from './advanced'
import { Guia } from './guia'
import { CurrentAssoc, Norton, RealSource, TempCo } from './sources'
import { Atom, ChargeCounter, Conductor, Units } from './current'
import { HowToConnect, MeterFace, OhmRules } from './meter'
import { OhmCalc, OhmPlot, SchematicCard, Triangle } from './ohm'
import { BandsView, ColorCode, Materials, RhoLA, SeriesParallel } from './resistance'
import { Cells, Direction, WaterTanks, Wave } from './voltage'

export const WIDGETS = {
  atom: Atom,
  conductor: Conductor,
  charge: ChargeCounter,
  units: Units,
  water: WaterTanks,
  direction: Direction,
  cells: Cells,
  wave: Wave,
  rhola: RhoLA,
  materials: Materials,
  colorcode: ColorCode,
  bands: BandsView,
  seriespar: SeriesParallel,
  triangle: Triangle,
  ohmplot: OhmPlot,
  ohmcalc: OhmCalc,
  schematic: SchematicCard,
  meterface: MeterFace,
  connect: HowToConnect,
  ohmrules: OhmRules,
  power: Power,
  rms: Rms,
  kvl: Kvl,
  kcl: Kcl,
  blackbox: BlackBox,
  clamp: Clamp,
  realsource: RealSource,
  currentassoc: CurrentAssoc,
  norton: Norton,
  tempco: TempCo,
  guia: Guia,
} satisfies Record<string, ComponentType<never>>

export type WidgetId = keyof typeof WIDGETS
