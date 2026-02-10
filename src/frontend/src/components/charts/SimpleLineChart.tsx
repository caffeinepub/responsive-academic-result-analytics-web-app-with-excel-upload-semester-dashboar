interface LineChartData {
  name: string;
  value: number;
}

interface SimpleLineChartProps {
  data: LineChartData[];
  color?: string;
}

export default function SimpleLineChart({ data, color = 'oklch(var(--chart-2))' }: SimpleLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data available
      </div>
    );
  }

  const chartHeight = 300;
  const chartWidth = 100;
  const padding = { top: 20, right: 20, bottom: 60, left: 40 };

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const valueRange = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * (chartWidth - padding.left - padding.right);
    const y = padding.top + ((maxValue - item.value) / valueRange) * (chartHeight - padding.top - padding.bottom);
    return { x, y, ...item };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full">
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percent => {
          const y = padding.top + (percent / 100) * (chartHeight - padding.top - padding.bottom);
          return (
            <line
              key={percent}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="oklch(var(--border))"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color}
              className="transition-all hover:r-5"
            />
            <text
              x={point.x}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              className="fill-foreground text-xs"
              style={{ fontSize: '10px' }}
            >
              {point.name}
            </text>
            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              className="fill-foreground text-xs font-semibold"
              style={{ fontSize: '11px' }}
            >
              {point.value.toFixed(1)}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
