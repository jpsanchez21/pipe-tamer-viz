import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SensorDataPoint } from '@/types/trip';
import { formatTime } from '@/utils/mockData';

interface SensorChartProps {
  data: SensorDataPoint[];
}

const SensorChart = ({ data }: SensorChartProps) => {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      time: formatTime(point.timestamp),
      timestamp: point.timestamp.getTime(),
      weight: point.weight,
      depth: point.depth / 100, // Scale for display
      hookload: point.hookload,
      rpm: point.rpm,
      torque: point.torque / 100, // Scale for display
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="glass-panel rounded-lg p-3 shadow-xl border border-border/50">
        <p className="font-mono text-xs text-muted-foreground mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-mono font-medium">{entry.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(222 30% 18% / 0.5)" 
            vertical={false}
          />
          <XAxis 
            dataKey="time" 
            stroke="hsl(215 20% 55%)"
            tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }}
            tickLine={{ stroke: 'hsl(222 30% 18%)' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="hsl(215 20% 55%)"
            tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }}
            tickLine={{ stroke: 'hsl(222 30% 18%)' }}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="weight"
            name="Weight (klbs)"
            stroke="hsl(195 100% 50%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="hookload"
            name="Hookload (klbs)"
            stroke="hsl(142 71% 45%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="depth"
            name="Depth (x100 ft)"
            stroke="hsl(38 92% 50%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="rpm"
            name="RPM"
            stroke="hsl(280 65% 60%)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SensorChart;
