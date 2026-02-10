interface BarChartData {
  name: string;
  value: number;
}

interface SimpleBarChartProps {
  data: BarChartData[];
}

export default function SimpleBarChart({ data }: SimpleBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = 300;
  
  // Calculate dynamic width based on number of bars
  // Each bar needs ~80px minimum for comfortable spacing and label visibility
  const minBarSlotWidth = 80;
  const calculatedWidth = Math.max(data.length * minBarSlotWidth, 400);
  const shouldScroll = data.length > 5;
  const chartWidth = shouldScroll ? calculatedWidth : '100%';
  
  // Bar width as percentage of slot
  const barWidthPercent = 60;

  return (
    <div className="w-full" style={{ minWidth: shouldScroll ? `${calculatedWidth}px` : undefined }}>
      <svg 
        width={chartWidth} 
        height={chartHeight} 
        className="overflow-visible"
        viewBox={shouldScroll ? `0 0 ${calculatedWidth} ${chartHeight}` : undefined}
        preserveAspectRatio={shouldScroll ? "xMinYMin meet" : undefined}
      >
        <g transform="translate(0, 20)">
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * (chartHeight - 80);
            const slotWidth = shouldScroll ? minBarSlotWidth : calculatedWidth / data.length;
            const x = index * slotWidth + slotWidth / 2;
            const barWidth = (slotWidth * barWidthPercent) / 100;
            
            return (
              <g key={item.name}>
                <rect
                  x={x - barWidth / 2}
                  y={chartHeight - 80 - barHeight}
                  width={barWidth}
                  height={barHeight}
                  fill="oklch(var(--chart-1))"
                  className="transition-all hover:opacity-80"
                />
                <text
                  x={x}
                  y={chartHeight - 60}
                  textAnchor="middle"
                  className="fill-foreground text-xs"
                  style={{ fontSize: '11px' }}
                >
                  {item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name}
                </text>
                <text
                  x={x}
                  y={chartHeight - 80 - barHeight - 5}
                  textAnchor="middle"
                  className="fill-foreground text-xs font-semibold"
                  style={{ fontSize: '12px' }}
                >
                  {item.value}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
