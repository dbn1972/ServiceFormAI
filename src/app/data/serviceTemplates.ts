/**
 * ServiceFormAI OS: Pre-Built Service Templates
 *
 * This file contains production-ready service templates that are automatically
 * created in draft state for every new tenant. Tenants can customize and publish
 * these templates with minimal effort.
 *
 * Benefits:
 * - Reduces time to first published service (from ~5 min to ~1 min)
 * - Provides best-practice examples
 * - Pre-configured DigiLocker mappings
 * - Validated eligibility rules
 * - Ready-to-use document requirements
 */

export interface ServiceTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  sla: string;
  popular: boolean;
  icon: string;
  fields: FormField[];
  eligibilityRules: EligibilityRule[];
  documents: DocumentRequirement[];
  estimatedApplicationTime: string; // e.g., "5 minutes"
  targetAudience: string; // e.g., "Students", "Citizens", "Businesses"
}

export interface FormField {
  id: string;
  type: 'text' | 'date' | 'dropdown' | 'number' | 'file' | 'textarea' | 'radio' | 'checkbox';
  label: string;
  required: boolean;
  prefillable: boolean;
  mapping?: string; // DigiLocker mapping
  options?: string[];
  validation?: string;
  helpText?: string;
  placeholder?: string;
}

export interface EligibilityRule {
  id: string;
  field: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in';
  value: string;
  description: string; // Human-readable explanation
}

export interface DocumentRequirement {
  id: string;
  name: string;
  digilockerType?: string; // DigiLocker document type code
  required: boolean;
  description?: string;
  acceptedFormats?: string[]; // e.g., ['PDF', 'JPG', 'PNG']
  maxSizeMB?: number;
}

// ============================================================================
// CIVIL RECORDS SERVICES
// ============================================================================

export const BIRTH_CERTIFICATE_TEMPLATE: ServiceTemplate = {
  id: 'birth-certificate',
  name: 'Birth Certificate',
  category: 'Civil Records',
  description: 'Official birth certificate issued by the municipal corporation. Required for school admission, passport application, and various government schemes.',
  sla: '7 days',
  popular: true,
  icon: 'FileText',
  estimatedApplicationTime: '10 minutes',
  targetAudience: 'Parents/Guardians',
  fields: [
    {
      id: 'child-name',
      type: 'text',
      label: "Child's Full Name (as per hospital records)",
      required: true,
      prefillable: false,
      placeholder: 'e.g., Ananya Rajesh Sharma',
      helpText: 'Enter name exactly as mentioned in hospital birth report'
    },
    {
      id: 'child-gender',
      type: 'radio',
      label: 'Gender',
      required: true,
      prefillable: false,
      options: ['Male', 'Female', 'Other']
    },
    {
      id: 'dob',
      type: 'date',
      label: 'Date of Birth',
      required: true,
      prefillable: false,
      validation: 'Must be within last 30 days for online registration'
    },
    {
      id: 'time-of-birth',
      type: 'text',
      label: 'Time of Birth',
      required: true,
      prefillable: false,
      placeholder: '10:30 AM'
    },
    {
      id: 'place-of-birth',
      type: 'text',
      label: 'Place of Birth (Hospital/Home)',
      required: true,
      prefillable: false,
      placeholder: 'e.g., Apollo Hospital, Pune'
    },
    {
      id: 'father-name',
      type: 'text',
      label: "Father's Full Name",
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Father Aadhaar → Name'
    },
    {
      id: 'father-aadhaar',
      type: 'text',
      label: "Father's Aadhaar Number",
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Father Aadhaar → Number',
      validation: '12-digit Aadhaar number'
    },
    {
      id: 'mother-name',
      type: 'text',
      label: "Mother's Full Name",
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Mother Aadhaar → Name'
    },
    {
      id: 'mother-aadhaar',
      type: 'text',
      label: "Mother's Aadhaar Number",
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Mother Aadhaar → Number',
      validation: '12-digit Aadhaar number'
    },
    {
      id: 'address',
      type: 'textarea',
      label: 'Permanent Address',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → Address'
    }
  ],
  eligibilityRules: [
    {
      id: 'rule-1',
      field: 'dob',
      operator: '>=',
      value: 'today - 30 days',
      description: 'Birth must be registered within 30 days for free online registration'
    },
    {
      id: 'rule-2',
      field: 'place-of-birth',
      operator: 'contains',
      value: 'city_jurisdiction',
      description: 'Birth must have occurred within municipal jurisdiction'
    }
  ],
  documents: [
    {
      id: 'doc-1',
      name: 'Hospital Birth Report',
      digilockerType: 'HOSPITAL_BIRTH_REPORT',
      required: true,
      description: 'Official birth report from hospital (if institutional delivery)',
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSizeMB: 5
    },
    {
      id: 'doc-2',
      name: "Father's Aadhaar Card",
      digilockerType: 'AADHAAR',
      required: true,
      description: 'Auto-fetched from DigiLocker with consent',
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-3',
      name: "Mother's Aadhaar Card",
      digilockerType: 'AADHAAR',
      required: true,
      description: 'Auto-fetched from DigiLocker with consent',
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-4',
      name: 'Address Proof',
      digilockerType: 'ADDRESS_PROOF',
      required: false,
      description: 'Utility bill, rent agreement, or property tax receipt',
      acceptedFormats: ['PDF', 'JPG'],
      maxSizeMB: 3
    }
  ]
};

