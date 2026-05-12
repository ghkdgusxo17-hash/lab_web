'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, SkipForward, SkipBack, Info, Layers, X } from 'lucide-react'

const CYCLE_STEPS_4BED = [
  { id: 1, states: ['AD', 'BD', 'DPE', 'PPE'], duration: 1500, desc: 'Col 1 Adsorbs. Col 3 equalizes pressure with Col 4. Col 2 Blowdown.' },
  { id: 2, states: ['AD', 'PG', 'PP', 'IDLE'], duration: 3000, desc: 'Col 1 Adsorbs. Col 3 provides Purge to Col 2.' },
  { id: 3, states: ['AD/PBF', 'IDLE', 'BD', 'BF'], duration: 3000, desc: 'Col 1 Adsorbs & Backfills Col 4. Col 3 Blowdown.' },
  { id: 4, states: ['DPE', 'PPE', 'BD', 'AD'], duration: 1500, desc: 'Col 4 Adsorbs. Col 1 equalizes pressure with Col 2. Col 3 Blowdown.' },
  { id: 5, states: ['PP', 'IDLE', 'PG', 'AD'], duration: 3000, desc: 'Col 4 Adsorbs. Col 1 provides Purge to Col 3.' },
  { id: 6, states: ['BD', 'BF', 'IDLE', 'AD/PBF'], duration: 3000, desc: 'Col 4 Adsorbs & Backfills Col 2. Col 1 Blowdown.' },
  { id: 7, states: ['BD', 'AD', 'PPE', 'DPE'], duration: 1500, desc: 'Col 2 Adsorbs. Col 4 equalizes pressure with Col 3. Col 1 Blowdown.' },
  { id: 8, states: ['PG', 'AD', 'IDLE', 'PP'], duration: 3000, desc: 'Col 2 Adsorbs. Col 4 provides Purge to Col 1.' },
  { id: 9, states: ['IDLE', 'AD/PBF', 'BF', 'BD'], duration: 3000, desc: 'Col 2 Adsorbs & Backfills Col 3. Col 4 Blowdown.' },
  { id: 10, states: ['PPE', 'DPE', 'AD', 'BD'], duration: 1500, desc: 'Col 3 Adsorbs. Col 2 equalizes pressure with Col 1. Col 4 Blowdown.' },
  { id: 11, states: ['IDLE', 'PP', 'AD', 'PG'], duration: 3000, desc: 'Col 3 Adsorbs. Col 2 provides Purge to Col 4.' },
  { id: 12, states: ['BF', 'BD', 'AD/PBF', 'IDLE'], duration: 3000, desc: 'Col 3 Adsorbs & Backfills Col 1. Col 2 Blowdown.' },
]

const CYCLE_STEPS_2BED = [
  { id: 1, states: ['AD', 'PG'], duration: 2500, desc: 'Bed 1 Adsorbs (Produces H2). Bed 2 is Purged.' },
  { id: 2, states: ['DPE', 'PPE'], duration: 1000, desc: 'Bed 1 Depressurizes and equalizes pressure with Bed 2.' },
  { id: 3, states: ['BD', 'PR'], duration: 1500, desc: 'Bed 1 Blowdown (Waste). Bed 2 Pressurizes.' },
  { id: 4, states: ['PG', 'AD'], duration: 2500, desc: 'Bed 2 Adsorbs (Produces H2). Bed 1 is Purged.' },
  { id: 5, states: ['PPE', 'DPE'], duration: 1000, desc: 'Bed 2 Depressurizes and equalizes pressure with Bed 1.' },
  { id: 6, states: ['PR', 'BD'], duration: 1500, desc: 'Bed 2 Blowdown (Waste). Bed 1 Pressurizes.' },
]

