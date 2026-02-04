import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-md border-border/50 bg-muted/30 hover:bg-muted/50 transition-all duration-300 group"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
        >
            {theme === 'dark' ? (
                <Sun className="h-[1.1rem] w-[1.1rem] text-orange-400 group-hover:rotate-45 transition-transform" />
            ) : (
                <Moon className="h-[1.1rem] w-[1.1rem] text-indigo-600 group-hover:-rotate-12 transition-transform" />
            )}
        </Button>
    );
}