export const DEATH_CERTIFICATE_TEMPLATE: ServiceTemplate = {
  id: 'death-certificate',
  name: 'Death Certificate',
  category: 'Civil Records',
  description: 'Official death certificate issued by the municipal corporation. Required for claiming insurance, property transfer, and pension cessation.',
  sla: '7 days',
  popular: false,
  icon: 'FileText',
  estimatedApplicationTime: '10 minutes',
  targetAudience: 'Family Members',
  fields: [
    {
      id: 'deceased-name',
      type: 'text',
      label: "Deceased Person's Full Name",
      required: true,
      prefillable: false,
      placeholder: 'As per Aadhaar/ID proof'
    },
    {
      id: 'deceased-gender',
      type: 'radio',
      label: 'Gender',
      required: true,
      prefillable: false,
      options: ['Male', 'Female', 'Other']
    },
    {
      id: 'dod',
      type: 'date',
      label: 'Date of Death',
      required: true,
      prefillable: false
    },
    {
      id: 'place-of-death',
      type: 'text',
      label: 'Place of Death (Hospital/Home)',
      required: true,
      prefillable: false
    },
    {
      id: 'applicant-name',
      type: 'text',
      label: 'Applicant Name',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → Name'
    },
    {
      id: 'relationship',
      type: 'dropdown',
      label: 'Relationship with Deceased',
      required: true,
      prefillable: false,
      options: ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other']
    }
  ],
  eligibilityRules: [
    {
      id: 'rule-1',
      field: 'dod',
      operator: '<=',
      value: 'today',
      description: 'Date of death cannot be in future'
    }
  ],
  documents: [
    {
      id: 'doc-1',
      name: 'Hospital Death Report / Medical Certificate',
      required: true,
      description: 'Issued by hospital or attending doctor',
      acceptedFormats: ['PDF', 'JPG'],
      maxSizeMB: 5
    },
    {
      id: 'doc-2',
      name: "Deceased's ID Proof (Aadhaar/Voter ID)",
      digilockerType: 'AADHAAR',
      required: true,
      acceptedFormats: ['PDF', 'JPG'],
      maxSizeMB: 2
    },
    {
      id: 'doc-3',
      name: "Applicant's ID Proof",
      digilockerType: 'AADHAAR',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    }
  ]
};

// ============================================================================
// REVENUE CERTIFICATES
// ============================================================================

