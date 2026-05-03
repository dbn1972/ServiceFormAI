/**
 * ServiceFormAI OS: EXPANDED Service Templates Library
 *
 * This file contains additional 30+ production-ready service templates
 * covering the entire citizen lifecycle and all major government touchpoints.
 *
 * Organized by:
 * 1. Identity & Status Certificates
 * 2. Transport & Vehicles
 * 3. Property & Land
 * 4. Infrastructure & Utilities
 * 5. Business & Commerce
 * 6. Health & Welfare
 * 7. Education
 * 8. Agriculture
 * 9. Grievances & Complaints
 *
 * Total: 40+ templates (9 basic + 31 expanded)
 */

import { ServiceTemplate } from './serviceTemplates';

// ============================================================================
// IDENTITY & STATUS CERTIFICATES (Additional)
// ============================================================================

export const MARRIAGE_CERTIFICATE_TEMPLATE: ServiceTemplate = {
  id: 'marriage-certificate',
  name: 'Marriage Registration Certificate',
  category: 'Civil Records',
  description: 'Official marriage registration certificate. Required for passport, visa, bank account updates, and legal recognition of marriage.',
  sla: '14 days',
  popular: true,
  icon: 'Heart',
  estimatedApplicationTime: '15 minutes',
  targetAudience: 'Married Couples',
  fields: [
    { id: 'groom-name', type: 'text', label: "Groom's Full Name", required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name', placeholder: 'As per Aadhaar' },
    { id: 'groom-dob', type: 'date', label: "Groom's Date of Birth", required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → DOB' },
    { id: 'groom-aadhaar', type: 'text', label: "Groom's Aadhaar Number", required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Number', validation: '12 digits' },
    { id: 'bride-name', type: 'text', label: "Bride's Full Name", required: true, prefillable: false, placeholder: 'As per Aadhaar' },
    { id: 'bride-dob', type: 'date', label: "Bride's Date of Birth", required: true, prefillable: false },
    { id: 'bride-aadhaar', type: 'text', label: "Bride's Aadhaar Number", required: true, prefillable: false, validation: '12 digits' },
    { id: 'marriage-date', type: 'date', label: 'Date of Marriage', required: true, prefillable: false },
    { id: 'marriage-place', type: 'text', label: 'Place of Marriage', required: true, prefillable: false },
    { id: 'witness1-name', type: 'text', label: 'Witness 1 Name', required: true, prefillable: false },
    { id: 'witness2-name', type: 'text', label: 'Witness 2 Name', required: true, prefillable: false },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'groom-age', operator: '>=', value: '21', description: 'Groom must be at least 21 years old' },
    { id: 'rule-2', field: 'bride-age', operator: '>=', value: '18', description: 'Bride must be at least 18 years old' },
  ],
  documents: [
    { id: 'doc-1', name: "Groom's Aadhaar Card", digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: "Bride's Aadhaar Card", digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Marriage Invitation Card / Photos', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 5 },
    { id: 'doc-4', name: 'Affidavit (Notarized)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-5', name: 'Witnesses ID Proof', required: true, acceptedFormats: ['PDF'], maxSizeMB: 3 },
  ]
};

export const DISABILITY_CERTIFICATE_TEMPLATE: ServiceTemplate = {
  id: 'disability-certificate',
  name: 'Disability Certificate (UDID)',
  category: 'Health & Welfare',
  description: 'Certificate for persons with disabilities. Provides access to reservations, concessions, and welfare schemes under Rights of Persons with Disabilities Act.',
  sla: '30 days',
  popular: true,
  icon: 'Accessibility',
  estimatedApplicationTime: '20 minutes',
  targetAudience: 'Persons with Disabilities',
  fields: [
    { id: 'applicant-name', type: 'text', label: 'Applicant Full Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'dob', type: 'date', label: 'Date of Birth', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → DOB' },
    { id: 'disability-type', type: 'dropdown', label: 'Type of Disability', required: true, prefillable: false, options: ['Locomotor', 'Visual', 'Hearing', 'Speech', 'Intellectual', 'Mental', 'Multiple Disabilities'] },
    { id: 'disability-percentage', type: 'dropdown', label: 'Disability Percentage', required: true, prefillable: false, options: ['Below 40%', '40-60%', '60-80%', 'Above 80%'] },
    { id: 'guardian-name', type: 'text', label: 'Guardian Name (if minor/dependent)', required: false, prefillable: false },
    { id: 'purpose', type: 'dropdown', label: 'Purpose of Certificate', required: true, prefillable: false, options: ['Employment Reservation', 'Education Concession', 'Pension/Welfare Scheme', 'Railway Concession', 'Other'] },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'disability-percentage', operator: '>=', value: '40', description: 'Minimum 40% disability required for certification' },
  ],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Medical Certificate from Government Hospital', required: true, description: 'From Medical Board/Civil Surgeon', acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-3', name: 'Recent Passport Size Photo', required: true, acceptedFormats: ['JPG', 'PNG'], maxSizeMB: 1 },
    { id: 'doc-4', name: 'Address Proof', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
  ]
};

export const SENIOR_CITIZEN_CARD_TEMPLATE: ServiceTemplate = {
  id: 'senior-citizen-card',
  name: 'Senior Citizen Card',
  category: 'Health & Welfare',
  description: 'Identity card for senior citizens providing access to concessions in transport, healthcare, and various welfare schemes.',
  sla: '15 days',
  popular: true,
  icon: 'User',
  estimatedApplicationTime: '10 minutes',
  targetAudience: 'Senior Citizens (60+ years)',
  fields: [
    { id: 'name', type: 'text', label: 'Full Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'dob', type: 'date', label: 'Date of Birth', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → DOB' },
    { id: 'address', type: 'textarea', label: 'Residential Address', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Address' },
    { id: 'mobile', type: 'text', label: 'Mobile Number', required: true, prefillable: true, mapping: 'DigiLocker → Mobile', validation: '10 digits' },
    { id: 'emergency-contact', type: 'text', label: 'Emergency Contact Number', required: true, prefillable: false },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'age', operator: '>=', value: '60', description: 'Applicant must be 60 years or older' },
  ],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Recent Passport Size Photo', required: true, acceptedFormats: ['JPG', 'PNG'], maxSizeMB: 1 },
    { id: 'doc-3', name: 'Age Proof (Birth Certificate/School LC)', required: false, acceptedFormats: ['PDF'], maxSizeMB: 2 },
  ]
};

