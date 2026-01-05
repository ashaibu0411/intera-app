/**
 * Content Moderation System
 *
 * Provides multiple layers of protection to ensure a clean, family-friendly app:
 * 1. Text filtering for inappropriate words/phrases
 * 2. Content reporting system
 * 3. User blocking/muting
 * 4. Automatic content flagging
 * 5. Community guidelines enforcement
 */

// ============================================
// BANNED CONTENT PATTERNS
// ============================================

// Explicit/sexual terms (partial list - expand as needed)
const SEXUAL_TERMS = [
  'sex', 'porn', 'xxx', 'nude', 'naked', 'nsfw', 'onlyfans', 'hookup',
  'escort', 'prostitut', 'stripper', 'erotic', 'fetish', 'explicit',
  'adult content', 'sexual', 'intimat', 'provocative'
];

// Violence-related terms
const VIOLENCE_TERMS = [
  'kill', 'murder', 'suicide', 'self-harm', 'attack', 'assault',
  'weapon', 'gun', 'shoot', 'stab', 'bomb', 'terroris', 'gore',
  'blood', 'death threat', 'hurt you', 'beat you'
];

// Hate speech patterns
const HATE_TERMS = [
  'racist', 'racism', 'nazi', 'supremacist', 'hate crime', 'slur',
  'discrimination', 'bigot', 'xenophob'
];

// Drugs/illegal substances
const DRUG_TERMS = [
  'cocaine', 'heroin', 'meth', 'drug deal', 'marijuana', 'weed',
  'pills', 'narcotic', 'overdose', 'illegal substance'
];

// Scam/fraud patterns
const SCAM_TERMS = [
  'send money', 'wire transfer', 'western union', 'gift card scam',
  'nigerian prince', 'lottery winner', 'inheritance', 'bank detail',
  'social security', 'password', 'credit card number', 'crypto invest'
];

// ============================================
// CONTENT TYPES
// ============================================

export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'live_stream';
export type ViolationType = 'sexual' | 'violence' | 'hate_speech' | 'drugs' | 'scam' | 'spam' | 'harassment' | 'other';
export type ModerationAction = 'approved' | 'flagged' | 'blocked' | 'pending_review';

export interface ModerationResult {
  action: ModerationAction;
  violations: ViolationType[];
  confidence: number; // 0-1
  message: string;
  flaggedTerms?: string[];
}

export interface ContentReport {
  id: string;
  contentId: string;
  contentType: ContentType;
  reporterId: string;
  reporterName: string;
  reason: ViolationType;
  description: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  actionTaken?: string;
}

export interface UserViolation {
  id: string;
  odooUserId: string;
  contentId: string;
  violationType: ViolationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'warning' | 'content_removed' | 'temporary_ban' | 'permanent_ban';
  createdAt: string;
  expiresAt?: string;
}

export interface BlockedUser {
  id: string;
  odooUserId: string;
  blockedUserId: string;
  blockedUserName: string;
  reason?: string;
  createdAt: string;
}

// ============================================
// TEXT MODERATION
// ============================================

/**
 * Check text content for violations
 */
export function moderateText(text: string): ModerationResult {
  const lowerText = text.toLowerCase();
  const violations: ViolationType[] = [];
  const flaggedTerms: string[] = [];
  let highestSeverity = 0;

  // Check sexual content (highest priority)
  for (const term of SEXUAL_TERMS) {
    if (lowerText.includes(term)) {
      violations.push('sexual');
      flaggedTerms.push(term);
      highestSeverity = Math.max(highestSeverity, 1);
      break;
    }
  }

  // Check violence
  for (const term of VIOLENCE_TERMS) {
    if (lowerText.includes(term)) {
      violations.push('violence');
      flaggedTerms.push(term);
      highestSeverity = Math.max(highestSeverity, 0.9);
      break;
    }
  }

  // Check hate speech
  for (const term of HATE_TERMS) {
    if (lowerText.includes(term)) {
      violations.push('hate_speech');
      flaggedTerms.push(term);
      highestSeverity = Math.max(highestSeverity, 0.95);
      break;
    }
  }

  // Check drugs
  for (const term of DRUG_TERMS) {
    if (lowerText.includes(term)) {
      violations.push('drugs');
      flaggedTerms.push(term);
      highestSeverity = Math.max(highestSeverity, 0.8);
      break;
    }
  }

  // Check scams
  for (const term of SCAM_TERMS) {
    if (lowerText.includes(term)) {
      violations.push('scam');
      flaggedTerms.push(term);
      highestSeverity = Math.max(highestSeverity, 0.7);
      break;
    }
  }

  // Determine action based on violations
  if (violations.length === 0) {
    return {
      action: 'approved',
      violations: [],
      confidence: 1,
      message: 'Content approved'
    };
  }

  // Sexual/violence content is immediately blocked
  if (violations.includes('sexual') || violations.includes('violence') || violations.includes('hate_speech')) {
    return {
      action: 'blocked',
      violations,
      confidence: highestSeverity,
      message: 'This content violates our community guidelines and cannot be posted.',
      flaggedTerms
    };
  }

  // Other violations are flagged for review
  return {
    action: 'flagged',
    violations,
    confidence: highestSeverity,
    message: 'This content has been flagged for review.',
    flaggedTerms
  };
}

