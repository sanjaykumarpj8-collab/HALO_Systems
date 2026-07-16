export const HALO_CONFIG = {
  APP_NAME: 'HALO',
  APP_TAGLINE: 'Stadium Operations System',
  
  // Roles
  ROLES: {
    ADMIN: 'admin',
    STAFF: 'staff', 
    FAN: 'fan',
  } as const,

  // Worker types
  WORKER_TYPES: ['janitor', 'medic', 'security'] as const,
  
  // Severity levels
  SEVERITY_LABELS: {
    1: 'Critical',
    2: 'High',
    3: 'Medium',
    4: 'Low',
    5: 'Trivial',
  } as const,

  SEVERITY_COLORS: {
    1: '#f44336',
    2: '#ff9800',
    3: '#ffeb3b',
    4: '#4caf50',
    5: '#9e9e9e',
  } as const,

  // Status colors (from wireframes)
  STATUS_COLORS: {
    'on-duty': '#4caf50',
    'completed': '#2196f3',
    'off-duty': '#ff9800',
    'retired': '#f44336',
  } as const,

  // Supported languages (FIFA defaults)
  LANGUAGES: [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'ar', name: 'العربية' },
    { code: 'pt', name: 'Português' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'hi', name: 'हिन्दी' },
  ] as const,

  // Dashboard stat card labels
  DASHBOARD_CARDS: [
    { key: 'active_workers', label: 'Active Workers', icon: '👷' },
    { key: 'incident_workers', label: 'Incident Workers', icon: '🚨' },
    { key: 'total_problems', label: 'Total Problems', icon: '📋' },
    { key: 'problem_solved', label: 'Problem Solved', icon: '✅' },
    { key: 'efficiency', label: 'Efficiency', icon: '📊', suffix: '%' },
  ] as const,

  // AI pipeline thresholds
  AI: {
    CONFIDENCE_THRESHOLD: 0.7,
    DUPLICATE_TIME_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
    ESCALATION_THRESHOLD: 3, // incidents in same section
    MAX_DISPATCH_CANDIDATES: 3,
  } as const,
} as const;
