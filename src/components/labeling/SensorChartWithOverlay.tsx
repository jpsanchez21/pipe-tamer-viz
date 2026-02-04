import { useRef, useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Brush, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SensorDataPoint, SensorConfig, PipeTrip } from '@/types/trip';
import { formatTime } from '@/utils/mockData';
import IntervalBlock from './IntervalBlock';

// Re-integrated Safe Brush
interface SensorChartWithOverlayProps {
  data: SensorDataPoint[];
  allData?: SensorDataPoint[]; // Full dataset for brush overview
  sensor: SensorConfig;
  trips: PipeTrip[];
  startDate: Date;
  endDate: Date;
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  onUpdateTrip: (tripId: string, updates: Partial<PipeTrip>) => void;
  showTimeAxis?: boolean;
  onBrushChange?: (startIndex: number, endIndex: number) => void;
  startIndex?: number;
  endIndex?: number;
  isFullDetail?: boolean;
  samplingRatio?: number;
  onWheelZoom?: (delta: number, mouseTime: number) => void;
  onDragPan?: (deltaMs: number) => void;
  visibleLayers?: { trips: boolean; pressureTests: boolean };
  onZoomToInterval?: (tripId: string) => void;
  brushSensorKey?: keyof Omit<SensorDataPoint, 'timestamp'>;
}