const getTargetImpurity = (colIdx: number, stepIdx: number, is2Bed: boolean) => {
  if (is2Bed) {
    const feedSeq = [10, 0, 0, 0, 0, 10]
    const co2Seq = [45, 65, 25, 0, 0, 15]
    const n2Seq = [80, 90, 35, 0, 0, 25]
    const shifts = [0, 3]
    const shiftIdx = (stepIdx + shifts[colIdx]) % 6
    return { feed: feedSeq[shiftIdx], co2: co2Seq[shiftIdx], n2: n2Seq[shiftIdx] }
  }

  const feedSeq = [10, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  const co2Seq = [25, 45, 65, 75, 80, 50, 20, 0, 0, 0, 0, 0]
  const n2Seq = [60, 80, 90, 90, 90, 60, 25, 0, 0, 0, 0, 0]
  const shifts = [0, 6, 3, 9]
  const shiftIdx = (stepIdx + shifts[colIdx]) % 12
  return { feed: feedSeq[shiftIdx], co2: co2Seq[shiftIdx], n2: n2Seq[shiftIdx] }
}

const getTargetPressure = (colIdx: number, stepIdx: number, is2Bed: boolean) => {
  if (is2Bed) {
    const seq = [1.0, 0.6, 0.2, 0.2, 0.6, 1.0]
    const shifts = [0, 3]
    return seq[(stepIdx + shifts[colIdx]) % 6]
  }
  const seq = [1.0, 1.0, 1.0, 0.8, 0.5, 0.3, 0.1, 0.1, 0.1, 0.5, 0.5, 1.0]
  const shifts = [0, 6, 3, 9]
  return seq[(stepIdx + shifts[colIdx]) % 12]
}

function AnimatedPipe({ path, active, direction = 1, color = '#94a3b8' }: { path: string; active: boolean; direction?: number; color?: string }) {
  return (
    <g>
      <path d={path} fill="none" stroke={color} strokeWidth="4" style={{ opacity: active ? 0.3 : 0.1, transition: 'opacity 0.3s ease' }} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray="8,8"
        className={active ? (direction > 0 ? 'psa-flow-forward' : 'psa-flow-backward') : ''}
        style={{ opacity: active ? 1 : 0, transition: 'opacity 0.3s ease' }}
      />
    </g>
  )
}

function Valve({ x, y, isOpen }: { x: number; y: number; isOpen: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`} className="transition-all duration-300">
      <circle
        cx="0" cy="0" r="8"
        fill="#0f172a"
        stroke={isOpen ? '#10b981' : '#475569'}
        strokeWidth="2"
        style={{ filter: isOpen ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))' : 'none' }}
      />
      <rect
        x="-2.5" y="-6" width="5" height="12"
        fill={isOpen ? '#10b981' : '#475569'}
        className="transition-transform duration-500 ease-in-out"
        style={{ transform: `rotate(${isOpen ? 0 : 90}deg)` }}
      />
    </g>
  )
}

export function PSACycleAnimation({ onClose }: { onClose: () => void }) {
  const [is2Bed, setIs2Bed] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const CYCLE_STEPS = is2Bed ? CYCLE_STEPS_2BED : CYCLE_STEPS_4BED
  const numSteps = is2Bed ? 6 : 12

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (isPlaying) {
      timer = setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % numSteps)
      }, CYCLE_STEPS[currentStep % numSteps].duration)
    }
    return () => clearTimeout(timer)
  }, [isPlaying, currentStep, CYCLE_STEPS, numSteps])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const safeStep = currentStep % numSteps
  const stepData = CYCLE_STEPS[safeStep]
  const colCenters = is2Bed ? [290, 450] : [130, 290, 450, 610]
  const hasPG = stepData.states.includes('PG')

  const activeFeedXs: number[] = []
  const activeProductProducerXs: number[] = []
  const activeProductReceiverXs: number[] = []
  const activeWasteXs: number[] = []
  const activeTransferSourceXs: number[] = []
  const activeTransferDestXs: number[] = []

  colCenters.forEach((cx, i) => {
    const state = stepData.states[i]
    const leftPipeX = cx - 15
    const rightPipeX = cx + 15
    const isFeedUp = state.includes('AD') || state === 'PR'
    const isProductUp = state.includes('AD')
    const isProductDown = state === 'BF'
    const isTransferUp = state === 'DPE' || state === 'PP' || (is2Bed && state.includes('AD') && hasPG)
    const isTransferDown = state === 'PPE' || state === 'PG'
    const isWasteDown = state === 'BD' || state === 'PG'
    if (isFeedUp) activeFeedXs.push(leftPipeX)
    if (isProductUp) activeProductProducerXs.push(leftPipeX)
    if (isProductDown) activeProductReceiverXs.push(leftPipeX)
    if (isWasteDown) activeWasteXs.push(rightPipeX)
    if (isTransferUp) activeTransferSourceXs.push(rightPipeX)
    if (isTransferDown) activeTransferDestXs.push(rightPipeX)
  })

  const feedMaxX = activeFeedXs.length > 0 ? Math.max(...activeFeedXs) : -1
  const prodMinX = activeProductProducerXs.length > 0 ? Math.min(...activeProductProducerXs) : -1
  const wasteMinX = activeWasteXs.length > 0 ? Math.min(...activeWasteXs) : -1
  const transferSourceX = activeTransferSourceXs.length > 0 ? activeTransferSourceXs[0] : -1
  const transferDestX = activeTransferDestXs.length > 0 ? activeTransferDestXs[0] : -1
  const prodReceiverX = activeProductReceiverXs.length > 0 ? activeProductReceiverXs[0] : -1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-5xl max-h-[90vh] mx-4 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 md:p-6 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              PSA Cycle Visualization
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {is2Bed ? '6-step 2-bed' : '12-step 4-bed'} PSA cycle for H&#x2082; production
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIs2Bed(!is2Bed); setCurrentStep(0) }}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors border border-slate-700"
            >
              <Layers size={16} />
              {is2Bed ? '4-Bed' : '2-Bed'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {/* Controls */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => { setIsPlaying(false); setCurrentStep((prev) => (prev - 1 + numSteps) % numSteps) }}
                className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                <SkipBack size={18} />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-900/50"
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
              </button>
              <button
                onClick={() => { setIsPlaying(false); setCurrentStep((prev) => (prev + 1) % numSteps) }}
                className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                <SkipForward size={18} />
              </button>
            </div>

            <div className="w-full max-w-3xl">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
                <span>Step {safeStep + 1} / {numSteps}</span>
                <span>{stepData.duration / 1000}s</span>
              </div>
              <div className="flex gap-1">
                {CYCLE_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full cursor-pointer transition-colors ${i === safeStep ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800 hover:bg-slate-700'}`}
                    onClick={() => { setCurrentStep(i); setIsPlaying(false) }}
                  />
                ))}
              </div>
              <div className="mt-3 text-center text-sm text-slate-300 min-h-[40px] flex items-center justify-center bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50">
                <Info size={16} className="mr-2 text-blue-400 shrink-0" />
                <p>{stepData.desc}</p>
              </div>
            </div>
          </div>

          {/* SVG Visualization */}
          <div className="relative w-full aspect-[4/3] max-w-4xl mx-auto bg-slate-950 rounded-xl overflow-hidden border border-slate-800/50">
            <svg viewBox="0 0 800 600" className="w-full h-full">
              <defs>
                <pattern id="psa-ac-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="#334155" />
                  <circle cx="6" cy="6" r="1.5" fill="#334155" />
                </pattern>
                <pattern id="psa-zeo-pattern" x="0" y="0" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="2" />
                </pattern>
                {[130, 290, 450, 610].map((cx) => (
                  <clipPath id={`psa-clip-${cx}`} key={`psa-clip-${cx}`}>
                    <rect x={cx - 28} y={202} width={56} height={196} rx={6} />
                  </clipPath>
                ))}
              </defs>

              {/* Horizontal pipes - base */}
              <path d="M 115 60 L 680 60" fill="none" stroke="#10b981" strokeWidth="4" style={{ opacity: 0.1 }} />
              <path d="M 145 120 L 625 120" fill="none" stroke="#3b82f6" strokeWidth="4" style={{ opacity: 0.1 }} />
              <path d="M 145 480 L 680 480" fill="none" stroke="#ec4899" strokeWidth="4" style={{ opacity: 0.1 }} />
              <path d="M 50 540 L 595 540" fill="none" stroke="#8b5cf6" strokeWidth="4" style={{ opacity: 0.1 }} />

              {/* Horizontal pipes - active */}
              {prodMinX !== -1 && <AnimatedPipe path={`M ${prodMinX} 60 L 680 60`} active={true} color="#10b981" />}
              {prodMinX !== -1 && prodReceiverX !== -1 && (
                <AnimatedPipe
                  path={`M ${Math.min(prodMinX, prodReceiverX)} 60 L ${Math.max(prodMinX, prodReceiverX)} 60`}
                  active={true} direction={prodMinX > prodReceiverX ? -1 : 1} color="#10b981"
                />
              )}
              <text x="690" y="65" fill={prodMinX !== -1 ? '#10b981' : '#334155'} className="text-sm font-bold transition-colors">H&#x2082; Product</text>

              {transferSourceX !== -1 && transferDestX !== -1 && (
                <AnimatedPipe
                  path={`M ${Math.min(transferSourceX, transferDestX)} 120 L ${Math.max(transferSourceX, transferDestX)} 120`}
                  active={true} direction={transferSourceX > transferDestX ? -1 : 1} color="#3b82f6"
                />
              )}
              <text x="635" y="125" fill={transferSourceX !== -1 && transferDestX !== -1 ? '#3b82f6' : '#334155'} className="text-sm font-bold transition-colors">Transfer / Purge</text>

              {wasteMinX !== -1 && <AnimatedPipe path={`M ${wasteMinX} 480 L 680 480`} active={true} color="#ec4899" />}
              <text x="690" y="485" fill={wasteMinX !== -1 ? '#ec4899' : '#334155'} className="text-sm font-bold transition-colors">Waste</text>

              {feedMaxX !== -1 && <AnimatedPipe path={`M 50 540 L ${feedMaxX} 540`} active={true} color="#8b5cf6" />}
              <text x="10" y="545" fill={feedMaxX !== -1 ? '#8b5cf6' : '#334155'} className="text-sm font-bold transition-colors">Feed</text>

              {/* Columns & Vertical Pipes */}
              {colCenters.map((cx, i) => {
                const state = stepData.states[i]
                const impurity = getTargetImpurity(i, safeStep, is2Bed)
                const pressure = getTargetPressure(i, safeStep, is2Bed)
                const isFeedUp = state.includes('AD') || state === 'PR'
                const isProductUp = state.includes('AD')
                const isProductDown = state === 'BF'
                const isTransferUp = state === 'DPE' || state === 'PP' || (is2Bed && state.includes('AD') && hasPG)
                const isTransferDown = state === 'PPE' || state === 'PG'
                const isWasteDown = state === 'BD' || state === 'PG'

                return (
                  <g key={i}>
                    {/* Top Product Pipe */}
                    <AnimatedPipe path={`M ${cx - 15} 200 L ${cx - 15} 60`} active={isProductUp || isProductDown} direction={isProductUp ? 1 : -1} color="#10b981" />
                    {/* Top Transfer Pipe */}
                    <AnimatedPipe path={`M ${cx + 15} 200 L ${cx + 15} 120`} active={isTransferUp || isTransferDown} direction={isTransferUp ? 1 : -1} color="#3b82f6" />
                    {/* Bottom Waste Pipe */}
                    <AnimatedPipe path={`M ${cx + 15} 400 L ${cx + 15} 480`} active={isWasteDown} direction={1} color="#ec4899" />
                    {/* Bottom Feed Pipe */}
                    <AnimatedPipe path={`M ${cx - 15} 400 L ${cx - 15} 540`} active={isFeedUp} direction={-1} color="#8b5cf6" />

                    {/* Valves */}
                    <Valve x={cx - 15} y={100} isOpen={isProductUp || isProductDown} />
                    <Valve x={cx + 15} y={160} isOpen={isTransferUp || isTransferDown} />
                    <Valve x={cx + 15} y={430} isOpen={isWasteDown} />
                    <Valve x={cx - 15} y={460} isOpen={isFeedUp} />

                    {/* Column Base */}
                    <rect x={cx - 30} y={200} width={60} height={200} rx={8} fill="#0f172a" />
                    {/* Zeolite Layer (Top 20%) */}
                    <rect x={cx - 28} y={202} width={56} height={39} fill="url(#psa-zeo-pattern)" />
                    {/* AC Layer (Bottom 80%) */}
                    <rect x={cx - 28} y={241} width={56} height={157} fill="url(#psa-ac-pattern)" />
                    {/* Column Border */}
                    <rect x={cx - 30} y={200} width={60} height={200} rx={8} fill="none" stroke="#475569" strokeWidth="2" />

                    {/* Gas Fills (Stacked Chromatographic Separation) */}
                    <g clipPath={`url(#psa-clip-${cx})`}>
                      {/* H2 Fill (Green) - Top */}
                      <rect
                        x={cx - 28} y={202} width={56}
                        height={Math.max(0, 196 * ((100 - impurity.n2) / 100))}
                        fill="#10b981"
                        style={{ opacity: pressure * 0.4 }}
                        className="transition-all duration-1000 ease-in-out pointer-events-none"
                      />
                      {/* N2 Fill (Yellow) */}
                      <rect
                        x={cx - 28} y={398 - (196 * impurity.n2 / 100)} width={56}
                        height={Math.max(0, 196 * ((impurity.n2 - impurity.co2) / 100))}
                        fill="#eab308"
                        style={{ opacity: (impurity.n2 - impurity.co2) <= 0 ? 0 : 0.45 }}
                        className="transition-all duration-1000 ease-in-out pointer-events-none"
                      />
                      {/* CO2 Fill (Red) */}
                      <rect
                        x={cx - 28} y={398 - (196 * impurity.co2 / 100)} width={56}
                        height={Math.max(0, 196 * ((impurity.co2 - impurity.feed) / 100))}
                        fill="#ef4444"
                        style={{ opacity: (impurity.co2 - impurity.feed) <= 0 ? 0 : 0.45 }}
                        className="transition-all duration-1000 ease-in-out pointer-events-none"
                      />
                      {/* Feed Fill (Purple) - Bottom */}
                      <rect
                        x={cx - 28} y={398 - (196 * impurity.feed / 100)} width={56}
                        height={Math.max(0, 196 * (impurity.feed / 100))}
                        fill="#8b5cf6"
                        style={{ opacity: impurity.feed <= 0 ? 0 : 0.6 }}
                        className="transition-all duration-1000 ease-in-out pointer-events-none"
                      />
                    </g>

                    {/* Column Label */}
                    <text
                      x={cx - 45} y={300}
                      fill="#cbd5e1"
                      textAnchor="middle"
                      className="text-sm font-bold tracking-wider"
                      transform={`rotate(-90, ${cx - 45}, 300)`}
                    >
                      BED {i + 1}
                    </text>

                    {/* State Label */}
                    <rect x={cx - 35} y={300 - 14} width={70} height={28} rx={6} fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <text x={cx} y={305} fill="#38bdf8" textAnchor="middle" className="text-xs font-bold font-mono tracking-wide">{state}</text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6 justify-center text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] shadow-[0_0_6px_#8b5cf6]" /> Feed</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]" /> H&#x2082; (Product)</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_6px_#3b82f6]" /> Transfer / Purge</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ec4899] shadow-[0_0_6px_#ec4899]" /> Waste</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_6px_#ef4444]" /> CO, CO&#x2082; (in AC)</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#eab308] shadow-[0_0_6px_#eab308]" /> N&#x2082; (in Zeolite)</div>
            <div className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="-10 -10 20 20">
                <circle cx="0" cy="0" r="8" fill="#0f172a" stroke="#10b981" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.8))' }} />
                <rect x="-2.5" y="-6" width="5" height="12" fill="#10b981" />
              </svg>
              Valve Open
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="-10 -10 20 20">
                <circle cx="0" cy="0" r="8" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                <rect x="-2.5" y="-6" width="5" height="12" fill="#475569" transform="rotate(90)" />
              </svg>
              Valve Closed
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
