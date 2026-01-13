import { useState, useRef, useCallback } from 'react';
import { PipeTrip, TripType } from '@/types/trip';
import { cn } from '@/lib/utils';

interface IntervalBlockProps {
  trip: PipeTrip;
  startDate: Date;
  endDate: Date;
  isSelected: boolean;
  onSelect: (tripId: string) => void;
  onUpdate: (tripId: string, updates: Partial<PipeTrip>) => void;
  containerWidth: number;
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
  NoPipe: { 
    bg: 'bg-muted/60', 
    border: 'border-muted-foreground', 
    text: 'text-muted-foreground' 
  },
  Other: { 
    bg: 'bg-trip-other/60', 
    border: 'border-trip-other', 
    text: 'text-white' 
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
        if (newStartTime < startDate) newStartTime = startDate;
      } else if (action === 'end') {
        newEndTime = new Date(dragStartRef.current.endTime.getTime() + deltaTime);
        if (newEndTime <= newStartTime) return;
        if (newEndTime > endDate) newEndTime = endDate;
      } else if (action === 'move') {
        const duration = dragStartRef.current.endTime.getTime() - dragStartRef.current.startTime.getTime();
        newStartTime = new Date(dragStartRef.current.startTime.getTime() + deltaTime);
        newEndTime = new Date(newStartTime.getTime() + duration);
        if (newStartTime < startDate) {
          newStartTime = startDate;
          newEndTime = new Date(startDate.getTime() + duration);
        }
        if (newEndTime > endDate) {
          newEndTime = endDate;
          newStartTime = new Date(endDate.getTime() - duration);
        }
      }

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
  }, [trip, containerWidth, totalDuration, startDate, endDate, onSelect, onUpdate]);

  return (
    <div
      className={cn(
        "absolute top-1 bottom-1 rounded border-2 cursor-pointer transition-all duration-100",
        colors.bg,
        colors.border,
        isSelected && "ring-2 ring-white ring-offset-1 ring-offset-background z-20",
        isDragging && "opacity-80"
      )}
      style={{ 
        left: `${left}%`, 
        width: `${Math.max(width, 2)}%`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(trip.id);
      }}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 transition-colors z-10"
        onMouseDown={(e) => handleMouseDown(e, 'start')}
      />
      
      {/* Center content - draggable for move */}
      <div
        className={cn(
          "h-full flex items-center justify-center px-1 cursor-grab active:cursor-grabbing overflow-hidden",
          colors.text
        )}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        <span className="text-[10px] font-bold truncate select-none">
          {trip.type}
        </span>
      </div>
      
      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 transition-colors z-10"
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
  );
};

export default IntervalBlock;