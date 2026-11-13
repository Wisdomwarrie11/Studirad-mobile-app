export type AcademicLevel = 'BSc' | 'PGD' | 'MSc' | 'PhD';

export type ResearchServiceCategory =
  | 'Consulting'
  | 'Editing'
  | 'Data Analysis'
  | 'Data Collection'
  | 'Others';

export type ResearchStageOption =
  | 'Idea'
  | 'Draft Writing'
  | 'Data Analysis'
  | 'Data Collection'
  | 'None'
  | 'Others';

export interface RepresentativeInfo {
  id: 'rep1' | 'rep2';
  label: string;
  displayPhone: string;
  whatsappNumber: string;
}

export const RESEARCH_REPRESENTATIVES: readonly RepresentativeInfo[] = [
  {
    id: 'rep1',
    label: 'Representative 1',
    displayPhone: '09029729621',
    whatsappNumber: '2349029729621',
  },
  {
    id: 'rep2',
    label: 'Representative 2',
    displayPhone: '07038333974',
    whatsappNumber: '2347038333974',
  },
] as const;

export interface AcademicLevelOption {
  level: AcademicLevel;
  title: string;
  subtitle: string;
}

export const ACADEMIC_LEVEL_OPTIONS: AcademicLevelOption[] = [
  {
    level: 'BSc',
    title: 'BSc',
    subtitle: 'Undergraduate thesis, capstone, or final-year radiography project',
  },
  {
    level: 'PGD',
    title: 'PGD',
    subtitle: 'Postgraduate Diploma research paper or clinical audit project',
  },
  {
    level: 'MSc',
    title: 'MSc',
    subtitle: 'Master’s degree dissertation, empirical study, or systematic review',
  },
  {
    level: 'PhD',
    title: 'PhD',
    subtitle: 'Doctoral thesis, advanced statistical modelling, or publication manuscript',
  },
];

export interface ResearchCategoryDefinition {
  id: ResearchServiceCategory;
  title: string;
  shortDescription: string;
  services: string[];
  guideText: string;
  priceLabel?: string;
  prices?: Record<AcademicLevel, string>;
  hasFixedPricing: boolean;
  reassuranceNote: string;
}

export const REASSURANCE_NOTE =
  'Have questions about the service or price? Speak with us before making payment. Our representative will guide you through the process.';

export const RESEARCH_CATEGORIES: ResearchCategoryDefinition[] = [
  {
    id: 'Consulting',
    title: 'Consulting',
    shortDescription: 'Topic selection, methodology planning, and research proposal structuring.',
    services: [
      'Research topic selection and refinement',
      'Research methodology guidance',
      'Proposal guidance',
    ],
    guideText:
      'Choose this package if you are unsure where to start with your research and need professional guidance on how to proceed.',
    priceLabel: 'Consultation Price',
    prices: {
      BSc: '₦2,000',
      PGD: '₦3,000',
      MSc: '₦3,000',
      PhD: '₦5,000',
    },
    hasFixedPricing: true,
    reassuranceNote: REASSURANCE_NOTE,
  },
  {
    id: 'Editing',
    title: 'Editing',
    shortDescription: 'Grammar polish, proofreading, formatting, referencing, and plagiarism checks.',
    services: [
      'Grammar Check',
      'Proofreading',
      'Reformatting',
      'Referencing',
      'Plagiarism Check',
    ],
    guideText:
      'Choose this package if you have already written your research work but need help improving its language, structure, formatting, or referencing.',
    priceLabel: 'Estimated Price',
    prices: {
      BSc: '₦5,000–₦10,000',
      PGD: '₦5,000–₦15,000',
      MSc: '₦5,000–₦15,000',
      PhD: '₦10,000–₦15,000',
    },
    hasFixedPricing: true,
    reassuranceNote: REASSURANCE_NOTE,
  },
  {
    id: 'Data Analysis',
    title: 'Data Analysis',
    shortDescription: 'Statistical processing in SPSS/Excel and structured interpretation of findings.',
    services: [
      'SPSS/Excel Analysis',
      'Data Interpretation',
    ],
    guideText:
      'Choose this package if you have collected your research data and need statistical analysis, interpretation, or assistance presenting your findings.',
    priceLabel: 'Estimated Price',
    prices: {
      BSc: '₦35,000–₦50,000',
      PGD: '₦45,000–₦60,000',
      MSc: '₦45,000–₦60,000',
      PhD: '₦50,000–₦100,000',
    },
    hasFixedPricing: true,
    reassuranceNote: REASSURANCE_NOTE,
  },
  {
    id: 'Data Collection',
    title: 'Data Collection',
    shortDescription: 'Fieldwork support, clinical questionnaire administration, and data gathering.',
    services: ['Research Data Gathering Support'],
    guideText:
      'This package covers hands-on assistance with gathering research data. Because fieldwork costs depend on the nature, location, and complexity of your study, a tailored quotation is provided after reviewing your requirements.',
    hasFixedPricing: false,
    reassuranceNote:
      'Speak with our representative to discuss your research location, target sample, and study requirements so we can provide an accurate quotation before you make any payment.',
  },
  {
    id: 'Others',
    title: 'Others',
    shortDescription: 'Bespoke research requests not covered by the four standard categories above.',
    services: [],
    guideText: 'Tell us briefly what research assistance you need.',
    hasFixedPricing: false,
    reassuranceNote:
      'Once you describe what you need and submit your request details, our representative will review your brief and discuss the scope with you on WhatsApp before payment.',
  },
];

