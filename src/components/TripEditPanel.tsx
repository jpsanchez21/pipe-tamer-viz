import { useState, useEffect } from 'react';
import { X, RotateCcw, Check, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PipeTrip, TripType } from '@/types/trip';
import { formatDuration } from '@/utils/mockData';
import { cn } from '@/lib/utils';

interface TripEditPanelProps {
  trip: PipeTrip;
  onClose: () => void;
  onUpdate: (tripId: string, updates: Partial<PipeTrip>) => void;
  onReset: (tripId: string) => void;
}

const tripTypes: TripType[] = ['RIH', 'POOH', 'Other'];

const TripEditPanel = ({ trip, onClose, onUpdate, onReset }: TripEditPanelProps) => {
  const [name, setName] = useState(trip.name);
  const [type, setType] = useState<TripType>(trip.type);
  const [startTime, setStartTime] = useState(trip.startTime.toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(trip.endTime.toISOString().slice(0, 16));
  const [comments, setComments] = useState(trip.comments);

  useEffect(() => {
    setName(trip.name);
    setType(trip.type);
    setStartTime(trip.startTime.toISOString().slice(0, 16));
    setEndTime(trip.endTime.toISOString().slice(0, 16));
    setComments(trip.comments);
  }, [trip]);

  const handleApply = () => {
    onUpdate(trip.id, {
      name,
      type,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      comments,
      status: 'modified',
    });
  };

  const handleReset = () => {
    onReset(trip.id);
  };

  const duration = formatDuration(new Date(startTime), new Date(endTime));

  return (
    <div className="w-96 glass-panel border-l border-border/50 animate-slide-in overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div>
          <h3 className="font-semibold">Edit Trip</h3>
          <p className="text-xs text-muted-foreground">ID: {trip.id}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Status Badge */}
      <div className="px-4 pt-4">
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
          trip.status === 'auto' && "status-badge-auto",
          trip.status === 'modified' && "status-badge-modified",
          trip.status === 'validated' && "status-badge-validated"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            trip.status === 'auto' && "bg-primary",
            trip.status === 'modified' && "bg-status-modified",
            trip.status === 'validated' && "bg-status-validated"
          )} />
          {trip.status === 'auto' && 'Auto-detected'}
          {trip.status === 'modified' && 'Modified'}
          {trip.status === 'validated' && 'Validated'}
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-5">
        {/* Trip Name */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Trip Name
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="industrial-input"
          />
        </div>

        {/* Trip Type */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Trip Type
          </Label>
          <Select value={type} onValueChange={(v) => setType(v as TripType)}>
            <SelectTrigger className="industrial-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tripTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Start Time
            </Label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="industrial-input font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              End Time
            </Label>
            <Input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="industrial-input font-mono text-xs"
            />
          </div>
        </div>

        {/* Duration Display */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="text-lg font-mono font-semibold text-primary">{duration}</p>
        </div>

        {/* Comments */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <MessageSquare className="w-3 h-3" />
            Comments
          </Label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add notes about this trip..."
            className="industrial-input min-h-[80px] resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border/50 space-y-3">
        <Button onClick={handleApply} variant="success" className="w-full">
          <Check className="w-4 h-4" />
          Apply Changes
        </Button>
        <Button onClick={handleReset} variant="outline" className="w-full">
          <RotateCcw className="w-4 h-4" />
          Reset to Auto-detected
        </Button>
      </div>
    </div>
  );
};

export default TripEditPanel;