const SensorChartWithOverlay = ({
  data,
  allData,
  sensor,
  trips,
  startDate,
  endDate,
  selectedTripId,
  onSelectTrip,
  onUpdateTrip,
  showTimeAxis = false,
  onBrushChange,
  startIndex,
  endIndex,
  onWheelZoom,
  onDragPan,
  isFullDetail = true,
  samplingRatio = 1,
  visibleLayers = { trips: true, pressureTests: true },
  onZoomToInterval,
  brushSensorKey,
}: SensorChartWithOverlayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseX, setLastMouseX] = useState<number | null>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Keyboard listener for Ctrl key (to show tooltip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) { // metaKey for Mac Command
        setIsCtrlPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const chartData = useMemo(() => data.map(point => ({
    time: point.timestamp.getTime(),
    value: point[sensor.key as keyof SensorDataPoint] as number,
  })), [data, sensor.key]);

  // Prepare full brush data if needed
  const brushData = useMemo(() => {
    const key = brushSensorKey || (sensor.key as keyof SensorDataPoint);
    return allData?.map((point) => ({
      time: point.timestamp.getTime(),
      value: point[key as keyof SensorDataPoint] as number,
    })) || [];
  }, [allData, sensor.key, brushSensorKey]);

  const handleBrushChange = (data: any) => {
    if (onBrushChange && data) {
      // Enforce minimum brush width but keep it low for deep zoom
      const minDataPoints = 15;
      let { startIndex, endIndex } = data;

      if (endIndex - startIndex < minDataPoints) {
        // Only force expansion if truly necessary to avoid stuck handles
        const midPoint = Math.floor((startIndex + endIndex) / 2);
        startIndex = Math.max(0, midPoint - Math.floor(minDataPoints / 2));
        endIndex = Math.min(brushData.length - 1, startIndex + minDataPoints);
      }

      onBrushChange(startIndex, endIndex);
    }
  };

  // TECHNICAL WORKFLOW: COORDINATE MAPPING
  const getTimeAtX = (x: number) => {
    if (containerWidth <= 55) return null; // 45 (left) + 10 (right) padding
    const chartContentWidth = containerWidth - 55;
    const paddingLeft = 45;
    const relativeX = x - paddingLeft;
    const ratio = Math.max(0, Math.min(1, relativeX / chartContentWidth));

    const startTime = startDate.getTime();
    const duration = endDate.getTime() - startTime;
    return startTime + (duration * ratio);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (onWheelZoom) {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseTime = getTimeAtX(mouseX);
      if (mouseTime !== null) {
        onWheelZoom(e.deltaY, mouseTime);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (onDragPan) {
      setIsDragging(true);
      setLastMouseX(e.clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && lastMouseX !== null && onDragPan) {
      const deltaX = e.clientX - lastMouseX;
      if (Math.abs(deltaX) > 1) {
        const chartContentWidth = containerWidth - 55;
        const duration = endDate.getTime() - startDate.getTime();
        const deltaMs = (deltaX / chartContentWidth) * duration;

        onDragPan(-deltaMs); // Invert for natural "pull" feeling
        setLastMouseX(e.clientX);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastMouseX(null);
  };

  // Balanced SCADA height for stacked charts
  const detailChartHeight = 135;
  const brushHeight = (showTimeAxis && onBrushChange && allData) ? 28 : 0;
  const totalHeight = detailChartHeight + brushHeight;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden" style={{ height: `${totalHeight}px` }}>
      <div className="flex flex-col h-full w-full">
        {/* EXTERNAL HEADER: Title outside plotting area */}
        <div className="px-12 py-1 flex items-center gap-2 border-b border-border/5">
          <div
            className={cn(
              "w-2 h-2 rounded-full shadow-[0_0_5px_rgba(var(--primary),0.3)]",
            )}
            style={{ backgroundColor: sensor.color }}
          />
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {sensor.label} <span className="opacity-40 lowercase font-medium italic select-none">({sensor.unit})</span>
          </span>
        </div>

        {/* Main Detail Chart */}
        <div
          className={cn(
            "flex-1 min-h-0 relative select-none overflow-hidden", // Added overflow-hidden
            isDragging ? "cursor-grabbing" : "cursor-crosshair"
          )}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 0, right: 10, left: 0, bottom: 20 }} // Reduced margin to minimize gaps
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border) / 0.4)"
                vertical={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground) / 0.6)"
                tick={{ fill: 'hsl(var(--muted-foreground) / 0.8)', fontSize: 10, fontWeight: 700 }}
                tickLine={{ stroke: 'hsl(var(--border) / 0.5)' }}
                width={45}
                domain={['auto', 'auto']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={sensor.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                className="sensor-line"
              />
              {isCtrlPressed && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))',
                    fontWeight: 700,
                    fontSize: '11px',
                    marginBottom: '4px'
                  }}
                  itemStyle={{
                    color: sensor.color,
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                  formatter={(value: any) => [
                    `${Number(value).toFixed(2)} ${sensor.unit}`,
                    sensor.label
                  ]}
                  labelFormatter={(unixTime: any) => {
                    const date = new Date(unixTime);
                    return format(date, 'yyyy-MM-dd HH:mm:ss');
                  }}
                  cursor={{
                    stroke: sensor.color,
                    strokeWidth: 1,
                    strokeDasharray: '5 5'
                  }}
                />
              )}
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground) / 0.6)"
                tick={{ fill: 'hsl(var(--muted-foreground) / 0.8)', fontSize: 9, fontWeight: 700 }}
                tickLine={{ stroke: 'hsl(var(--border) / 0.5)' }}
                interval="preserveStartEnd"
                minTickGap={60}
                tickFormatter={(unixTime) => {
                  const date = new Date(unixTime);
                  return format(date, 'MMM dd HH:mm');
                }}
                height={30}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Interval overlay layer - With Layer Visibility Filtering */}
          <div className="absolute top-0 left-[45px] right-[10px] bottom-[50px] pointer-events-none">
            {/* Layer 1: Trips (RIH, POOH, Other) - Only render if within visible range */}
            {visibleLayers.trips && trips
              .filter(t => ['RIH', 'POOH', 'Other'].includes(t.type))
              .filter(t => {
                // Only render if trip overlaps with visible time range
                return t.endTime >= startDate && t.startTime <= endDate;
              })
              .map((trip) => (
                <IntervalBlock
                  key={trip.id}
                  trip={trip}
                  startDate={startDate}
                  endDate={endDate}
                  isSelected={selectedTripId === trip.id}
                  onSelect={onSelectTrip}
                  onUpdate={onUpdateTrip}
                  containerWidth={containerWidth}
                  verticalPosition="full"
                  allTrips={trips}
                  onZoomToInterval={onZoomToInterval}
                />
              ))}

            {/* Layer 2: Pressure Tests (PP) - Only render if within visible range */}
            {visibleLayers.pressureTests && trips
              .filter(t => t.type === 'PP')
              .filter(t => {
                // Only render if trip overlaps with visible time range
                return t.endTime >= startDate && t.startTime <= endDate;
              })
              .map((trip) => (
                <IntervalBlock
                  key={trip.id}
                  trip={trip}
                  startDate={startDate}
                  endDate={endDate}
                  isSelected={selectedTripId === trip.id}
                  onSelect={onSelectTrip}
                  onUpdate={onUpdateTrip}
                  containerWidth={containerWidth}
                  verticalPosition="full"
                  allTrips={trips}
                  onZoomToInterval={onZoomToInterval}
                />
              ))}
          </div>
        </div>

        {/* Overview Chart with Brush (Only if enabled) - Technical Timeline Style */}
        {showTimeAxis && onBrushChange && allData && (
          <div className="h-[34px] w-full mt-[-18px] pb-1 z-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={brushData}
                margin={{ top: 0, right: 10, left: 45, bottom: 5 }}
              >
                <XAxis
                  dataKey="time"
                  hide
                />
                <Brush
                  dataKey="time"
                  height={22}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--background))"
                  tickFormatter={() => ''}
                  onChange={handleBrushChange}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  travellerWidth={12}
                  alwaysShowText={false}
                  gap={1}
                >
                  <LineChart>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary) / 0.3)"
                      strokeWidth={1}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </Brush>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorChartWithOverlay;