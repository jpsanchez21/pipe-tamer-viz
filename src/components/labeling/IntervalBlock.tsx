import { useState, useRef, useCallback } from 'react';
import { PipeTrip, TripType, ConnectionWindow } from '@/types/trip';
import { cn } from '@/lib/utils';

interface IntervalBlockProps {
  trip: PipeTrip;
  validConnections?: ConnectionWindow[];
  startDate: Date;
  endDate: Date;
  isSelected: boolean;
  onSelect: (tripId: string) => void;
  onUpdate: (tripId: string, updates: Partial<PipeTrip>) => void;
  containerWidth: number;
  verticalPosition?: 'top' | 'bottom' | 'full';
  allTrips?: PipeTrip[];
  onZoomToInterval?: (tripId: string) => void;
}

const tripColors: Record<TripType, { bg: string; border: string; text: string }> = {
  RIH: {
    bg: 'bg-trip-rih/60',
    border: 'border-trip-rih',
    text: 'text-white'
  },
  POOH: {
    bg: 'bg-trip-pooh/60',
    border: 'border-trip-pooh',
    text: 'text-white'
  },
  Other: {
    bg: 'bg-trip-other/60',
    border: 'border-trip-other',
    text: 'text-white'
  },
  PP: {
    bg: 'bg-slate-500/20',
    border: 'border-slate-500',
    text: 'text-slate-600'
  },
};