export const INCOME_CERTIFICATE_TEMPLATE: ServiceTemplate = {
  id: 'income-certificate',
  name: 'Income Certificate',
  category: 'Revenue',
  description: 'Certificate stating annual family income. Required for scholarships, fee concessions, EWS quota, and government schemes.',
  sla: '14 days',
  popular: true,
  icon: 'Briefcase',
  estimatedApplicationTime: '15 minutes',
  targetAudience: 'Citizens',
  fields: [
    {
      id: 'applicant-name',
      type: 'text',
      label: 'Applicant Full Name',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → Name'
    },
    {
      id: 'father-name',
      type: 'text',
      label: "Father's / Husband's Name",
      required: true,
      prefillable: false
    },
    {
      id: 'dob',
      type: 'date',
      label: 'Date of Birth',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → DOB'
    },
    {
      id: 'address',
      type: 'textarea',
      label: 'Permanent Residential Address',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → Address'
    },
    {
      id: 'occupation',
      type: 'text',
      label: 'Occupation of Earning Members',
      required: true,
      prefillable: false,
      placeholder: 'e.g., Agriculture, Business, Salaried'
    },
    {
      id: 'annual-income',
      type: 'dropdown',
      label: 'Annual Family Income Range',
      required: true,
      prefillable: false,
      options: [
        'Below ₹1,00,000',
        '₹1,00,000 - ₹2,50,000',
        '₹2,50,000 - ₹5,00,000',
        '₹5,00,000 - ₹8,00,000',
        'Above ₹8,00,000'
      ]
    },
    {
      id: 'purpose',
      type: 'dropdown',
      label: 'Purpose of Certificate',
      required: true,
      prefillable: false,
      options: ['Scholarship', 'Fee Concession', 'EWS Quota', 'Government Scheme', 'Other']
    }
  ],
  eligibilityRules: [
    {
      id: 'rule-1',
      field: 'address',
      operator: 'contains',
      value: 'district_name',
      description: 'Applicant must be resident of this district'
    }
  ],
  documents: [
    {
      id: 'doc-1',
      name: 'Aadhaar Card',
      digilockerType: 'AADHAAR',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-2',
      name: 'Salary Slip / Income Proof',
      required: true,
      description: 'Last 3 months salary slip OR ITR OR agricultural income proof',
      acceptedFormats: ['PDF', 'JPG'],
      maxSizeMB: 5
    },
    {
      id: 'doc-3',
      name: 'Ration Card',
      digilockerType: 'RATION_CARD',
      required: false,
      acceptedFormats: ['PDF', 'JPG'],
      maxSizeMB: 2
    },
    {
      id: 'doc-4',
      name: 'Bank Passbook (First Page)',
      digilockerType: 'BANK_PASSBOOK',
      required: false,
      acceptedFormats: ['PDF', 'JPG'],
      maxSizeMB: 2
    }
  ]
};

export const CASTE_CERTIFICATE_TEMPLATE: ServiceTemplate = {
  id: 'caste-certificate',
  name: 'Caste Certificate',
  category: 'Revenue',
  description: 'Certificate verifying caste category (SC/ST/OBC). Required for reservation benefits in education and employment.',
  sla: '30 days',
  popular: true,
  icon: 'BadgeCheck',
  estimatedApplicationTime: '20 minutes',
  targetAudience: 'SC/ST/OBC Citizens',
  fields: [
    {
      id: 'applicant-name',
      type: 'text',
      label: 'Applicant Full Name',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → Name'
    },
    {
      id: 'father-name',
      type: 'text',
      label: "Father's Name",
      required: true,
      prefillable: false
    },
    {
      id: 'mother-name',
      type: 'text',
      label: "Mother's Name",
      required: true,
      prefillable: false
    },
    {
      id: 'dob',
      type: 'date',
      label: 'Date of Birth',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → DOB'
    },
    {
      id: 'caste',
      type: 'text',
      label: 'Caste Name',
      required: true,
      prefillable: false,
      placeholder: 'e.g., Scheduled Caste, Scheduled Tribe, OBC'
    },
    {
      id: 'category',
      type: 'dropdown',
      label: 'Category',
      required: true,
      prefillable: false,
      options: ['Scheduled Caste (SC)', 'Scheduled Tribe (ST)', 'Other Backward Class (OBC)', 'VJNT', 'SBC']
    },
    {
      id: 'native-district',
      type: 'text',
      label: 'Native District',
      required: true,
      prefillable: false
    }
  ],
  eligibilityRules: [
    {
      id: 'rule-1',
      field: 'category',
      operator: 'in',
      value: 'SC,ST,OBC,VJNT,SBC',
      description: 'Applicant must belong to recognized category'
    }
  ],
  documents: [
    {
      id: 'doc-1',
      name: 'Aadhaar Card',
      digilockerType: 'AADHAAR',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-2',
      name: "Father's/Mother's Caste Certificate",
      required: true,
      description: 'Original caste certificate of parents',
      acceptedFormats: ['PDF', 'JPG'],
      maxSizeMB: 5
    },
    {
      id: 'doc-3',
      name: 'School Leaving Certificate',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-4',
      name: 'Domicile Certificate',
      digilockerType: 'DOMICILE_CERTIFICATE',
      required: false,
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    }
  ]
};

