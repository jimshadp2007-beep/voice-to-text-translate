import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, Star, Globe } from 'lucide-react';
import type { Language } from '../utils/api';

interface LanguageDropdownProps {
  languages: Language[];
  selectedCode: string;
  onSelect: (code: string) => void;
  label?: string;
  excludeCode?: string;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  languages,
  selectedCode,
  onSelect,
  label = "Select Language",
  excludeCode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorite_languages');
    return saved ? JSON.parse(saved) : ['mal_Mlym', 'eng_Latn', 'hin_Deva']; // Default favorites
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFavorite = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(code)
      ? favorites.filter(f => f !== code)
      : [...favorites, code];
    setFavorites(updated);
    localStorage.setItem('favorite_languages', JSON.stringify(updated));
  };

  const selectedLanguage = languages.find(l => l.code === selectedCode);
  
  // Filter and sort languages (Favorites first, then others, filtering search and excluded code)
  const filteredLanguages = languages
    .filter(lang => {
      if (excludeCode && lang.code === excludeCode) return false;
      return lang.name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const aFav = favorites.includes(a.code) ? 1 : 0;
      const bFav = favorites.includes(b.code) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav; // Favorites first
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      {label && (
        <span className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
          {label}
        </span>
      )}
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm hover:border-primary/50 dark:hover:border-primary/50 text-slate-800 dark:text-slate-100 transition-all font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span>{selectedLanguage ? selectedLanguage.name : 'Auto Detect'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-lg dark:shadow-slate-950/50 overflow-hidden backdrop-blur-xl transition-all duration-200 transform origin-top scale-100">
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* List of Languages */}
          <div className="max-h-60 overflow-y-auto py-1.5 scrollbar-thin">
            {filteredLanguages.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center font-medium">
                No languages found
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = lang.code === selectedCode;
                const isFav = favorites.includes(lang.code);
                
                return (
                  <div
                    key={lang.code}
                    onClick={() => {
                      onSelect(lang.code);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary/10 text-primary dark:text-primary-light font-semibold' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isSelected ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <span className="w-4" /> // spacing spacer
                      )}
                      <span>{lang.name}</span>
                      {lang.code === 'mal_Mlym' && (
                        <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 px-1.5 py-0.5 rounded-full font-bold">
                          Mandatory
                        </span>
                      )}
                    </div>

                    {/* Star Favorite Toggle */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(lang.code, e)}
                      className={`p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors ${
                        isFav 
                          ? 'text-amber-500' 
                          : 'text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
