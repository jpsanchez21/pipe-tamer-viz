import { PipeTrip, SensorDataPoint, TripType, PipeType, PipeConnection } from '@/types/trip';

export const generateMockSensorData = (startDate: Date, endDate: Date): SensorDataPoint[] => {
  const data: SensorDataPoint[] = [];
  const durationMs = endDate.getTime() - startDate.getTime();
  const intervalSeconds = 4; // Permanent 4s resolution
  const totalPoints = Math.floor(durationMs / (intervalSeconds * 1000));

  for (let i = 0; i < totalPoints; i++) {
    const timestamp = new Date(startDate.getTime() + i * intervalSeconds * 1000);
    const phase = i / totalPoints;

    // Simulate realistic drilling patterns with high-frequency telemetry
    const baseWeight = 150 + Math.sin(phase * Math.PI * 4) * 30 + Math.random() * 5;
    const baseDepth = 5000 + phase * 3000 + Math.sin(phase * Math.PI * 8) * 200;
    const baseHookload = 200 + Math.cos(phase * Math.PI * 6) * 50 + Math.sin(i * 0.1) * 10;
    const baseTorque = 8000 + Math.cos(phase * Math.PI * 5) * 2000 + Math.random() * 500;
    const basePumpPressure = 2500 + Math.sin(phase * Math.PI * 10) * 400 + Math.random() * 100;
    const baseBlockPos = 50 + Math.sin((i / 50) * Math.PI) * 40;

    data.push({
      timestamp,
      weight: Math.round(baseWeight),
      depth: Math.round(baseDepth),
      hookload: Math.round(baseHookload),
      rpm: Math.round(60 + Math.random() * 5),
      torque: Math.round(baseTorque),
      pumpPressure: Math.round(basePumpPressure),
      blockPosition: Math.round(baseBlockPos),
    });
  }

  return data;
};

export const generateMockTrips = (startDate: Date, endDate: Date): PipeTrip[] => {
  const tripTypes: TripType[] = ['RIH', 'POOH', 'Other'];
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
    const currentType = tripTypes[i % tripTypes.length];

    // Generate Connections for RIH/POOH
    const connections: PipeConnection[] = [];
    if (currentType === 'RIH' || currentType === 'POOH') {
      const connCount = 5 + Math.floor(Math.random() * 10); // 5-15 connections
      const step = (tripEnd.getTime() - tripStart.getTime()) / connCount;

      for (let k = 0; k < connCount; k++) {
        const connStart = new Date(tripStart.getTime() + k * step + (Math.random() * step * 0.5));
        const connDuration = 1000 * 60 * 2; // 2 minutes approx
        const connEnd = new Date(connStart.getTime() + connDuration);

        if (connEnd > tripEnd) continue;

        connections.push({
          id: `conn-${i}-${k}`,
          tripId: `trip-${i + 1}`,
          startTime: connStart,
          endTime: connEnd,
          durationSeconds: 120,
          depth: 5000 + (k * 100),
          maxTorque: 20 + Math.random() * 15,
          type: currentType === 'RIH' ? 'Make Up' : 'Break Out',
          status: Math.random() > 0.9 ? 'Review' : 'Ok'
        });
      }
    }

    trips.push({
      id: `trip-${i + 1}`,
      name: tripNames[i % tripNames.length],
      wellName: 'WELL-ALPHA-7B', // Reference well
      deviceId: `DEV-TX-${100 + i}`,
      type: currentType,
      pipeType: pipeTypes[i % pipeTypes.length],
      keyType: i % 2 === 0 ? 'Hydraulic' : 'Power',
      dhToolFamily: i % 3 === 0 ? 'Artificial Lift' : (i % 3 === 1 ? 'Fishing' : 'Cleaning'),
      tubingReference: tubingRefs[i % tubingRefs.length],
      startTime: tripStart,
      endTime: tripEnd,
      status: i === 2 ? 'modified' : i === 4 ? 'validated' : 'auto',
      comments: i === 2 ? 'Adjusted timing based on hookload signature' : '',
      originalStartTime: tripStart,
      originalEndTime: tripEnd,
      connections: connections // Attach generated connections
    });
  }

  // ADD SIMULATED PRESSURE TESTS (PP)
  // These will overlap or coexist with existing trips to demonstrate layering
  const pressureTestNames = ["Prueba BOP", "Prueba Línea Superficie", "Prueba Integridad Casing", "Prueba Baja Presión"];
  const numTests = 4;

  for (let j = 0; j < numTests; j++) {
    const startRatio = 0.1 + (j * 0.2) + (Math.random() * 0.1);
    const testDuration = 1000 * 60 * 45; // 45 minutes fixed duration

    const testStart = new Date(startDate.getTime() + (duration * startRatio));
    const testEnd = new Date(testStart.getTime() + testDuration);

    trips.push({
      id: `pp-${j + 1}`,
      name: pressureTestNames[j],
      wellName: 'WELL-ALPHA-7B',
      type: 'PP',
      actionName: pressureTestNames[j],
      pipeType: 'Other',
      tubingReference: 'N/A',
      startTime: testStart,
      endTime: testEnd,
      status: 'auto',
      comments: 'Simulación automática de prueba de presión',
      originalStartTime: testStart,
      originalEndTime: testEnd,
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
    second: '2-digit',
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

export const generateMockInterventions = (startDate: Date, endDate: Date): any[] => {
  return [
    {
      id: 'int-1',
      wellName: 'WELL-ALPHA-7B',
      operationType: 'Completación Técnica',
      targetDepth: '12,450 ft',
      status: 'active',
      startDate: new Date(startDate.getTime() + 3600000),
      endDate: new Date(endDate.getTime() - 3600000),
    },
    {
      id: 'int-2',
      wellName: 'WELL-BETA-02',
      operationType: 'Fracturamiento Hidráulico',
      targetDepth: '10,200 ft',
      status: 'planned',
      startDate: new Date(startDate.getTime() + 7200000),
      endDate: new Date(endDate.getTime() - 7200000),
    },
    {
      id: 'int-3',
      wellName: 'WELL-GAMMA-15',
      operationType: 'Exploración Exploratoria',
      targetDepth: '15,000 ft',
      status: 'completed',
      startDate: new Date(startDate.getTime() + 10800000),
      endDate: new Date(endDate.getTime() - 10800000),
    },
  ];
};
