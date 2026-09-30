/**
 * FormTemplates — Pre-built form templates for common government use cases.
 *
 * Three templates: Citizen Registration, Licence Application, Grievance Form.
 * Each contains a complete BuilderState with fields, validation rules,
 * sections, layout, and metadata.
 */

import type { FormTemplate, BuilderState } from '../components/form-builder/types';

// ---------------------------------------------------------------------------
// Citizen Registration Template
// ---------------------------------------------------------------------------

const citizenRegistrationState: BuilderState = {
  metadata: {
    serviceName: 'Citizen Registration',
    description: 'Register as a citizen to access government services',
    category: 'Registration',
    department: 'Department of Administrative Reforms',
  },
  fields: [
    {
      id: 'full_name',
      type: 'text',
      label: 'Full Name',
      placeholder: 'Enter your full name as per Aadhaar',
      required: true,
      validation: { minLength: 2, maxLength: 100 },
    },
    {
      id: 'date_of_birth',
      type: 'date',
      label: 'Date of Birth',
      required: true,
    },
    {
      id: 'gender',
      type: 'radio',
      label: 'Gender',
      required: true,
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'aadhaar_number',
      type: 'text',
      label: 'Aadhaar Number',
      placeholder: 'XXXX XXXX XXXX',
      required: true,
      validatorType: 'aadhaar',
      validation: { minLength: 12, maxLength: 14 },
    },
    {
      id: 'mobile_number',
      type: 'phone',
      label: 'Mobile Number',
      placeholder: '+91 XXXXX XXXXX',
      required: true,
      validatorType: 'mobile_in',
    },
    {
      id: 'email_address',
      type: 'email',
      label: 'Email Address',
      placeholder: 'email@example.com',
      required: false,
    },
    {
      id: 'address',
      type: 'textarea',
      label: 'Residential Address',
      placeholder: 'Enter your full residential address',
      required: true,
      validation: { minLength: 10, maxLength: 500 },
    },
    {
      id: 'pincode',
      type: 'text',
      label: 'PIN Code',
      placeholder: 'XXXXXX',
      required: true,
      validatorType: 'pincode_in',
    },
  ],
  sections: [
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'Basic personal details',
      fieldIds: ['full_name', 'date_of_birth', 'gender', 'aadhaar_number'],
    },
    {
      id: 'contact_info',
      title: 'Contact Information',
      description: 'How to reach you',
      fieldIds: ['mobile_number', 'email_address', 'address', 'pincode'],
    },
  ],
  formSettings: {
    columns: 2,
    gap: 'md',
  },
  crossFieldRules: [],
};

// ---------------------------------------------------------------------------
// Licence Application Template
// ---------------------------------------------------------------------------

