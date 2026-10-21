// El lado derecho de la lección: banco 3D o gráfico 2D sobre la mesa.

import { useEffect, type ReactNode } from 'react'
import type { Visual } from '../content/types'
import type { Part } from '../engine/types'
import { useBench } from '../sim/benchStore'
import { BenchOverlay, type EditLevel } from '../sim/BenchOverlay'
import { Bench } from '../sim/three/Bench'
import { WIDGETS } from '../widgets/registry'
import { useDecor } from '../content/rewards'

export function BenchVisual({ scene, edit = 'values', children }: { scene: () => Part[]; edit?: EditLevel; children?: ReactNode }) {
  const decor = useDecor()
  useEffect(() => {
    useBench.getState().load(scene())
  }, [scene])
  return (
    <Bench decor={decor} fit="auto">
      <BenchOverlay edit={edit} />
      {children}
    </Bench>
  )
}

export function VisualPane({ visual }: { visual: Visual }) {
  if (visual.kind === 'bench') return <BenchVisual scene={visual.scene} edit={visual.edit} />
  const W = WIDGETS[visual.widget] as unknown as (p: Record<string, unknown>) => ReactNode
  return (
    <div className="desk h-full w-full overflow-auto">
      <W {...(visual.props ?? {})} />
    </div>
  )
}
