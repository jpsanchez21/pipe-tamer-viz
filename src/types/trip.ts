export type TripType = 'RIH' | 'POOH' | 'Drilling' | 'Other';

export type TripStatus = 'auto' | 'modified' | 'validated';

export interface PipeTrip {
  id: string;
  name: string;
  type: TripType;
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

export interface AnalysisWindow {
  startDate: Date;
  endDate: Date;
}
