import { Activity, Droplets } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const Header = () => {
  return (
    <header className="glass-panel border-b border-border/40 px-4 py-1.5 md:py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-primary/20 border border-primary/30">
            <Droplets className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold tracking-tight leading-none">TRIPVIEW – ANALÍTICA DE VIAJES</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
