interface StatusBadgeProps {
  status: 'Draft' | 'Submitted' | 'Shortlisted' | 'Interview';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Submitted':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Shortlisted':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Interview':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {status}
    </span>
  );
}