export const EWS_CERTIFICATE_TEMPLATE: ServiceTemplate = {
  id: 'ews-certificate',
  name: 'EWS Certificate (Economically Weaker Section)',
  category: 'Revenue',
  description: 'Certificate for Economically Weaker Section providing 10% reservation in education and employment as per government policy.',
  sla: '21 days',
  popular: true,
  icon: 'BadgeCheck',
  estimatedApplicationTime: '15 minutes',
  targetAudience: 'General Category Citizens with low income',
  fields: [
    { id: 'applicant-name', type: 'text', label: 'Applicant Full Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'father-name', type: 'text', label: "Father's/Husband's Name", required: true, prefillable: false },
    { id: 'dob', type: 'date', label: 'Date of Birth', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → DOB' },
    { id: 'annual-income', type: 'dropdown', label: 'Annual Family Income', required: true, prefillable: false, options: ['Below ₹8,00,000'], helpText: 'Gross annual income must be below ₹8 lakh' },
    { id: 'occupation', type: 'text', label: 'Occupation', required: true, prefillable: false },
    { id: 'address', type: 'textarea', label: 'Residential Address', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Address' },
    { id: 'purpose', type: 'dropdown', label: 'Purpose of Certificate', required: true, prefillable: false, options: ['College Admission', 'Government Job', 'Medical Admission', 'Other'] },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'annual-income', operator: '<=', value: '800000', description: 'Annual family income must be below ₹8,00,000' },
    { id: 'rule-2', field: 'category', operator: '==', value: 'General', description: 'Only for General category (not SC/ST/OBC)' },
  ],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Income Proof (Salary Slip/ITR)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-3', name: 'Ration Card', digilockerType: 'RATION_CARD', required: false, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-4', name: 'Self-Declaration Affidavit', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
  ]
};

// ============================================================================
// TRANSPORT & VEHICLES
// ============================================================================

export const DRIVING_LICENSE_TEMPLATE: ServiceTemplate = {
  id: 'driving-license',
  name: 'Driving License (New/Renewal)',
  category: 'Transport',
  description: 'Driving license application for two-wheelers, four-wheelers, and commercial vehicles. Valid across India.',
  sla: '30 days',
  popular: true,
  icon: 'Car',
  estimatedApplicationTime: '20 minutes',
  targetAudience: 'Eligible Drivers',
  fields: [
    { id: 'applicant-name', type: 'text', label: 'Full Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'dob', type: 'date', label: 'Date of Birth', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → DOB' },
    { id: 'address', type: 'textarea', label: 'Permanent Address', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Address' },
    { id: 'license-type', type: 'dropdown', label: 'License Type', required: true, prefillable: false, options: ['Two-Wheeler (Non-Gear)', 'Two-Wheeler (With Gear)', 'Light Motor Vehicle (LMV)', 'Commercial Vehicle', 'Transport Vehicle'] },
    { id: 'application-type', type: 'radio', label: 'Application Type', required: true, prefillable: false, options: ['New License', 'Renewal', 'Duplicate'] },
    { id: 'learners-license-no', type: 'text', label: "Learner's License Number", required: false, prefillable: false, helpText: 'Required for new DL application' },
    { id: 'blood-group', type: 'dropdown', label: 'Blood Group', required: true, prefillable: false, options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'age', operator: '>=', value: '18', description: 'Minimum 18 years for two-wheeler and LMV' },
    { id: 'rule-2', field: 'age', operator: '>=', value: '20', description: 'Minimum 20 years for commercial/transport vehicle (if selected)' },
  ],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Address Proof', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Age Proof (Birth Certificate/School LC)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-4', name: 'Passport Size Photo', required: true, acceptedFormats: ['JPG', 'PNG'], maxSizeMB: 1 },
    { id: 'doc-5', name: 'Medical Certificate (Form 1A)', required: true, description: 'From registered medical practitioner', acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-6', name: "Learner's License", required: false, description: 'For new DL application', acceptedFormats: ['PDF'], maxSizeMB: 2 },
  ]
};

export const VEHICLE_REGISTRATION_TEMPLATE: ServiceTemplate = {
  id: 'vehicle-registration',
  name: 'Vehicle Registration Certificate (RC)',
  category: 'Transport',
  description: 'Registration of new vehicle (two-wheeler, car, commercial). Mandatory within 30 days of purchase.',
  sla: '15 days',
  popular: true,
  icon: 'Car',
  estimatedApplicationTime: '25 minutes',
  targetAudience: 'Vehicle Owners',
  fields: [
    { id: 'owner-name', type: 'text', label: 'Owner Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'vehicle-type', type: 'dropdown', label: 'Vehicle Type', required: true, prefillable: false, options: ['Two-Wheeler', 'Three-Wheeler', 'Four-Wheeler (Car)', 'Commercial Vehicle', 'Tractor'] },
    { id: 'manufacturer', type: 'text', label: 'Manufacturer/Make', required: true, prefillable: false, placeholder: 'e.g., Honda, Maruti, Tata' },
    { id: 'model', type: 'text', label: 'Model', required: true, prefillable: false },
    { id: 'chassis-number', type: 'text', label: 'Chassis Number', required: true, prefillable: false },
    { id: 'engine-number', type: 'text', label: 'Engine Number', required: true, prefillable: false },
    { id: 'fuel-type', type: 'dropdown', label: 'Fuel Type', required: true, prefillable: false, options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'] },
    { id: 'address', type: 'textarea', label: 'Owner Address', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Address' },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Address Proof', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Purchase Invoice', required: true, acceptedFormats: ['PDF'], maxSizeMB: 3 },
    { id: 'doc-4', name: 'Form 20 (Application)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-5', name: 'Form 21 (Sale Certificate)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-6', name: 'Insurance Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-7', name: 'PUC (Pollution Under Control) Certificate', required: false, acceptedFormats: ['PDF'], maxSizeMB: 1 },
  ]
};

export const VEHICLE_NOC_TEMPLATE: ServiceTemplate = {
  id: 'vehicle-noc',
  name: 'Vehicle NOC (No Objection Certificate)',
  category: 'Transport',
  description: 'NOC for transferring vehicle registration from one state to another. Required when relocating.',
  sla: '7 days',
  popular: false,
  icon: 'FileCheck',
  estimatedApplicationTime: '10 minutes',
  targetAudience: 'Vehicle Owners relocating',
  fields: [
    { id: 'owner-name', type: 'text', label: 'Vehicle Owner Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'vehicle-number', type: 'text', label: 'Vehicle Registration Number', required: true, prefillable: false, placeholder: 'e.g., MH12AB1234' },
    { id: 'from-state', type: 'text', label: 'Current State', required: true, prefillable: false },
    { id: 'to-state', type: 'text', label: 'Destination State', required: true, prefillable: false },
    { id: 'new-address', type: 'textarea', label: 'New Address (in destination state)', required: true, prefillable: false },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'RC (Registration Certificate)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Insurance Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'PUC Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 1 },
    { id: 'doc-4', name: 'Address Proof (New State)', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
    { id: 'doc-5', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
  ]
};

// ============================================================================
// PROPERTY & LAND
// ============================================================================

export const BUILDING_PLAN_APPROVAL_TEMPLATE: ServiceTemplate = {
  id: 'building-plan-approval',
  name: 'Building Plan Approval',
  category: 'Municipal',
  description: 'Approval of building construction plan as per municipal bylaws. Mandatory before starting construction.',
  sla: '60 days',
  popular: true,
  icon: 'Building',
  estimatedApplicationTime: '45 minutes',
  targetAudience: 'Property Owners/Developers',
  fields: [
    { id: 'owner-name', type: 'text', label: 'Property Owner Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'plot-number', type: 'text', label: 'Plot/Survey Number', required: true, prefillable: false },
    { id: 'plot-area', type: 'number', label: 'Plot Area (sq ft)', required: true, prefillable: false },
    { id: 'proposed-area', type: 'number', label: 'Proposed Built-up Area (sq ft)', required: true, prefillable: false },
    { id: 'building-type', type: 'dropdown', label: 'Type of Building', required: true, prefillable: false, options: ['Residential', 'Commercial', 'Industrial', 'Mixed Use', 'Institutional'] },
    { id: 'floors', type: 'number', label: 'Number of Floors', required: true, prefillable: false },
    { id: 'architect-name', type: 'text', label: 'Architect Name', required: true, prefillable: false },
    { id: 'architect-license', type: 'text', label: 'Architect License Number', required: true, prefillable: false },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Property Ownership Deed', required: true, acceptedFormats: ['PDF'], maxSizeMB: 10 },
    { id: 'doc-2', name: '7/12 Extract / Land Revenue Record', required: true, acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-3', name: 'Building Plan (Architect Signed)', required: true, description: 'Scale 1:100 or 1:200', acceptedFormats: ['PDF'], maxSizeMB: 20 },
    { id: 'doc-4', name: 'Structural Drawings', required: true, acceptedFormats: ['PDF'], maxSizeMB: 20 },
    { id: 'doc-5', name: 'Site Plan', required: true, acceptedFormats: ['PDF'], maxSizeMB: 10 },
    { id: 'doc-6', name: 'Architect License Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-7', name: 'Owner Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
  ]
};

export const PROPERTY_MUTATION_TEMPLATE: ServiceTemplate = {
  id: 'property-mutation',
  name: 'Property Mutation/Transfer',
  category: 'Revenue',
  description: 'Transfer of property ownership records after sale, inheritance, or gift. Updates revenue records.',
  sla: '90 days',
  popular: true,
  icon: 'FileTransfer',
  estimatedApplicationTime: '30 minutes',
  targetAudience: 'Property Buyers/Legal Heirs',
  fields: [
    { id: 'new-owner-name', type: 'text', label: 'New Owner Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'previous-owner-name', type: 'text', label: 'Previous Owner Name', required: true, prefillable: false },
    { id: 'property-number', type: 'text', label: 'Property/Survey Number', required: true, prefillable: false },
    { id: 'transfer-type', type: 'dropdown', label: 'Type of Transfer', required: true, prefillable: false, options: ['Sale', 'Gift', 'Inheritance', 'Partition'] },
    { id: 'sale-deed-date', type: 'date', label: 'Sale Deed/Transfer Date', required: true, prefillable: false },
    { id: 'area', type: 'number', label: 'Property Area (sq ft/sq m)', required: true, prefillable: false },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Registered Sale Deed / Gift Deed / Will', required: true, acceptedFormats: ['PDF'], maxSizeMB: 10 },
    { id: 'doc-2', name: 'Stamp Duty & Registration Receipt', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Previous Property Card / 7/12', required: true, acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-4', name: 'New Owner Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-5', name: 'Property Tax Receipt (Latest)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-6', name: 'NOC from Society (if applicable)', required: false, acceptedFormats: ['PDF'], maxSizeMB: 2 },
  ]
};

export const SEVEN_TWELVE_EXTRACT_TEMPLATE: ServiceTemplate = {
  id: 'seven-twelve-extract',
  name: '7/12 Extract (Satbara Utara)',
  category: 'Revenue',
  description: 'Land ownership record extract showing details of agricultural land, ownership, cultivation, and encumbrances.',
  sla: '7 days',
  popular: true,
  icon: 'FileText',
  estimatedApplicationTime: '10 minutes',
  targetAudience: 'Land Owners',
  fields: [
    { id: 'applicant-name', type: 'text', label: 'Applicant Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'survey-number', type: 'text', label: 'Survey Number / Gat Number', required: true, prefillable: false },
    { id: 'village', type: 'text', label: 'Village Name', required: true, prefillable: false },
    { id: 'taluka', type: 'text', label: 'Taluka', required: true, prefillable: false },
    { id: 'district', type: 'text', label: 'District', required: true, prefillable: false },
    { id: 'purpose', type: 'dropdown', label: 'Purpose of Extract', required: true, prefillable: false, options: ['Loan Application', 'Sale/Purchase', 'Legal Proceedings', 'Government Scheme', 'Other'] },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Ownership Proof (if not owner)', required: false, description: 'Power of Attorney, Sale Deed, etc.', acceptedFormats: ['PDF'], maxSizeMB: 5 },
  ]
};

// ============================================================================
// INFRASTRUCTURE & UTILITIES
// ============================================================================

export const WATER_CONNECTION_TEMPLATE: ServiceTemplate = {
  id: 'water-connection',
  name: 'Water Connection (New/Transfer)',
  category: 'Municipal',
  description: 'New water connection or transfer of existing connection for residential/commercial premises.',
  sla: '30 days',
  popular: true,
  icon: 'Droplet',
  estimatedApplicationTime: '15 minutes',
  targetAudience: 'Property Owners/Tenants',
  fields: [
    { id: 'applicant-name', type: 'text', label: 'Applicant Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'property-address', type: 'textarea', label: 'Property Address', required: true, prefillable: false },
    { id: 'connection-type', type: 'radio', label: 'Connection Type', required: true, prefillable: false, options: ['New Connection', 'Transfer of Existing', 'Additional Connection'] },
    { id: 'usage-type', type: 'dropdown', label: 'Usage Type', required: true, prefillable: false, options: ['Residential', 'Commercial', 'Industrial'] },
    { id: 'property-type', type: 'dropdown', label: 'Property Type', required: true, prefillable: false, options: ['Own', 'Rented'] },
    { id: 'meter-size', type: 'dropdown', label: 'Requested Meter Size', required: true, prefillable: false, options: ['15mm (Residential)', '20mm (Small Commercial)', '25mm (Large Commercial)'] },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Property Ownership Proof', required: true, description: 'Sale deed, property card, or rent agreement', acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-3', name: 'Property Tax Receipt', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-4', name: 'Site Plan / Layout', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 3 },
    { id: 'doc-5', name: 'NOC from Society (if applicable)', required: false, acceptedFormats: ['PDF'], maxSizeMB: 2 },
  ]
};

export const ELECTRICITY_CONNECTION_TEMPLATE: ServiceTemplate = {
  id: 'electricity-connection',
  name: 'Electricity Connection (New)',
  category: 'Utilities',
  description: 'New electricity connection for residential, commercial, or industrial use.',
  sla: '15 days',
  popular: true,
  icon: 'Zap',
  estimatedApplicationTime: '20 minutes',
  targetAudience: 'Property Owners',
  fields: [
    { id: 'applicant-name', type: 'text', label: 'Applicant Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'mobile', type: 'text', label: 'Mobile Number', required: true, prefillable: true, mapping: 'DigiLocker → Mobile', validation: '10 digits' },
    { id: 'email', type: 'text', label: 'Email', required: true, prefillable: false },
    { id: 'property-address', type: 'textarea', label: 'Installation Address', required: true, prefillable: false },
    { id: 'connection-type', type: 'dropdown', label: 'Connection Type', required: true, prefillable: false, options: ['Residential', 'Commercial', 'Industrial', 'Agricultural'] },
    { id: 'load-required', type: 'dropdown', label: 'Load Required (kW)', required: true, prefillable: false, options: ['1-2 kW', '2-5 kW', '5-10 kW', '10-20 kW', 'Above 20 kW'] },
    { id: 'phase-type', type: 'dropdown', label: 'Phase Type', required: true, prefillable: false, options: ['Single Phase', 'Three Phase'] },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Property Ownership/Occupancy Proof', required: true, acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-3', name: 'Wiring Certificate (from Licensed Electrician)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-4', name: 'Building Plan Approval (if new building)', required: false, acceptedFormats: ['PDF'], maxSizeMB: 5 },
  ]
};

export const SEWERAGE_CONNECTION_TEMPLATE: ServiceTemplate = {
  id: 'sewerage-connection',
  name: 'Sewerage Connection',
  category: 'Municipal',
  description: 'Sewerage/drainage connection to municipal system for residential or commercial premises.',
  sla: '45 days',
  popular: false,
  icon: 'Waves',
  estimatedApplicationTime: '15 minutes',
  targetAudience: 'Property Owners',
  fields: [
    { id: 'applicant-name', type: 'text', label: 'Applicant Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'property-address', type: 'textarea', label: 'Property Address', required: true, prefillable: false },
    { id: 'property-type', type: 'dropdown', label: 'Property Type', required: true, prefillable: false, options: ['Residential', 'Commercial', 'Industrial'] },
    { id: 'building-floors', type: 'number', label: 'Number of Floors', required: true, prefillable: false },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Property Ownership Proof', required: true, acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-3', name: 'Building Plan/Layout', required: true, acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-4', name: 'Property Tax Receipt', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
  ]
};

// ============================================================================
// BUSINESS & COMMERCE
// ============================================================================

export const UDYAM_REGISTRATION_TEMPLATE: ServiceTemplate = {
  id: 'udyam-registration',
  name: 'Udyam Registration (MSME)',
  category: 'Business & Commerce',
  description: 'MSME/Udyam registration for micro, small, and medium enterprises. Provides access to government schemes, subsidies, and loans.',
  sla: '7 days',
  popular: true,
  icon: 'Building2',
  estimatedApplicationTime: '30 minutes',
  targetAudience: 'Business Owners/Entrepreneurs',
  fields: [
    { id: 'entrepreneur-name', type: 'text', label: 'Entrepreneur/Owner Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'aadhaar', type: 'text', label: 'Aadhaar Number', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Number', validation: '12 digits' },
    { id: 'pan', type: 'text', label: 'PAN Number', required: true, prefillable: true, mapping: 'DigiLocker → PAN → Number', validation: '10 characters' },
    { id: 'business-name', type: 'text', label: 'Business/Enterprise Name', required: true, prefillable: false },
    { id: 'business-type', type: 'dropdown', label: 'Type of Organization', required: true, prefillable: false, options: ['Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'Cooperative'] },
    { id: 'enterprise-category', type: 'dropdown', label: 'Enterprise Category', required: true, prefillable: false, options: ['Micro', 'Small', 'Medium'] },
    { id: 'sector', type: 'dropdown', label: 'Sector', required: true, prefillable: false, options: ['Manufacturing', 'Service', 'Both'] },
    { id: 'investment', type: 'number', label: 'Investment in Plant & Machinery (₹)', required: true, prefillable: false },
    { id: 'turnover', type: 'number', label: 'Annual Turnover (₹)', required: true, prefillable: false },
    { id: 'employees', type: 'number', label: 'Number of Employees', required: true, prefillable: false },
    { id: 'business-address', type: 'textarea', label: 'Business Address', required: true, prefillable: false },
    { id: 'bank-account', type: 'text', label: 'Business Bank Account Number', required: true, prefillable: false },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'investment', operator: '<=', value: '500000000', description: 'Investment should not exceed ₹50 crore for medium enterprises' },
  ],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'PAN Card', digilockerType: 'PAN', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Business Address Proof', required: true, description: 'Rent agreement, ownership deed, electricity bill', acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-4', name: 'Bank Account Statement/Cancelled Cheque', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
  ]
};

export const GST_REGISTRATION_TEMPLATE: ServiceTemplate = {
  id: 'gst-registration',
  name: 'GST Registration',
  category: 'Business & Commerce',
  description: 'Goods and Services Tax registration for businesses. Mandatory for turnover above ₹40 lakh (₹20 lakh for services).',
  sla: '7 days',
  popular: true,
  icon: 'Receipt',
  estimatedApplicationTime: '40 minutes',
  targetAudience: 'Business Owners',
  fields: [
    { id: 'business-name', type: 'text', label: 'Legal Business Name', required: true, prefillable: false },
    { id: 'pan', type: 'text', label: 'Business PAN', required: true, prefillable: true, mapping: 'DigiLocker → PAN → Number', validation: '10 characters' },
    { id: 'business-type', type: 'dropdown', label: 'Business Constitution', required: true, prefillable: false, options: ['Proprietorship', 'Partnership', 'Private Limited Company', 'LLP', 'Public Limited Company', 'HUF'] },
    { id: 'business-address', type: 'textarea', label: 'Principal Place of Business', required: true, prefillable: false },
    { id: 'state', type: 'dropdown', label: 'State', required: true, prefillable: false, options: ['Maharashtra', 'Karnataka', 'Gujarat', 'Tamil Nadu', 'Delhi', 'Other'] },
    { id: 'hsn-code', type: 'text', label: 'Primary HSN/SAC Code', required: true, prefillable: false, helpText: 'Harmonized System Code for goods/services' },
    { id: 'turnover', type: 'number', label: 'Expected Annual Turnover (₹)', required: true, prefillable: false },
    { id: 'bank-account', type: 'text', label: 'Business Bank Account Number', required: true, prefillable: false },
    { id: 'bank-ifsc', type: 'text', label: 'Bank IFSC Code', required: true, prefillable: false },
    { id: 'authorized-signatory', type: 'text', label: 'Authorized Signatory Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'turnover', operator: '>=', value: '2000000', description: 'Mandatory registration for turnover above ₹20 lakh (services) or ₹40 lakh (goods)' },
  ],
  documents: [
    { id: 'doc-1', name: 'PAN Card', digilockerType: 'PAN', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Aadhaar of Authorized Signatory', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Business Address Proof', required: true, description: 'Rent agreement/ownership deed with electricity bill', acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-4', name: 'Bank Account Statement/Cancelled Cheque', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
    { id: 'doc-5', name: 'Partnership Deed/MOA/AOA', required: false, description: 'For partnership/company', acceptedFormats: ['PDF'], maxSizeMB: 10 },
    { id: 'doc-6', name: 'Digital Signature Certificate (DSC)', required: false, description: 'For companies/LLPs', acceptedFormats: ['PDF'], maxSizeMB: 1 },
  ]
};

export const SHOP_ACT_LICENSE_TEMPLATE: ServiceTemplate = {
  id: 'shop-act-license',
  name: 'Shop & Establishment License',
  category: 'Business & Commerce',
  description: 'License for shops, commercial establishments, restaurants, and offices. Mandatory under Shops and Establishments Act.',
  sla: '15 days',
  popular: true,
  icon: 'Store',
  estimatedApplicationTime: '20 minutes',
  targetAudience: 'Shop/Business Owners',
  fields: [
    { id: 'owner-name', type: 'text', label: 'Owner/Proprietor Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'establishment-name', type: 'text', label: 'Name of Establishment', required: true, prefillable: false },
    { id: 'business-type', type: 'dropdown', label: 'Type of Business', required: true, prefillable: false, options: ['Retail Shop', 'Restaurant/Hotel', 'Office', 'Warehouse', 'Factory', 'Service Center', 'Other'] },
    { id: 'establishment-address', type: 'textarea', label: 'Establishment Address', required: true, prefillable: false },
    { id: 'employees-male', type: 'number', label: 'Number of Male Employees', required: true, prefillable: false },
    { id: 'employees-female', type: 'number', label: 'Number of Female Employees', required: true, prefillable: false },
    { id: 'commencement-date', type: 'date', label: 'Date of Commencement', required: true, prefillable: false },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Owner Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'PAN Card', digilockerType: 'PAN', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Premises Ownership/Rent Agreement', required: true, acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-4', name: 'Electricity Bill (Recent)', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
    { id: 'doc-5', name: 'Partnership Deed (if applicable)', required: false, acceptedFormats: ['PDF'], maxSizeMB: 5 },
  ]
};

export const FSSAI_LICENSE_TEMPLATE: ServiceTemplate = {
  id: 'fssai-license',
  name: 'FSSAI Food License',
  category: 'Business & Commerce',
  description: 'Food Safety and Standards Authority license for food businesses - restaurants, bakeries, food manufacturers, and retailers.',
  sla: '60 days',
  popular: true,
  icon: 'UtensilsCrossed',
  estimatedApplicationTime: '35 minutes',
  targetAudience: 'Food Business Operators',
  fields: [
    { id: 'applicant-name', type: 'text', label: 'Applicant/Proprietor Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'business-name', type: 'text', label: 'Food Business Name', required: true, prefillable: false },
    { id: 'license-type', type: 'dropdown', label: 'License Type', required: true, prefillable: false, options: ['Basic Registration (< ₹12 lakh turnover)', 'State License (₹12 lakh - ₹20 crore)', 'Central License (> ₹20 crore)'] },
    { id: 'food-category', type: 'dropdown', label: 'Food Category', required: true, prefillable: false, options: ['Restaurant/Eatery', 'Bakery', 'Sweet Shop', 'Food Manufacturer', 'Food Retailer', 'Catering Service', 'Food Vendor'] },
    { id: 'premises-address', type: 'textarea', label: 'Premises Address', required: true, prefillable: false },
    { id: 'premises-area', type: 'number', label: 'Premises Area (sq ft)', required: true, prefillable: false },
    { id: 'water-source', type: 'dropdown', label: 'Source of Water', required: true, prefillable: false, options: ['Municipal', 'Borewell', 'Tanker', 'Other'] },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Owner Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'PAN Card', digilockerType: 'PAN', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Premises Ownership/Rent Agreement', required: true, acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-4', name: 'Layout Plan of Premises', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 5 },
    { id: 'doc-5', name: 'Water Test Report', required: true, description: 'From recognized lab', acceptedFormats: ['PDF'], maxSizeMB: 3 },
    { id: 'doc-6', name: 'Food Safety Management System Plan', required: false, description: 'For central license', acceptedFormats: ['PDF'], maxSizeMB: 5 },
  ]
};

export const PROFESSIONAL_TAX_TEMPLATE: ServiceTemplate = {
  id: 'professional-tax',
  name: 'Professional Tax Registration',
  category: 'Business & Commerce',
  description: 'Professional tax registration for employers and self-employed professionals. State-level tax on professions and trades.',
  sla: '10 days',
  popular: false,
  icon: 'Briefcase',
  estimatedApplicationTime: '15 minutes',
  targetAudience: 'Employers & Professionals',
  fields: [
    { id: 'applicant-name', type: 'text', label: 'Applicant Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'business-name', type: 'text', label: 'Business/Professional Name', required: true, prefillable: false },
    { id: 'applicant-type', type: 'dropdown', label: 'Type', required: true, prefillable: false, options: ['Employer', 'Self-Employed Professional'] },
    { id: 'profession', type: 'text', label: 'Profession/Trade', required: true, prefillable: false, placeholder: 'e.g., Doctor, Lawyer, Consultant' },
    { id: 'employees', type: 'number', label: 'Number of Employees', required: false, prefillable: false, helpText: 'For employers only' },
    { id: 'business-address', type: 'textarea', label: 'Business Address', required: true, prefillable: false },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'PAN Card', digilockerType: 'PAN', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Business Address Proof', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 3 },
    { id: 'doc-4', name: 'Trade License/Shop Act License', required: false, acceptedFormats: ['PDF'], maxSizeMB: 2 },
  ]
};

// ============================================================================
// AGRICULTURE & FARMERS
// ============================================================================

export const KISAN_CREDIT_CARD_TEMPLATE: ServiceTemplate = {
  id: 'kisan-credit-card',
  name: 'Kisan Credit Card (KCC)',
  category: 'Agriculture',
  description: 'Credit card for farmers providing short-term credit for agricultural needs, including cultivation, post-harvest expenses, and allied activities.',
  sla: '30 days',
  popular: true,
  icon: 'CreditCard',
  estimatedApplicationTime: '25 minutes',
  targetAudience: 'Farmers',
  fields: [
    { id: 'farmer-name', type: 'text', label: 'Farmer Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'aadhaar', type: 'text', label: 'Aadhaar Number', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Number', validation: '12 digits' },
    { id: 'land-holding', type: 'number', label: 'Total Land Holding (acres)', required: true, prefillable: false },
    { id: 'irrigated-land', type: 'number', label: 'Irrigated Land (acres)', required: true, prefillable: false },
    { id: 'crops-cultivated', type: 'text', label: 'Major Crops Cultivated', required: true, prefillable: false, placeholder: 'e.g., Rice, Wheat, Cotton' },
    { id: 'bank-name', type: 'text', label: 'Preferred Bank', required: true, prefillable: false },
    { id: 'existing-loan', type: 'radio', label: 'Any Existing Agricultural Loan?', required: true, prefillable: false, options: ['Yes', 'No'] },
    { id: 'credit-limit-required', type: 'number', label: 'Credit Limit Required (₹)', required: true, prefillable: false },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'land-holding', operator: '>', value: '0', description: 'Must have agricultural land ownership or tenancy' },
  ],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Land Ownership Document (7/12, Patta)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-3', name: 'Bank Passbook/Statement', required: true, acceptedFormats: ['PDF'], maxSizeMB: 3 },
    { id: 'doc-4', name: 'Recent Passport Size Photo', required: true, acceptedFormats: ['JPG', 'PNG'], maxSizeMB: 1 },
    { id: 'doc-5', name: 'Income/Asset Proof', required: false, acceptedFormats: ['PDF'], maxSizeMB: 3 },
  ]
};

export const CROP_INSURANCE_TEMPLATE: ServiceTemplate = {
  id: 'crop-insurance',
  name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
  category: 'Agriculture',
  description: 'Crop insurance scheme providing financial support to farmers in case of crop failure due to natural calamities, pests, or diseases.',
  sla: '15 days',
  popular: true,
  icon: 'Shield',
  estimatedApplicationTime: '20 minutes',
  targetAudience: 'Farmers',
  fields: [
    { id: 'farmer-name', type: 'text', label: 'Farmer Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'aadhaar', type: 'text', label: 'Aadhaar Number', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Number', validation: '12 digits' },
    { id: 'season', type: 'dropdown', label: 'Season', required: true, prefillable: false, options: ['Kharif', 'Rabi', 'Zaid'] },
    { id: 'crop', type: 'dropdown', label: 'Crop to be Insured', required: true, prefillable: false, options: ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Pulses', 'Oilseeds', 'Other'] },
    { id: 'area', type: 'number', label: 'Area Under Cultivation (acres)', required: true, prefillable: false },
    { id: 'survey-number', type: 'text', label: 'Survey/Plot Number', required: true, prefillable: false },
    { id: 'bank-account', type: 'text', label: 'Bank Account Number', required: true, prefillable: false },
    { id: 'bank-ifsc', type: 'text', label: 'IFSC Code', required: true, prefillable: false },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Land Ownership Document (7/12, Patta)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-3', name: 'Bank Passbook/Cancelled Cheque', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
    { id: 'doc-4', name: 'Sowing Certificate (from Gram Panchayat)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
  ]
};

export const PM_KISAN_ENROLLMENT_TEMPLATE: ServiceTemplate = {
  id: 'pm-kisan-enrollment',
  name: 'PM-KISAN Enrollment',
  category: 'Agriculture',
  description: 'Enrollment in PM-KISAN scheme providing ₹6,000/year income support to farmer families in three equal installments.',
  sla: '30 days',
  popular: true,
  icon: 'IndianRupee',
  estimatedApplicationTime: '15 minutes',
  targetAudience: 'Small & Marginal Farmers',
  fields: [
    { id: 'farmer-name', type: 'text', label: 'Farmer Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'aadhaar', type: 'text', label: 'Aadhaar Number', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Number', validation: '12 digits' },
    { id: 'mobile', type: 'text', label: 'Mobile Number', required: true, prefillable: true, mapping: 'DigiLocker → Mobile', validation: '10 digits' },
    { id: 'gender', type: 'dropdown', label: 'Gender', required: true, prefillable: false, options: ['Male', 'Female', 'Other'] },
    { id: 'category', type: 'dropdown', label: 'Category', required: true, prefillable: false, options: ['General', 'SC', 'ST', 'OBC'] },
    { id: 'land-holding', type: 'number', label: 'Total Cultivable Land (acres)', required: true, prefillable: false },
    { id: 'bank-account', type: 'text', label: 'Bank Account Number', required: true, prefillable: false },
    { id: 'bank-ifsc', type: 'text', label: 'Bank IFSC Code', required: true, prefillable: false },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'land-holding', operator: '>', value: '0', description: 'Must have cultivable land ownership' },
  ],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Land Ownership Document (7/12, Khasra, Patta)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-3', name: 'Bank Passbook/Cancelled Cheque', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
  ]
};

export const FARMER_REGISTRATION_TEMPLATE: ServiceTemplate = {
  id: 'farmer-registration',
  name: 'Farmer Registration (State Farmer Database)',
  category: 'Agriculture',
  description: 'Registration in state farmer database for access to agricultural schemes, subsidies, input support, and welfare programs.',
  sla: '15 days',
  popular: true,
  icon: 'Tractor',
  estimatedApplicationTime: '20 minutes',
  targetAudience: 'All Farmers',
  fields: [
    { id: 'farmer-name', type: 'text', label: 'Farmer Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'aadhaar', type: 'text', label: 'Aadhaar Number', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Number', validation: '12 digits' },
    { id: 'dob', type: 'date', label: 'Date of Birth', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → DOB' },
    { id: 'gender', type: 'dropdown', label: 'Gender', required: true, prefillable: false, options: ['Male', 'Female', 'Other'] },
    { id: 'farmer-type', type: 'dropdown', label: 'Farmer Type', required: true, prefillable: false, options: ['Owner Cultivator', 'Tenant Farmer', 'Sharecropper', 'Agricultural Laborer'] },
    { id: 'land-holding', type: 'number', label: 'Total Land (acres)', required: true, prefillable: false },
    { id: 'major-crops', type: 'text', label: 'Major Crops', required: true, prefillable: false },
    { id: 'livestock', type: 'text', label: 'Livestock (if any)', required: false, prefillable: false, placeholder: 'e.g., 2 cows, 5 goats' },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Land Ownership/Tenancy Document', required: true, acceptedFormats: ['PDF'], maxSizeMB: 5 },
    { id: 'doc-3', name: 'Recent Passport Size Photo', required: true, acceptedFormats: ['JPG', 'PNG'], maxSizeMB: 1 },
    { id: 'doc-4', name: 'Bank Passbook (First Page)', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
  ]
};

// ============================================================================
// EDUCATION
// ============================================================================

export const POST_MATRIC_SCHOLARSHIP_TEMPLATE: ServiceTemplate = {
  id: 'post-matric-scholarship',
  name: 'Post-Matric Scholarship (SC/ST/OBC)',
  category: 'Education',
  description: 'Post-matriculation scholarship for SC/ST/OBC students pursuing higher education (11th onwards, diploma, degree, post-graduation).',
  sla: '90 days',
  popular: true,
  icon: 'GraduationCap',
  estimatedApplicationTime: '25 minutes',
  targetAudience: 'SC/ST/OBC Students',
  fields: [
    { id: 'student-name', type: 'text', label: 'Student Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'aadhaar', type: 'text', label: 'Aadhaar Number', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Number', validation: '12 digits' },
    { id: 'dob', type: 'date', label: 'Date of Birth', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → DOB' },
    { id: 'category', type: 'dropdown', label: 'Category', required: true, prefillable: false, options: ['SC', 'ST', 'OBC', 'VJNT', 'SBC'] },
    { id: 'course', type: 'text', label: 'Course Enrolled', required: true, prefillable: false, placeholder: 'e.g., B.Tech CSE, B.Com' },
    { id: 'institution', type: 'text', label: 'College/Institution Name', required: true, prefillable: false },
    { id: 'year-of-study', type: 'dropdown', label: 'Year of Study', required: true, prefillable: false, options: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'] },
    { id: 'annual-income', type: 'number', label: 'Family Annual Income (₹)', required: true, prefillable: false },
    { id: 'bank-account', type: 'text', label: 'Bank Account Number', required: true, prefillable: false },
    { id: 'bank-ifsc', type: 'text', label: 'IFSC Code', required: true, prefillable: false },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'category', operator: 'in', value: 'SC,ST,OBC,VJNT,SBC', description: 'Only for SC/ST/OBC/VJNT/SBC categories' },
    { id: 'rule-2', field: 'annual-income', operator: '<=', value: '250000', description: 'Family income should not exceed ₹2.5 lakh (varies by state)' },
  ],
  documents: [
    { id: 'doc-1', name: 'Student Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Caste Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Income Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-4', name: 'Previous Year Marksheet', required: true, acceptedFormats: ['PDF'], maxSizeMB: 3 },
    { id: 'doc-5', name: 'College Bonafide Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-6', name: 'Fee Receipt', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-7', name: 'Bank Passbook/Cancelled Cheque', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
  ]
};

export const MINORITY_SCHOLARSHIP_TEMPLATE: ServiceTemplate = {
  id: 'minority-scholarship',
  name: 'Minority Scholarship',
  category: 'Education',
  description: 'Pre-matric and post-matric scholarships for students from minority communities (Muslim, Christian, Sikh, Buddhist, Jain, Parsi).',
  sla: '90 days',
  popular: true,
  icon: 'BookOpen',
  estimatedApplicationTime: '20 minutes',
  targetAudience: 'Minority Community Students',
  fields: [
    { id: 'student-name', type: 'text', label: 'Student Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'aadhaar', type: 'text', label: 'Aadhaar Number', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Number', validation: '12 digits' },
    { id: 'religion', type: 'dropdown', label: 'Religion', required: true, prefillable: false, options: ['Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi'] },
    { id: 'class-standard', type: 'dropdown', label: 'Class/Standard', required: true, prefillable: false, options: ['Class 1-10', 'Class 11-12', 'Graduation', 'Post-Graduation'] },
    { id: 'institution', type: 'text', label: 'School/College Name', required: true, prefillable: false },
    { id: 'annual-income', type: 'number', label: 'Family Annual Income (₹)', required: true, prefillable: false },
    { id: 'bank-account', type: 'text', label: 'Bank Account Number', required: true, prefillable: false },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'annual-income', operator: '<=', value: '200000', description: 'Family income should not exceed ₹2 lakh' },
  ],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Income Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Minority Community Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-4', name: 'Marksheet (Previous Year)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 3 },
    { id: 'doc-5', name: 'Bonafide Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-6', name: 'Bank Passbook', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
  ]
};

// ============================================================================
// HEALTH & WELFARE (Additional)
// ============================================================================

export const OLD_AGE_PENSION_TEMPLATE: ServiceTemplate = {
  id: 'old-age-pension',
  name: 'Old Age Pension Scheme',
  category: 'Health & Welfare',
  description: 'Monthly pension for senior citizens from economically weaker sections. Provides financial security in old age.',
  sla: '60 days',
  popular: true,
  icon: 'Heart',
  estimatedApplicationTime: '15 minutes',
  targetAudience: 'Senior Citizens (60+ years)',
  fields: [
    { id: 'applicant-name', type: 'text', label: 'Applicant Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'aadhaar', type: 'text', label: 'Aadhaar Number', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Number', validation: '12 digits' },
    { id: 'dob', type: 'date', label: 'Date of Birth', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → DOB' },
    { id: 'annual-income', type: 'number', label: 'Annual Income (₹)', required: true, prefillable: false },
    { id: 'bank-account', type: 'text', label: 'Bank Account Number', required: true, prefillable: false },
    { id: 'bank-ifsc', type: 'text', label: 'IFSC Code', required: true, prefillable: false },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'age', operator: '>=', value: '60', description: 'Applicant must be 60 years or older' },
    { id: 'rule-2', field: 'annual-income', operator: '<=', value: '100000', description: 'Annual income should not exceed ₹1 lakh' },
  ],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Age Proof (Birth Certificate/School LC)', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Income Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-4', name: 'Bank Passbook/Cancelled Cheque', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
    { id: 'doc-5', name: 'BPL Ration Card (if applicable)', required: false, acceptedFormats: ['PDF'], maxSizeMB: 2 },
  ]
};

export const WIDOW_PENSION_TEMPLATE: ServiceTemplate = {
  id: 'widow-pension',
  name: 'Widow Pension Scheme',
  category: 'Health & Welfare',
  description: 'Monthly pension for widows from economically weaker sections. Provides financial support to destitute widows.',
  sla: '60 days',
  popular: true,
  icon: 'HeartHandshake',
  estimatedApplicationTime: '15 minutes',
  targetAudience: 'Widows',
  fields: [
    { id: 'applicant-name', type: 'text', label: 'Applicant Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'aadhaar', type: 'text', label: 'Aadhaar Number', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Number', validation: '12 digits' },
    { id: 'dob', type: 'date', label: 'Date of Birth', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → DOB' },
    { id: 'husband-death-date', type: 'date', label: "Husband's Date of Death", required: true, prefillable: false },
    { id: 'annual-income', type: 'number', label: 'Annual Income (₹)', required: true, prefillable: false },
    { id: 'bank-account', type: 'text', label: 'Bank Account Number', required: true, prefillable: false },
    { id: 'bank-ifsc', type: 'text', label: 'IFSC Code', required: true, prefillable: false },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'age', operator: '>=', value: '18', description: 'Applicant must be 18 years or older' },
    { id: 'rule-2', field: 'annual-income', operator: '<=', value: '100000', description: 'Annual income should not exceed ₹1 lakh' },
  ],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: "Husband's Death Certificate", required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Income Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-4', name: 'Bank Passbook/Cancelled Cheque', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 2 },
    { id: 'doc-5', name: 'BPL Ration Card (if applicable)', required: false, acceptedFormats: ['PDF'], maxSizeMB: 2 },
  ]
};

export const AYUSHMAN_BHARAT_TEMPLATE: ServiceTemplate = {
  id: 'ayushman-bharat',
  name: 'Ayushman Bharat (PM-JAY) Card',
  category: 'Health & Welfare',
  description: 'Health insurance card providing ₹5 lakh annual coverage for hospitalization. Free treatment at empaneled hospitals.',
  sla: '30 days',
  popular: true,
  icon: 'HeartPulse',
  estimatedApplicationTime: '20 minutes',
  targetAudience: 'BPL/Low-Income Families',
  fields: [
    { id: 'head-of-family', type: 'text', label: 'Head of Family Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'aadhaar', type: 'text', label: 'Aadhaar Number', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Number', validation: '12 digits' },
    { id: 'mobile', type: 'text', label: 'Mobile Number', required: true, prefillable: true, mapping: 'DigiLocker → Mobile', validation: '10 digits' },
    { id: 'family-members', type: 'number', label: 'Total Family Members', required: true, prefillable: false },
    { id: 'ration-card-type', type: 'dropdown', label: 'Ration Card Type', required: true, prefillable: false, options: ['AAY (Antyodaya)', 'BPL (Yellow)', 'No Ration Card'] },
    { id: 'annual-income', type: 'number', label: 'Annual Family Income (₹)', required: true, prefillable: false },
  ],
  eligibilityRules: [
    { id: 'rule-1', field: 'annual-income', operator: '<=', value: '250000', description: 'Annual family income should not exceed ₹2.5 lakh' },
  ],
  documents: [
    { id: 'doc-1', name: 'Aadhaar Card (All Family Members)', digilockerType: 'AADHAAR', required: true, acceptedFormats: ['PDF'], maxSizeMB: 10 },
    { id: 'doc-2', name: 'Ration Card', digilockerType: 'RATION_CARD', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-3', name: 'Income Certificate', required: true, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-4', name: 'Family Photograph', required: true, acceptedFormats: ['JPG', 'PNG'], maxSizeMB: 2 },
  ]
};

// ============================================================================
// GRIEVANCES & RTI
// ============================================================================

export const RTI_APPLICATION_TEMPLATE: ServiceTemplate = {
  id: 'rti-application',
  name: 'RTI Application (Right to Information)',
  category: 'Grievances',
  description: 'Application under RTI Act 2005 to seek information from public authorities. Mandatory response within 30 days.',
  sla: '30 days',
  popular: true,
  icon: 'FileSearch',
  estimatedApplicationTime: '15 minutes',
  targetAudience: 'All Citizens',
  fields: [
    { id: 'applicant-name', type: 'text', label: 'Applicant Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'mobile', type: 'text', label: 'Mobile Number', required: true, prefillable: true, mapping: 'DigiLocker → Mobile', validation: '10 digits' },
    { id: 'email', type: 'text', label: 'Email Address', required: true, prefillable: false },
    { id: 'address', type: 'textarea', label: 'Postal Address', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Address' },
    { id: 'department', type: 'text', label: 'Department/Public Authority', required: true, prefillable: false, placeholder: 'e.g., Municipal Corporation, Revenue Department' },
    { id: 'information-sought', type: 'textarea', label: 'Information Sought', required: true, prefillable: false, helpText: 'Be specific and clear about what information you need' },
    { id: 'bpl-status', type: 'radio', label: 'Are you BPL (Below Poverty Line)?', required: true, prefillable: false, options: ['Yes', 'No'], helpText: 'BPL applicants are exempted from RTI fee' },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'BPL Card (if claiming fee exemption)', required: false, acceptedFormats: ['PDF'], maxSizeMB: 2 },
    { id: 'doc-2', name: 'Fee Payment Receipt', required: false, description: 'If not BPL, attach ₹10 fee payment receipt', acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 1 },
  ]
};

export const PUBLIC_GRIEVANCE_TEMPLATE: ServiceTemplate = {
  id: 'public-grievance',
  name: 'Public Grievance (CPGRAMS)',
  category: 'Grievances',
  description: 'Lodge complaints against government departments for non-delivery of services, corruption, or grievances. Centralized platform for redressal.',
  sla: '45 days',
  popular: true,
  icon: 'MessageSquareWarning',
  estimatedApplicationTime: '10 minutes',
  targetAudience: 'All Citizens',
  fields: [
    { id: 'complainant-name', type: 'text', label: 'Your Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'mobile', type: 'text', label: 'Mobile Number', required: true, prefillable: true, mapping: 'DigiLocker → Mobile', validation: '10 digits' },
    { id: 'email', type: 'text', label: 'Email Address', required: true, prefillable: false },
    { id: 'grievance-type', type: 'dropdown', label: 'Grievance Type', required: true, prefillable: false, options: ['Service Delay', 'Corruption/Bribery', 'Poor Quality of Service', 'Misconduct', 'Non-Delivery of Service', 'Other'] },
    { id: 'department', type: 'text', label: 'Department/Office Against Which Grievance', required: true, prefillable: false },
    { id: 'grievance-description', type: 'textarea', label: 'Grievance Description', required: true, prefillable: false, helpText: 'Describe your grievance in detail with dates, facts, and evidence' },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Supporting Documents/Evidence', required: false, description: 'Any documents supporting your grievance', acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 10 },
  ]
};

export const CONSUMER_COMPLAINT_TEMPLATE: ServiceTemplate = {
  id: 'consumer-complaint',
  name: 'Consumer Complaint',
  category: 'Grievances',
  description: 'File consumer complaint against defective goods, deficient services, unfair trade practices, or overcharging.',
  sla: '60 days',
  popular: false,
  icon: 'Scale',
  estimatedApplicationTime: '20 minutes',
  targetAudience: 'Consumers',
  fields: [
    { id: 'complainant-name', type: 'text', label: 'Complainant Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
    { id: 'mobile', type: 'text', label: 'Mobile Number', required: true, prefillable: true, mapping: 'DigiLocker → Mobile', validation: '10 digits' },
    { id: 'email', type: 'text', label: 'Email Address', required: true, prefillable: false },
    { id: 'complaint-type', type: 'dropdown', label: 'Complaint Type', required: true, prefillable: false, options: ['Defective Product', 'Deficient Service', 'Unfair Trade Practice', 'Overcharging', 'False Advertisement'] },
    { id: 'seller-name', type: 'text', label: 'Seller/Service Provider Name', required: true, prefillable: false },
    { id: 'purchase-date', type: 'date', label: 'Date of Purchase/Service', required: true, prefillable: false },
    { id: 'amount', type: 'number', label: 'Amount Paid (₹)', required: true, prefillable: false },
    { id: 'complaint-details', type: 'textarea', label: 'Complaint Details', required: true, prefillable: false },
    { id: 'relief-sought', type: 'textarea', label: 'Relief Sought', required: true, prefillable: false, placeholder: 'e.g., Refund, Replacement, Compensation' },
  ],
  eligibilityRules: [],
  documents: [
    { id: 'doc-1', name: 'Purchase Invoice/Bill', required: true, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 3 },
    { id: 'doc-2', name: 'Product Photos/Service Proof', required: true, acceptedFormats: ['JPG', 'PNG', 'PDF'], maxSizeMB: 5 },
    { id: 'doc-3', name: 'Correspondence with Seller (if any)', required: false, acceptedFormats: ['PDF', 'JPG'], maxSizeMB: 5 },
  ]
};

// ============================================================================
// FINAL EXPORT: ALL EXPANDED TEMPLATES
// ============================================================================

export const ALL_EXPANDED_TEMPLATES: ServiceTemplate[] = [
  // Identity & Status Certificates (4)
  MARRIAGE_CERTIFICATE_TEMPLATE,
  DISABILITY_CERTIFICATE_TEMPLATE,
  SENIOR_CITIZEN_CARD_TEMPLATE,
  EWS_CERTIFICATE_TEMPLATE,

  // Transport & Vehicles (3)
  DRIVING_LICENSE_TEMPLATE,
  VEHICLE_REGISTRATION_TEMPLATE,
  VEHICLE_NOC_TEMPLATE,

  // Property & Land (3)
  BUILDING_PLAN_APPROVAL_TEMPLATE,
  PROPERTY_MUTATION_TEMPLATE,
  SEVEN_TWELVE_EXTRACT_TEMPLATE,

  // Infrastructure & Utilities (3)
  WATER_CONNECTION_TEMPLATE,
  ELECTRICITY_CONNECTION_TEMPLATE,
  SEWERAGE_CONNECTION_TEMPLATE,

  // Business & Commerce (5)
  UDYAM_REGISTRATION_TEMPLATE,
  GST_REGISTRATION_TEMPLATE,
  SHOP_ACT_LICENSE_TEMPLATE,
  FSSAI_LICENSE_TEMPLATE,
  PROFESSIONAL_TAX_TEMPLATE,

  // Agriculture & Farmers (4)
  KISAN_CREDIT_CARD_TEMPLATE,
  CROP_INSURANCE_TEMPLATE,
  PM_KISAN_ENROLLMENT_TEMPLATE,
  FARMER_REGISTRATION_TEMPLATE,

  // Education (2)
  POST_MATRIC_SCHOLARSHIP_TEMPLATE,
  MINORITY_SCHOLARSHIP_TEMPLATE,

  // Health & Welfare (3)
  OLD_AGE_PENSION_TEMPLATE,
  WIDOW_PENSION_TEMPLATE,
  AYUSHMAN_BHARAT_TEMPLATE,

  // Grievances & RTI (3)
  RTI_APPLICATION_TEMPLATE,
  PUBLIC_GRIEVANCE_TEMPLATE,
  CONSUMER_COMPLAINT_TEMPLATE,
];

// Category-wise exports for easy access
export const TEMPLATES_BY_CATEGORY_EXPANDED = {
  'Identity & Status': [MARRIAGE_CERTIFICATE_TEMPLATE, DISABILITY_CERTIFICATE_TEMPLATE, SENIOR_CITIZEN_CARD_TEMPLATE, EWS_CERTIFICATE_TEMPLATE],
  'Transport': [DRIVING_LICENSE_TEMPLATE, VEHICLE_REGISTRATION_TEMPLATE, VEHICLE_NOC_TEMPLATE],
  'Property & Land': [BUILDING_PLAN_APPROVAL_TEMPLATE, PROPERTY_MUTATION_TEMPLATE, SEVEN_TWELVE_EXTRACT_TEMPLATE],
  'Utilities & Infrastructure': [WATER_CONNECTION_TEMPLATE, ELECTRICITY_CONNECTION_TEMPLATE, SEWERAGE_CONNECTION_TEMPLATE],
  'Business & Commerce': [UDYAM_REGISTRATION_TEMPLATE, GST_REGISTRATION_TEMPLATE, SHOP_ACT_LICENSE_TEMPLATE, FSSAI_LICENSE_TEMPLATE, PROFESSIONAL_TAX_TEMPLATE],
  'Agriculture': [KISAN_CREDIT_CARD_TEMPLATE, CROP_INSURANCE_TEMPLATE, PM_KISAN_ENROLLMENT_TEMPLATE, FARMER_REGISTRATION_TEMPLATE],
  'Education': [POST_MATRIC_SCHOLARSHIP_TEMPLATE, MINORITY_SCHOLARSHIP_TEMPLATE],
  'Health & Welfare': [OLD_AGE_PENSION_TEMPLATE, WIDOW_PENSION_TEMPLATE, AYUSHMAN_BHARAT_TEMPLATE],
  'Grievances & RTI': [RTI_APPLICATION_TEMPLATE, PUBLIC_GRIEVANCE_TEMPLATE, CONSUMER_COMPLAINT_TEMPLATE],
};

/**
 * TOTAL TEMPLATE COUNT: 9 (base) + 30 (expanded) = 39 templates
 *
 * Coverage:
 * - Birth to Death: Birth Certificate → Death Certificate ✓
 * - Education: Scholarships (Merit, SC/ST, Minority) ✓
 * - Employment: Professional Tax, Licenses ✓
 * - Business: MSME, GST, Shop Act, FSSAI ✓
 * - Property: Building Plans, Mutation, 7/12 ✓
 * - Transport: DL, RC, NOC ✓
 * - Agriculture: KCC, Crop Insurance, PM-KISAN ✓
 * - Welfare: Pension (Old Age, Widow), Disability, Ayushman ✓
 * - Utilities: Water, Electricity, Sewerage ✓
 * - Grievances: RTI, Public Grievance, Consumer ✓
 * - Municipal: Trade License, Property Tax, Ration Card ✓
 */