export const DOMICILE_CERTIFICATE_TEMPLATE: ServiceTemplate = {
  id: 'domicile-certificate',
  name: 'Domicile Certificate',
  category: 'Revenue',
  description: 'Certificate proving residency in the state. Required for state quota admissions and government job applications.',
  sla: '21 days',
  popular: false,
  icon: 'MapPin',
  estimatedApplicationTime: '15 minutes',
  targetAudience: 'Citizens',
  fields: [
    {
      id: 'applicant-name',
      type: 'text',
      label: 'Applicant Full Name',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → Name'
    },
    {
      id: 'dob',
      type: 'date',
      label: 'Date of Birth',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → DOB'
    },
    {
      id: 'years-of-residence',
      type: 'number',
      label: 'Years of Continuous Residence in State',
      required: true,
      prefillable: false,
      validation: 'Minimum 15 years required'
    },
    {
      id: 'address',
      type: 'textarea',
      label: 'Current Residential Address',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → Address'
    },
    {
      id: 'purpose',
      type: 'dropdown',
      label: 'Purpose of Certificate',
      required: true,
      prefillable: false,
      options: ['College Admission', 'Government Job', 'Scholarship', 'Other']
    }
  ],
  eligibilityRules: [
    {
      id: 'rule-1',
      field: 'years-of-residence',
      operator: '>=',
      value: '15',
      description: 'Minimum 15 years continuous residence required'
    }
  ],
  documents: [
    {
      id: 'doc-1',
      name: 'Aadhaar Card',
      digilockerType: 'AADHAAR',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-2',
      name: 'School Leaving Certificate',
      required: true,
      description: 'Showing school address in the state',
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-3',
      name: 'Property Tax Receipt / Electricity Bill',
      required: true,
      description: 'Proof of residence for last 15 years',
      acceptedFormats: ['PDF', 'JPG'],
      maxSizeMB: 5
    }
  ]
};

// ============================================================================
// EDUCATION & WELFARE
// ============================================================================

export const SCHOLARSHIP_TEMPLATE: ServiceTemplate = {
  id: 'state-scholarship',
  name: 'State Merit Scholarship',
  category: 'Education',
  description: 'Financial assistance for meritorious students from economically weaker sections pursuing higher education.',
  sla: '45 days',
  popular: true,
  icon: 'GraduationCap',
  estimatedApplicationTime: '20 minutes',
  targetAudience: 'Students',
  fields: [
    {
      id: 'student-name',
      type: 'text',
      label: 'Student Full Name',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → Name'
    },
    {
      id: 'dob',
      type: 'date',
      label: 'Date of Birth',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → DOB'
    },
    {
      id: 'gender',
      type: 'radio',
      label: 'Gender',
      required: true,
      prefillable: false,
      options: ['Male', 'Female', 'Other']
    },
    {
      id: 'category',
      type: 'dropdown',
      label: 'Category',
      required: true,
      prefillable: false,
      options: ['General', 'SC', 'ST', 'OBC', 'EWS']
    },
    {
      id: 'course-name',
      type: 'text',
      label: 'Course Enrolled',
      required: true,
      prefillable: false,
      placeholder: 'e.g., B.Tech Computer Science'
    },
    {
      id: 'institution-name',
      type: 'text',
      label: 'Name of Institution',
      required: true,
      prefillable: false
    },
    {
      id: 'year-of-study',
      type: 'dropdown',
      label: 'Year of Study',
      required: true,
      prefillable: false,
      options: ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Final Year']
    },
    {
      id: 'previous-marks',
      type: 'number',
      label: 'Percentage in Previous Year (%)',
      required: true,
      prefillable: false,
      validation: 'Minimum 60% required'
    },
    {
      id: 'annual-income',
      type: 'dropdown',
      label: 'Annual Family Income',
      required: true,
      prefillable: false,
      options: ['Below ₹1,00,000', '₹1,00,000 - ₹2,50,000', '₹2,50,000 - ₹5,00,000']
    },
    {
      id: 'bank-account',
      type: 'text',
      label: 'Bank Account Number',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Bank Passbook → Account Number'
    },
    {
      id: 'ifsc',
      type: 'text',
      label: 'IFSC Code',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Bank Passbook → IFSC'
    }
  ],
  eligibilityRules: [
    {
      id: 'rule-1',
      field: 'age',
      operator: '>=',
      value: '16',
      description: 'Applicant must be at least 16 years old'
    },
    {
      id: 'rule-2',
      field: 'age',
      operator: '<=',
      value: '25',
      description: 'Applicant must be below 25 years old'
    },
    {
      id: 'rule-3',
      field: 'previous-marks',
      operator: '>=',
      value: '60',
      description: 'Minimum 60% marks required in previous year'
    },
    {
      id: 'rule-4',
      field: 'annual-income',
      operator: '<=',
      value: '250000',
      description: 'Annual family income must be below ₹2,50,000'
    }
  ],
  documents: [
    {
      id: 'doc-1',
      name: 'Aadhaar Card',
      digilockerType: 'AADHAAR',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-2',
      name: 'Income Certificate',
      digilockerType: 'INCOME_CERTIFICATE',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-3',
      name: 'Previous Year Marksheet',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-4',
      name: 'Bonafide Certificate',
      digilockerType: 'EDU_BONAFIDE',
      required: true,
      description: 'From current institution',
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-5',
      name: 'Bank Passbook (First Page)',
      digilockerType: 'BANK_PASSBOOK',
      required: true,
      acceptedFormats: ['PDF', 'JPG'],
      maxSizeMB: 2
    },
    {
      id: 'doc-6',
      name: 'Caste Certificate',
      digilockerType: 'CASTE_CERTIFICATE',
      required: false,
      description: 'Required for SC/ST/OBC applicants',
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    }
  ]
};

