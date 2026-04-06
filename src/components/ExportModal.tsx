import { useState, useMemo } from 'react';
import { X, Download, CheckSquare, Square, FileSpreadsheet, Filter, Table } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { predictGender } from '../utils/screeningRules';

interface Application {
    id: string;
    created_at: string;
    full_name: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    status: string;
    cv_url: string;
    photo_url: string;
    other_documents: { name: string; path: string }[];
    reference_number: string;
    state_of_origin: string;
    lga: string;
    qualification: string;
    institution: string;
    year_of_graduation: string;
    license_number: string;
    date_of_birth: string;
    nin_number?: string;
}

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    filteredApplications: Application[]; // The currently filtered view key
    allApplications: Application[]; // The complete dataset for independent filtering
}

const AVAILABLE_FIELDS = [
    { id: 'reference_number', label: 'Reference Number', category: 'Application' },
    { id: 'created_at', label: 'Date Applied', category: 'Application' },
    { id: 'status', label: 'Status', category: 'Application' },
    { id: 'position', label: 'Position', category: 'Application' },
    { id: 'department', label: 'Department', category: 'Application' },

    { id: 'full_name', label: 'Full Name', category: 'Personal' },
    { id: 'email', label: 'Email', category: 'Personal' },
    { id: 'phone', label: 'Phone Number', category: 'Personal' },
    { id: 'date_of_birth', label: 'Date of Birth', category: 'Personal' },
    { id: 'age', label: 'Age', category: 'Personal' },
    { id: 'gender', label: 'Gender (AI)', category: 'Personal' },
    { id: 'state_of_origin', label: 'State of Origin', category: 'Personal' },
    { id: 'lga', label: 'LGA', category: 'Personal' },

    { id: 'qualification', label: 'Qualification', category: 'Education' },
    { id: 'institution', label: 'Institution', category: 'Education' },
    { id: 'year_of_graduation', label: 'Year of Graduation', category: 'Education' },

    { id: 'license_number', label: 'License Number', category: 'Professional' },
    { id: 'nin_number', label: 'NIN', category: 'Personal' },
    { id: 'cv_url', label: 'CV Link', category: 'Documents' },
    { id: 'photo_url', label: 'Photo Link', category: 'Documents' },
];

