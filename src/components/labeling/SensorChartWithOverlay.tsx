import { useRef, useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SensorDataPoint, SensorConfig, PipeTrip } from '@/types/trip';
import { formatTime } from '@/utils/mockData';
import IntervalBlock from './IntervalBlock';

interface SensorChartWithOverlayProps {
  data: SensorDataPoint[];
  sensor: SensorConfig;
  trips: PipeTrip[];
  startDate: Date;
  endDate: Date;
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  onUpdateTrip: (tripId: string, updates: Partial<PipeTrip>) => void;
  showTimeAxis?: boolean;
}

const SensorChartWithOverlay = ({
  data,
  sensor,
  trips,
  startDate,
  endDate,
  selectedTripId,
  onSelectTrip,
  onUpdateTrip,
  showTimeAxis = false,
}: SensorChartWithOverlayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Account for Y-axis width (40px) and right margin (10px)
        setContainerWidth(containerRef.current.offsetWidth - 50);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const chartData = useMemo(() => {
    return data.map((point) => ({
      time: formatTime(point.timestamp),
      timestamp: point.timestamp.getTime(),
      value: sensor.scale ? point[sensor.key] / sensor.scale : point[sensor.key],
    }));
  }, [data, sensor]);

  return (
    <div ref={containerRef} className="relative w-full h-[120px]">
      {/* Sensor label */}
      <div className="absolute top-2 left-12 z-10 flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: sensor.color }}
        />
        <span className="text-xs font-medium text-muted-foreground">
          {sensor.label} ({sensor.unit})
        </span>
      </div>

      {/* Chart */}
      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 25, right: 10, left: 0, bottom: showTimeAxis ? 20 : 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(222 30% 18% / 0.5)" 
              vertical={true}
            />
            {showTimeAxis && (
              <XAxis 
                dataKey="time" 
                stroke="hsl(215 20% 55%)"
                tick={{ fill: 'hsl(215 20% 55%)', fontSize: 9 }}
                tickLine={{ stroke: 'hsl(222 30% 18%)' }}
                interval="preserveStartEnd"
              />
            )}
            <YAxis 
              stroke="hsl(215 20% 55%)"
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 9 }}
              tickLine={{ stroke: 'hsl(222 30% 18%)' }}
              width={40}
              domain={['auto', 'auto']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={sensor.color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Interval overlay layer */}
      <div 
        className="absolute top-[25px] bottom-[5px] left-[40px] right-[10px]"
        style={{ bottom: showTimeAxis ? '20px' : '5px' }}
      >
        {trips.map((trip) => (
          <IntervalBlock
            key={trip.id}
            trip={trip}
            startDate={startDate}
            endDate={endDate}
            isSelected={selectedTripId === trip.id}
            onSelect={onSelectTrip}
            onUpdate={onUpdateTrip}
            containerWidth={containerWidth}
          />
        ))}
      </div>
    </div>
  );
};

export default SensorChartWithOverlay;