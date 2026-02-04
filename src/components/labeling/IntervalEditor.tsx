import { useState, useEffect } from 'react';
import { X, RotateCcw, Save, CheckCircle, Tag, Clock, MessageSquare, Wrench, Trash2, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PipeTrip, TripType, PipeType, DHToolFamily, KeyType } from '@/types/trip';
import { formatDuration } from '@/utils/mockData';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { pipeSpecs } from '@/data/pipeSpecs';

interface IntervalEditorProps {
  trip: PipeTrip | null;
  onClose: () => void;
  onUpdate: (tripId: string, updates: Partial<PipeTrip>) => void;
  onReset: (tripId: string) => void;
  onDelete?: (tripId: string) => void;
  pressureData?: { time: number; value: number }[]; // Add pressure data prop
}

const tripTypes: TripType[] = ['RIH', 'POOH', 'Other'];
const keyTypes: KeyType[] = ['Hydraulic', 'Power', 'ThirdParty'];
const pipeTypes: PipeType[] = ['Tubing', 'Drill Pipe', 'Casing', 'BHA', 'Other'];
const dhToolFamilies: DHToolFamily[] = [
  'Artificial Lift', 'Fishing', 'Open Bottom', 'Cleaning',
  'Casing Repair', 'Debris Removal', 'Isolation', 'Tubing MP', 'Rod MP'
];

const toLocalISOString = (date: Date) => {
  const pad = (num: number) => (num < 10 ? '0' : '') + num;
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes());
};

