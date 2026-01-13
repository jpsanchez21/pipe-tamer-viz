import { PipeTrip } from '@/types/trip';
import { formatDateTime, formatDuration } from '@/utils/mockData';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Bot } from 'lucide-react';

interface IntervalSummaryTableProps {
  trips: PipeTrip[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
}

const statusIcons = {
  auto: Bot,
  modified: AlertCircle,
  validated: CheckCircle2,
};

const tripTypeColors = {
  RIH: 'bg-trip-rih/20 text-trip-rih border-trip-rih/30',
  POOH: 'bg-trip-pooh/20 text-trip-pooh border-trip-pooh/30',
  NoPipe: 'bg-muted text-muted-foreground border-muted-foreground/30',
  Other: 'bg-trip-other/20 text-trip-other border-trip-other/30',
};

const IntervalSummaryTable = ({ trips, selectedTripId, onSelectTrip }: IntervalSummaryTableProps) => {
  return (
    <div className="bg-card/50 border border-border/30 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</th>
              <th className="text-left p-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="text-left p-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pipe</th>
              <th className="text-left p-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start</th>
              <th className="text-left p-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">End</th>
              <th className="text-left p-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
              <th className="text-left p-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip, index) => {
              const StatusIcon = statusIcons[trip.status];
              return (
                <tr
                  key={trip.id}
                  className={cn(
                    "border-b border-border/20 cursor-pointer transition-colors",
                    selectedTripId === trip.id && "bg-primary/10",
                    "hover:bg-muted/30"
                  )}
                  onClick={() => onSelectTrip(trip.id)}
                >
                  <td className="p-2 font-mono text-xs text-muted-foreground">{index + 1}</td>
                  <td className="p-2">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
                      tripTypeColors[trip.type]
                    )}>
                      {trip.type}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-xs">{trip.tubingReference}</td>
                  <td className="p-2 font-mono text-xs text-muted-foreground">
                    {formatDateTime(trip.startTime)}
                  </td>
                  <td className="p-2 font-mono text-xs text-muted-foreground">
                    {formatDateTime(trip.endTime)}
                  </td>
                  <td className="p-2 font-mono text-xs">
                    {formatDuration(trip.startTime, trip.endTime)}
                  </td>
                  <td className="p-2">
                    <div className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                      trip.status === 'auto' && "status-badge-auto",
                      trip.status === 'modified' && "status-badge-modified",
                      trip.status === 'validated' && "status-badge-validated"
                    )}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IntervalSummaryTable;