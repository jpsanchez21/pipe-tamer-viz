import { useState } from 'react';
import { Calendar, Clock, Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TimeWindowSelectorProps {
  onRunAnalysis: (startDate: Date, endDate: Date) => void;
}

const TimeWindowSelector = ({ onRunAnalysis }: TimeWindowSelectorProps) => {
  const [startDate, setStartDate] = useState('2024-01-15');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('2024-01-15');
  const [endTime, setEndTime] = useState('20:00');

  const handleRunAnalysis = () => {
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    onRunAnalysis(start, end);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
      <Card className="w-full max-w-2xl glass-panel animate-fade-in">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Pipe Trip Analysis
          </CardTitle>
          <CardDescription className="text-base">
            Select a time window to detect and analyze pipe trips
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Time */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Start
              </Label>
              <div className="space-y-3">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 industrial-input font-mono"
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-10 industrial-input font-mono"
                  />
                </div>
              </div>
            </div>

            {/* End Time */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                End
              </Label>
              <div className="space-y-3">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 industrial-input font-mono"
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="pl-10 industrial-input font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Automated analytics will detect pipe trips within the selected time window. 
              Each detected trip will be labeled with an initial classification that you can 
              review and adjust.
            </p>
          </div>

          {/* Run Button */}
          <Button 
            onClick={handleRunAnalysis}
            variant="industrial"
            size="xl"
            className="w-full"
          >
            <Play className="w-5 h-5" />
            Run Analysis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeWindowSelector;
