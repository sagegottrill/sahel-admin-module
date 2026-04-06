interface FilterPanelProps {
  selectedDepartment: string;
  selectedType: string;
  keyword: string;
  onDepartmentChange: (dept: string) => void;
  onTypeChange: (type: string) => void;
  onKeywordChange: (keyword: string) => void;
  onReset: () => void;
}

export default function FilterPanel({
  selectedDepartment,
  selectedType,
  keyword,
  onDepartmentChange,
  onTypeChange,
  onKeywordChange,
  onReset
}: FilterPanelProps) {
  const departments = [
    'All Departments',
    'Field Operations',
    'Access Control',
    'Platform Operations',
    'Information Technology',
    'Finance'
  ];

  const types = ['All Types', 'Operations', 'Security', 'Administration', 'Technical'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
      <h3 className="text-lg font-semibold text-[#1e3a5f] mb-4">Filter Roles</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Keyword</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="Search roles..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a9d7e] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a9d7e] focus:border-transparent"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role Type</label>
          <div className="space-y-2">
            {types.map(type => (
              <label key={type} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={selectedType === type}
                  onChange={(e) => onTypeChange(e.target.value)}
                  className="mr-2 text-[#4a9d7e] focus:ring-[#4a9d7e]"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={onReset}
          className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
