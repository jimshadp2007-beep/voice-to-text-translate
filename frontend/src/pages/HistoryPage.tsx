import React, { useEffect, useState, useRef } from 'react';
import { 
  Search, Trash2, Star, Play, Pause, ChevronDown, 
  ChevronUp, Calendar, Clock, Award, Download, Copy,
  Check, FileText, Globe, Volume2, Archive
} from 'lucide-react';
import { api } from '../utils/api';
import type { TranslationItem } from '../utils/api';

interface HistoryPageProps {
  history: TranslationItem[];
  setHistory: React.Dispatch<React.SetStateAction<TranslationItem[]>>;
  onDeleteHistoryItem: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onClearHistory: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  setHistory,
  onDeleteHistoryItem,
  onToggleFavorite,
  onClearHistory
}) => {
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  
  // Custom audio playback state
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);

  // Filter history locally for instantaneous responsiveness
  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      item.source_text.toLowerCase().includes(search.toLowerCase()) ||
      item.translated_text.toLowerCase().includes(search.toLowerCase()) ||
      item.detected_lang.toLowerCase().includes(search.toLowerCase()) ||
      item.target_lang.toLowerCase().includes(search.toLowerCase());
      
    if (favoritesOnly) {
      return matchesSearch && item.is_favorite;
    }
    return matchesSearch;
  });

  const toggleExpand = (id: number) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const handlePlayAudio = (item: TranslationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (playingId === item.id) {
      historyAudioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Determine TTS audio url
    let url = "";
    if (item.translated_audio_filename) {
      url = api.getTTSStaticUrl(item.translated_audio_filename) || "";
    }
    
    if (!url) {
      // Stream it
      api.getTTSStreamUrl(item.translated_text, item.target_lang_code)
        .then(streamUrl => {
          playAudioUrl(streamUrl, item.id);
        });
    } else {
      playAudioUrl(url, item.id);
    }
  };

  const playAudioUrl = (url: string, id: number) => {
    if (historyAudioRef.current) {
      historyAudioRef.current.src = url;
      historyAudioRef.current.play()
        .then(() => setPlayingId(id))
        .catch(err => console.error("Playback error:", err));
    }
  };

  const copyText = (text: string, id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
      
      {/* Hidden audio tag for history playback */}
      <audio 
        ref={historyAudioRef} 
        onEnded={() => setPlayingId(null)} 
        className="hidden" 
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Translation Logs
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
            Manage your historical voice translations and bookmarks
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              <a
                href={api.getExportHistoryUrl('csv')}
                download
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                title="Download History as CSV spreadsheet"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Export CSV</span>
              </a>
              <a
                href={api.getExportHistoryUrl('json')}
                download
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                title="Download History as JSON data"
              >
                <Archive className="w-3.5 h-3.5 text-secondary" />
                <span>JSON</span>
              </a>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear all translation history? This action is permanent.")) {
                    onClearHistory();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-danger bg-danger/10 hover:bg-danger/15 rounded-xl text-xs font-bold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </>
          )}
        </div>
      </div>


      {/* Filters bar */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-80 flex items-center bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-2.5">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm border-none text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Favorite Filter Toggle */}
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl border text-sm font-bold transition-all w-full sm:w-auto justify-center ${
            favoritesOnly 
              ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10' 
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          <Star className={`w-4 h-4 ${favoritesOnly ? 'fill-current' : ''}`} />
          <span>{favoritesOnly ? 'Showing Bookmarks' : 'Filter Bookmarks'}</span>
        </button>

      </div>

      {/* History Items list */}
      <div className="flex flex-col gap-4">
        {filteredHistory.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shadow-sm">
              <Archive className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">No logs found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold max-w-xs leading-normal">
              {search || favoritesOnly ? 'Try adjusting your search filters or clearing tags.' : 'Perform translations in the Translator tab to register historical entries.'}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isExpanded = expandedItem === item.id;
            const formattedDate = new Date(item.timestamp).toLocaleDateString(undefined, { 
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });

            return (
              <div 
                key={item.id}
                onClick={() => toggleExpand(item.id)}
                className={`glass-panel rounded-3xl border transition-all cursor-pointer shadow-sm ${
                  isExpanded 
                    ? 'border-primary/40 dark:border-primary/40 ring-1 ring-primary/10' 
                    : 'border-slate-200/50 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Collapsed Header */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-8">
                    
                    {/* Date stamp */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-450 dark:text-slate-500 shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formattedDate}</span>
                    </div>

                    {/* Language flow badges */}
                    <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{item.detected_lang}</span>
                      <span className="text-primary font-extrabold">&rarr;</span>
                      <span className="text-primary dark:text-primary-light">{item.target_lang}</span>
                    </div>

                    {/* Preview of text */}
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate max-w-md hidden md:block">
                      {item.source_text}
                    </p>

                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1">
                    {/* TTS speaker play */}
                    <button
                      type="button"
                      onClick={(e) => handlePlayAudio(item, e)}
                      className={`p-2 rounded-xl transition-all ${
                        playingId === item.id 
                          ? 'bg-primary text-white' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-805 text-slate-400 hover:text-slate-750 dark:hover:text-white'
                      }`}
                      title="Listen Speech"
                    >
                      {playingId === item.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>

                    {/* Star bookmark */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-805 transition-all ${
                        item.is_favorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500 dark:text-slate-600'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-current' : ''}`} />
                    </button>

                    {/* Delete item */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Delete this translation entry?")) {
                          onDeleteHistoryItem(item.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-300 hover:text-danger dark:text-slate-600 dark:hover:text-danger hover:bg-slate-100 dark:hover:bg-slate-805 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Expand indicator */}
                    <div className="p-1 text-slate-400 ml-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/40 grid grid-cols-1 md:grid-cols-2 gap-5 cursor-default bg-slate-50/20 dark:bg-slate-900/10 rounded-b-3xl">
                    
                    {/* Source details */}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        <span>Original Text ({item.detected_lang})</span>
                        {item.audio_duration > 0 && <span>Duration: {item.audio_duration}s</span>}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-850 p-4.5 rounded-2xl border border-slate-200/30 dark:border-slate-800/50 leading-relaxed whitespace-pre-wrap">
                        {item.source_text}
                      </p>
                    </div>

                    {/* Target details */}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        <span>Translated Text ({item.target_lang})</span>
                        <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-850 p-4.5 rounded-2xl border border-slate-200/30 dark:border-slate-800/50 leading-relaxed whitespace-pre-wrap">
                        {item.translated_text}
                      </p>
                    </div>

                    {/* Mini toolbar */}
                    <div className="md:col-span-2 flex justify-end gap-2.5 mt-2">
                      {item.translated_audio_filename && (
                        <a
                          href={api.getTTSStaticUrl(item.translated_audio_filename) || '#'}
                          download={`translation_${item.id}.mp3`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors"
                          title="Download synthesized audio"
                        >
                          <Download className="w-3.5 h-3.5 text-secondary" />
                          <span>Download Audio</span>
                        </a>
                      )}
                      {item.original_audio_filename && (
                        <a
                          href={api.getAudioStaticUrl(item.original_audio_filename) || '#'}
                          download={`speech_${item.id}.wav`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors"
                          title="Download original voice recording"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-primary" />
                          <span>Voice WAV</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={(e) => copyText(item.translated_text, item.id, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === item.id ? 'Copied' : 'Copy Translation'}</span>
                      </button>
                    </div>


                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