export default function ExportModal({ isOpen, onClose, filteredApplications, allApplications }: ExportModalProps) {
    const [selectedFields, setSelectedFields] = useState<string[]>(AVAILABLE_FIELDS.map(f => f.id));
    const [isExporting, setIsExporting] = useState(false);
    const [exportScope, setExportScope] = useState<'current' | 'all' | 'position' | 'excel'>('current');
    const [selectedPos, setSelectedPos] = useState('');

    if (!isOpen) return null;

    // Derive Positions from ALL applications
    const positions = Array.from(new Set(allApplications.map(a => a.position))).sort();

    // Determine final list
    const getExportData = () => {
        switch (exportScope) {
            case 'all':
                return allApplications;
            case 'position':
                return allApplications.filter(a => a.position === selectedPos);
            case 'current':
            default:
                return filteredApplications;
        }
    };

    const records = getExportData();

    const toggleField = (fieldId: string) => {
        if (selectedFields.includes(fieldId)) {
            setSelectedFields(selectedFields.filter(id => id !== fieldId));
        } else {
            setSelectedFields([...selectedFields, fieldId]);
        }
    };

    const toggleAll = () => {
        if (selectedFields.length === AVAILABLE_FIELDS.length) {
            setSelectedFields([]);
        } else {
            setSelectedFields(AVAILABLE_FIELDS.map(f => f.id));
        }
    };

    // Helper to format a single row
    const formatRow = (app: Application) => {
        return AVAILABLE_FIELDS
            .filter(field => selectedFields.includes(field.id))
            .map(field => {
                const key = field.id as keyof Application;
                let value = app[key];

                if (field.id === 'created_at' && value) {
                    value = new Date(value as string).toLocaleString();
                }

                if (field.id === 'age') {
                    if (app.date_of_birth) {
                        const birthDate = new Date(app.date_of_birth);
                        const today = new Date();
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const m = today.getMonth() - birthDate.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                        }
                        value = age.toString();
                    } else {
                        value = 'N/A';
                    }
                }

                if (field.id === 'gender') {
                    value = predictGender(app.full_name);
                }

                return String(value || '');
            });
    };

    const handleExport = async () => {
        if (selectedFields.length === 0) {
            alert('Please select at least one field to export.');
            return;
        }
        if (exportScope === 'position' && !selectedPos) {
            alert('Please select a position.');
            return;
        }

        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const headers = AVAILABLE_FIELDS
                .filter(field => selectedFields.includes(field.id))
                .map(field => field.label);

            if (exportScope === 'excel') {
                // EXCEL MULTI-SHEET LOGIC
                const wb = utils.book_new();
                let hasData = false;

                positions.forEach(pos => {
                    const posApps = allApplications.filter(a => a.position === pos);
                    if (posApps.length === 0) return;

                    const data = posApps.map(app => formatRow(app));
                    const ws = utils.aoa_to_sheet([headers, ...data]);

                    // Sheet names limited to 31 chars
                    const sheetName = pos.slice(0, 30).replace(/[:\\\/?*\[\]]/g, "");
                    utils.book_append_sheet(wb, ws, sheetName);
                    hasData = true;
                });

                if (hasData) {
                    writeFile(wb, `SRS_Master_Workbook_${new Date().toISOString().split('T')[0]}.xlsx`);
                } else {
                    alert('No data to export.');
                }

            } else {
                // CSV LOGIC (Legacy)
                const csvContent = [
                    headers.join(','),
                    ...records.map(app => {
                        const row = formatRow(app);
                        // CSV specific escaping
                        return row.map(cell => {
                            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                                return `"${cell.replace(/"/g, '""')}"`;
                            }
                            return cell;
                        }).join(',');
                    })
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                const filenameStr = exportScope === 'position' ? selectedPos : exportScope;
                link.setAttribute('href', url);
                link.setAttribute('download', `export_${filenameStr.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            onClose();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data.');
        } finally {
            setIsExporting(false);
        }
    };

    const categories = Array.from(new Set(AVAILABLE_FIELDS.map(f => f.category)));

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[95vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-teal/10 p-2 rounded-lg text-brand-teal">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#1e3a5f]">Export Data</h2>
                            <p className="text-sm text-gray-500">Robust CSV Generator</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">

                    {/* Scope Selection */}
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <h3 className="text-sm font-semibold text-[#1e3a5f] mb-3 flex items-center gap-2">
                            <Filter size={16} /> Export Scope
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                onClick={() => setExportScope('current')}
                                className={`px-3 py-2 rounded-md text-sm font-medium border transition-all
                    ${exportScope === 'current' ? 'bg-white border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500' : 'bg-transparent border-gray-200 text-gray-600 hover:border-blue-300'}`}
                            >
                                Current Table View ({filteredApplications.length})
                            </button>
                            <button
                                onClick={() => setExportScope('all')}
                                className={`px-3 py-2 rounded-md text-sm font-medium border transition-all
                    ${exportScope === 'all' ? 'bg-white border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500' : 'bg-transparent border-gray-200 text-gray-600 hover:border-blue-300'}`}
                            >
                                All Applications ({allApplications.length})
                            </button>
                            <button
                                onClick={() => { setExportScope('position'); setSelectedPos(positions[0] || ''); }}
                                className={`px-3 py-2 rounded-md text-sm font-medium border transition-all
                    ${exportScope === 'position' ? 'bg-white border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500' : 'bg-transparent border-gray-200 text-gray-600 hover:border-blue-300'}`}
                            >
                                Specific Position
                            </button>
                            <button
                                onClick={() => setExportScope('excel')}
                                className={`px-3 py-2 rounded-md text-sm font-medium border transition-all flex items-center justify-center gap-2
                    ${exportScope === 'excel' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm ring-1 ring-green-500' : 'bg-transparent border-gray-200 text-gray-600 hover:border-green-300'}`}
                            >
                                <Table size={14} /> Multi-Sheet Excel
                            </button>
                        </div>

                        {/* Position Dropdown */}
                        {exportScope === 'position' && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                                <select
                                    value={selectedPos}
                                    onChange={(e) => setSelectedPos(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {positions.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-sm font-medium text-gray-700">
                                Selected Columns <span className="text-gray-400 font-normal">({selectedFields.length})</span>
                            </div>
                            <button
                                onClick={toggleAll}
                                className="text-sm text-brand-teal hover:underline font-medium flex items-center gap-1.5"
                            >
                                {selectedFields.length === AVAILABLE_FIELDS.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categories.map(category => (
                                <div key={category} className="space-y-2">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{category}</h3>
                                    <div className="space-y-2">
                                        {AVAILABLE_FIELDS.filter(f => f.category === category).map(field => (
                                            <div
                                                key={field.id}
                                                onClick={() => toggleField(field.id)}
                                                className={`flex items-center gap-3 p-2 rounded border cursor-pointer select-none
                            ${selectedFields.includes(field.id)
                                                        ? 'border-brand-teal/50 bg-brand-teal/5'
                                                        : 'border-gray-100 hover:bg-gray-50'}`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center
                            ${selectedFields.includes(field.id)
                                                        ? 'bg-brand-teal border-brand-teal text-white'
                                                        : 'border-gray-300 bg-white'}`}>
                                                    {selectedFields.includes(field.id) && <CheckSquare size={10} />}
                                                </div>
                                                <span className="text-sm text-gray-700">{field.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-600">
                        Will export <span className="text-brand-teal font-bold">{records.length}</span> rows
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting || selectedFields.length === 0 || records.length === 0}
                            className="px-6 py-2.5 bg-brand-teal text-white rounded-lg hover:bg-[#3d8568] transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                        >
                            {isExporting ? 'Generating...' : <><Download size={18} /> Export CSV</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