export const RATION_CARD_TEMPLATE: ServiceTemplate = {
  id: 'ration-card',
  name: 'Ration Card (New/Renewal)',
  category: 'Food & Civil Supplies',
  description: 'Ration card for purchasing subsidized food grains from Public Distribution System (PDS).',
  sla: '30 days',
  popular: true,
  icon: 'CreditCard',
  estimatedApplicationTime: '25 minutes',
  targetAudience: 'Families',
  fields: [
    {
      id: 'head-of-family',
      type: 'text',
      label: 'Name of Head of Family',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → Name'
    },
    {
      id: 'family-members',
      type: 'number',
      label: 'Number of Family Members',
      required: true,
      prefillable: false,
      validation: 'Minimum 1'
    },
    {
      id: 'address',
      type: 'textarea',
      label: 'Residential Address',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → Address'
    },
    {
      id: 'annual-income',
      type: 'dropdown',
      label: 'Annual Family Income',
      required: true,
      prefillable: false,
      options: [
        'Below ₹15,000 (AAY - Antyodaya Anna Yojana)',
        '₹15,000 - ₹1,00,000 (BPL - Below Poverty Line)',
        '₹1,00,000 - ₹3,00,000 (APL - Above Poverty Line)'
      ]
    },
    {
      id: 'card-type',
      type: 'radio',
      label: 'Card Type Requested',
      required: true,
      prefillable: false,
      options: ['AAY (Pink)', 'BPL (Yellow)', 'APL (White)']
    }
  ],
  eligibilityRules: [
    {
      id: 'rule-1',
      field: 'address',
      operator: 'contains',
      value: 'state_name',
      description: 'Applicant must be resident of this state'
    }
  ],
  documents: [
    {
      id: 'doc-1',
      name: 'Aadhaar Cards of All Family Members',
      digilockerType: 'AADHAAR',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 10
    },
    {
      id: 'doc-2',
      name: 'Income Certificate',
      digilockerType: 'INCOME_CERTIFICATE',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-3',
      name: 'Address Proof',
      required: true,
      description: 'Electricity bill, property tax receipt, or rent agreement',
      acceptedFormats: ['PDF', 'JPG'],
      maxSizeMB: 3
    },
    {
      id: 'doc-4',
      name: 'Family Photo',
      required: true,
      description: 'Recent photograph of all family members',
      acceptedFormats: ['JPG', 'PNG'],
      maxSizeMB: 2
    }
  ]
};

// ============================================================================
// MUNICIPAL SERVICES
// ============================================================================

export const PROPERTY_TAX_TEMPLATE: ServiceTemplate = {
  id: 'property-tax',
  name: 'Property Tax Payment',
  category: 'Municipal',
  description: 'Annual property tax payment for residential/commercial properties within municipal limits.',
  sla: 'Instant (upon payment)',
  popular: true,
  icon: 'Landmark',
  estimatedApplicationTime: '5 minutes',
  targetAudience: 'Property Owners',
  fields: [
    {
      id: 'property-id',
      type: 'text',
      label: 'Property ID / Assessment Number',
      required: true,
      prefillable: false,
      placeholder: 'e.g., MH-PUN-001234'
    },
    {
      id: 'owner-name',
      type: 'text',
      label: 'Property Owner Name',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → Name'
    },
    {
      id: 'property-address',
      type: 'textarea',
      label: 'Property Address',
      required: true,
      prefillable: false
    },
    {
      id: 'property-type',
      type: 'dropdown',
      label: 'Property Type',
      required: true,
      prefillable: false,
      options: ['Residential', 'Commercial', 'Industrial', 'Mixed Use']
    },
    {
      id: 'payment-mode',
      type: 'radio',
      label: 'Payment Mode',
      required: true,
      prefillable: false,
      options: ['Online (Debit/Credit Card)', 'Net Banking', 'UPI', 'Challan (Offline)']
    }
  ],
  eligibilityRules: [],
  documents: [
    {
      id: 'doc-1',
      name: 'Property Ownership Proof',
      required: true,
      description: 'Property deed, sale agreement, or 7/12 extract',
      acceptedFormats: ['PDF'],
      maxSizeMB: 5
    },
    {
      id: 'doc-2',
      name: 'Previous Year Tax Receipt',
      required: false,
      acceptedFormats: ['PDF', 'JPG'],
      maxSizeMB: 2
    }
  ]
};

