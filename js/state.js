// Tutte le variabili globali di stato dell'app
// Modificare solo qui, mai dichiarare var/let globali negli altri file

var currentUser       = null;
var isLoggedIn        = false;
var isAdmin           = false;

var navHistory        = [];
var currentPage       = '';
var currentEventId    = null;

var selectedStars     = 0;
var reportSelected    = '';
var userInterests     = [];

var userLocation      = null;
var activeFilters     = { category: '', maxDistance: 200, gender: '', organizerGender: '' };

var savedEvents       = [];
var blockedUsers      = [];
var activeTab         = 'chat';

var events            = [];
var selectedEmoji     = '🎉';
var thumbValue        = null;
var repeatValue       = null;

var notifications = JSON.parse(localStorage.getItem('ec_notifications') || 'null') || [
  { id: 1, text: 'Benvenuto su EventConnect! 🎉', time: 'ora', read: false, icon: '🎉' }
];

var isPremium            = false;
var profileDropdownOpen  = false;
var pendingEmailVerify   = false;
var selectedGender       = '';

var geoDebounceTimer  = null; // usato in utils.js per Nominatim
