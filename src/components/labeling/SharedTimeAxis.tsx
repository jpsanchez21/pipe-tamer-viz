import { useMemo } from 'react';
import { formatDateTime } from '@/utils/mockData';

interface SharedTimeAxisProps {
  startDate: Date;
  endDate: Date;
}

const SharedTimeAxis = ({ startDate, endDate }: SharedTimeAxisProps) => {
  const totalDuration = endDate.getTime() - startDate.getTime();

  const timeMarkers = useMemo(() => {
    const markers = [];
    const markerCount = 8;
    for (let i = 0; i <= markerCount; i++) {
      const time = new Date(startDate.getTime() + (totalDuration / markerCount) * i);
      markers.push({
        position: (i / markerCount) * 100,
        label: formatDateTime(time),
      });
    }
    return markers;
  }, [startDate, totalDuration]);

  return (
    <div className="relative h-8 bg-muted/20 border-t border-border/30">
      {/* Grid lines */}
      {timeMarkers.map((marker, index) => (
        <div
          key={index}
          className="absolute top-0 bottom-0 w-px bg-border/30"
          style={{ left: `calc(40px + ${marker.position}% * (100% - 50px) / 100)` }}
        />
      ))}
      
      {/* Time labels */}
      <div className="absolute inset-0 flex items-center">
        {timeMarkers.map((marker, index) => (
          <span 
            key={index}
            className="absolute text-[10px] font-mono text-muted-foreground transform -translate-x-1/2"
            style={{ left: `calc(40px + ${marker.position}% * (100% - 50px) / 100)` }}
          >
            {marker.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SharedTimeAxis;