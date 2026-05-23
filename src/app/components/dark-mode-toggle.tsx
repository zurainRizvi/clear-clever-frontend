import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-card hover:bg-accent transition-all duration-300 border border-border shadow-lg hover:shadow-xl"
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
      ) : (
        <Moon className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
      )}
    </button>
  );
}
