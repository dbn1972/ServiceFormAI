/**
 * Comprehensive mock data for end-to-end visualization
 * Simulates a fully operational government service platform
 */

// Mock Tenant Organization
export const MOCK_TENANT = {
  id: 'tenant-mh-001',
  name: 'State Welfare Department',
  state: 'Maharashtra',
  logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Emblem_of_Maharashtra.svg/200px-Emblem_of_Maharashtra.svg.png',
  adminName: 'Rajesh Kumar',
  adminEmail: 'rajesh.kumar@maharashtra.gov.in',
  adminPhone: '+91 98765 43210',
  registeredDate: '2025-11-15',
  servicesPublished: 12,
  totalApplications: 4827,
  activeOfficers: 24,
};

// Mock Officers/Team Members
export const MOCK_OFFICERS = [
  {
    id: 'officer-001',
    name: 'Priya Sharma',
    role: 'Senior Officer',
    department: 'Education',
    email: 'priya.sharma@maharashtra.gov.in',
    phone: '+91 98765 43211',
    assignedServices: 3,
    applicationsReviewed: 456,
    avgProcessingTime: '2.3 days',
    status: 'active',
    avatar: 'PS',
  },
  {
    id: 'officer-002',
    name: 'Amit Patel',
    role: 'Officer',
    department: 'Revenue',
    email: 'amit.patel@maharashtra.gov.in',
    phone: '+91 98765 43212',
    assignedServices: 4,
    applicationsReviewed: 623,
    avgProcessingTime: '1.8 days',
    status: 'active',
    avatar: 'AP',
  },
  {
    id: 'officer-003',
    name: 'Sneha Desai',
    role: 'Senior Officer',
    department: 'Civil Records',
    email: 'sneha.desai@maharashtra.gov.in',
    phone: '+91 98765 43213',
    assignedServices: 2,
    applicationsReviewed: 892,
    avgProcessingTime: '1.2 days',
    status: 'active',
    avatar: 'SD',
  },
  {
    id: 'officer-004',
    name: 'Vikram Singh',
    role: 'Officer',
    department: 'Health',
    email: 'vikram.singh@maharashtra.gov.in',
    phone: '+91 98765 43214',
    assignedServices: 2,
    applicationsReviewed: 234,
    avgProcessingTime: '3.1 days',
    status: 'active',
    avatar: 'VS',
  },
  {
    id: 'officer-005',
    name: 'Anjali Rao',
    role: 'Junior Officer',
    department: 'Municipal',
    email: 'anjali.rao@maharashtra.gov.in',
    phone: '+91 98765 43215',
    assignedServices: 1,
    applicationsReviewed: 156,
    avgProcessingTime: '2.7 days',
    status: 'active',
    avatar: 'AR',
  },
];

// Mock Published Services (subset of templates that are live)
export const MOCK_PUBLISHED_SERVICES = [
  {
    id: 'service-001',
    templateId: 'birth-certificate',
    name: 'Birth Certificate',
    category: 'Civil Records',
    status: 'published',
    publishedDate: '2025-12-01',
    totalApplications: 1243,
    pendingApplications: 34,
    approvedApplications: 1189,
    rejectedApplications: 20,
    avgProcessingTime: '1.2 days',
    slaCompliance: 98,
    citizenSatisfaction: 4.7,
    assignedOfficers: ['officer-003'],
  },
  {
    id: 'service-002',
    templateId: 'scholarship-application',
    name: 'Scholarship Application',
    category: 'Education',
    status: 'published',
    publishedDate: '2025-11-20',
    totalApplications: 2156,
    pendingApplications: 178,
    approvedApplications: 1834,
    rejectedApplications: 144,
    avgProcessingTime: '12.4 days',
    slaCompliance: 89,
    citizenSatisfaction: 4.5,
    assignedOfficers: ['officer-001'],
  },
  {
    id: 'service-003',
    templateId: 'income-certificate',
    name: 'Income Certificate',
    category: 'Revenue',
    status: 'published',
    publishedDate: '2025-12-05',
    totalApplications: 876,
    pendingApplications: 43,
    approvedApplications: 798,
    rejectedApplications: 35,
    avgProcessingTime: '2.8 days',
    slaCompliance: 94,
    citizenSatisfaction: 4.6,
    assignedOfficers: ['officer-002'],
  },
  {
    id: 'service-004',
    templateId: 'caste-certificate',
    name: 'Caste Certificate',
    category: 'Revenue',
    status: 'published',
    publishedDate: '2025-11-25',
    totalApplications: 234,
    pendingApplications: 12,
    approvedApplications: 213,
    rejectedApplications: 9,
    avgProcessingTime: '5.6 days',
    slaCompliance: 87,
    citizenSatisfaction: 4.4,
    assignedOfficers: ['officer-002'],
  },
  {
    id: 'service-005',
    templateId: 'health-card',
    name: 'Health Card',
    category: 'Health',
    status: 'published',
    publishedDate: '2025-12-10',
    totalApplications: 167,
    pendingApplications: 28,
    approvedApplications: 134,
    rejectedApplications: 5,
    avgProcessingTime: '3.2 days',
    slaCompliance: 92,
    citizenSatisfaction: 4.8,
    assignedOfficers: ['officer-004'],
  },
  {
    id: 'service-006',
    templateId: 'property-tax',
    name: 'Property Tax Payment',
    category: 'Municipal',
    status: 'published',
    publishedDate: '2025-12-01',
    totalApplications: 456,
    pendingApplications: 0,
    approvedApplications: 456,
    rejectedApplications: 0,
    avgProcessingTime: '0.1 days',
    slaCompliance: 100,
    citizenSatisfaction: 4.9,
    assignedOfficers: ['officer-005'],
  },
];

