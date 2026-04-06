import type { FormDefinition } from '../types';

interface RequirementsModalProps {
    job: FormDefinition;
    isOpen: boolean;
    onClose: () => void;
    onProceed: () => void;
}

export default function RequirementsModal({ job, isOpen, onClose, onProceed }: RequirementsModalProps) {
    if (!isOpen) return null;

    const requiredCount = (job.fields || []).filter((f: any) => f.required).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-[#1e3a5f]">{job.name}</h2>
                        <p className="text-gray-500 text-sm">{job.fields?.length || 0} fields • {requiredCount} required</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-[#1e3a5f] mb-2">Form description</h3>
                        <p className="text-gray-700 leading-relaxed">{job.description || 'No description provided.'}</p>
                    </div>

                    <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                        <h3 className="text-lg font-semibold text-[#1e3a5f] mb-3">What you’ll submit</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            You’ll submit a structured record. Keep text short and avoid sensitive secrets.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            {(job.fields || []).slice(0, 8).map((f: any) => (
                                <li key={f.key}>
                                    <span className="font-medium text-brand-blue">{f.label}</span>
                                    {f.required ? <span className="text-xs text-gray-500"> (required)</span> : null}
                                </li>
                            ))}
                            {(job.fields || []).length > 8 ? (
                                <li className="text-gray-500">…and {job.fields.length - 8} more</li>
                            ) : null}
                        </ul>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-4 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onProceed}
                        className="px-6 py-2.5 bg-[#4a9d7e] text-white rounded-lg font-bold hover:bg-[#3d8568] transition-colors shadow-md hover:shadow-lg"
                    >
                        Proceed to Form
                    </button>
                </div>
            </div >
        </div >
    );
}