const IntervalEditor = ({ trip, onClose, onUpdate, onReset, onDelete, pressureData = [] }: IntervalEditorProps) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TripType>('RIH');
  const [actionName, setActionName] = useState('');
  const [pipeType, setPipeType] = useState<PipeType>('Tubing');
  const [keyType, setKeyType] = useState<KeyType | undefined>(undefined);
  const [dhToolFamily, setDhToolFamily] = useState<DHToolFamily | undefined>(undefined);
  const [tubingReference, setTubingReference] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comments, setComments] = useState('');

  // Initial load of trip data
  useEffect(() => {
    if (trip) {
      setName(trip.name);
      setType(trip.type);
      setActionName(trip.actionName || '');
      setPipeType(trip.pipeType);
      setKeyType(trip.keyType);
      setDhToolFamily(trip.dhToolFamily);
      setTubingReference(trip.tubingReference);
      setStartTime(toLocalISOString(trip.startTime));
      setEndTime(toLocalISOString(trip.endTime));
      setComments(trip.comments);
    }
  }, [trip]);

  // Real-time synchronization helper
  const syncChanges = (updates: Partial<PipeTrip>) => {
    if (!trip) return;
    onUpdate(trip.id, {
      ...updates,
      status: trip.status === 'auto' ? 'modified' : trip.status
    });
  };

  if (!trip) {
    return (
      <div className="w-full h-full glass-panel flex flex-col items-center justify-center p-6 text-center">
        <Tag className="w-12 h-12 text-muted-foreground/60 mb-4 animate-pulse-glow rounded-full p-2" />
        <h3 className="font-semibold text-muted-foreground">No hay intervalo seleccionado</h3>
        <p className="text-xs text-muted-foreground/80 mt-2">
          Haga clic en un bloque de intervalo para ver y editar sus propiedades
        </p>
      </div>
    );
  }

  const handleValidate = () => {
    onUpdate(trip.id, { status: 'validated' });
  };

  const handleReset = () => {
    onReset(trip.id);
  };

  const duration = formatDuration(new Date(startTime || trip.startTime), new Date(endTime || trip.endTime));
  const isPressureTest = trip.type === 'PP';



  return (
    <div className="w-full h-full glass-panel flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          {isPressureTest ? <Activity className="w-4 h-4 text-purple-500" /> : <Tag className="w-4 h-4 text-primary" />}
          <h3 className="font-semibold text-sm">{isPressureTest ? 'Detalle de Prueba' : 'Editor de Intervalos'}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Status Badge */}
      <div className="px-4 pt-3">
        <div className={cn(
          "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium",
          trip.status === 'auto' && "status-badge-auto",
          trip.status === 'modified' && "status-badge-modified",
          trip.status === 'validated' && "status-badge-validated"
        )}>
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            trip.status === 'auto' && "bg-primary",
            trip.status === 'modified' && "bg-status-modified",
            trip.status === 'validated' && "bg-status-validated"
          )} />
          {trip.status === 'auto' && 'Auto-detectado'}
          {trip.status === 'modified' && 'Modificado'}
          {trip.status === 'validated' && 'Validado'}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* PRESSURE TEST CHART (Only for PP) */}
        {isPressureTest && (
          <div className="h-40 w-full bg-muted/20 rounded-lg border border-border/50 p-2 mb-4">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Perfil de Presión (Real)</span>
              {pressureData.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-purple-500">
                  Max: {Math.max(...pressureData.map(d => d.value)).toFixed(0)} psi
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={pressureData}>
                <defs>
                  <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="time"
                  hide={false}
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  tickFormatter={(val) => format(new Date(val), 'HH:mm')}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  hide={false}
                  width={35}
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  labelFormatter={(label) => format(new Date(label), 'HH:mm:ss')}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', fontSize: '10px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number) => [`${value.toFixed(0)} psi`, 'Presión']}
                />
                <Area type="monotone" dataKey="value" stroke="#a855f7" fillOpacity={1} fill="url(#colorPressure)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 1. Trip Type - ONLY for non-pressure tests */}
        {!isPressureTest && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tipo de Viaje
            </Label>
            <Select
              value={type}
              onValueChange={(v) => {
                const newType = v as TripType;
                setType(newType);
                syncChanges({ type: newType });
              }}
            >
              <SelectTrigger className="industrial-input h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RIH">RIH</SelectItem>
                <SelectItem value="POOH">POOH</SelectItem>
                <SelectItem value="Other">OTHER</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 2. Activity Name (Editable) */}
        <div className="space-y-1.5 animate-slide-in-fast">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Tag className="w-3 h-3" />
            Nombre de Actividad
          </Label>
          <Input
            value={actionName}
            onChange={(e) => {
              const val = e.target.value;
              setActionName(val);
              syncChanges({ actionName: val });
            }}
            placeholder={type}
            className="industrial-input h-9"
          />
        </div>

        <Separator className="bg-border/30" />

        {/* 3. Start Time */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Inicio
          </Label>
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(e) => {
              const val = e.target.value;
              setStartTime(val);
              if (val) syncChanges({ startTime: new Date(val) });
            }}
            className="industrial-input h-9 font-mono text-xs"
          />
        </div>

        {/* 4. End Time */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Fin
          </Label>
          <Input
            type="datetime-local"
            value={endTime}
            onChange={(e) => {
              const val = e.target.value;
              setEndTime(val);
              if (val) syncChanges({ endTime: new Date(val) });
            }}
            className="industrial-input h-9 font-mono text-xs"
          />
        </div>

        {/* Duration Display */}
        <div className="p-2.5 rounded-md bg-muted/30 border border-border/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duración</p>
          <p className="text-base font-mono font-semibold text-primary">{duration}</p>
        </div>

        <Separator className="bg-border/30" />

        {/* TRIP-SPECIFIC FIELDS (Only for RIH, POOH, Other - NOT for PP) */}
        {!isPressureTest && (
          <>
            {/* 5. Pipe Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wrench className="w-3 h-3" />
                Especificación de Tubería
              </Label>
              <Select
                value={tubingReference}
                onValueChange={(val) => {
                  const spec = pipeSpecs.find(p => p.name === val);
                  if (spec) {
                    setTubingReference(val);
                    setPipeType(spec.type); // Auto-update generic type based on spec
                    syncChanges({ tubingReference: val, pipeType: spec.type });
                  }
                }}
              >
                <SelectTrigger className="industrial-input h-9 text-xs">
                  <SelectValue placeholder="Seleccionar especificación..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/30">TUBING</div>
                  {pipeSpecs.filter(p => p.type === 'Tubing').map((p) => (
                    <SelectItem key={p.id} value={p.name} className="text-xs">{p.name}</SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/30 border-t border-border/20 mt-1">DRILL PIPE</div>
                  {pipeSpecs.filter(p => p.type === 'Drill Pipe').map((p) => (
                    <SelectItem key={p.id} value={p.name} className="text-xs">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 6. Key Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wrench className="w-3 h-3" /> Tipo de Llave
              </Label>
              <Select value={keyType} onValueChange={(v) => { const val = v as KeyType; setKeyType(val); syncChanges({ keyType: val }); }}>
                <SelectTrigger className="industrial-input h-9"><SelectValue placeholder="Seleccionar Llave" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Llave Hidráulica">Llave Hidráulica</SelectItem>
                  <SelectItem value="Llave de Potencia">Llave de Potencia</SelectItem>
                  <SelectItem value="Llave de Tercero">Llave de Tercero</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 7. DH Tool Family */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wrench className="w-3 h-3" /> Familia de Herramientas
              </Label>
              <Select value={dhToolFamily} onValueChange={(v) => { const val = v as DHToolFamily; setDhToolFamily(val); syncChanges({ dhToolFamily: val }); }}>
                <SelectTrigger className="industrial-input h-9"><SelectValue placeholder="Seleccionar Familia" /></SelectTrigger>
                <SelectContent>{dhToolFamilies.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <Separator className="bg-border/30" />
          </>
        )}

        {/* 8. Comments */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" />
            Comentarios
          </Label>
          <Textarea
            value={comments}
            onChange={(e) => {
              const val = e.target.value;
              setComments(val);
              syncChanges({ comments: val });
            }}
            placeholder="Añadir notas..."
            className="industrial-input min-h-[60px] resize-none text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border/50 space-y-2 shrink-0">
        <Button onClick={handleValidate} variant="success" size="sm" className="w-full gap-1.5 font-bold">
          <CheckCircle className="w-3.5 h-3.5" />
          {isPressureTest ? 'Validar Prueba' : 'Validar Viaje'}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleReset} variant="outline" size="sm" className="w-full gap-1.5 text-xs font-bold">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          {onDelete && (
            <Button onClick={() => onDelete(trip.id)} variant="destructive" size="sm" className="w-full gap-1.5 text-xs font-bold">
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntervalEditor;
