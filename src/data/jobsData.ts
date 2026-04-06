export interface RoleTemplate {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Operations' | 'Security' | 'Administration' | 'Technical';
  description: string;
  requirements: string[];
  requiredDocuments: string[];
  verificationLabel: string;
}

export const rolesData: RoleTemplate[] = [
  {
    id: 'ROLE-DS-001',
    title: 'Data Scout',
    department: 'Field Operations',
    location: 'Multi-site',
    type: 'Operations',
    description: 'Collect, verify, and submit structured field observations and incident reports.',
    requirements: [
      'Basic smartphone literacy',
      'Ability to follow verification protocols',
      'Comfort working in low-connectivity environments'
    ],
    requiredDocuments: ['Government-issued ID (optional)', 'Letter of introduction (optional)'],
    verificationLabel: 'Verifier ID (if applicable)'
  },
  {
    id: 'ROLE-WD-002',
    title: 'Warden',
    department: 'Access Control',
    location: 'Site-based',
    type: 'Security',
    description: 'Manage access, onboarding checkpoints, and incident escalation at assigned sites.',
    requirements: [
      'Basic documentation skills',
      'Ability to coordinate with operations teams',
      'Familiarity with safety and escalation procedures'
    ],
    requiredDocuments: ['Government-issued ID (optional)'],
    verificationLabel: 'Site assignment code'
  },
  {
    id: 'ROLE-SA-003',
    title: 'System Admin',
    department: 'Platform Operations',
    location: 'Regional / Remote',
    type: 'Administration',
    description: 'Administer users, roles, and system configuration for secure deployments.',
    requirements: [
      'Understanding of access control principles',
      'Comfort with audit logs and operational workflows',
      'Ability to support constrained / edge deployments'
    ],
    requiredDocuments: ['Admin authorization (deployment-specific)'],
    verificationLabel: 'Admin approval token'
  }
];
