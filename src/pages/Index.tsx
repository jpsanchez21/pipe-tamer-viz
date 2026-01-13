import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import TimeWindowSelector from '@/components/TimeWindowSelector';
import AnalysisView from '@/components/AnalysisView';
import { PipeTrip, SensorDataPoint } from '@/types/trip';
import { generateMockSensorData, generateMockTrips } from '@/utils/mockData';

type ViewMode = 'selection' | 'analysis';

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [trips, setTrips] = useState<PipeTrip[]>([]);
  const [sensorData, setSensorData] = useState<SensorDataPoint[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  const handleRunAnalysis = useCallback((startDate: Date, endDate: Date) => {
    // Generate mock data
    const mockSensorData = generateMockSensorData(startDate, endDate);
    const mockTrips = generateMockTrips(startDate, endDate);
    
    setSensorData(mockSensorData);
    setTrips(mockTrips);
    setDateRange({ start: startDate, end: endDate });
    setViewMode('analysis');
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
        <TimeWindowSelector onRunAnalysis={handleRunAnalysis} />
      )}
      
      {viewMode === 'analysis' && dateRange && (
        <AnalysisView
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
