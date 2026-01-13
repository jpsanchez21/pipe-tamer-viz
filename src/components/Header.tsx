import { Activity, Droplets } from 'lucide-react';

const Header = () => {
  return (
    <header className="glass-panel border-b border-border/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 border border-primary/30">
            <Droplets className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">PipeTrip Analyzer</h1>
            <p className="text-xs text-muted-foreground">Visual Labeling Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-status-validated/10 border border-status-validated/30">
            <Activity className="w-4 h-4 text-status-validated" />
            <span className="text-xs font-medium text-status-validated">System Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