const licenceApplicationState: BuilderState = {
  metadata: {
    serviceName: 'Licence Application',
    description: 'Apply for a new licence or renew an existing one',
    category: 'Licence',
    department: 'Department of Licensing',
  },
  fields: [
    {
      id: 'applicant_name',
      type: 'text',
      label: 'Applicant Name',
      placeholder: 'Full name as per ID proof',
      required: true,
      validation: { minLength: 2, maxLength: 100 },
    },
    {
      id: 'applicant_email',
      type: 'email',
      label: 'Email Address',
      placeholder: 'email@example.com',
      required: true,
    },
    {
      id: 'applicant_phone',
      type: 'phone',
      label: 'Phone Number',
      placeholder: '+91 XXXXX XXXXX',
      required: true,
      validatorType: 'mobile_in',
    },
    {
      id: 'licence_type',
      type: 'dropdown',
      label: 'Licence Type',
      required: true,
      options: [
        { value: 'new', label: 'New Licence' },
        { value: 'renewal', label: 'Renewal' },
        { value: 'duplicate', label: 'Duplicate' },
        { value: 'amendment', label: 'Amendment' },
      ],
    },
    {
      id: 'existing_licence_number',
      type: 'text',
      label: 'Existing Licence Number',
      placeholder: 'Enter your existing licence number',
      required: false,
      conditional: {
        field: 'licence_type',
        operator: 'not_equals',
        value: 'new',
      },
    },
    {
      id: 'start_date',
      type: 'date',
      label: 'Licence Start Date',
      required: true,
    },
    {
      id: 'end_date',
      type: 'date',
      label: 'Licence End Date',
      required: true,
    },
    {
      id: 'address',
      type: 'textarea',
      label: 'Business Address',
      placeholder: 'Enter the business address',
      required: true,
      validation: { minLength: 10, maxLength: 500 },
    },
    {
      id: 'id_proof',
      type: 'file',
      label: 'ID Proof Document',
      helpText: 'Upload Aadhaar, PAN, or Voter ID (PDF/JPG, max 5MB)',
      required: true,
      validation: { maxSizeMB: 5, allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
    },
  ],
  sections: [
    {
      id: 'applicant_details',
      title: 'Applicant Details',
      fieldIds: ['applicant_name', 'applicant_email', 'applicant_phone'],
    },
    {
      id: 'licence_details',
      title: 'Licence Details',
      fieldIds: ['licence_type', 'existing_licence_number', 'start_date', 'end_date'],
    },
    {
      id: 'supporting_docs',
      title: 'Supporting Documents',
      fieldIds: ['address', 'id_proof'],
    },
  ],
  formSettings: {
    columns: 2,
    gap: 'md',
  },
  crossFieldRules: [
    {
      type: 'date_after',
      fields: ['start_date', 'end_date'],
      message: 'End date must be after start date',
    },
  ],
};

// ---------------------------------------------------------------------------
// Grievance Form Template
// ---------------------------------------------------------------------------

const grievanceFormState: BuilderState = {
  metadata: {
    serviceName: 'Grievance Form',
    description: 'Submit a grievance or complaint to the department',
    category: 'Grievance',
    department: 'Department of Public Grievances',
  },
  fields: [
    {
      id: 'complainant_name',
      type: 'text',
      label: 'Complainant Name',
      placeholder: 'Your full name',
      required: true,
      validation: { minLength: 2, maxLength: 100 },
    },
    {
      id: 'complainant_phone',
      type: 'phone',
      label: 'Phone Number',
      placeholder: '+91 XXXXX XXXXX',
      required: true,
      validatorType: 'mobile_in',
    },
    {
      id: 'complainant_email',
      type: 'email',
      label: 'Email Address',
      placeholder: 'email@example.com',
      required: false,
    },
    {
      id: 'grievance_category',
      type: 'dropdown',
      label: 'Grievance Category',
      required: true,
      options: [
        { value: 'service_delay', label: 'Service Delay' },
        { value: 'corruption', label: 'Corruption' },
        { value: 'staff_behaviour', label: 'Staff Behaviour' },
        { value: 'infrastructure', label: 'Infrastructure Issue' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'other_category_description',
      type: 'text',
      label: 'Specify Category',
      placeholder: 'Describe the category',
      required: true,
      conditional: {
        field: 'grievance_category',
        operator: 'equals',
        value: 'other',
      },
    },
    {
      id: 'grievance_description',
      type: 'textarea',
      label: 'Grievance Description',
      placeholder: 'Describe your grievance in detail',
      required: true,
      validation: { minLength: 20, maxLength: 2000 },
    },
    {
      id: 'incident_date',
      type: 'date',
      label: 'Date of Incident',
      required: false,
    },
    {
      id: 'supporting_document',
      type: 'file',
      label: 'Supporting Document',
      helpText: 'Upload any supporting evidence (PDF/JPG/PNG, max 10MB)',
      required: false,
      validation: { maxSizeMB: 10, allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
    },
    {
      id: 'anonymous_submission',
      type: 'checkbox',
      label: 'Submit anonymously',
      helpText: 'Your personal details will not be shared with the department',
      required: false,
    },
  ],
  sections: [
    {
      id: 'complainant_info',
      title: 'Complainant Information',
      fieldIds: ['complainant_name', 'complainant_phone', 'complainant_email'],
    },
    {
      id: 'grievance_details',
      title: 'Grievance Details',
      fieldIds: [
        'grievance_category',
        'other_category_description',
        'grievance_description',
        'incident_date',
      ],
    },
    {
      id: 'attachments',
      title: 'Attachments & Options',
      fieldIds: ['supporting_document', 'anonymous_submission'],
    },
  ],
  formSettings: {
    columns: 1,
    gap: 'md',
  },
  crossFieldRules: [],
};

// ---------------------------------------------------------------------------
// Exported templates
// ---------------------------------------------------------------------------

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'citizen-registration',
    name: 'Citizen Registration',
    description:
      'A standard citizen registration form with personal details, Aadhaar verification, contact information, and address fields.',
    fieldSummary: [
      'Full Name',
      'Date of Birth',
      'Gender',
      'Aadhaar Number',
      'Mobile Number',
      'Email',
      'Address',
      'PIN Code',
    ],
    state: citizenRegistrationState,
  },
  {
    id: 'licence-application',
    name: 'Licence Application',
    description:
      'A licence application form with applicant details, licence type selection, date range, document upload, and conditional fields for renewals.',
    fieldSummary: [
      'Applicant Name',
      'Email',
      'Phone',
      'Licence Type',
      'Existing Licence Number (conditional)',
      'Start Date',
      'End Date',
      'Business Address',
      'ID Proof Upload',
    ],
    state: licenceApplicationState,
  },
  {
    id: 'grievance-form',
    name: 'Grievance Form',
    description:
      'A grievance submission form with complainant details, category selection, detailed description, file attachment, and anonymous submission option.',
    fieldSummary: [
      'Complainant Name',
      'Phone',
      'Email',
      'Category',
      'Specify Category (conditional)',
      'Description',
      'Incident Date',
      'Supporting Document',
      'Anonymous Submission',
    ],
    state: grievanceFormState,
  },
];
