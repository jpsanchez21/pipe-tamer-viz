import { useMemo, useState, useRef } from 'react';
import { PipeTrip, TripType } from '@/types/trip';
import { formatDateTime } from '@/utils/mockData';
import { cn } from '@/lib/utils';

interface TripTimelineProps {
  trips: PipeTrip[];
  startDate: Date;
  endDate: Date;
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  onUpdateTrip: (tripId: string, updates: Partial<PipeTrip>) => void;
}

const tripColors: Record<TripType, string> = {
  RIH: 'bg-trip-rih',
  POOH: 'bg-trip-pooh',
  Drilling: 'bg-trip-drilling',
  Other: 'bg-trip-other',
};

const tripBorderColors: Record<TripType, string> = {
  RIH: 'border-trip-rih/50',
  POOH: 'border-trip-pooh/50',
  Drilling: 'border-trip-drilling/50',
  Other: 'border-trip-other/50',
};

const TripTimeline = ({ 
  trips, 
  startDate, 
  endDate, 
  selectedTripId, 
  onSelectTrip,
  onUpdateTrip 
}: TripTimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<{ tripId: string; edge: 'start' | 'end' } | null>(null);

  const totalDuration = endDate.getTime() - startDate.getTime();

  const getPosition = (time: Date) => {
    return ((time.getTime() - startDate.getTime()) / totalDuration) * 100;
  };

  const getWidth = (start: Date, end: Date) => {
    return ((end.getTime() - start.getTime()) / totalDuration) * 100;
  };

  const timeMarkers = useMemo(() => {
    const markers = [];
    const markerCount = 6;
    for (let i = 0; i <= markerCount; i++) {
      const time = new Date(startDate.getTime() + (totalDuration / markerCount) * i);
      markers.push({
        position: (i / markerCount) * 100,
        label: formatDateTime(time),
      });
    }
    return markers;
  }, [startDate, totalDuration]);

  const handleMouseDown = (e: React.MouseEvent, tripId: string, edge: 'start' | 'end') => {
    e.stopPropagation();
    setIsDragging({ tripId, edge });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newTime = new Date(startDate.getTime() + (percentage / 100) * totalDuration);

    const trip = trips.find(t => t.id === isDragging.tripId);
    if (!trip) return;

    if (isDragging.edge === 'start' && newTime < trip.endTime) {
      onUpdateTrip(isDragging.tripId, { startTime: newTime, status: 'modified' });
    } else if (isDragging.edge === 'end' && newTime > trip.startTime) {
      onUpdateTrip(isDragging.tripId, { endTime: newTime, status: 'modified' });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  return (
    <div 
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Time axis */}
      <div className="flex justify-between mb-2 px-1">
        {timeMarkers.map((marker, index) => (
          <span 
            key={index}
            className="text-xs font-mono text-muted-foreground"
            style={{ position: 'absolute', left: `${marker.position}%`, transform: 'translateX(-50%)' }}
          >
            {marker.label}
          </span>
        ))}
      </div>

      {/* Timeline track */}
      <div 
        ref={timelineRef}
        className="relative h-20 mt-8 bg-muted/30 rounded-lg border border-border/30 overflow-hidden"
      >
        {/* Grid lines */}
        {timeMarkers.map((marker, index) => (
          <div
            key={index}
            className="absolute top-0 bottom-0 w-px bg-border/30"
            style={{ left: `${marker.position}%` }}
          />
        ))}

        {/* Trip blocks */}
        {trips.map((trip) => {
          const left = getPosition(trip.startTime);
          const width = getWidth(trip.startTime, trip.endTime);
          const isSelected = selectedTripId === trip.id;

          return (
            <div
              key={trip.id}
              className={cn(
                "absolute top-2 bottom-2 rounded-md cursor-pointer transition-all duration-150 border-2",
                tripColors[trip.type],
                tripBorderColors[trip.type],
                isSelected && "ring-2 ring-foreground ring-offset-2 ring-offset-background z-10",
                "hover:brightness-110"
              )}
              style={{ left: `${left}%`, width: `${width}%`, minWidth: '60px' }}
              onClick={() => onSelectTrip(trip.id)}
            >
              {/* Trip content */}
              <div className="h-full flex flex-col justify-center px-2 overflow-hidden">
                <span className="text-xs font-bold text-primary-foreground truncate">
                  {trip.type}
                </span>
                <span className="text-[10px] text-primary-foreground/80 truncate">
                  {trip.name}
                </span>
              </div>

              {/* Resize handles */}
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-foreground/20 transition-colors"
                onMouseDown={(e) => handleMouseDown(e, trip.id, 'start')}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-foreground/20 transition-colors"
                onMouseDown={(e) => handleMouseDown(e, trip.id, 'end')}
              />

              {/* Status indicator */}
              {trip.status !== 'auto' && (
                <div className={cn(
                  "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                  trip.status === 'modified' ? 'bg-status-modified' : 'bg-status-validated'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        {Object.entries(tripColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-sm", color)} />
            <span className="text-xs text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripTimeline;
