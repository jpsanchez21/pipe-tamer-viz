import { useState, useEffect } from 'react';
import { X, RotateCcw, Save, CheckCircle, Tag, Clock, MessageSquare, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PipeTrip, TripType, PipeType } from '@/types/trip';
import { formatDuration } from '@/utils/mockData';
import { cn } from '@/lib/utils';

interface IntervalEditorProps {
  trip: PipeTrip | null;
  onClose: () => void;
  onUpdate: (tripId: string, updates: Partial<PipeTrip>) => void;
  onReset: (tripId: string) => void;
  onValidate: (tripId: string) => void;
}

const tripTypes: TripType[] = ['RIH', 'POOH', 'NoPipe', 'Other'];
const pipeTypes: PipeType[] = ['Drill Pipe', 'Casing', 'Tubing', 'BHA', 'Other'];

const IntervalEditor = ({ trip, onClose, onUpdate, onReset, onValidate }: IntervalEditorProps) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TripType>('RIH');
  const [pipeType, setPipeType] = useState<PipeType>('Drill Pipe');
  const [tubingReference, setTubingReference] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (trip) {
      setName(trip.name);
      setType(trip.type);
      setPipeType(trip.pipeType);
      setTubingReference(trip.tubingReference);
      setStartTime(trip.startTime.toISOString().slice(0, 16));
      setEndTime(trip.endTime.toISOString().slice(0, 16));
      setComments(trip.comments);
    }
  }, [trip]);

  if (!trip) {
    return (
      <div className="w-80 glass-panel border-l border-border/50 flex flex-col items-center justify-center p-6 text-center">
        <Tag className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold text-muted-foreground">No Interval Selected</h3>
        <p className="text-xs text-muted-foreground/70 mt-2">
          Click on an interval block to view and edit its properties
        </p>
      </div>
    );
  }

  const handleSave = () => {
    onUpdate(trip.id, {
      name,
      type,
      pipeType,
      tubingReference,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      comments,
      status: 'modified',
    });
  };

  const handleReset = () => {
    onReset(trip.id);
  };

  const handleValidate = () => {
    onValidate(trip.id);
  };

  const duration = formatDuration(new Date(startTime), new Date(endTime));

  return (
    <div className="w-80 glass-panel border-l border-border/50 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Interval Editor</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Status Badge */}
      <div className="px-4 pt-3">
        <div className={cn(
          "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium",
          trip.status === 'auto' && "status-badge-auto",
          trip.status === 'modified' && "status-badge-modified",
          trip.status === 'validated' && "status-badge-validated"
        )}>
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Trip Type */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Trip Type
          </Label>
          <Select value={type} onValueChange={(v) => setType(v as TripType)}>
            <SelectTrigger className="industrial-input h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tripTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="bg-border/30" />

        {/* Pipe Type */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Wrench className="w-3 h-3" />
            Pipe Type
          </Label>
          <Select value={pipeType} onValueChange={(v) => setPipeType(v as PipeType)}>
            <SelectTrigger className="industrial-input h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pipeTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tubing Reference */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tubing Reference
          </Label>
          <Input
            value={tubingReference}
            onChange={(e) => setTubingReference(e.target.value)}
            className="industrial-input h-9 font-mono text-sm"
            placeholder="e.g., DP-5.5&quot;"
          />
        </div>

        <Separator className="bg-border/30" />

        {/* Time Range */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Start Time
          </Label>
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="industrial-input h-9 font-mono text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            End Time
          </Label>
          <Input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="industrial-input h-9 font-mono text-xs"
          />
        </div>

        {/* Duration Display */}
        <div className="p-2.5 rounded-md bg-muted/30 border border-border/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
          <p className="text-base font-mono font-semibold text-primary">{duration}</p>
        </div>

        <Separator className="bg-border/30" />

        {/* Comments */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" />
            Comments
          </Label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add notes..."
            className="industrial-input min-h-[60px] resize-none text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border/50 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleSave} variant="default" size="sm" className="gap-1.5">
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>
          <Button onClick={handleValidate} variant="success" size="sm" className="gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Validate
          </Button>
        </div>
        <Button onClick={handleReset} variant="outline" size="sm" className="w-full gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Auto
        </Button>
      </div>
    </div>
  );
};

export default IntervalEditor;