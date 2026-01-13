import { PipeTrip, SensorDataPoint, TripType, PipeType } from '@/types/trip';

export const generateMockSensorData = (startDate: Date, endDate: Date): SensorDataPoint[] => {
  const data: SensorDataPoint[] = [];
  const totalPoints = 200;
  const duration = endDate.getTime() - startDate.getTime();
  const interval = duration / totalPoints;

  for (let i = 0; i < totalPoints; i++) {
    const timestamp = new Date(startDate.getTime() + i * interval);
    const phase = i / totalPoints;
    
    // Simulate realistic drilling patterns
    const baseWeight = 150 + Math.sin(phase * Math.PI * 4) * 30;
    const baseDepth = 5000 + phase * 3000 + Math.sin(phase * Math.PI * 8) * 200;
    const baseHookload = 200 + Math.cos(phase * Math.PI * 6) * 50 + Math.random() * 20;
    const baseRpm = 60 + Math.sin(phase * Math.PI * 3) * 20 + Math.random() * 10;
    const baseTorque = 8000 + Math.cos(phase * Math.PI * 5) * 2000 + Math.random() * 500;

    data.push({
      timestamp,
      weight: Math.round(baseWeight + Math.random() * 10),
      depth: Math.round(baseDepth),
      hookload: Math.round(baseHookload),
      rpm: Math.round(baseRpm),
      torque: Math.round(baseTorque),
    });
  }

  return data;
};

export const generateMockTrips = (startDate: Date, endDate: Date): PipeTrip[] => {
  const tripTypes: TripType[] = ['RIH', 'POOH', 'NoPipe', 'Other'];
  const pipeTypes: PipeType[] = ['Drill Pipe', 'Casing', 'Tubing', 'BHA', 'Other'];
  const tripNames = [
    'Trip to Casing Point',
    'Pull Out for Bit Change',
    'Run In with New BHA',
    'Short Trip for Tight Hole',
    'Wiper Trip',
  ];
  const tubingRefs = ['DP-5.5"', 'CSG-9.625"', 'TBG-4.5"', 'BHA-8.5"', 'DP-6.625"'];

  const duration = endDate.getTime() - startDate.getTime();
  const numTrips = 5;
  const tripDuration = duration / (numTrips + 1);
  const trips: PipeTrip[] = [];

  for (let i = 0; i < numTrips; i++) {
    const tripStart = new Date(startDate.getTime() + (i + 0.3) * tripDuration);
    const tripEnd = new Date(tripStart.getTime() + tripDuration * 0.5);
    
    trips.push({
      id: `trip-${i + 1}`,
      name: tripNames[i % tripNames.length],
      type: tripTypes[i % tripTypes.length],
      pipeType: pipeTypes[i % pipeTypes.length],
      tubingReference: tubingRefs[i % tubingRefs.length],
      startTime: tripStart,
      endTime: tripEnd,
      status: i === 2 ? 'modified' : i === 4 ? 'validated' : 'auto',
      comments: i === 2 ? 'Adjusted timing based on hookload signature' : '',
      originalStartTime: tripStart,
      originalEndTime: tripEnd,
    });
  }

  return trips;
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

export const formatDuration = (start: Date, end: Date): string => {
  const diff = end.getTime() - start.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};
