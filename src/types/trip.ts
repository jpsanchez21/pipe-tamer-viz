export type TripType = 'RIH' | 'POOH' | 'Other' | 'PP';

export type TripStatus = 'auto' | 'modified' | 'validated';

export type PipeType = 'Drill Pipe' | 'Tubing' | 'Casing' | 'BHA' | 'Other';

export type KeyType = 'Hydraulic' | 'Power' | 'ThirdParty' | 'Llave Hidráulica' | 'Llave de Potencia';

export type DHToolFamily =
  | 'Artificial Lift'
  | 'Fishing'
  | 'Open Bottom'
  | 'Cleaning'
  | 'Casing Repair'
  | 'Debris Removal'
  | 'Isolation'
  | 'Tubing MP'
  | 'Rod MP';

export interface PipeConnection {
  id: string;
  tripId: string;
  activityName?: string;
  connectionNumber?: number;
  connectionType?: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  timeBetweenSlips?: number; // tiempo_cuna_cuna in minutes
  depth: number;
  maxTorque: number;
  type: 'Make Up' | 'Break Out';
  status: 'Ok' | 'Review';
}

export interface PipeTrip {
  id: string;
  name: string;
  wellName?: string;
  deviceId?: string;
  type: TripType;
  actionName?: string;
  pipeType: PipeType;
  keyType?: KeyType;
  dhToolFamily?: DHToolFamily;
  tubingReference: string;
  blockWeight?: number; // Block weight in Lb
  startTime: Date;
  endTime: Date;
  status: TripStatus;
  comments: string;
  originalStartTime?: Date;
  originalEndTime?: Date;
  originalStatus?: TripStatus;

  // Pressure Test fields
  testNumber?: string | number;
  maxPressure?: number;
  maxFlow?: number;
  durationText?: string;
  connections: PipeConnection[];
  checkpoint?: string; // JSON string of the full trip state for reset
}

export interface SensorDataPoint {
  timestamp: Date;
  weight: number;
  depth: number;
  hookload: number;
  rpm: number;
  torque: number;
  pumpPressure: number;
  blockPosition: number;
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

export interface ConnectionWindow {
  id: string;
  start: Date;
  end: Date;
}

export interface Intervention {
  id: string;
  wellName: string;
  operationType: string;
  targetDepth: string;
  status: 'active' | 'completed' | 'planned';
  startDate: Date;
  endDate: Date;
}
