import { useState, useCallback } from 'react';
import { ArrowLeft, Save, CheckCircle, BarChart3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PipeTrip, SensorDataPoint } from '@/types/trip';
import SensorChart from './SensorChart';
import TripTimeline from './TripTimeline';
import TripEditPanel from './TripEditPanel';
import TripSummaryTable from './TripSummaryTable';
import { toast } from '@/hooks/use-toast';

interface AnalysisViewProps {
  trips: PipeTrip[];
  sensorData: SensorDataPoint[];
  startDate: Date;
  endDate: Date;
  onBack: () => void;
  onTripsUpdate: (trips: PipeTrip[]) => void;
}

const AnalysisView = ({ 
  trips, 
  sensorData, 
  startDate, 
  endDate, 
  onBack,
  onTripsUpdate 
}: AnalysisViewProps) => {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedTrip = trips.find(t => t.id === selectedTripId);

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
      title: "Trip Reset",
      description: "Trip has been reset to auto-detected values.",
    });
  }, [trips, onTripsUpdate]);

  const handleValidateTrip = useCallback((tripId: string) => {
    handleUpdateTrip(tripId, { status: 'validated' });
  }, [handleUpdateTrip]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast({
      title: "Trips Saved",
      description: `Successfully saved ${trips.length} validated trips.`,
    });
  };

  const stats = {
    total: trips.length,
    auto: trips.filter(t => t.status === 'auto').length,
    modified: trips.filter(t => t.status === 'modified').length,
    validated: trips.filter(t => t.status === 'validated').length,
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold">Analysis Results</h2>
              <p className="text-sm text-muted-foreground">
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSaveAll} 
            variant="success" 
            size="lg"
            disabled={isSaving}
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Validated Trips
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="glass-panel">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Trips</p>
              <p className="text-3xl font-bold font-mono">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="glass-panel border-primary/30">
            <CardContent className="pt-4">
              <p className="text-xs text-primary uppercase tracking-wider">Auto-detected</p>
              <p className="text-3xl font-bold font-mono text-primary">{stats.auto}</p>
            </CardContent>
          </Card>
          <Card className="glass-panel border-status-modified/30">
            <CardContent className="pt-4">
              <p className="text-xs text-status-modified uppercase tracking-wider">Modified</p>
              <p className="text-3xl font-bold font-mono text-status-modified">{stats.modified}</p>
            </CardContent>
          </Card>
          <Card className="glass-panel border-status-validated/30">
            <CardContent className="pt-4">
              <p className="text-xs text-status-validated uppercase tracking-wider">Validated</p>
              <p className="text-3xl font-bold font-mono text-status-validated">{stats.validated}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sensor Chart */}
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Sensor Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SensorChart data={sensorData} />
          </CardContent>
        </Card>

        {/* Trip Timeline */}
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Pipe Trips Timeline
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (Drag edges to adjust timing)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TripTimeline
              trips={trips}
              startDate={startDate}
              endDate={endDate}
              selectedTripId={selectedTripId}
              onSelectTrip={setSelectedTripId}
              onUpdateTrip={handleUpdateTrip}
            />
          </CardContent>
        </Card>

        {/* Summary Table */}
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <List className="w-4 h-4 text-primary" />
              Trip Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TripSummaryTable
              trips={trips}
              selectedTripId={selectedTripId}
              onSelectTrip={setSelectedTripId}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edit Panel */}
      {selectedTrip && (
        <TripEditPanel
          trip={selectedTrip}
          onClose={() => setSelectedTripId(null)}
          onUpdate={handleUpdateTrip}
          onReset={handleResetTrip}
        />
      )}
    </div>
  );
};

export default AnalysisView;
