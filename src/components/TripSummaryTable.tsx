import { PipeTrip } from '@/types/trip';
import { formatDateTime, formatDuration } from '@/utils/mockData';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Bot } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TripSummaryTableProps {
  trips: PipeTrip[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
}

const statusIcons = {
  auto: Bot,
  modified: AlertCircle,
  validated: CheckCircle2,
};

const TripSummaryTable = ({ trips, selectedTripId, onSelectTrip }: TripSummaryTableProps) => {
  return (
    <div className="data-grid rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trip</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => {
            const StatusIcon = statusIcons[trip.status];
            return (
              <TableRow
                key={trip.id}
                className={cn(
                  "border-border/30 cursor-pointer transition-colors",
                  selectedTripId === trip.id && "bg-primary/10",
                  "hover:bg-muted/50"
                )}
                onClick={() => onSelectTrip(trip.id)}
              >
                <TableCell className="font-medium">{trip.name}</TableCell>
                <TableCell>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                    trip.type === 'RIH' && "bg-trip-rih/20 text-trip-rih",
                    trip.type === 'POOH' && "bg-trip-pooh/20 text-trip-pooh",
                    trip.type === 'NoPipe' && "bg-muted text-muted-foreground",
                    trip.type === 'Other' && "bg-trip-other/20 text-trip-other"
                  )}>
                    {trip.type}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {formatDateTime(trip.startTime)}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {formatDateTime(trip.endTime)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatDuration(trip.startTime, trip.endTime)}
                </TableCell>
                <TableCell>
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    trip.status === 'auto' && "status-badge-auto",
                    trip.status === 'modified' && "status-badge-modified",
                    trip.status === 'validated' && "status-badge-validated"
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TripSummaryTable;