const IntervalBlock = ({
  trip,
  startDate,
  endDate,
  isSelected,
  onSelect,
  onUpdate,
  containerWidth,
  verticalPosition = 'full',
  allTrips = [],
  onZoomToInterval,
}: IntervalBlockProps) => {
  const [isDragging, setIsDragging] = useState<'move' | 'start' | 'end' | null>(null);
  const dragStartRef = useRef<{ x: number; startTime: Date; endTime: Date } | null>(null);

  const totalDuration = endDate.getTime() - startDate.getTime();

  const getPosition = (time: Date) => {
    return ((time.getTime() - startDate.getTime()) / totalDuration) * 100;
  };

  const getWidth = (start: Date, end: Date) => {
    return ((end.getTime() - start.getTime()) / totalDuration) * 100;
  };

  const left = getPosition(trip.startTime);
  const width = getWidth(trip.startTime, trip.endTime);
  const colors = tripColors[trip.type];

  const checkCollision = (newStart: Date, newEnd: Date): boolean => {
    if (trip.type === 'Other' || trip.type === 'PP') return false;
    const oppositeType = trip.type === 'RIH' ? 'POOH' : 'RIH';
    const oppositeTrips = allTrips.filter(t => t.id !== trip.id && t.type === oppositeType);
    return oppositeTrips.some(otherTrip => newStart < otherTrip.endTime && newEnd > otherTrip.startTime);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, action: 'move' | 'start' | 'end') => {
    e.stopPropagation();
    setIsDragging(action);
    dragStartRef.current = {
      x: e.clientX,
      startTime: trip.startTime,
      endTime: trip.endTime,
    };
    onSelect(trip.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current || !containerWidth) return;

      const deltaX = moveEvent.clientX - dragStartRef.current.x;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const deltaTime = (deltaPercent / 100) * totalDuration;

      let newStartTime = dragStartRef.current.startTime;
      let newEndTime = dragStartRef.current.endTime;

      if (action === 'start') {
        newStartTime = new Date(dragStartRef.current.startTime.getTime() + deltaTime);
        if (newStartTime >= newEndTime) return;
      } else if (action === 'end') {
        newEndTime = new Date(dragStartRef.current.endTime.getTime() + deltaTime);
        if (newEndTime <= newStartTime) return;
      } else if (action === 'move') {
        const duration = dragStartRef.current.endTime.getTime() - dragStartRef.current.startTime.getTime();
        newStartTime = new Date(dragStartRef.current.startTime.getTime() + deltaTime);
        newEndTime = new Date(newStartTime.getTime() + duration);
      }

      if (checkCollision(newStartTime, newEndTime)) return;

      onUpdate(trip.id, {
        startTime: newStartTime,
        endTime: newEndTime,
        status: 'modified',
      });
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [trip, containerWidth, totalDuration, startDate, endDate, onSelect, onUpdate, allTrips]);

  const isPressureTest = trip.type === 'PP';
  const isThin = width < 4;

  // PRESSURE TEST: Vertical line marker with top flag
  if (isPressureTest) {
    const centerPosition = left + (width / 2);

    // Prevent label from escaping chart boundaries (more aggressive detection)
    const isNearLeftEdge = centerPosition < 8; // If in first 8%
    const isNearRightEdge = centerPosition > 92; // If in last 8%

    // Adjust label position based on edge proximity
    let labelPositionClass = "left-1/2 -translate-x-1/2"; // Default: centered
    if (isNearLeftEdge) {
      labelPositionClass = "left-0"; // Align to left edge
    } else if (isNearRightEdge) {
      labelPositionClass = "right-0"; // Align to right edge
    }

    return (
      <div
        className="absolute overflow-visible pointer-events-auto"
        style={{
          left: `${left}%`,
          width: `${width}%`,
          top: 0,
          bottom: 0,
        }}
      >
        {/* When NOT selected: Show vertical line + top flag */}
        {!isSelected && (
          <>
            {/* Vertical Line Marker */}
            <div
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-slate-500 cursor-pointer hover:w-[3px] transition-all duration-200 z-40"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(trip.id);
                if (onZoomToInterval) {
                  onZoomToInterval(trip.id);
                }
              }}
            />

            {/* Top Flag/Banner */}
            <div
              className={`absolute -top-1 cursor-pointer z-50 group ${labelPositionClass}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(trip.id);
                if (onZoomToInterval) {
                  onZoomToInterval(trip.id);
                }
              }}
            >
              {/* Triangle pointer */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-500 group-hover:border-t-slate-600 transition-colors" />

              {/* Flag label */}
              <div className="bg-slate-500 text-white px-1 py-0 rounded shadow-lg group-hover:bg-slate-600 group-hover:scale-105 transition-all duration-200 border border-slate-400">
                <span className="text-[7px] font-black tracking-wide uppercase whitespace-nowrap">PP</span>
              </div>
            </div>
          </>
        )}

        {/* When SELECTED: Show full editable block */}
        {isSelected && (
          <div
            className={cn(
              "absolute inset-0 border-2 rounded transition-all duration-200",
              colors.border,
              colors.bg,
              "ring-2 ring-white ring-offset-1 ring-offset-background shadow-xl z-50"
            )}
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(100, 116, 139, 0.1) 5px, rgba(100, 116, 139, 0.1) 10px)',
            }}
            onClick={(e) => { e.stopPropagation(); }}
          >
            {/* Left resize handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 transition-colors z-10 bg-slate-500/50"
              onMouseDown={(e) => handleMouseDown(e, 'start')}
            />

            {/* Center content */}
            <div
              className={cn(
                "h-full flex items-center justify-center cursor-grab active:cursor-grabbing",
                colors.text
              )}
              onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
              <span className="text-[10px] font-black uppercase tracking-widest bg-slate-500 text-white px-2 py-1 rounded">
                PP
              </span>
            </div>

            {/* Right resize handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 transition-colors z-10 bg-slate-500/50"
              onMouseDown={(e) => handleMouseDown(e, 'end')}
            />

            {/* Status indicator */}
            {trip.status !== 'auto' && (
              <div className={cn(
                "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-background",
                trip.status === 'modified' ? 'bg-status-modified' : 'bg-status-validated'
              )} />
            )}
          </div>
        )}
      </div>
    );
  }

  // STANDARD TRIPS: Render as blocks (RIH, POOH, OTHER)
  // Calculate label alignment based on position to prevent escaping boundaries
  const centerPosition = left + (width / 2);
  const isNearLeftEdge = centerPosition < 8;
  const isNearRightEdge = centerPosition > 92;

  // Adjust label justification based on edge proximity
  let labelJustifyClass = "justify-center"; // Default: centered
  if (isNearLeftEdge) {
    labelJustifyClass = "justify-start pl-2"; // Align to left
  } else if (isNearRightEdge) {
    labelJustifyClass = "justify-end pr-2"; // Align to right
  }

  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 border-2 rounded transition-all duration-100 pointer-events-auto group overflow-visible",
        colors.border,
        colors.bg,
        isSelected && "ring-2 ring-white ring-offset-1 ring-offset-background",
        isDragging && "opacity-80",
        isSelected ? "z-50" : trip.type === 'Other' ? "z-30" : trip.type === 'POOH' ? "z-20" : "z-10"
      )}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        minWidth: '6px',
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(trip.id); }}
    >
      {/* Left resize handle */}
      {(isSelected || !isThin) && (
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 transition-colors z-10"
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        />
      )}

      {/* Center content */}
      <div
        className={cn(
          "h-full flex items-center justify-center px-0.5 pt-1 cursor-grab active:cursor-grabbing overflow-hidden group relative",
          colors.text
        )}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        <span
          className={cn(
            "text-[8px] font-black select-none uppercase tracking-tighter shadow-sm transition-all duration-200",
            "truncate max-w-full block text-center",
            width < 4 ? "opacity-0 group-hover:opacity-100 group-hover:z-50" : "opacity-100"
          )}
          style={{
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {trip.type === 'Other' && trip.actionName ? trip.actionName : trip.type}
        </span>
      </div>

      {/* Right resize handle */}
      {(isSelected || !isThin) && (
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 transition-colors z-10"
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        />
      )}

      {/* Status indicator */}
      {trip.status !== 'auto' && (
        <div className={cn(
          "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-background",
          trip.status === 'modified' ? 'bg-status-modified' : 'bg-status-validated'
        )} />
      )}
    </div>
  );
};

export default IntervalBlock;