export const TRADE_LICENSE_TEMPLATE: ServiceTemplate = {
  id: 'trade-license',
  name: 'Trade License (New/Renewal)',
  category: 'Municipal',
  description: 'License to operate commercial business within municipal limits. Mandatory for shops, restaurants, factories.',
  sla: '30 days',
  popular: true,
  icon: 'Briefcase',
  estimatedApplicationTime: '30 minutes',
  targetAudience: 'Business Owners',
  fields: [
    {
      id: 'business-name',
      type: 'text',
      label: 'Name of Business',
      required: true,
      prefillable: false,
      placeholder: 'e.g., Sharma General Store'
    },
    {
      id: 'owner-name',
      type: 'text',
      label: 'Owner Name',
      required: true,
      prefillable: true,
      mapping: 'DigiLocker → Aadhaar → Name'
    },
    {
      id: 'business-type',
      type: 'dropdown',
      label: 'Type of Business',
      required: true,
      prefillable: false,
      options: [
        'Retail Shop',
        'Restaurant/Food Service',
        'Factory/Manufacturing',
        'Wholesale Trade',
        'Service Provider',
        'Other'
      ]
    },
    {
      id: 'business-address',
      type: 'textarea',
      label: 'Business Address',
      required: true,
      prefillable: false
    },
    {
      id: 'area-sqft',
      type: 'number',
      label: 'Total Area (sq ft)',
      required: true,
      prefillable: false
    },
    {
      id: 'employees',
      type: 'number',
      label: 'Number of Employees',
      required: true,
      prefillable: false
    }
  ],
  eligibilityRules: [],
  documents: [
    {
      id: 'doc-1',
      name: 'Owner Aadhaar Card',
      digilockerType: 'AADHAAR',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-2',
      name: 'Premises Ownership/Rent Agreement',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5
    },
    {
      id: 'doc-3',
      name: 'NOC from Building Owner',
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    },
    {
      id: 'doc-4',
      name: 'Fire NOC',
      required: false,
      description: 'Required for commercial establishments > 500 sq ft',
      acceptedFormats: ['PDF'],
      maxSizeMB: 2
    }
  ]
};

// ============================================================================
// IMPORT EXPANDED TEMPLATES
// ============================================================================

import { ALL_EXPANDED_TEMPLATES } from './serviceTemplatesExpanded';

// ============================================================================
// EXPORT ALL TEMPLATES (BASE + EXPANDED)
// ============================================================================

// Base 9 templates (original core services)
export const BASE_SERVICE_TEMPLATES: ServiceTemplate[] = [
  BIRTH_CERTIFICATE_TEMPLATE,
  DEATH_CERTIFICATE_TEMPLATE,
  INCOME_CERTIFICATE_TEMPLATE,
  CASTE_CERTIFICATE_TEMPLATE,
  DOMICILE_CERTIFICATE_TEMPLATE,
  SCHOLARSHIP_TEMPLATE,
  RATION_CARD_TEMPLATE,
  PROPERTY_TAX_TEMPLATE,
  TRADE_LICENSE_TEMPLATE,
];

// Complete library: 9 base + 30 expanded = 39 total templates
export const ALL_SERVICE_TEMPLATES: ServiceTemplate[] = [
  ...BASE_SERVICE_TEMPLATES,
  ...ALL_EXPANDED_TEMPLATES,
];

export const POPULAR_TEMPLATES = ALL_SERVICE_TEMPLATES.filter(t => t.popular);

export const TEMPLATES_BY_CATEGORY = ALL_SERVICE_TEMPLATES.reduce((acc, template) => {
  if (!acc[template.category]) {
    acc[template.category] = [];
  }
  acc[template.category]!.push(template);
  return acc;
}, {} as Record<string, ServiceTemplate[]>);
