export interface Scene {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
}

// Static phrase from JSON
export interface StaticPhrase {
  id: string;
  sceneId: string;
  targetText: string;
  targetLang: string;
  nativeText: string;
  nativeLang: string;
  note?: string;
}

// Saved phrase in database
export interface SavedPhrase {
  id: string;
  nativeText: string;
  targetText: string;
  nativeLang: string;
  targetLang: string;
  audioBase64?: string;
  createdAt: string;
}

// Alias for backward compatibility
export type Phrase = StaticPhrase;