/**
 * Clean/censor text by replacing flagged terms with asterisks
 */
export function censorText(text: string): string {
  let result = text;
  const allTerms = [...SEXUAL_TERMS, ...VIOLENCE_TERMS, ...HATE_TERMS];

  for (const term of allTerms) {
    const regex = new RegExp(term, 'gi');
    result = result.replace(regex, '*'.repeat(term.length));
  }

  return result;
}

// ============================================
// VIDEO/STREAM CONTENT POLICIES
// ============================================

export interface StreamContentPolicy {
  allowedCategories: string[];
  bannedCategories: string[];
  maxDuration: number; // seconds
  requiresAgeVerification: boolean;
  autoModeration: boolean;
}

export const DEFAULT_STREAM_POLICY: StreamContentPolicy = {
  allowedCategories: [
    'entertainment', 'music', 'comedy', 'dance', 'talent', 'chat',
    'cooking', 'education', 'faith', 'business', 'sports', 'gaming',
    'art', 'culture', 'community', 'wellness'
  ],
  bannedCategories: [
    'adult', 'nsfw', '18+', 'explicit', 'gambling', 'weapons',
    'drugs', 'violence', 'hate'
  ],
  maxDuration: 14400, // 4 hours max for streams
  requiresAgeVerification: false,
  autoModeration: true
};

/**
 * Validate stream/video category
 */
export function validateStreamCategory(category: string): boolean {
  const lowerCategory = category.toLowerCase();

  // Check if category is banned
  if (DEFAULT_STREAM_POLICY.bannedCategories.some(banned =>
    lowerCategory.includes(banned)
  )) {
    return false;
  }

  return true;
}

/**
 * Validate stream title and description
 */
export function validateStreamContent(title: string, description: string): ModerationResult {
  const titleResult = moderateText(title);
  const descResult = moderateText(description);

  // If either is blocked, block the whole stream
  if (titleResult.action === 'blocked' || descResult.action === 'blocked') {
    return {
      action: 'blocked',
      violations: [...titleResult.violations, ...descResult.violations],
      confidence: Math.max(titleResult.confidence, descResult.confidence),
      message: 'Stream content violates community guidelines.',
      flaggedTerms: [...(titleResult.flaggedTerms || []), ...(descResult.flaggedTerms || [])]
    };
  }

  if (titleResult.action === 'flagged' || descResult.action === 'flagged') {
    return {
      action: 'flagged',
      violations: [...titleResult.violations, ...descResult.violations],
      confidence: Math.max(titleResult.confidence, descResult.confidence),
      message: 'Stream content flagged for review.',
      flaggedTerms: [...(titleResult.flaggedTerms || []), ...(descResult.flaggedTerms || [])]
    };
  }

  return {
    action: 'approved',
    violations: [],
    confidence: 1,
    message: 'Stream content approved'
  };
}

// ============================================
// REPORTING SYSTEM
// ============================================

export const REPORT_REASONS: { value: ViolationType; label: string; description: string }[] = [
  {
    value: 'sexual',
    label: 'Sexual Content',
    description: 'Nudity, sexual acts, or sexually suggestive content'
  },
  {
    value: 'violence',
    label: 'Violence or Threats',
    description: 'Physical violence, threats, or graphic content'
  },
  {
    value: 'hate_speech',
    label: 'Hate Speech',
    description: 'Racism, discrimination, or targeting protected groups'
  },
  {
    value: 'harassment',
    label: 'Harassment or Bullying',
    description: 'Targeted harassment, bullying, or intimidation'
  },
  {
    value: 'scam',
    label: 'Scam or Fraud',
    description: 'Attempting to deceive or steal from others'
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Repetitive, unwanted, or promotional content'
  },
  {
    value: 'drugs',
    label: 'Drugs or Illegal Activity',
    description: 'Promoting drug use or illegal activities'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other community guideline violation'
  },
];

