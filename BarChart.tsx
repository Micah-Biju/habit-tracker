import React from 'react';

interface DayBarData {
  dayLabel: string; // e.g. "Mon"
  completed: number;
  total: number;
  isToday?: boolean;
}

interface BarChartProps {
  data: DayBarData[];
  barColor: string;
  emptyColor?: string;
  maxScale?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  barColor,
  emptyColor = '#e5eee1',
  maxScale,
}) => {
  // Determine highest value for Y axis (minimum 8 for nice spreadsheet ticks)
  const highestCount = Math.max(...data.map((d) => Math.max(d.total, d.completed)), 6);
  const calculatedMax = maxScale || Math.max(10, Math.ceil(highestCount / 2) * 2);
  const ticks = [calculatedMax, Math.round(calculatedMax * 0.75), Math.round(calculatedMax * 0.5), Math.round(calculatedMax * 0.25), 0];

  return (
    <div className="w-full flex flex-col select-none">
      <div className="flex items-end h-44 w-full gap-2 pt-2 pb-1 relative">
        {/* Y Axis scale */}
        <div className="flex flex-col justify-between h-full pr-2 text-right border-r border-stone-200 shrink-0 select-none pb-1">
          {ticks.map((val, idx) => (
            <span key={idx} className="text-[10px] text-stone-400 font-mono tabular-nums leading-none">
              {val}
            </span>
          ))}
        </div>

        {/* Chart Area with Horizontal Grid Lines */}
        <div className="relative flex-1 h-full flex items-end justify-around gap-2 px-1">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
            {ticks.map((_, idx) => (
              <div key={idx} className="w-full border-b border-stone-100" />
            ))}
          </div>

          {/* Day Bars */}
          {data.map((item, idx) => {
            const completedHeight = item.total > 0 ? (item.completed / calculatedMax) * 100 : 0;
            const totalHeight = item.total > 0 ? (item.total / calculatedMax) * 100 : 0;
            const percent = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group relative z-10"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none bg-stone-900 text-white text-[11px] font-mono py-1 px-2 rounded shadow-md whitespace-nowrap z-20">
                  {item.dayLabel}: {item.completed}/{item.total} ({percent}%)
                </div>

                {/* Bar Container */}
                <div
                  className="w-full max-w-[32px] rounded-t-sm flex items-end justify-center relative overflow-hidden transition-all duration-300"
                  style={{
                    height: `${Math.max(totalHeight, 6)}%`,
                    backgroundColor: item.total > 0 ? emptyColor : 'transparent',
                  }}
                >
                  {/* Completed Fill */}
                  <div
                    className="w-full rounded-t-sm transition-all duration-500 ease-out"
                    style={{
                      height: `${completedHeight}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X Axis Labels */}
      <div className="flex w-full pl-6 pr-1 pt-1.5 border-t border-stone-200">
        <div className="w-4 shrink-0" />
        <div className="flex-1 flex justify-around">
          {data.map((item, idx) => (
            <span
              key={idx}
              className={`text-xs font-mono font-medium text-center flex-1 ${
                item.isToday ? 'text-stone-900 font-bold underline underline-offset-4 decoration-2' : 'text-stone-500'
              }`}
            >
              {item.dayLabel}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