// Mock Citizen Applications
export const MOCK_APPLICATIONS = [
  {
    id: 'app-001',
    serviceId: 'service-001',
    serviceName: 'Birth Certificate',
    applicantName: 'Rahul Verma',
    applicantEmail: 'rahul.verma@gmail.com',
    applicantPhone: '+91 98765 11111',
    status: 'pending',
    submittedDate: '2026-04-29T10:30:00Z',
    lastUpdated: '2026-04-29T10:30:00Z',
    assignedOfficer: 'officer-003',
    priority: 'normal',
    slaDeadline: '2026-05-06T10:30:00Z',
    daysRemaining: 6,
  },
  {
    id: 'app-002',
    serviceId: 'service-002',
    serviceName: 'Scholarship Application',
    applicantName: 'Ananya Reddy',
    applicantEmail: 'ananya.reddy@gmail.com',
    applicantPhone: '+91 98765 22222',
    status: 'under_review',
    submittedDate: '2026-04-15T14:20:00Z',
    lastUpdated: '2026-04-28T09:15:00Z',
    assignedOfficer: 'officer-001',
    priority: 'high',
    slaDeadline: '2026-05-30T14:20:00Z',
    daysRemaining: 30,
  },
  {
    id: 'app-003',
    serviceId: 'service-001',
    serviceName: 'Birth Certificate',
    applicantName: 'Deepak Joshi',
    applicantEmail: 'deepak.joshi@gmail.com',
    applicantPhone: '+91 98765 33333',
    status: 'approved',
    submittedDate: '2026-04-20T11:00:00Z',
    lastUpdated: '2026-04-21T16:30:00Z',
    assignedOfficer: 'officer-003',
    priority: 'normal',
    slaDeadline: '2026-04-27T11:00:00Z',
    daysRemaining: 0,
    approvedDate: '2026-04-21T16:30:00Z',
  },
  {
    id: 'app-004',
    serviceId: 'service-003',
    serviceName: 'Income Certificate',
    applicantName: 'Kavita Mehta',
    applicantEmail: 'kavita.mehta@gmail.com',
    applicantPhone: '+91 98765 44444',
    status: 'pending',
    submittedDate: '2026-04-28T09:45:00Z',
    lastUpdated: '2026-04-28T09:45:00Z',
    assignedOfficer: 'officer-002',
    priority: 'urgent',
    slaDeadline: '2026-05-12T09:45:00Z',
    daysRemaining: 12,
  },
  {
    id: 'app-005',
    serviceId: 'service-002',
    serviceName: 'Scholarship Application',
    applicantName: 'Rohan Gupta',
    applicantEmail: 'rohan.gupta@gmail.com',
    applicantPhone: '+91 98765 55555',
    status: 'rejected',
    submittedDate: '2026-03-10T13:20:00Z',
    lastUpdated: '2026-04-05T10:00:00Z',
    assignedOfficer: 'officer-001',
    priority: 'normal',
    slaDeadline: '2026-04-24T13:20:00Z',
    daysRemaining: 0,
    rejectedDate: '2026-04-05T10:00:00Z',
    rejectionReason: 'Income exceeds eligibility threshold',
  },
];

// Mock Notifications
export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-001',
    type: 'application',
    title: 'New application received',
    message: 'Birth Certificate application from Rahul Verma',
    timestamp: '2026-04-29T10:30:00Z',
    read: false,
    actionUrl: '/tenant/applications/app-001',
  },
  {
    id: 'notif-002',
    type: 'sla_warning',
    title: 'SLA deadline approaching',
    message: 'Income Certificate application (Kavita Mehta) due in 2 days',
    timestamp: '2026-04-28T08:00:00Z',
    read: false,
    actionUrl: '/tenant/applications/app-004',
  },
  {
    id: 'notif-003',
    type: 'approval',
    title: 'Application approved',
    message: 'Birth Certificate for Deepak Joshi has been approved',
    timestamp: '2026-04-21T16:30:00Z',
    read: true,
    actionUrl: '/tenant/applications/app-003',
  },
  {
    id: 'notif-004',
    type: 'system',
    title: 'New service published',
    message: 'Health Card service is now live',
    timestamp: '2026-04-10T12:00:00Z',
    read: true,
    actionUrl: '/tenant/dashboard',
  },
];

