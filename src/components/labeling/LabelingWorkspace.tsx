import { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowLeft, Save, Layers, ZoomOut, Monitor, Plus, Trash2, Filter, Activity, GripHorizontal, TestTube2, RefreshCw, Calendar, Clock, TowerControl as Tower, Weight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PipeTrip, SensorDataPoint, SensorConfig, TripType } from '@/types/trip';
import SensorChartWithOverlay from './SensorChartWithOverlay';
import IntervalEditor from './IntervalEditor';
import IntervalSummaryTable from './IntervalSummaryTable';
import { toast } from '@/hooks/use-toast';
import { validateTimestamps, formatValidationReport } from '@/utils/timestampValidation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface LabelingWorkspaceProps {
  wellName: string;
  rigName: string;
  trips: PipeTrip[];
  sensorData: SensorDataPoint[];
  startDate: Date;
  endDate: Date;
  onBack: () => void;
  onTripsUpdate: (trips: PipeTrip[]) => void;
}

const sensorConfigs: Record<string, SensorConfig> = {
  hookload: { key: 'hookload', label: 'Carga en el gancho', unit: 'klbs', color: 'hsl(195, 100%, 50%)' },
  blockPosition: { key: 'blockPosition', label: 'Posición del bloque', unit: 'ft', color: 'hsl(130, 71%, 45%)' },
  torque: { key: 'torque', label: 'Torque de llave', unit: 'ft-lb', color: 'hsl(38, 92%, 50%)' },
  pumpPressure: { key: 'pumpPressure', label: 'Presión bomba', unit: 'psi', color: 'hsl(280, 65%, 60%)' },
  depth: { key: 'depth', label: 'Profundidad', unit: 'ft', color: 'hsl(0, 100%, 60%)', scale: 100 },
};

const downsampleData = (data: SensorDataPoint[], threshold: number): SensorDataPoint[] => {
  if (data.length <= threshold) return data;
  const factor = Math.ceil(data.length / threshold);
  const sampled: SensorDataPoint[] = [];
  for (let i = 0; i < data.length; i += factor) {
    sampled.push(data[i]);
  }
  if (data.length > 0 && sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }
  return sampled;
};