export const RESEARCH_STAGES: ResearchStageOption[] = [
  'Idea',
  'Draft Writing',
  'Data Analysis',
  'Data Collection',
  'None',
  'Others',
];

export function getCategoryDefinition(category: ResearchServiceCategory): ResearchCategoryDefinition {
  return RESEARCH_CATEGORIES.find((c) => c.id === category) || RESEARCH_CATEGORIES[0];
}

export function getPriceForSelection(
  category: ResearchServiceCategory,
  level: AcademicLevel
): string | undefined {
  const def = getCategoryDefinition(category);
  if (!def.hasFixedPricing || !def.prices) return undefined;
  return def.prices[level];
}

export interface WhatsAppPayloadParams {
  referenceCode?: string;
  fullName: string;
  email: string;
  academicLevel: AcademicLevel;
  researchTopic: string;
  currentStage: string;
  targetDeadline: string;
  serviceCategory: ResearchServiceCategory;
  selectedServices: string[];
  additionalDescription?: string;
  priceDisplay?: string;
}

export function buildResearchWhatsAppMessage(params: WhatsAppPayloadParams): string {
  const lines: string[] = [
    '*StudiRad Research Assistance Request*',
    '',
  ];

  if (params.referenceCode) {
    lines.push(`*Reference ID:* ${params.referenceCode}`);
  }
  lines.push(`*Full Name:* ${params.fullName}`);
  lines.push(`*Email Address:* ${params.email}`);
  lines.push(`*Academic Level:* ${params.academicLevel}`);
  lines.push(`*Research Topic:* ${params.researchTopic}`);
  lines.push(`*Current Research Stage:* ${params.currentStage}`);
  lines.push(`*Target Deadline:* ${params.targetDeadline}`);
  lines.push(`*Service Category:* ${params.serviceCategory}`);

  if (params.selectedServices.length > 0) {
    lines.push(`*Specific Service(s):* ${params.selectedServices.join(', ')}`);
  }

  if (params.additionalDescription && params.additionalDescription.trim()) {
    lines.push(`*Additional Description:* ${params.additionalDescription.trim()}`);
  }

  if (params.priceDisplay) {
    const priceLabel =
      params.serviceCategory === 'Consulting' ? 'Consultation Price' : 'Estimated Price Range';
    lines.push(`*${priceLabel}:* ${params.priceDisplay}`);
  }

  lines.push('');
  lines.push('Hello StudiRad Representative, I would like to discuss my research assistance request above.');

  return lines.join('\n');
}

export function buildWhatsAppUrl(whatsappNumber: string, message: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
