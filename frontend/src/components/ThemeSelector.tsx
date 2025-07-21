import React, { useState } from "react";
import { Palette } from "lucide-react";

const THEMES = [
  {
    name: "Dark",
    class: "theme-dark",
    colors: ["bg-background", "bg-light-black", "bg-purple-500"],
  },
  {
    name: "Pink",
    class: "theme-pink",
    colors: ["bg-pink-300", "bg-pink-500", "bg-pink-900"],
  }
];

const ThemeSelector = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  React.useEffect(() => {
    // On mount, set theme from localStorage or system preference
    const saved = localStorage.getItem("theme");
    if (saved && THEMES.some(t => t.class === saved)) {
      document.documentElement.classList.remove(...THEMES.map(t => t.class));
      document.documentElement.classList.add(saved);
      setSelected(saved);
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const defaultTheme = prefersDark ? "theme-dark" : THEMES[0].class;
      document.documentElement.classList.add(defaultTheme);
      setSelected(defaultTheme);
    }
  }, []);

  const setTheme = (themeClass: string) => {
    document.documentElement.classList.remove(...THEMES.map(t => t.class));
    document.documentElement.classList.add(themeClass);
    setSelected(themeClass);
    setOpen(false);
    localStorage.setItem("theme", themeClass);
  };

  return (
    <div className="relative">
      <button
        className="p-2 rounded-full hover:bg-light-black transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label="Select theme"
      >
        <Palette className="w-5 h-5 searchbar-icon" />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-48 bg-dark-black border border-zinc-700 rounded-xl shadow-lg z-50 py-2">
          {THEMES.map((theme) => (
            <button
              key={theme.class}
              className={`flex items-center w-full px-4 py-2 gap-3 hover:bg-light-black transition-colors ${selected === theme.class ? "bg-light-black" : ""}`}
              onClick={() => setTheme(theme.class)}
            >
              <Palette className="w-4 h-4 mr-2 searchbar-icon" />
              <span className="flex-1 text-left">{theme.name}</span>
              <span className="flex gap-1">
                {theme.colors.map((c, i) => (
                  <span key={i} className={`inline-block w-3 h-3 rounded-full border border-zinc-700 ${c}`}></span>
                ))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector; 