// Mock Analytics Data
export const MOCK_ANALYTICS = {
  overview: {
    totalApplications: 4827,
    approvalRate: 92,
    slaCompliance: 94,
    citizenSatisfaction: 4.6,
  },
  trends: {
    applicationsOverTime: [
      { date: '2026-03-01', applications: 234, approvals: 198, rejections: 12 },
      { date: '2026-03-08', applications: 267, approvals: 245, rejections: 15 },
      { date: '2026-03-15', applications: 312, approvals: 289, rejections: 18 },
      { date: '2026-03-22', applications: 289, approvals: 267, rejections: 14 },
      { date: '2026-03-29', applications: 345, approvals: 318, rejections: 19 },
      { date: '2026-04-05', applications: 398, approvals: 365, rejections: 22 },
      { date: '2026-04-12', applications: 423, approvals: 389, rejections: 25 },
      { date: '2026-04-19', applications: 456, approvals: 421, rejections: 27 },
      { date: '2026-04-26', applications: 478, approvals: 445, rejections: 24 },
    ],
  },
  categoryPerformance: [
    { category: 'Civil Records', applications: 1243, approvalRate: 96, slaCompliance: 98 },
    { category: 'Education', applications: 2156, approvalRate: 85, slaCompliance: 89 },
    { category: 'Revenue', applications: 1110, approvalRate: 91, slaCompliance: 92 },
    { category: 'Health', applications: 167, approvalRate: 96, slaCompliance: 92 },
    { category: 'Municipal', applications: 456, approvalRate: 100, slaCompliance: 100 },
  ],
  topServices: [
    { name: 'Scholarship Application', applications: 2156, trend: '+12%' },
    { name: 'Birth Certificate', applications: 1243, trend: '+8%' },
    { name: 'Income Certificate', applications: 876, trend: '+15%' },
    { name: 'Property Tax Payment', applications: 456, trend: '+5%' },
    { name: 'Caste Certificate', applications: 234, trend: '+3%' },
  ],
};

// Mock Activity Log
export const MOCK_ACTIVITY = [
  {
    id: 'activity-001',
    type: 'application_submitted',
    user: 'Rahul Verma',
    action: 'submitted Birth Certificate application',
    timestamp: '2026-04-29T10:30:00Z',
    details: 'Application ID: app-001',
  },
  {
    id: 'activity-002',
    type: 'application_assigned',
    user: 'System',
    action: 'assigned application to Sneha Desai',
    timestamp: '2026-04-29T10:31:00Z',
    details: 'Application ID: app-001',
  },
  {
    id: 'activity-003',
    type: 'service_published',
    user: 'Rajesh Kumar',
    action: 'published Health Card service',
    timestamp: '2026-04-10T12:00:00Z',
    details: 'Service ID: service-005',
  },
  {
    id: 'activity-004',
    type: 'application_approved',
    user: 'Sneha Desai',
    action: 'approved Birth Certificate application',
    timestamp: '2026-04-21T16:30:00Z',
    details: 'Applicant: Deepak Joshi, Processing time: 1.2 days',
  },
  {
    id: 'activity-005',
    type: 'application_rejected',
    user: 'Priya Sharma',
    action: 'rejected Scholarship application',
    timestamp: '2026-04-05T10:00:00Z',
    details: 'Applicant: Rohan Gupta, Reason: Income exceeds threshold',
  },
];

// Helper function to get mock data by ID
export function getMockService(serviceId: string) {
  return MOCK_PUBLISHED_SERVICES.find(s => s.id === serviceId);
}

export function getMockOfficer(officerId: string) {
  return MOCK_OFFICERS.find(o => o.id === officerId);
}

export function getMockApplication(applicationId: string) {
  return MOCK_APPLICATIONS.find(a => a.id === applicationId);
}

// Helper to generate realistic random data
export function generateMockApplications(count: number) {
  const statuses = ['pending', 'under_review', 'approved', 'rejected'];
  const names = ['Amit', 'Priya', 'Rahul', 'Ananya', 'Deepak', 'Kavita', 'Rohan', 'Sneha'];
  const lastNames = ['Kumar', 'Sharma', 'Patel', 'Reddy', 'Verma', 'Mehta', 'Gupta', 'Desai'];

  return Array.from({ length: count }, (_, i) => {
    const firstName = names[Math.floor(Math.random() * names.length)]!;
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]!;
    const service = MOCK_PUBLISHED_SERVICES[Math.floor(Math.random() * MOCK_PUBLISHED_SERVICES.length)]!;
    const officer = MOCK_OFFICERS[Math.floor(Math.random() * MOCK_OFFICERS.length)]!;
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      id: `app-gen-${i}`,
      serviceId: service.id,
      serviceName: service.name,
      applicantName: `${firstName} ${lastName}`,
      applicantEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
      applicantPhone: `+91 ${Math.floor(Math.random() * 90000) + 10000} ${Math.floor(Math.random() * 90000) + 10000}`,
      status,
      submittedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignedOfficer: officer.id,
      priority: Math.random() > 0.7 ? 'urgent' : 'normal',
      slaDeadline: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: Math.floor(Math.random() * 30),
    };
  });
}
