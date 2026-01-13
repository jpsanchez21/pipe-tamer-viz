export type TripType = 'RIH' | 'POOH' | 'NoPipe' | 'Other';

export type TripStatus = 'auto' | 'modified' | 'validated';

export type PipeType = 'Drill Pipe' | 'Casing' | 'Tubing' | 'BHA' | 'Other';

export interface PipeTrip {
  id: string;
  name: string;
  type: TripType;
  pipeType: PipeType;
  tubingReference: string;
  startTime: Date;
  endTime: Date;
  status: TripStatus;
  comments: string;
  originalStartTime: Date;
  originalEndTime: Date;
}

export interface SensorDataPoint {
  timestamp: Date;
  weight: number;
  depth: number;
  hookload: number;
  rpm: number;
  torque: number;
}

export interface SensorConfig {
  key: keyof Omit<SensorDataPoint, 'timestamp'>;
  label: string;
  unit: string;
  color: string;
  scale?: number;
}

export interface AnalysisWindow {
  startDate: Date;
  endDate: Date;
}
