export interface Language {
  code: string;
  name: string;
  tts_voice: string;
}

export interface TranslationItem {
  id: number;
  timestamp: string;
  source_text: string;
  detected_lang: string;
  source_lang_code: string;
  translated_text: string;
  target_lang: string;
  target_lang_code: string;
  confidence: number;
  audio_duration: number;
  original_audio_filename: string | null;
  translated_audio_filename: string | null;
  is_favorite: boolean;
  duration?: number;
  audio_url?: string | null;
  tts_url?: string | null;
}

export interface DashboardStats {
  summary: {
    totalTranslations: number;
    totalDuration: number;
    averageConfidence: number;
    favoritesCount: number;
    timeSavedMinutes: number;
  };
  charts: {
    popularLanguages: Array<{ language: string; count: number }>;
    popularSources: Array<{ language: string; count: number }>;
    timeline: Array<{ day: string; translations: number }>;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  getAudioStaticUrl(filename: string | null): string | null {
    if (!filename) return null;
    return `${API_BASE_URL}/static/uploads/${filename}`;
  },

  getTTSStaticUrl(filename: string | null): string | null {
    if (!filename) return null;
    return `${API_BASE_URL}/static/tts/${filename}`;
  },

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  },

  async fetchLanguages(): Promise<Language[]> {
    const response = await fetch(`${API_BASE_URL}/api/languages`);
    if (!response.ok) throw new Error('Failed to fetch languages');
    return response.json();
  },

  async translateAudio(
    audioBlob: Blob,
    targetLangCode: string,
    applyNoiseReduction: boolean
  ): Promise<TranslationItem> {
    const formData = new FormData();
    // Use .wav for recording blob, but it will be processed to 16kHz WAV in backend anyway
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('target_lang', targetLangCode);
    formData.append('apply_noise_reduction', String(applyNoiseReduction));

    const response = await fetch(`${API_BASE_URL}/api/translate-audio`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Voice translation failed');
    }

    return response.json();
  },

  async translateText(
    sourceText: string,
    sourceLangCode: string,
    targetLangCode: string
  ): Promise<TranslationItem> {
    const formData = new FormData();
    formData.append('source_text', sourceText);
    formData.append('source_lang', sourceLangCode);
    formData.append('target_lang', targetLangCode);

    const response = await fetch(`${API_BASE_URL}/api/translate-text`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Text translation failed');
    }

    return response.json();
  },

  async getTTSStreamUrl(text: string, targetLangCode: string): Promise<string> {
    const query = new URLSearchParams({ text, target_lang: targetLangCode }).toString();
    return `${API_BASE_URL}/api/tts?${query}`;
  },

  async fetchHistory(search?: string, favoritesOnly?: boolean): Promise<TranslationItem[]> {
    const queryParams: Record<string, string> = {};
    if (search) queryParams.search = search;
    if (favoritesOnly) queryParams.favorites_only = 'true';
    
    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${API_BASE_URL}/api/history${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  },

  async toggleFavorite(itemId: number): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/history/${itemId}/favorite`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to toggle favorite');
    const data = await response.json();
    return data.is_favorite;
  },

  async deleteHistoryItem(itemId: number): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/history/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete history item');
    return response.ok;
  },

  async clearAllHistory(): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/history`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear history');
    return response.ok;
  },

  async fetchStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  }
};
