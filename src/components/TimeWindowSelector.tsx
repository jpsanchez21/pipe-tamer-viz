import { useState } from 'react';
import { Calendar, Clock, Play, Info, TowerControl as Tower, Search, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Intervention } from '@/types/trip';
import { generateMockInterventions } from '@/utils/mockData';
import { cn } from '@/lib/utils';

interface TimeWindowSelectorProps {
  onRunAnalysis: (startDate: Date, endDate: Date, rig: string, intervention: Intervention) => void;
}

const TimeWindowSelector = ({ onRunAnalysis }: TimeWindowSelectorProps) => {
  const [startDate, setStartDate] = useState('2024-01-15');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('2024-01-15');
  const [endTime, setEndTime] = useState('20:00');
  const [rig, setRig] = useState('Rig-Alpha');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuery = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    const mockResults = generateMockInterventions(start, end);

    setInterventions(mockResults);
    setIsLoading(false);
    setIsDialogOpen(true);
  };

  const handleDirectDateQuery = () => {
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);

    // Create a generic intervention for direct date query
    const directIntervention: Intervention = {
      id: 'direct-query',
      wellName: 'Consulta por Fecha',
      operationType: 'Análisis Temporal',
      targetDepth: 'N/A',
      status: 'active',
      startDate: start,
      endDate: end
    };

    onRunAnalysis(start, end, rig, directIntervention);
  };

  const handleSelectIntervention = (int: Intervention) => {
    setSelectedIntervention(int);
    setIsDialogOpen(false);
  };

  const handleRunAnalysis = () => {
    if (selectedIntervention) {
      const start = new Date(`${startDate}T${startTime}:00`);
      const end = new Date(`${endDate}T${endTime}:00`);
      onRunAnalysis(start, end, rig, selectedIntervention);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 md:p-6 py-12">
      <div className="w-full max-w-xl space-y-6 animate-fade-in">
        <Card className="glass-panel border-border/40 shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-4 border-b border-border/10 bg-muted/5">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <Tower className="w-6 h-6 text-primary shadow-sm" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
              Consola de Operaciones
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground/80">
              Control técnico de intervenciones y pozos
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Rig Identification */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Identificación de Torre</Label>
              <div className="relative group">
                <Tower className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary brightness-125 z-10" />
                <Input
                  value={rig}
                  onChange={(e) => setRig(e.target.value)}
                  placeholder="Nombre de la torre"
                  className="pl-10 industrial-input h-11 text-base font-mono uppercase focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Time and Date Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4 pt-2 border-t md:border-t-0 border-border/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">Inicio Intervención</p>
                <div className="relative group">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary brightness-125 z-10" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 industrial-input h-10 text-sm font-mono"
                  />
                </div>
                <div className="relative group">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary brightness-125 z-10" />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-10 industrial-input h-10 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t md:border-t-0 md:border-l border-border/10 md:pl-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">Fin Intervención</p>
                <div className="relative group">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary brightness-125 z-10" />
                  <Input
                    type="date"
                    value={selectedIntervention?.status === 'active' ? '' : endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder={selectedIntervention?.status === 'active' ? '--' : ''}
                    disabled={selectedIntervention?.status === 'active'}
                    className="pl-10 industrial-input h-10 text-sm font-mono"
                  />
                </div>
                <div className="relative group">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary brightness-125 z-10" />
                  <Input
                    type="time"
                    value={selectedIntervention?.status === 'active' ? '' : endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder={selectedIntervention?.status === 'active' ? '--' : ''}
                    disabled={selectedIntervention?.status === 'active'}
                    className="pl-10 industrial-input h-10 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Selection Summary (Inline) */}
            {selectedIntervention && (
              <div className="p-4 rounded-lg bg-primary/5 border-l-4 border-primary flex items-center justify-between animate-slide-in-fast">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-primary/70">Intervención Seleccionada</p>
                    <p className="text-sm font-bold tracking-tight">{selectedIntervention.wellName}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  className="h-8 px-2 text-[10px] font-bold uppercase tracking-tighter hover:bg-primary/10"
                >
                  Cambiar
                </Button>
              </div>
            )}

            {/* Primary Actions */}
            <div className="space-y-3 pt-2">
              {!selectedIntervention ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleQuery}
                      disabled={isLoading}
                      size="xl"
                      className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.15em] shadow-xl relative overflow-hidden group">
                      {isLoading ? (
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      )}
                      <span className="text-xs">Consultar<br />Intervenciones</span>
                    </Button>

                    <Button
                      onClick={handleDirectDateQuery}
                      disabled={isLoading}
                      size="xl"
                      className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.15em] shadow-xl relative overflow-hidden group">
                      <Calendar className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs">Consultar<br />por Fechas</span>
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  onClick={handleRunAnalysis}
                  size="xl"
                  variant="industrial"
                  className="w-full h-16 text-lg font-black uppercase tracking-[0.3em] shadow-2xl relative overflow-hidden animate-bounce-subtle">
                  <Play className="w-6 h-6 mr-3 fill-current" />
                  Iniciar Análisis
                </Button>
              )}
            </div>

            {!selectedIntervention && !isLoading && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <Info className="w-4 h-4 text-orange-500 mt-0.5" />
                <div className="text-[10px] text-muted-foreground italic leading-relaxed space-y-1">
                  <p>
                    <strong>Consultar Intervenciones:</strong> Busca intervenciones activas en el rango seleccionado.
                  </p>
                  <p>
                    <strong>Consultar por Fechas:</strong> Analiza todos los viajes en el periodo sin filtrar por intervención.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Intervention Multi-Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl glass-panel border-primary/20 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-border/10">
            <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
              <Search className="w-5 h-5" />
              Intervenciones Disponibles
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-tighter opacity-70">
              Seleccione el pozo para el rango solicitado
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-2.5 py-4 max-h-[60vh] overflow-y-auto pr-1">
            {interventions.length > 0 ? interventions.map((int) => (
              <div
                key={int.id}
                onClick={() => handleSelectIntervention(int)}
                className="group relative flex items-center justify-between p-4 rounded-lg border border-border/30 bg-card/30 hover:border-primary/30 hover:bg-primary/3 transition-all cursor-pointer hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-background border border-border/30 flex items-center justify-center group-hover:border-primary/40 transition-all">
                    <Tower className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight uppercase">{int.wellName}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.15em]",
                  int.status === 'active'
                    ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30"
                    : "bg-muted text-muted-foreground border border-border/40"
                )}>
                  {int.status === 'active' ? 'ACTIVA' : 'INACTIVA'}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <Search className="w-12 h-12 text-muted-foreground/20 animate-pulse" />
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">No se encontraron registros activos</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeWindowSelector;
