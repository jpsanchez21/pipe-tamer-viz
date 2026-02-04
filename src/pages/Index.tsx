import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import TimeWindowSelector from '@/components/TimeWindowSelector';
import LabelingWorkspace from '@/components/labeling/LabelingWorkspace';
import { PipeTrip, SensorDataPoint, Intervention } from '@/types/trip';
import { realTrips } from '@/data/realTrips';
import { realTelemetry } from '@/data/realTelemetry';

type ViewMode = 'selection' | 'labeling';

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [trips, setTrips] = useState<PipeTrip[]>([]);
  const [sensorData, setSensorData] = useState<SensorDataPoint[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedRig, setSelectedRig] = useState<string | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  const handleRunAnalysis = useCallback((startDate: Date, endDate: Date, rig: string, intervention: Intervention) => {
    // 1. Use the Real Field telemetry loaded from CSV
    const fieldData = realTelemetry as SensorDataPoint[];

    // Determine the actual range of the real data
    const start = fieldData[0].timestamp;
    const end = fieldData[fieldData.length - 1].timestamp;

    // 2. Use real trips from CSV data
    const csvTrips = realTrips.map(trip => ({
      ...trip,
      startTime: new Date(trip.startTime),
      endTime: new Date(trip.endTime),
      originalStartTime: new Date(trip.originalStartTime),
      originalEndTime: new Date(trip.originalEndTime),
      connections: trip.connections?.map(conn => ({
        ...conn,
        startTime: new Date(conn.startTime),
        endTime: new Date(conn.endTime),
      }))
    }));

    // Add checkpoint after date conversion
    const tripsWithCheckpoint = csvTrips.map(t => ({
      ...t,
      checkpoint: JSON.stringify(t)
    }));

    setSensorData(fieldData);
    setTrips(tripsWithCheckpoint);
    setDateRange({ start, end });
    setSelectedRig(rig);
    setSelectedIntervention({
      ...intervention,
      wellName: csvTrips[0]?.wellName || 'Real Data',
      operationType: 'Real Telemetry Analysis'
    });
    setViewMode('labeling');
  }, []);

  const handleBack = useCallback(() => {
    setViewMode('selection');
  }, []);

  const handleTripsUpdate = useCallback((updatedTrips: PipeTrip[]) => {
    setTrips(updatedTrips);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {viewMode === 'selection' && (
        <div className="flex flex-col items-center gap-8">
          <TimeWindowSelector onRunAnalysis={handleRunAnalysis} />
        </div>
      )}

      {viewMode === 'labeling' && dateRange && (
        <LabelingWorkspace
          wellName={selectedIntervention?.wellName || 'Sin Pozo'}
          rigName={selectedRig || 'Sin Torre'}
          trips={trips}
          sensorData={sensorData}
          startDate={dateRange.start}
          endDate={dateRange.end}
          onBack={handleBack}
          onTripsUpdate={handleTripsUpdate}
        />
      )}
    </div>
  );
};

export default Index;