const LabelingWorkspace = ({
  wellName,
  rigName,
  trips,
  sensorData,
  startDate,
  endDate,
  onBack,
  onTripsUpdate
}: LabelingWorkspaceProps) => {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [zoomedRange, setZoomedRange] = useState<{ start: Date, end: Date } | null>(null);
  const [brushIndices, setBrushIndices] = useState<{ start: number, end: number }>({ start: 0, end: 0 });
  const [dynamicSensorKey, setDynamicSensorKey] = useState<keyof Omit<SensorDataPoint, 'timestamp'>>('torque');
  const [isRecalculateOpen, setIsRecalculateOpen] = useState(false);
  const [blockWeight, setBlockWeight] = useState('5000');
  const [isRecalculating, setIsRecalculating] = useState(false);

  // VALIDATION: Check timestamp consistency on mount and data changes
  useEffect(() => {
    console.log('🔍 Running timestamp validation...');
    const report = validateTimestamps(trips, sensorData);
    const formattedReport = formatValidationReport(report);

    console.log(formattedReport);

    // Validation is informative only - no UI interruptions
    if (report.isValid) {
      console.log('✅ All timestamps validated successfully!');
    } else {
      console.warn('⚠️ Some validation issues found - check report above');
    }
  }, [trips, sensorData]);

  // Layer Visibility State (For Charts)
  const [visibleLayers, setVisibleLayers] = useState<{ trips: boolean; pressureTests: boolean }>({
    trips: true,
    pressureTests: true
  });

  // Table Tab State
  const [activeTableTab, setActiveTableTab] = useState<'trips' | 'connections' | 'pressureTests'>('trips');

  const activeSensorKeys: (keyof Omit<SensorDataPoint, 'timestamp'>)[] = [
    'hookload',
    'blockPosition',
    dynamicSensorKey
  ];

  const handleToggleSensor = (key: string) => {
    if (['torque', 'pumpPressure', 'depth'].includes(key)) {
      setDynamicSensorKey(key as any);
    }
  };

  const toggleLayer = (layer: 'trips' | 'pressureTests') => {
    setVisibleLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const effectiveRange = zoomedRange || { start: startDate, end: endDate };

  const rangeFilteredData = useMemo(() => {
    if (!zoomedRange) return sensorData;
    return sensorData.filter(point =>
      point.timestamp >= zoomedRange.start &&
      point.timestamp <= zoomedRange.end
    );
  }, [sensorData, zoomedRange]);

  const samplingThreshold = 2000;
  const filteredData = useMemo(() => {
    return downsampleData(rangeFilteredData, samplingThreshold);
  }, [rangeFilteredData]);

  const isFullDetail = rangeFilteredData.length <= samplingThreshold;
  const samplingRatio = isFullDetail ? 1 : Math.round(rangeFilteredData.length / filteredData.length);

  const brushOverviewData = useMemo(() => {
    return downsampleData(sensorData, 5000);
  }, [sensorData]);

  useEffect(() => {
    if (brushOverviewData.length > 0) {
      setBrushIndices({
        start: 0,
        end: brushOverviewData.length - 1
      });
    }
  }, [brushOverviewData.length]);

  // Sync brush indices when zoomedRange changes via wheel/pan
  useEffect(() => {
    if (!zoomedRange || brushOverviewData.length === 0) {
      setBrushIndices({ start: 0, end: brushOverviewData.length - 1 });
      return;
    }

    // Find closest indices in brushOverviewData for the current zoomedRange
    let startIdx = 0;
    let endIdx = brushOverviewData.length - 1;

    // Binary search would be faster but for 5000 points this is fine
    for (let i = 0; i < brushOverviewData.length; i++) {
      if (brushOverviewData[i].timestamp >= zoomedRange.start) {
        startIdx = i;
        break;
      }
    }
    for (let i = brushOverviewData.length - 1; i >= 0; i--) {
      if (brushOverviewData[i].timestamp <= zoomedRange.end) {
        endIdx = i;
        break;
      }
    }

    setBrushIndices({ start: startIdx, end: endIdx });
  }, [zoomedRange, brushOverviewData]);

  const selectedTrip = trips.find(t => t.id === selectedTripId) || null;

  // Prep pressure data for editor if a PP trip is selected
  const editorPressureData = useMemo(() => {
    if (!selectedTrip || selectedTrip.type !== 'PP') return [];

    // Get data 1 min before and after for better visual context
    const buffer = 60 * 1000;
    const start = selectedTrip.startTime.getTime() - buffer;
    const end = selectedTrip.endTime.getTime() + buffer;

    // Determine sampling rate based on duration to avoid too many points in small chart
    // For a small preview chart, we don't need thousands of points
    const duration = end - start;
    const targetPoints = 200; // Target ~200 points for the preview

    const relevantData = sensorData.filter(d => {
      const t = d.timestamp.getTime();
      return t >= start && t <= end;
    });

    if (relevantData.length <= targetPoints) {
      return relevantData.map(d => ({
        time: d.timestamp.getTime(),
        value: d.pumpPressure || 0
      }));
    }

    // Simple downsampling
    const stride = Math.ceil(relevantData.length / targetPoints);
    return relevantData
      .filter((_, i) => i % stride === 0)
      .map(d => ({
        time: d.timestamp.getTime(),
        value: d.pumpPressure || 0
      }));

  }, [selectedTrip, sensorData]);

  // Extract ALL connections from all trips for valid filtering and SNAP logic
  const allGlobalConnections = useMemo(() => {
    return trips.flatMap(trip => trip.connections || []);
  }, [trips]);

  // Extract connections for the table view (filtered)
  const selectedConnections = useMemo(() => {
    // If no trip selected in connections tab, show all connections
    if (!selectedTrip || activeTableTab !== 'connections') {
      return allGlobalConnections;
    }

    // Filter by activity name when a trip is selected
    const activityName = selectedTrip.actionName || selectedTrip.name;
    return allGlobalConnections.filter(conn =>
      conn.activityName === activityName ||
      conn.activityName === selectedTrip.name
    );
  }, [selectedTrip, allGlobalConnections, activeTableTab]);


  // Filter trips for the table view based on ACTIVE TAB
  const visibleTripsSummary = useMemo(() => {
    return trips.filter(t => {
      if (activeTableTab === 'trips') {
        return ['RIH', 'POOH', 'Other'].includes(t.type);
      }
      if (activeTableTab === 'pressureTests') {
        return t.type === 'PP';
      }
      // For connections, we don't strictly filter trips here as the table handles connection display
      return true;
    });
  }, [trips, activeTableTab]);

  const handleSelectTrip = useCallback((tripId: string | null) => {
    // Prevent re-selection if already selected (optimisation)
    if (tripId === selectedTripId) return;

    // LAZY CHECKPOINT: Ensure trip has a reset point when first selected
    if (tripId) {
      const trip = trips.find(t => t.id === tripId);
      if (trip && !trip.checkpoint) {
        const tripsWithCheckpoint = trips.map(t =>
          t.id === tripId ? { ...t, checkpoint: JSON.stringify(t) } : t
        );
        onTripsUpdate(tripsWithCheckpoint);
        // Note: We continue selection logic. React batching handles the update.
      }
    }

    setSelectedTripId(tripId);
    if (tripId) {
      const trip = trips.find(t => t.id === tripId);
      if (trip) {
        // Switch tab based on trip type - BUT NO ZOOM BY DEFAULT interacting from chart
        if (trip.type === 'PP') {
          setActiveTableTab('pressureTests');
        } else if (['RIH', 'POOH', 'Other'].includes(trip.type)) {
          setActiveTableTab('trips');
        }
      }
    }
  }, [trips, selectedTripId, onTripsUpdate]);

  const handleUpdateTrip = useCallback((tripId: string, updates: Partial<PipeTrip>) => {
    let finalUpdates = { ...updates };
    const tripToUpdate = trips.find(t => t.id === tripId);

    // SNAP LOGIC: Differentiated by Trip Type
    // Determine the RESULTING type after this update
    const resultingType = finalUpdates.type !== undefined ? finalUpdates.type : tripToUpdate?.type;
    const isStrictType = resultingType && ['RIH', 'POOH'].includes(resultingType);

    if (tripToUpdate && isStrictType && allGlobalConnections.length > 0) {

      // Helper: Find nearest connection boundary
      const findNearestConnectionTime = (target: Date) => {
        let nearest = target.getTime();
        let minDiff = Infinity;
        const targetTime = target.getTime();

        for (const conn of allGlobalConnections) {
          const startDiff = Math.abs(conn.startTime.getTime() - targetTime);
          const endDiff = Math.abs(conn.endTime.getTime() - targetTime);

          if (startDiff < minDiff) {
            minDiff = startDiff;
            nearest = conn.startTime.getTime();
          }
          if (endDiff < minDiff) {
            minDiff = endDiff;
            nearest = conn.endTime.getTime();
          }
        }
        return new Date(nearest);
      };

      // 1. Snap any time updates (drag/resize operations) - ALWAYS snap to nearest connection
      if (finalUpdates.startTime) {
        finalUpdates.startTime = findNearestConnectionTime(finalUpdates.startTime);
      }
      if (finalUpdates.endTime) {
        finalUpdates.endTime = findNearestConnectionTime(finalUpdates.endTime);
      }

      // 2. AUTO-SNAP ON TYPE CHANGE: If changing TO strict type, snap current times
      const isTypeChanging = finalUpdates.type !== undefined && finalUpdates.type !== tripToUpdate.type;
      if (isTypeChanging) {
        // Only snap times that weren't already updated above
        if (!finalUpdates.startTime) {
          finalUpdates.startTime = findNearestConnectionTime(tripToUpdate.startTime);
        }
        if (!finalUpdates.endTime) {
          finalUpdates.endTime = findNearestConnectionTime(tripToUpdate.endTime);
        }
      }
    }
    // OTHER type: No Snap (Free movement)

    // CHECKPOINT LOGIC: If validating, update "original" fields to serve as the new reset point
    if (finalUpdates.status === 'validated') {
      const currentTrip = trips.find(t => t.id === tripId);
      if (currentTrip) {
        // Create a full checkpoint of the validated state
        const stateToSave = { ...currentTrip, ...finalUpdates };
        finalUpdates.checkpoint = JSON.stringify(stateToSave);

        // Keep legacy original fields for backward compatibility if needed
        finalUpdates.originalStartTime = finalUpdates.startTime || currentTrip.startTime;
        finalUpdates.originalEndTime = finalUpdates.endTime || currentTrip.endTime;
        finalUpdates.originalStatus = 'validated';
      }
    }

    const updatedTrips = trips.map(trip => {
      if (trip.id === tripId) {
        // AUTO-CHECKPOINT ON FIRST EDIT:
        // If trip is being modified and has no checkpoint, save current state as original BEFORE applying updates
        let preserveCheckpoint = trip.checkpoint;
        if (!preserveCheckpoint) {
          preserveCheckpoint = JSON.stringify(trip);
        }

        // Apply updates, ensuring checkpoint is preserved (unless updates explicitly change it, which shouldn't happen here normally)
        return {
          ...trip,
          ...finalUpdates,
          checkpoint: finalUpdates.checkpoint || preserveCheckpoint
        };
      }
      return trip;
    });
    onTripsUpdate(updatedTrips);
  }, [trips, onTripsUpdate, allGlobalConnections]);

  const handleResetTrip = useCallback((tripId: string) => {
    const updatedTrips = trips.map(trip => {
      if (trip.id !== tripId) return trip;

      if (trip.checkpoint) {
        try {
          // Full restore from checkpoint
          const snapshot = JSON.parse(trip.checkpoint);

          // Re-hydrate dates (JSON parse makes them strings)
          snapshot.startTime = new Date(snapshot.startTime);
          snapshot.endTime = new Date(snapshot.endTime);
          snapshot.originalStartTime = new Date(snapshot.originalStartTime);
          snapshot.originalEndTime = new Date(snapshot.originalEndTime);

          if (snapshot.connections) {
            snapshot.connections = snapshot.connections.map((c: any) => ({
              ...c,
              startTime: new Date(c.startTime),
              endTime: new Date(c.endTime)
            }));
          }

          // Restore everything but keep the ID (sanity check)
          return { ...snapshot, id: trip.id };
        } catch (e) {
          console.error("Failed to restore checkpoint", e);
          // Fallback to minimal reset
          return {
            ...trip,
            startTime: trip.originalStartTime || trip.startTime,
            endTime: trip.originalEndTime || trip.endTime,
            status: trip.originalStatus || 'auto'
          };
        }
      }

      // Legacy fallback
      return {
        ...trip,
        startTime: trip.originalStartTime || trip.startTime,
        endTime: trip.originalEndTime || trip.endTime,
        status: trip.originalStatus || 'auto'
      };
    });
    onTripsUpdate(updatedTrips);
  }, [trips, onTripsUpdate]);

  const handleDeleteTrip = useCallback((tripId: string) => {
    onTripsUpdate(trips.filter(t => t.id !== tripId));
    setSelectedTripId(null);
  }, [trips, onTripsUpdate]);

  const handleAddTrip = useCallback((startTimeOrEvent?: Date | any, type: TripType = 'Other', wellName?: string, name: string = 'Nuevo Intervalo') => {
    // Default duration increased to 4 hours for better visibility
    const defaultDuration = 4 * 60 * 60 * 1000; // 4 hours

    // Determine start time: Use provided date or fallback to center of current view
    let centerDate: Date;
    if (startTimeOrEvent instanceof Date) {
      centerDate = startTimeOrEvent;
    } else {
      // Fallback to center of effective range (viewport)
      centerDate = new Date(effectiveRange.start.getTime() + (effectiveRange.end.getTime() - effectiveRange.start.getTime()) / 2);
    }

    const start = new Date(centerDate.getTime() - defaultDuration / 2);
    const end = new Date(centerDate.getTime() + defaultDuration / 2);

    // Create the trip object fully populated first
    const newTrip: PipeTrip = {
      id: `manual-${Date.now()}`,
      name: name,
      wellName,
      type: (typeof type === 'string' ? type : 'Other') as TripType, // Safeguard against event object being passed as type
      actionName: '',
      pipeType: 'Tubing',
      tubingReference: '',
      startTime: start,
      endTime: end,
      status: 'modified',
      comments: 'Agregado manualmente',
      connections: [],
      originalStartTime: start,
      originalEndTime: end,
      originalStatus: 'modified',
    } as PipeTrip;

    // Now create the checkpoint with the fully populated object
    newTrip.checkpoint = JSON.stringify(newTrip);

    onTripsUpdate([...trips, newTrip]);
    // Automatically select the new trip
    setSelectedTripId(newTrip.id);
  }, [trips, onTripsUpdate, effectiveRange]);

  // BRUSH AND ZOOM HANDLERS DELETED FOR BREVITY (Re-inserting full content)
  const handleBrushChange = useCallback((startIndex: number, endIndex: number) => {
    if (startIndex < brushOverviewData.length && endIndex < brushOverviewData.length) {
      setZoomedRange({
        start: brushOverviewData[startIndex].timestamp,
        end: brushOverviewData[endIndex].timestamp
      });
      setBrushIndices({ start: startIndex, end: endIndex });
    }
  }, [brushOverviewData]);

  const handleWheelZoom = useCallback((delta: number, mouseTime: number) => {
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    const currentStart = effectiveRange.start.getTime();
    const currentEnd = effectiveRange.end.getTime();
    const duration = currentEnd - currentStart;
    const newDuration = duration * zoomFactor;
    const ratio = (mouseTime - currentStart) / duration;

    const newStartMs = Math.max(startDate.getTime(), mouseTime - (newDuration * ratio));
    const newEndMs = Math.min(endDate.getTime(), newStartMs + newDuration);

    setZoomedRange({ start: new Date(newStartMs), end: new Date(newEndMs) });
  }, [effectiveRange, startDate, endDate]);

  const handleDragPan = useCallback((deltaMs: number) => {
    const currentStart = effectiveRange.start.getTime();
    const currentEnd = effectiveRange.end.getTime();
    const duration = currentEnd - currentStart;
    let newStartMs = currentStart + deltaMs;
    let newEndMs = currentEnd + deltaMs;
    if (newStartMs < startDate.getTime()) { newStartMs = startDate.getTime(); newEndMs = newStartMs + duration; }
    if (newEndMs > endDate.getTime()) { newEndMs = endDate.getTime(); newStartMs = newEndMs - duration; }
    setZoomedRange({ start: new Date(newStartMs), end: new Date(newEndMs) });
  }, [effectiveRange, startDate, endDate]);

  const handleZoomToInterval = useCallback((tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    // Calculate context window: 30 minutes before and after the event
    const contextMs = 30 * 60 * 1000; // 30 minutes
    const tripDuration = trip.endTime.getTime() - trip.startTime.getTime();

    // If the trip is very short, ensure we show at least 1 hour total context
    const minTotalContext = 60 * 60 * 1000; // 1 hour
    const actualContext = Math.max(contextMs, (minTotalContext - tripDuration) / 2);

    let newStartMs = trip.startTime.getTime() - actualContext;
    let newEndMs = trip.endTime.getTime() + actualContext;

    // Clamp to overall dataset boundaries
    newStartMs = Math.max(startDate.getTime(), newStartMs);
    newEndMs = Math.min(endDate.getTime(), newEndMs);

    setZoomedRange({ start: new Date(newStartMs), end: new Date(newEndMs) });
  }, [trips, startDate, endDate]);

  // Wrapper for TABLE selection to enforce zoom
  const handleSelectTripWithZoom = useCallback((tripId: string) => {
    handleSelectTrip(tripId);
    handleZoomToInterval(tripId);
  }, [handleSelectTrip, handleZoomToInterval]);

  const handleExecuteRecalculate = () => {
    setIsRecalculateOpen(false);
    setIsRecalculating(true);

    // Simulate complex technical re-analysis
    setTimeout(() => {
      setIsRecalculating(false);
      toast({
        title: "Análisis completado",
        description: "Los intervalos se han recalculado con los nuevos parámetros.",
      });
    }, 2500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background overflow-hidden relative">
      {/* Recalculating Overlay */}
      {isRecalculating && (
        <div className="absolute inset-0 z-[100] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
          <div className="flex flex-col items-center gap-6 p-10 rounded-2xl glass-panel border-primary/20 shadow-2xl max-w-sm text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-widest text-primary">Recalculando</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-tighter leading-relaxed">
                Procesando telemetría con nuevo peso de bloque sugerido: <span className="font-bold text-foreground">{blockWeight} LBS</span>
              </p>
            </div>
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-processing-width" />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b h-14">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-sm uppercase">Análisis Técnico</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRecalculateOpen(true)}
            className="h-8 font-bold border-primary/20 hover:bg-primary/5"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Recalcular
          </Button>
          <Button onClick={() => setIsSaving(true)} variant="default" size="sm" className="h-8 font-bold">
            <Save className="w-4 h-4 mr-2" /> Guardar
          </Button>
        </div>
      </div>

      <div
        className="flex-1 flex overflow-hidden cursor-default"
        onClick={() => handleSelectTrip(null)}
      >
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar border-r p-6 space-y-10">
          <div onClick={(e) => e.stopPropagation()} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Sensor Selection Buttons (FAR LEFT) */}
                <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/10">
                  {['depth', 'torque', 'pumpPressure'].map(k => (
                    <Button
                      key={k}
                      onClick={() => handleToggleSensor(k)}
                      variant={dynamicSensorKey === k ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-8 text-[11px] font-bold px-4 rounded-lg transition-all",
                        dynamicSensorKey === k ? "shadow-sm" : "hover:bg-background/50"
                      )}
                    >
                      {sensorConfigs[k].label}
                    </Button>
                  ))}
                </div>

                {/* Global Data Resolution Indicator (NEXT TO SENSORS) */}
                <div className="flex items-center gap-3 px-4 py-1.5 bg-muted/30 rounded-full border border-border/10 shadow-sm">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      isFullDetail ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500/50"
                    )}
                  />
                  <span className={cn(
                    "text-[10px] font-mono font-black tracking-widest",
                    isFullDetail ? "text-emerald-500" : "text-muted-foreground/50"
                  )}>
                    {isFullDetail ? "LIVE DATA HD" : `INTERPOLADO 1:${samplingRatio}`}
                  </span>
                </div>

                {/* Reset Zoom Button (ALWAYS VISIBLE) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setZoomedRange(null);
                    handleSelectTrip(null);
                  }}
                  disabled={!zoomedRange}
                  className="h-8 text-[11px] font-black border-primary/20 hover:bg-primary/5 hover:border-primary/40 rounded-lg px-4 uppercase tracking-wider"
                >
                  <ZoomOut className="w-3.5 h-3.5 mr-2" /> Reset Zoom
                </Button>
              </div>

              {/* Layer Visibility Toggles (RIGHT SIDE - PREMIUM STYLE) */}
              <div className="flex items-center gap-2 p-1.5 bg-muted/40 rounded-xl border border-border/20 shadow-sm">
                <span className="text-[10px] font-black text-muted-foreground/60 px-3 uppercase tracking-widest">Capas</span>
                <div className="w-[1px] h-4 bg-border/40 mx-1" />
                <label className={cn(
                  "flex items-center gap-2.5 px-4 py-2 rounded-lg cursor-pointer transition-all duration-300",
                  visibleLayers.trips
                    ? "bg-primary/10 border border-primary/30 shadow-sm"
                    : "bg-transparent border border-transparent hover:bg-background/60"
                )}>
                  <input
                    type="checkbox"
                    checked={visibleLayers.trips}
                    onChange={() => toggleLayer('trips')}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                  />
                  <span className={cn(
                    "text-[11px] font-bold tracking-wide transition-colors",
                    visibleLayers.trips ? "text-primary" : "text-muted-foreground"
                  )}>Viajes</span>
                </label>
                <label className={cn(
                  "flex items-center gap-2.5 px-4 py-2 rounded-lg cursor-pointer transition-all duration-300",
                  visibleLayers.pressureTests
                    ? "bg-primary/10 border border-primary/30 shadow-sm"
                    : "bg-transparent border border-transparent hover:bg-background/60"
                )}>
                  <input
                    type="checkbox"
                    checked={visibleLayers.pressureTests}
                    onChange={() => toggleLayer('pressureTests')}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                  />
                  <span className={cn(
                    "text-[11px] font-bold tracking-wide transition-colors",
                    visibleLayers.pressureTests ? "text-primary" : "text-muted-foreground"
                  )}>Pruebas P.</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 data-grid">
              {activeSensorKeys.map((key, idx) => (
                <SensorChartWithOverlay
                  key={key}
                  data={filteredData}
                  allData={brushOverviewData}
                  sensor={sensorConfigs[key]}
                  trips={trips}
                  startDate={effectiveRange.start}
                  endDate={effectiveRange.end}
                  selectedTripId={selectedTripId}
                  onSelectTrip={handleSelectTrip}
                  onUpdateTrip={handleUpdateTrip}
                  showTimeAxis={idx === activeSensorKeys.length - 1}
                  onBrushChange={idx === activeSensorKeys.length - 1 ? handleBrushChange : undefined}
                  startIndex={brushIndices.start}
                  endIndex={brushIndices.end}
                  onWheelZoom={handleWheelZoom}
                  onDragPan={handleDragPan}
                  isFullDetail={isFullDetail}
                  samplingRatio={samplingRatio}
                  visibleLayers={visibleLayers}
                  onZoomToInterval={handleZoomToInterval}
                  brushSensorKey="hookload"
                />
              ))}
            </div>
          </div>

          <div className="space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  <h2 className="font-bold text-sm uppercase">Intervalos de Operación</h2>
                </div>
                {/* Table View Tabs */}
                <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/10">
                  <Button
                    variant={activeTableTab === 'trips' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTableTab('trips')}
                    className={cn(
                      "h-7 text-[10px] font-bold rounded-lg px-4 transition-all",
                      activeTableTab === 'trips' ? "shadow-md glow-primary bg-primary text-primary-foreground" : "hover:bg-primary/5"
                    )}
                  >
                    Viajes
                  </Button>
                  <Button
                    variant={activeTableTab === 'connections' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTableTab('connections')}
                    className={cn(
                      "h-7 text-[10px] font-bold rounded-lg px-4 transition-all",
                      activeTableTab === 'connections' ? "shadow-md glow-primary bg-primary text-primary-foreground" : "hover:bg-primary/5"
                    )}
                  >
                    Conexiones
                  </Button>
                  <Button
                    variant={activeTableTab === 'pressureTests' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTableTab('pressureTests')}
                    className={cn(
                      "h-7 text-[10px] font-bold rounded-lg px-4 transition-all",
                      activeTableTab === 'pressureTests' ? "shadow-md glow-primary bg-primary text-primary-foreground" : "hover:bg-primary/5"
                    )}
                  >
                    Pruebas P.
                  </Button>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddTrip} className="h-9 text-xs font-bold uppercase tracking-wider px-6 rounded-xl border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Añadir Manual
              </Button>
            </div>

            <div className="data-grid bg-muted/20 p-1">
              <div className="bg-background/40 backdrop-blur-md rounded-xl overflow-hidden">
                <IntervalSummaryTable
                  trips={visibleTripsSummary}
                  connections={selectedConnections}
                  selectedTripId={selectedTripId}
                  onSelectTrip={handleSelectTripWithZoom}
                  activeTab={activeTableTab}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Editor - Premium Tactical Glassmorphism */}
        <div className="w-80 border-l glass-panel flex flex-col shrink-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {selectedTrip ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-right-4 duration-300">
              <IntervalEditor
                trip={selectedTrip}
                onClose={() => handleSelectTrip(null)}
                onUpdate={handleUpdateTrip}
                onReset={handleResetTrip}
                onDelete={handleDeleteTrip}
                pressureData={editorPressureData}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-30 p-8 grayscale active:grayscale-0 transition-all duration-700">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                <Layers className="w-16 h-16 text-primary relative z-10" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Modo Análisis</p>
                <p className="text-[10px] font-medium uppercase tracking-tighter opacity-70">Seleccione un intervalo<br />para gestionar la telemetría</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recalculate Dialog */}
      <Dialog open={isRecalculateOpen} onOpenChange={setIsRecalculateOpen}>
        <DialogContent className="max-w-md glass-panel border-primary/20 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-border/10">
            <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
              <RefreshCw className="w-5 h-5" />
              Recalcular Análisis
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-tighter opacity-70">
              Ajuste los parámetros para procesar nuevamente los datos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Rig Info (Read Only) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Torre e Intervención</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/10">
                <Tower className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase">{rigName}</p>
                  <p className="text-[10px] text-muted-foreground">{wellName}</p>
                </div>
              </div>
            </div>

            {/* Date Range (Read Only) - Side by Side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Fecha Inicio</Label>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/10">
                  <Calendar className="w-3.5 h-3.5 text-primary/70" />
                  <p className="text-[11px] font-mono whitespace-nowrap">{format(startDate, 'yyyy-MM-dd HH:mm')}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Fecha Fin</Label>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/10">
                  <Clock className="w-3.5 h-3.5 text-primary/70" />
                  <p className="text-[11px] font-mono whitespace-nowrap">{format(endDate, 'yyyy-MM-dd HH:mm')}</p>
                </div>
              </div>
            </div>

            {/* Editable Parameter: Block Weight */}
            <div className="space-y-3 pt-2 border-t border-border/10">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Peso de Bloque Sugerido</Label>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">lbs</span>
              </div>
              <div className="relative group">
                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary brightness-125 z-10" />
                <Input
                  type="number"
                  step="100"
                  value={blockWeight}
                  onChange={(e) => setBlockWeight(e.target.value)}
                  className="pl-10 industrial-input h-11 text-base font-mono focus:ring-primary/40"
                />
              </div>
              <p className="text-[9px] text-muted-foreground italic px-1">
                * Este valor se utilizará como umbral para detectar movimiento y carga en el análisis.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/10">
            <Button
              variant="ghost"
              onClick={() => setIsRecalculateOpen(false)}
              className="text-xs font-bold uppercase tracking-widest"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteRecalculate}
              className="font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Ejecutar Recálculo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabelingWorkspace;