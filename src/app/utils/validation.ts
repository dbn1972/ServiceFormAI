// Validation utilities for Indian government forms

export const validators = {
  // Mobile number validation (Indian format)
  mobile: (value: string): string | true => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) return 'Mobile number is required';
    if (cleaned.length !== 10) return 'Mobile number must be 10 digits';
    if (!cleaned.match(/^[6-9]/)) return 'Mobile number must start with 6, 7, 8, or 9';
    return true;
  },

  // Email validation
  email: (value: string): string | true => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Invalid email address';
    return true;
  },

  // Password validation
  password: (value: string): string | true => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
    return true;
  },

  // Aadhaar number validation
  aadhaar: (value: string): string | true => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) return 'Aadhaar number is required';
    if (cleaned.length !== 12) return 'Aadhaar number must be 12 digits';
    
    // Verhoeff algorithm for Aadhaar validation
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    ];
    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
    ];

    let c = 0;
    const invertedArray = cleaned.split('').map(Number).reverse();

    invertedArray.forEach((val, i) => {
      c = d[c]![p[i % 8]![val]!]!;
    });

    if (c !== 0) return 'Invalid Aadhaar number';
    return true;
  },

  // PAN card validation
  pan: (value: string): string | true => {
    if (!value) return 'PAN is required';
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(value.toUpperCase())) return 'Invalid PAN format (e.g., ABCDE1234F)';
    return true;
  },

  // Pincode validation
  pincode: (value: string): string | true => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) return 'Pincode is required';
    if (cleaned.length !== 6) return 'Pincode must be 6 digits';
    return true;
  },

  // Required field validation
  required: (fieldName: string) => (value: any): string | true => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return true;
  },

  // Age validation
  age: (minAge: number = 18) => (value: string): string | true => {
    if (!value) return 'Date of birth is required';
    const today = new Date();
    const birthDate = new Date(value);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < minAge) return `You must be at least ${minAge} years old`;
    return true;
  },

  // File validation
  file: (maxSizeMB: number = 5, allowedTypes: string[] = []) => (files: FileList | null): string | true => {
    if (!files || files.length === 0) return 'File is required';
    const file = files[0];
    if (!file) return 'File is required';
    
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) return `File size must be less than ${maxSizeMB}MB`;
    
    // Check file type
    if (allowedTypes.length > 0) {
      const fileType = file.type;
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const isValid = allowedTypes.some(type => 
        fileType.includes(type) || fileExt === type
      );
      if (!isValid) return `File type must be ${allowedTypes.join(', ')}`;
    }
    
    return true;
  },

  // IFSC code validation
  ifsc: (value: string): string | true => {
    if (!value) return 'IFSC code is required';
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(value.toUpperCase())) return 'Invalid IFSC code format';
    return true;
  },

  // Bank account number validation
  accountNumber: (value: string): string | true => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) return 'Account number is required';
    if (cleaned.length < 9 || cleaned.length > 18) return 'Account number must be 9-18 digits';
    return true;
  },

  // Amount validation
  amount: (min: number = 0, max?: number) => (value: string | number): string | true => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'Invalid amount';
    if (num < min) return `Amount must be at least ₹${min}`;
    if (max && num > max) return `Amount must not exceed ₹${max}`;
    return true;
  },
};

// Format utilities
export const formatters = {
  mobile: (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{5})(\d{0,5})/, (_, p1, p2) => 
        p2 ? `${p1} ${p2}` : p1
      );
    }
    return cleaned.slice(0, 10);
  },

  aadhaar: (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{4})(\d{0,4})(\d{0,4})/, (_, p1, p2, p3) => {
      let result = p1;
      if (p2) result += `-${p2}`;
      if (p3) result += `-${p3}`;
      return result;
    }).slice(0, 14); // 12 digits + 2 hyphens
  },

  pan: (value: string): string => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  },

  pincode: (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 6);
  },

  amount: (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  },

  date: (value: string | Date): string => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  },

  ifsc: (value: string): string => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
  },
};

// Helper to generate application ID
export function generateApplicationId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `APP-${year}-${random}`;
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
