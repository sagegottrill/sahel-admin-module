export interface ManagedUser {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  unit: string;
  status: 'Draft' | 'Active' | 'Suspended' | 'Pending Review';
  createdDate: string;
}

export const managedUsersSeed: ManagedUser[] = [
  {
    id: 'USR001',
    reference: 'SRS-USER-2024-001',
    fullName: 'Amina Mohammed',
    email: 'amina.mohammed@example.org',
    phone: '+2348012345678',
    role: 'Data Scout',
    unit: 'Field Operations',
    status: 'Active',
    createdDate: '2024-11-15'
  },
  {
    id: 'USR002',
    reference: 'SRS-USER-2024-002',
    fullName: 'Ibrahim Musa',
    email: 'ibrahim.musa@example.org',
    phone: '+2348023456789',
    role: 'Warden',
    unit: 'Access Control',
    status: 'Pending Review',
    createdDate: '2024-11-16'
  },
  {
    id: 'USR003',
    reference: 'SRS-USER-2024-003',
    fullName: 'Fatima Abubakar',
    email: 'fatima.abubakar@example.org',
    phone: '+2348034567890',
    role: 'System Admin',
    unit: 'Platform Operations',
    status: 'Active',
    createdDate: '2024-11-17'
  }
];
