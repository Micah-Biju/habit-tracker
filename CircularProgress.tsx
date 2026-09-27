import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  showPercentSign?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 110,
  strokeWidth = 10,
  color = '#5d8052',
  trackColor = '#e5eee1',
  label,
  sublabel,
  showPercentSign = true,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            className="transition-all duration-300"
          />
          {/* Progress Stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="font-bold text-stone-900 tracking-tight font-mono tabular-nums leading-none"
            style={{ fontSize: size > 90 ? '1.5rem' : '1.1rem' }}
          >
            {clamped}
            {showPercentSign && <span className="text-xs font-semibold ml-0.5">%</span>}
          </span>
          {label && (
            <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider mt-0.5">
              {label}
            </span>
          )}
        </div>
      </div>

      {sublabel && (
        <span className="mt-1 text-xs text-stone-500 font-mono tabular-nums text-center">
          {sublabel}
        </span>
      )}
    </div>
  );
};
