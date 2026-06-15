interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export function Sparkline({ data, width = 56, height = 24, color = "#7c3aed" }: SparklineProps) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pad = 2

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2)
    const y = pad + (1 - (v - min) / range) * (height - pad * 2)
    return `${x},${y}`
  })

  const area = [
    `M ${points[0]}`,
    ...points.slice(1).map((p) => `L ${p}`),
    `L ${width - pad},${height - pad}`,
    `L ${pad},${height - pad}`,
    "Z",
  ].join(" ")

  const line = [`M ${points[0]}`, ...points.slice(1).map((p) => `L ${p}`)].join(" ")

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0 opacity-80">
      <path d={area} fill={color} fillOpacity={0.15} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
