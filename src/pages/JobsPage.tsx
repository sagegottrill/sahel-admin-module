import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import JobCard from '../components/JobCard';
import RequirementsModal from '../components/RequirementsModal';
import { FormDefinition } from '../types';
import FilterPanel from '../components/FilterPanel';
import { dataClient } from '../lib/dataClient';

interface JobsPageProps {
  onNavigate: (page: string) => void;
}

export default function JobsPage({ onNavigate }: JobsPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [filterDept, setFilterDept] = useState('All Departments');
  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const data = await dataClient.listForms();
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = forms.filter(form => {
    const matchesSearch = searchTerm === '' ||
      form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    // UI filter scaffolding; can be extended with form tags.
    const matchesType = filterType === 'All Types';
    const matchesDept = filterDept === 'All Departments';
    return matchesSearch && matchesType && matchesDept;
  });

  const departments = ['All Departments'];
  const types = ['All Types'];


  const handleReset = () => {
    setFilterDept('All Departments');
    setFilterType('All Types');
    setSearchTerm('');
  };

  const handleApplyClick = (job: FormDefinition) => {
    setSelectedForm(job);
    setIsModalOpen(true);
  };

  const handleProceedToApply = () => {
    if (selectedForm) {
      setIsModalOpen(false);
      // Store the full form object so ApplyPage can render fields
      localStorage.setItem('selectedForm', JSON.stringify(selectedForm));

      if (!user) {
        // Redirect to auth page with return path
        navigate('/auth', {
          state: {
            returnTo: '/',
            view: 'apply'
          }
        });
        return;
      }

      onNavigate('apply');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold font-serif text-brand-blue mb-8">Forms</h1>

      {/* General guidance */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-8 border-l-4 border-brand-teal">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General expectations */}
          <div>
            <h2 className="text-2xl font-bold font-serif text-brand-blue mb-4">Submission guidance</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-brand-teal mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Fill required fields accurately; keep entries concise for low-bandwidth environments.</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-brand-teal mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Some deployments may require identity verification and/or manual approval.</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-brand-teal mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Do not include secrets (passwords, API keys) in free-text fields.</span>
              </li>
            </ul>
          </div>

          {/* Enrollment flow */}
          <div>
            <h2 className="text-2xl font-bold font-serif text-brand-blue mb-4">How it works</h2>
            <div className="space-y-4 text-gray-700">
              <p className="flex items-start gap-3">
                <svg className="w-5 h-5 text-brand-teal mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>Choose a form, submit data, and track status in your console.</span>
              </p>
              <p className="text-sm text-gray-600 italic">
                <strong>Note:</strong> Admins can clear submissions as Approved/Rejected.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                <div>
                  <p className="text-sm font-semibold text-[#1e3a5f] mb-2">Attachments</p>
                  <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                    <li>Attachments are deployment-specific. If enabled, keep files small.</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border-l-4 border-brand-blue rounded">
                <p className="text-sm text-brand-blue">
                  <strong>Tip:</strong> If you upload documents, keep them small for low-bandwidth environments.
                  <br />
                  <span className="block mt-2 font-medium">
                    Please compress your PDF file before uploading to ensure faster submission. You can use <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" rel="noopener noreferrer" className="underline text-[#1e3a5f] hover:text-[#4a9d7e]">iLovePDF</a> or any other tool.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <FilterPanel
            selectedDepartment={filterDept}
            selectedType={filterType}
            keyword={searchTerm}
            onDepartmentChange={setFilterDept}
            onTypeChange={setFilterType}
            onKeywordChange={setSearchTerm}
            onReset={handleReset}
          />
        </div>

        <div className="lg:col-span-3">
          <div className="mb-6">
            <p className="text-gray-600">
              Showing <span className="font-semibold text-[#1e3a5f]">{filteredJobs.length}</span> forms
            </p>
          </div>

          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map(job => (
                <JobCard key={job.id} job={job} onApply={handleApplyClick} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No forms found matching your criteria</p>
              <button
                onClick={handleReset}
                className="mt-4 text-[#4a9d7e] hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Requirements Modal */}
      {selectedForm && (
        <RequirementsModal
          job={selectedForm as any}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onProceed={handleProceedToApply}
        />
      )}
    </div>
  );
}
