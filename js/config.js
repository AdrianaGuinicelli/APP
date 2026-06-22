// Supabase init + costanti globali di configurazione

const SUPABASE_URL = 'https://sqevigimxneucauwljov.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

if (!window._supabaseClient) {
  window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
var supabase = window._supabaseClient;

const ALL_BUTTONS = [
  { id: 'home',         icon: '🏠', label: 'Home',      page: 'home' },
  { id: 'search',       icon: '🔍', label: 'Cerca',     page: 'search' },
  { id: 'create',       icon: '➕', label: 'Crea',      page: 'create', isPlus: true },
  { id: 'chatList',     icon: '💬', label: 'Chat',      page: 'chatList',     badge: 'chat' },
  { id: 'aiAssistant',  icon: '🤖', label: 'AI',        page: 'aiAssistant' },
  { id: 'notifications',icon: '🔔', label: 'Notifiche', page: 'notifications', badge: 'notif' },
  { id: 'savedEvents',  icon: '🔖', label: 'Preferiti', page: 'savedEvents' },
  { id: 'matchPeople',  icon: '🤝', label: 'Match',     page: 'matchPeople' },
];

const DEFAULT_BOTTOM = ['home', 'search', 'create', 'chatList', 'aiAssistant'];
const DEFAULT_HEADER = ['notifications', 'savedEvents'];

const PAGE_TITLES = {
  home: '',
  search: 'Cerca Eventi',
  create: 'Crea Attività',
  chatList: 'Chat',
  profile: 'Profilo',
  onboarding: 'I tuoi interessi',
  login: 'Accedi',
  register: 'Registrati',
  eventDetail: 'Dettaglio Evento',
  eventGroup: 'Gruppo Evento',
  aiAssistant: 'AI Assistant',
  matchPeople: 'Match Persone',
  feedback: 'Feedback',
  notifications: 'Notifiche',
  admin: 'Admin Dashboard',
  report: 'Segnala',
  savedEvents: 'Preferiti',
  settings: 'Impostazioni',
  myevents: 'I miei eventi'
};

const allInterests = [
  { icon: '🎵', label: 'Musica' },
  { icon: '🎨', label: 'Arte' },
  { icon: '⚽', label: 'Sport' },
  { icon: '🥾', label: 'Trekking' },
  { icon: '🎬', label: 'Cinema' },
  { icon: '🍕', label: 'Cibo' },
  { icon: '✈️', label: 'Viaggi' },
  { icon: '💻', label: 'Tecnologia' },
  { icon: '🎭', label: 'Teatro' },
  { icon: '📚', label: 'Libri' },
  { icon: '🧘', label: 'Benessere' },
  { icon: '🎉', label: 'Altro' }
];

const emojiOpts = ['🎷','🖼️','🍹','⚽','🥾','🏔️','🚣','🎸','🎭','🎬','🍕','✈️','💻','🧘','🎉','🎨','🏋️','🎤'];

const aiRules = [
  { kw: ['jazz','musica','concerto'],     reply: '🎷 Ho trovato eventi musicali!',       suggest: 'Musica' },
  { kw: ['trekking','montagna','escursione'], reply: '🥾 Ci sono uscite trekking!',       suggest: 'Trekking' },
  { kw: ['arte','mostra','museo'],        reply: '🖼️ Ho trovato mostre artistiche!',      suggest: 'Arte' },
  { kw: ['aperitivo','cibo','mangiare'],  reply: '🍹 Ci sono eventi food!',               suggest: 'Food' },
  { kw: ['sport','calcio','kayak'],       reply: '⚽ Ho trovato eventi sportivi!',         suggest: 'Sport' },
  { kw: ['persone','conoscere','match'],  reply: '🤝 Vuoi vedere le persone compatibili con te?' },
  { kw: ['vicino','zona','distanza'],     reply: '📍 Attiva la posizione per eventi vicini a te!' },
];
