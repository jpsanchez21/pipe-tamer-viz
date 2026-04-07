import { PipeTrip, PipeConnection } from '@/types/trip';
import { formatDateTime, formatDuration } from '@/utils/mockData';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Bot } from 'lucide-react';

interface IntervalSummaryTableProps {
  trips: PipeTrip[];
  connections?: PipeConnection[]; // Allow passing connections directly
  selectedTripId: string | null;
  onSelectTrip: (id: string) => void;
  activeTab: 'trips' | 'connections' | 'pressureTests';
}

const statusIcons = {
  auto: Bot,
  modified: AlertCircle,
  validated: CheckCircle2,
};

const tripTypeColors: Record<string, string> = {
  RIH: 'bg-trip-rih/20 text-trip-rih border-trip-rih/30',
  POOH: 'bg-trip-pooh/20 text-trip-pooh border-trip-pooh/30',
  NoPipe: 'bg-muted text-muted-foreground border-muted-foreground/30',
  Other: 'bg-trip-other/20 text-trip-other border-trip-other/30',
  PP: 'bg-slate-500/10 text-slate-600 border-slate-500/20 font-bold',
};

const IntervalSummaryTable = ({ trips, connections = [], selectedTripId, onSelectTrip, activeTab }: IntervalSummaryTableProps) => {

  const renderHeaders = () => {
    switch (activeTab) {
      case 'pressureTests':
        return (
          <>
            <th className="text-center p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">#</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Pozo</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Actividad</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Fecha Hora Inicio</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Fecha Hora Fin</th>
            <th className="text-center p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">N° Prueba</th>
            <th className="text-center p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Presión Máx</th>
            <th className="text-center p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Caudal Máx</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Duración</th>
          </>
        );
      case 'connections':
        return (
          <>
            <th className="text-center p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">#</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Actividad</th>
            <th className="text-center p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">N° Conexión</th>
            <th className="text-center p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Tipo Conexión</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Fecha Hora Inicio</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Fecha Hora Fin</th>
            <th className="text-center p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Tiempo Cuna-Cuna</th>
            <th className="text-center p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Torque</th>
          </>
        );
      case 'trips':
      default:
        return (
          <>
            <th className="text-center p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">#</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Pozo</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Tipo</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Actividad</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Inicio</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Fin</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Tipo Tubería</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Tipo Llave</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">DHT Family</th>
            <th className="text-center p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Peso Bloque</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Duración</th>
            <th className="text-left p-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Estado</th>
          </>
        );
    }
  };

  const renderContent = () => {
    if (activeTab === 'connections') {
      if (!connections || connections.length === 0) {
        return (
          <tr>
            <td colSpan={8} className="p-8 text-center text-muted-foreground italic">
              No hay conexiones para el viaje seleccionado o no hay viaje seleccionado.
            </td>
          </tr>
        );
      }
      return connections.map((conn, index) => (
        <tr
          key={conn.id}
          className="border-b border-border/10 cursor-pointer transition-all duration-200 leading-normal hover:bg-muted/30"
          onClick={() => onSelectTrip(conn.id)} // Select logic for connections? Maybe minimal
        >
          <td className="p-2.5 font-mono text-muted-foreground/60 text-xs text-center">{index + 1}</td>
          <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap text-xs">{conn.activityName || '---'}</td>
          <td className="p-2.5 font-mono font-semibold text-primary text-xs text-center">{conn.connectionNumber || index + 1}</td>
          <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap text-xs text-center">{conn.connectionType || '---'}</td>
          <td className="p-2.5 font-mono text-muted-foreground text-xs">{formatDateTime(conn.startTime)}</td>
          <td className="p-2.5 font-mono text-muted-foreground text-xs">
            {conn.timeBetweenSlips ? (() => {
              // User logic: 2.13 means 2 min 13 sec (not 2.13 decimal minutes)
              const minutes = Math.floor(conn.timeBetweenSlips);
              const seconds = Math.round((conn.timeBetweenSlips - minutes) * 100);
              const totalDurationMs = (minutes * 60 + seconds) * 1000;
              return formatDateTime(new Date(conn.startTime.getTime() + totalDurationMs));
            })() : '---'}
          </td>
          <td className="p-2.5 font-mono font-semibold text-primary text-xs text-center">{conn.timeBetweenSlips ? conn.timeBetweenSlips.toFixed(2) : '---'} min</td>
          <td className="p-2.5 font-mono text-muted-foreground text-xs text-center">{Math.round(conn.maxTorque)} ft-lb</td>
        </tr>
      ));
    } else {
      // TRIPS & PRESSURE TESTS Logic (Same as before)
      if (trips.length === 0) {
        return (
          <tr>
            <td colSpan={12} className="p-8 text-center text-muted-foreground italic">
              No hay datos para esta vista.
            </td>
          </tr>
        );
      }
      return trips.map((trip, index) => {
        const isSelected = selectedTripId === trip.id;

        let cells;
        if (activeTab === 'pressureTests') {
          cells = (
            <>
              <td className="p-2.5 font-mono text-muted-foreground/60 text-xs text-center">{index + 1}</td>
              <td className="p-2.5 font-mono font-semibold whitespace-nowrap text-primary">{trip.wellName || 'N/A'}</td>
              <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap text-xs">{trip.actionName || '---'}</td>
              <td className="p-2.5 font-mono text-muted-foreground text-xs">{formatDateTime(trip.startTime)}</td>
              <td className="p-2.5 font-mono text-muted-foreground text-xs">{formatDateTime(trip.endTime)}</td>
              <td className="p-2.5 font-mono font-semibold text-primary text-xs text-center">{trip.testNumber || index + 1}</td>
              <td className="p-2.5 font-mono text-muted-foreground text-xs text-center">{trip.maxPressure ? `${trip.maxPressure.toFixed(2)} psi` : '---'}</td>
              <td className="p-2.5 font-mono text-muted-foreground text-xs text-center">{trip.maxFlow ? trip.maxFlow.toFixed(2) : '0'}</td>
              <td className="p-2.5 font-mono text-primary font-semibold text-xs">{trip.durationText || formatDuration(trip.startTime, trip.endTime)}</td>
            </>
          );
        } else {
          cells = (
            <>
              {/* # */}
              <td className="p-2.5 font-mono text-muted-foreground/60 text-xs text-center">{index + 1}</td>
              {/* Pozo */}
              <td className="p-2.5 font-mono text-primary font-semibold whitespace-nowrap">{trip.wellName || 'N/A'}</td>
              {/* Tipo */}
              <td className="p-2.5">
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight",
                  tripTypeColors[trip.type] || tripTypeColors.Other
                )}>
                  {trip.type}
                </span>
              </td>
              {/* Actividad */}
              <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap text-xs">{trip.actionName || '---'}</td>
              {/* Inicio */}
              <td className="p-2.5 font-mono text-muted-foreground text-xs">{formatDateTime(trip.startTime)}</td>
              {/* Fin */}
              <td className="p-2.5 font-mono text-muted-foreground text-xs">{formatDateTime(trip.endTime)}</td>
              {/* Tipo Tubería */}
              <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap text-xs">{trip.tubingReference}</td>
              {/* Tipo Llave */}
              <td className="p-2.5 font-mono text-muted-foreground text-xs whitespace-nowrap">{trip.keyType || '---'}</td>
              {/* DHT Family */}
              <td className="p-2.5 font-mono text-muted-foreground text-xs whitespace-nowrap">{trip.dhToolFamily || '---'}</td>
              {/* Peso Bloque */}
              <td className="p-2.5 font-mono text-muted-foreground font-semibold text-xs text-center">{trip.blockWeight ? `${trip.blockWeight} Lb` : '---'}</td>
              {/* Duración */}
              <td className="p-2.5 font-mono text-primary font-semibold text-xs">{formatDuration(trip.startTime, trip.endTime)}</td>
              {/* Estado */}
              <td className="p-2.5">
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold",
                  trip.status === 'auto' && "status-badge-auto",
                  trip.status === 'modified' && "status-badge-modified",
                  trip.status === 'validated' && "status-badge-validated"
                )}>
                  {statusIcons[trip.status] && <span className="w-3 h-3"><Bot className="w-3 h-3" /></span>}
                  <span className="uppercase tracking-wider">{trip.status}</span>
                </div>
              </td>
            </>
          );
        }

        return (
          <tr
            key={trip.id}
            className={cn(
              "border-b border-border/10 cursor-pointer transition-all duration-200 leading-normal group",
              isSelected ? "bg-primary/20 border-l-2 border-l-primary" : "hover:bg-muted/30"
            )}
            onClick={() => onSelectTrip(trip.id)}
          >
            {cells}
          </tr>
        );
      });
    }
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full text-xs border-separate border-spacing-0">
          <thead className="bg-muted/40 sticky top-0 z-20">
            <tr className="border-b border-border/50">
              {renderHeaders()}
            </tr>
          </thead>
          <tbody>
            {renderContent()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IntervalSummaryTable;