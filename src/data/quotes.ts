export type QuoteCategory =
  | 'discipline'
  | 'focus'
  | 'consistency'
  | 'learning'
  | 'execution'
  | 'patience'
  | 'resilience'
  | 'craft';

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: QuoteCategory;
}

export interface StoredQuoteState {
  quoteId: string;
  displayedAt: number; // epoch ms
  expiresAt: number;   // epoch ms
  recentQuoteIds?: string[];
}

export const QUOTE_STORAGE_KEY = 'tempo_quote_state';
export const QUOTE_LIFETIME_MS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

/**
 * Curated TEMPO Quote Library
 * Composed of original TEMPO focus principles and timeless public-domain thoughts.
 * Clean, minimal, non-hustle, focused on depth, clarity, and patient discipline.
 */
export const QUOTES_LIBRARY: Quote[] = [
  // --- TEMPO Originals ---
  {
    id: 'tempo-01',
    text: 'Attention is a resource. Spend it deliberately.',
    author: 'TEMPO',
    category: 'focus',
  },
  {
    id: 'tempo-02',
    text: 'Consistency compounds quietly.',
    author: 'TEMPO',
    category: 'consistency',
  },
  {
    id: 'tempo-03',
    text: 'Do the work in front of you.',
    author: 'TEMPO',
    category: 'execution',
  },
  {
    id: 'tempo-04',
    text: 'Clarity begins with one focused hour.',
    author: 'TEMPO',
    category: 'focus',
  },
  {
    id: 'tempo-05',
    text: 'Progress does not need an audience.',
    author: 'TEMPO',
    category: 'discipline',
  },
  {
    id: 'tempo-06',
    text: 'Protect the work that matters.',
    author: 'TEMPO',
    category: 'focus',
  },
  {
    id: 'tempo-07',
    text: 'Start with the task. Let momentum follow.',
    author: 'TEMPO',
    category: 'execution',
  },
  {
    id: 'tempo-08',
    text: 'Discipline is making the next useful action obvious.',
    author: 'TEMPO',
    category: 'discipline',
  },
  {
    id: 'tempo-09',
    text: 'Calm execution outlasts chaotic urgency.',
    author: 'TEMPO',
    category: 'patience',
  },
  {
    id: 'tempo-10',
    text: 'Deep work requires deep stillness.',
    author: 'TEMPO',
    category: 'focus',
  },
  {
    id: 'tempo-11',
    text: 'Measure progress by hours honored, not tasks rushed.',
    author: 'TEMPO',
    category: 'craft',
  },
  {
    id: 'tempo-12',
    text: 'Resist the urge to fragment your attention.',
    author: 'TEMPO',
    category: 'focus',
  },
  {
    id: 'tempo-13',
    text: 'Simplify until only the essential remains.',
    author: 'TEMPO',
    category: 'craft',
  },
  {
    id: 'tempo-14',
    text: 'The boundary of your focus defines the quality of your craft.',
    author: 'TEMPO',
    category: 'craft',
  },
  {
    id: 'tempo-15',
    text: 'Patience turns small efforts into immovable foundations.',
    author: 'TEMPO',
    category: 'patience',
  },
  {
    id: 'tempo-16',
    text: 'A quiet mind solves difficult problems.',
    author: 'TEMPO',
    category: 'learning',
  },
  {
    id: 'tempo-17',
    text: 'Do not hurry through the foundation.',
    author: 'TEMPO',
    category: 'patience',
  },
  {
    id: 'tempo-18',
    text: 'One cycle finished is worth ten contemplated.',
    author: 'TEMPO',
    category: 'execution',
  },
  {
    id: 'tempo-19',
    text: 'The best cadence is the one you can repeat tomorrow.',
    author: 'TEMPO',
    category: 'consistency',
  },
  {
    id: 'tempo-20',
    text: 'Every distraction rejected is focus preserved.',
    author: 'TEMPO',
    category: 'focus',
  },

  // --- Classic / Public Domain ---
  {
    id: 'classic-01',
    text: 'You have power over your mind — not outside events.',
    author: 'Marcus Aurelius',
    category: 'discipline',
  },
  {
    id: 'classic-02',
    text: 'It is not that we have so little time, but that we lose so much.',
    author: 'Seneca',
    category: 'focus',
  },
  {
    id: 'classic-03',
    text: 'Simplicity is the ultimate sophistication.',
    author: 'Leonardo da Vinci',
    category: 'craft',
  },
  {
    id: 'classic-04',
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Aristotle',
    category: 'consistency',
  },
  {
    id: 'classic-05',
    text: 'Nature does not hurry, yet everything is accomplished.',
    author: 'Lao Tzu',
    category: 'patience',
  },
  {
    id: 'classic-06',
    text: 'No great thing is created suddenly.',
    author: 'Epictetus',
    category: 'patience',
  },
  {
    id: 'classic-07',
    text: 'Concentrate every minute on doing what is in front of you with precise and genuine seriousness.',
    author: 'Marcus Aurelius',
    category: 'focus',
  },
  {
    id: 'classic-08',
    text: 'Well begun is half done.',
    author: 'Aristotle',
    category: 'execution',
  },
  {
    id: 'classic-09',
    text: 'Adopt the pace of nature: her secret is patience.',
    author: 'Ralph Waldo Emerson',
    category: 'patience',
  },
  {
    id: 'classic-10',
    text: 'The impediment to action advances action. What stands in the way becomes the way.',
    author: 'Marcus Aurelius',
    category: 'resilience',
  },
  {
    id: 'classic-11',
    text: 'First say to yourself what you would be; and then do what you have to do.',
    author: 'Epictetus',
    category: 'discipline',
  },
  {
    id: 'classic-12',
    text: 'Difficulties strengthen the mind, as labor does the body.',
    author: 'Seneca',
    category: 'resilience',
  },
  {
    id: 'classic-13',
    text: 'Small disciplines repeated every day lead to great achievements gained slowly over time.',
    author: 'Seneca',
    category: 'consistency',
  },
  {
    id: 'classic-14',
    text: 'Do not spoil what you have by desiring what you have not.',
    author: 'Epicurus',
    category: 'learning',
  },
  {
    id: 'classic-15',
    text: 'Silence is a source of great strength.',
    author: 'Lao Tzu',
    category: 'focus',
  },
  {
    id: 'classic-16',
    text: 'He who conquers himself is the mightiest warrior.',
    author: 'Confucius',
    category: 'discipline',
  },
  {
    id: 'classic-17',
    text: 'Action will remove the doubt that theory cannot solve.',
    author: 'Petronius',
    category: 'execution',
  },
  {
    id: 'classic-18',
    text: 'It does not matter how slowly you go as long as you do not stop.',
    author: 'Confucius',
    category: 'consistency',
  },
];
