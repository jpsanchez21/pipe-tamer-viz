import { useState, useCallback } from 'react';
import { ArrowLeft, Save, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PipeTrip, SensorDataPoint, SensorConfig } from '@/types/trip';
import SensorChartWithOverlay from './SensorChartWithOverlay';
import SharedTimeAxis from './SharedTimeAxis';
import IntervalEditor from './IntervalEditor';
import IntervalSummaryTable from './IntervalSummaryTable';
import { toast } from '@/hooks/use-toast';

interface LabelingWorkspaceProps {
  trips: PipeTrip[];
  sensorData: SensorDataPoint[];
  startDate: Date;
  endDate: Date;
  onBack: () => void;
  onTripsUpdate: (trips: PipeTrip[]) => void;
}

const sensorConfigs: SensorConfig[] = [
  { key: 'hookload', label: 'Hookload', unit: 'klbs', color: 'hsl(195, 100%, 50%)' },
  { key: 'weight', label: 'Weight', unit: 'klbs', color: 'hsl(142, 71%, 45%)' },
  { key: 'depth', label: 'Depth', unit: 'ft', color: 'hsl(38, 92%, 50%)', scale: 100 },
  { key: 'rpm', label: 'RPM', unit: 'rpm', color: 'hsl(280, 65%, 60%)' },
];

const LabelingWorkspace = ({ 
  trips, 
  sensorData, 
  startDate, 
  endDate, 
  onBack,
  onTripsUpdate 
}: LabelingWorkspaceProps) => {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedTrip = trips.find(t => t.id === selectedTripId) || null;

  const handleUpdateTrip = useCallback((tripId: string, updates: Partial<PipeTrip>) => {
    const updatedTrips = trips.map(trip => 
      trip.id === tripId ? { ...trip, ...updates } : trip
    );
    onTripsUpdate(updatedTrips);
  }, [trips, onTripsUpdate]);

  const handleResetTrip = useCallback((tripId: string) => {
    const updatedTrips = trips.map(trip => 
      trip.id === tripId ? { 
        ...trip, 
        startTime: trip.originalStartTime,
        endTime: trip.originalEndTime,
        status: 'auto' as const,
        comments: ''
      } : trip
    );
    onTripsUpdate(updatedTrips);
    toast({
      title: "Interval Reset",
      description: "Interval has been reset to auto-detected values.",
    });
  }, [trips, onTripsUpdate]);

  const handleValidateTrip = useCallback((tripId: string) => {
    handleUpdateTrip(tripId, { status: 'validated' });
    toast({
      title: "Interval Validated",
      description: "Interval has been marked as validated.",
    });
  }, [handleUpdateTrip]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast({
      title: "Intervals Saved",
      description: `Successfully saved ${trips.length} intervals.`,
    });
  };

  const stats = {
    total: trips.length,
    auto: trips.filter(t => t.status === 'auto').length,
    modified: trips.filter(t => t.status === 'modified').length,
    validated: trips.filter(t => t.status === 'validated').length,
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Main workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 glass-panel">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Interval Labeling</h2>
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
            </span>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Auto: <span className="font-mono font-semibold">{stats.auto}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-status-modified" />
                Modified: <span className="font-mono font-semibold">{stats.modified}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-status-validated" />
                Validated: <span className="font-mono font-semibold">{stats.validated}</span>
              </span>
            </div>
            <Button 
              onClick={handleSaveAll} 
              variant="success" 
              size="sm"
              disabled={isSaving}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </div>

        {/* Charts area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1" onClick={() => setSelectedTripId(null)}>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 px-2">
            <span className="text-xs text-muted-foreground">Trip Types:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded bg-trip-rih/60 border border-trip-rih" />
                RIH
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded bg-trip-pooh/60 border border-trip-pooh" />
                POOH
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded bg-muted/60 border border-muted-foreground" />
                No Pipe
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded bg-trip-other/60 border border-trip-other" />
                Other
              </span>
            </div>
          </div>

          {/* Stacked sensor charts with overlays */}
          <div className="glass-panel rounded-lg border border-border/30 overflow-hidden">
            {sensorConfigs.map((sensor, index) => (
              <div 
                key={sensor.key}
                className={index < sensorConfigs.length - 1 ? "border-b border-border/20" : ""}
              >
                <SensorChartWithOverlay
                  data={sensorData}
                  sensor={sensor}
                  trips={trips}
                  startDate={startDate}
                  endDate={endDate}
                  selectedTripId={selectedTripId}
                  onSelectTrip={setSelectedTripId}
                  onUpdateTrip={handleUpdateTrip}
                  showTimeAxis={index === sensorConfigs.length - 1}
                />
              </div>
            ))}
          </div>

          {/* Shared time axis */}
          <SharedTimeAxis startDate={startDate} endDate={endDate} />
        </div>

        {/* Bottom summary table */}
        <div className="border-t border-border/50 p-4 glass-panel">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interval Summary ({trips.length} intervals)
            </h3>
          </div>
          <div className="max-h-[140px] overflow-y-auto">
            <IntervalSummaryTable
              trips={trips}
              selectedTripId={selectedTripId}
              onSelectTrip={setSelectedTripId}
            />
          </div>
        </div>
      </div>

      {/* Right-side editor panel */}
      <IntervalEditor
        trip={selectedTrip}
        onClose={() => setSelectedTripId(null)}
        onUpdate={handleUpdateTrip}
        onReset={handleResetTrip}
        onValidate={handleValidateTrip}
      />
    </div>
  );
};

export default LabelingWorkspace;