// ============================================
// COMMUNITY GUIDELINES
// ============================================

export const COMMUNITY_GUIDELINES = {
  title: 'AfroConnect Community Guidelines',
  lastUpdated: '2025-01-01',
  sections: [
    {
      title: 'Respect Everyone',
      rules: [
        'Treat all community members with dignity and respect',
        'No hate speech, discrimination, or targeting of any group',
        'No harassment, bullying, or intimidation',
        'Respect different cultures, religions, and backgrounds'
      ]
    },
    {
      title: 'Keep It Clean',
      rules: [
        'No sexual content, nudity, or sexually suggestive material',
        'No graphic violence or gore',
        'No promotion of self-harm or suicide',
        'Keep language appropriate for all ages'
      ]
    },
    {
      title: 'Stay Safe',
      rules: [
        'Never share personal information publicly',
        'Report suspicious or scam activity immediately',
        'No promotion of illegal drugs or substances',
        'No weapons or dangerous items promotion'
      ]
    },
    {
      title: 'Be Authentic',
      rules: [
        'No impersonation of others',
        'No fake accounts or misleading profiles',
        'No spam or repetitive content',
        'Be genuine in your interactions'
      ]
    },
    {
      title: 'Streaming & Video Rules',
      rules: [
        'All live streams must follow community guidelines',
        'No adult content or nudity in streams',
        'No violent or harmful activities',
        'Respect copyright and intellectual property',
        'Streams can be terminated immediately for violations'
      ]
    }
  ],
  consequences: [
    'First violation: Warning issued',
    'Second violation: Content removed, 24-hour posting restriction',
    'Third violation: 7-day account suspension',
    'Severe violations: Immediate permanent ban',
    'Sexual/violent content: Zero tolerance - immediate ban'
  ]
};

// ============================================
// USER SAFETY FEATURES
// ============================================

/**
 * Check if user can post based on violation history
 */
export function canUserPost(violations: UserViolation[]): { canPost: boolean; reason?: string; unbanDate?: string } {
  const activeViolations = violations.filter(v => {
    if (!v.expiresAt) return v.action === 'permanent_ban';
    return new Date(v.expiresAt) > new Date();
  });

  const permanentBan = activeViolations.find(v => v.action === 'permanent_ban');
  if (permanentBan) {
    return { canPost: false, reason: 'Your account has been permanently suspended for community guideline violations.' };
  }

  const tempBan = activeViolations.find(v => v.action === 'temporary_ban');
  if (tempBan) {
    return {
      canPost: false,
      reason: 'Your account is temporarily suspended.',
      unbanDate: tempBan.expiresAt
    };
  }

  return { canPost: true };
}

/**
 * Get appropriate action based on violation history
 */
export function getViolationAction(
  violationType: ViolationType,
  previousViolations: UserViolation[]
): UserViolation['action'] {
  // Zero tolerance for sexual/violent content
  if (violationType === 'sexual' || violationType === 'violence') {
    return 'permanent_ban';
  }

  // Zero tolerance for hate speech
  if (violationType === 'hate_speech') {
    return previousViolations.length > 0 ? 'permanent_ban' : 'temporary_ban';
  }

  // Progressive discipline for other violations
  const recentViolations = previousViolations.filter(v => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(v.createdAt) > thirtyDaysAgo;
  });

  if (recentViolations.length >= 3) return 'permanent_ban';
  if (recentViolations.length >= 2) return 'temporary_ban';
  if (recentViolations.length >= 1) return 'content_removed';
  return 'warning';
}

// ============================================
// PRE-UPLOAD CONTENT WARNINGS
// ============================================

export const CONTENT_WARNINGS = {
  beforeUpload: [
    'All content is reviewed for community guideline compliance',
    'Sexual or violent content will result in immediate ban',
    'Respect copyright - only upload content you own',
    'Your uploads can be reported by other users'
  ],
  beforeStream: [
    'Live streams are monitored for guideline compliance',
    'Violations during streams result in immediate termination',
    'Sexual or violent content leads to permanent ban',
    'Be respectful to viewers and other creators'
  ]
};

/**
 * Generate upload disclaimer text
 */
export function getUploadDisclaimer(contentType: ContentType): string {
  return `By uploading this ${contentType}, you confirm that:
• It does not contain sexual, violent, or harmful content
• It does not promote hate speech or discrimination
• You have the right to share this content
• It complies with AfroConnect Community Guidelines

Violations will result in content removal and possible account suspension.`;
}
