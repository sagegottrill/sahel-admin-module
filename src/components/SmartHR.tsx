import { useState, useMemo } from 'react';
import { analyzeCandidate, ScreeningSummary, predictGender } from '../utils/screeningRules';
import { UserCheck, AlertTriangle, ShieldCheck, Filter, ChevronDown, CheckCircle, XCircle, FileSpreadsheet, Download } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

interface SmartReviewProps {
    applications: any[];
}

export default function SmartReview({ applications }: SmartReviewProps) {
    const [filter, setFilter] = useState<'all' | 'clean' | 'flagged'>('all');
    const [positionFilter, setPositionFilter] = useState<string>('all');
    const [isExporting, setIsExporting] = useState(false);

    // 1. Run Analysis on ALL applications
    const analyzedData = useMemo(() => {
        return applications.map(app => {
            const analysis = analyzeCandidate(app);
            return {
                ...app,
                analysis
            };
        });
    }, [applications]);

    // 2. Calculate Stats
    const stats: ScreeningSummary = useMemo(() => {
        return {
            total: analyzedData.length,
            clean: analyzedData.filter(a => a.analysis.isClean).length,
            flagged: analyzedData.filter(a => !a.analysis.isClean).length
        };
    }, [analyzedData]);

    // 3. Filter View
    const filteredList = useMemo(() => {
        return analyzedData.filter(item => {
            // Verdict Filter
            if (filter === 'clean' && !item.analysis.isClean) return false;
            if (filter === 'flagged' && item.analysis.isClean) return false;

            // Position Filter
            if (positionFilter !== 'all' && item.position !== positionFilter) return false;

            return true;
        });
    }, [analyzedData, filter, positionFilter]);

    const positions = Array.from(new Set(applications.map(a => a.position))).sort();

    const handleSmartExport = async () => {
        setIsExporting(true);
        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const wb = utils.book_new();

            // 1. Prepare Data Groups
            const cleanApps = analyzedData.filter(a => a.analysis.isClean);
            const ageIssues = analyzedData.filter(a => a.analysis.issues.some(i => i.includes('Age') || i.includes('old')));
            const qualIssues = analyzedData.filter(a => a.analysis.issues.some(i => i.includes('Qualification')));
            const docIssues = analyzedData.filter(a => a.analysis.issues.some(i => i.includes('Missing') || i.includes('License')));

            // Helper to format rows
            const headers = [
                'Reference', 'Date Applied', 'Status', 'Position', 'Department',
                'Full Name', 'Email', 'Phone', 'NIN', 'Date of Birth', 'Age', 'Gender',
                'State', 'LGA',
                'Qualification', 'Institution', 'Year', 'License',
                'Verdict', 'Issues',
                'CV Link', 'Photo Link'
            ];

            const formatForExcel = (apps: any[]) => apps.map(app => [
                app.reference_number || '',
                app.created_at ? new Date(app.created_at).toLocaleDateString() : '',
                app.status || 'Pending',
                app.position || '',
                app.department || '',
                app.full_name || '',
                app.email || '',
                app.phone || '',
                app.nin_number || '',
                app.date_of_birth || '',
                app.analysis.age || 'N/A',
                predictGender(app.full_name), // Gender (AI)
                app.state_of_origin || '',
                app.lga || '',
                app.qualification || '',
                app.institution || '',
                app.year_of_graduation || '',
                app.license_number || '',
                app.analysis.isClean ? 'Qualified' : 'Flagged',
                app.analysis.issues.join('; '),
                app.cv_url || '',
                app.photo_url || ''
            ]);

            // 2. Create Sheets

            // Sheet A: EXECUTIVE SUMMARY
            // We can make a simple summary sheet
            const summaryData = [
                ['Automated Review Report', new Date().toLocaleString()],
                ['', ''],
                ['Total Applications', analyzedData.length],
                ['Qualified Candidates', cleanApps.length],
                ['Flagged Candidates', analyzedData.length - cleanApps.length],
                ['', ''],
                ['Issue Breakdown', ''],
                ['Age Disqualifications', ageIssues.length],
                ['Qualification Mismatches', qualIssues.length],
                ['Documentation Issues', docIssues.length]
            ];
            const wsSummary = utils.aoa_to_sheet(summaryData);
            utils.book_append_sheet(wb, wsSummary, "Executive Summary");

            // Sheet B: QUALIFIED (The Shortlist)
            if (cleanApps.length > 0) {
                const wsClean = utils.aoa_to_sheet([headers, ...formatForExcel(cleanApps)]);
                utils.book_append_sheet(wb, wsClean, "Qualified Candidates");
            }

            // Sheet C: AGE ISSUES
            if (ageIssues.length > 0) {
                const wsAge = utils.aoa_to_sheet([headers, ...formatForExcel(ageIssues)]);
                utils.book_append_sheet(wb, wsAge, "Age Disqualified");
            }

            // Sheet D: QUALIFICATION ISSUES
            if (qualIssues.length > 0) {
                const wsQual = utils.aoa_to_sheet([headers, ...formatForExcel(qualIssues)]);
                utils.book_append_sheet(wb, wsQual, "Wrong Qualification");
            }

            // Sheet E: DOC ISSUES
            if (docIssues.length > 0) {
                const wsDoc = utils.aoa_to_sheet([headers, ...formatForExcel(docIssues)]);
                utils.book_append_sheet(wb, wsDoc, "Documentation Issues");
            }

            // Write File
            writeFile(wb, `HR_Smart_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to generate report");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
                        <ShieldCheck className="text-brand-teal" /> Smart Review Assistant
                    </h2>
                    <p className="text-gray-500">Automated screening based on Age, Qualification, and Documentation rules.</p>
                </div>
                <button
                    onClick={handleSmartExport}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:opacity-70 font-medium"
                >
                    {isExporting ? 'Generating Report...' : (
                        <>
                            <FileSpreadsheet size={18} /> Download Smart Report
                        </>
                    )}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">Total Analyzed</p>
                        <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                        <UserCheck size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">Qualified (Clean)</p>
                        <p className="text-3xl font-bold text-green-600">{stats.clean}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-full text-green-600">
                        <CheckCircle size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">Flagged Issues</p>
                        <p className="text-3xl font-bold text-red-600">{stats.flagged}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-full text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        All Candidates
                    </button>
                    <button
                        onClick={() => setFilter('clean')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'clean' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                    >
                        Clean Only
                    </button>
                    <button
                        onClick={() => setFilter('flagged')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'flagged' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                    >
                        Flagged Only
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={16} className="text-gray-400" />
                    <select
                        value={positionFilter}
                        onChange={(e) => setPositionFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal w-full md:min-w-[200px]"
                    >
                        <option value="all">All Positions</option>
                        {positions.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Smart Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="px-6 py-4">Candidate</th>
                                <th className="px-6 py-4">Position</th>
                                <th className="px-6 py-4">Age</th>
                                <th className="px-6 py-4">Qualification</th>
                                <th className="px-6 py-4">AI Verdict</th>
                                <th className="px-6 py-4">Identified Issues</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredList.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div className="flex flex-col">
                                            <span>{app.full_name}</span>
                                            <span className="text-xs text-gray-500">{app.reference_number}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{app.position}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${(app.analysis.age < 18 || app.analysis.age > 60)
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {app.analysis.age || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate" title={app.qualification}>
                                        {app.qualification || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {app.analysis.isClean ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <CheckCircle size={12} /> Clean
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                <AlertTriangle size={12} /> Flaeged
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {app.analysis.issues.length > 0 ? (
                                            <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
                                                {app.analysis.issues.map((issue: string, idx: number) => (
                                                    <li key={idx}>{issue}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredList.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No candidates match the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 text-center">
                    AI Screening is a tool to assist, not replace, human judgment. Always verify flagged issues manually.
                </div>
            </div>
        </div>
    );
}
