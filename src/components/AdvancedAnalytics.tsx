import React, { useRef, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import { Download, Users, TrendingUp, MapPin, Calendar, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Application {
    id: string;
    position: string;
    department: string;
    status: string;
    created_at: string;
    state_of_origin?: string;
    lga?: string;
    gender?: string;
}

interface AdvancedAnalyticsProps {
    applications: Application[];
}

export default function AdvancedAnalytics({ applications }: AdvancedAnalyticsProps) {
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    // --- Data Processing ---------------------------

    // 1. Executive Summary Stats
    const totalApps = applications.length;
    const shortlistedApps = applications.filter(a => a.status === 'Shortlisted').length;
    const pendingApps = applications.filter(a => !a.status || a.status === 'Pending').length;
    const rejectionRate = ((applications.filter(a => a.status === 'Rejected').length / totalApps) * 100).toFixed(1);

    // 2. Timeline Data (Applications over time)
    const timelineMap = applications.reduce((acc: any, app) => {
        const date = new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});
    const timelineData = Object.keys(timelineMap).map(date => ({
        date,
        count: timelineMap[date]
    })).slice(-14); // Last 14 days for cleaner view

    // 3. Geographic Data (State of Origin)
    const stateMap = applications.reduce((acc: any, app) => {
        const state = app.state_of_origin || 'Unknown';
        acc[state] = (acc[state] || 0) + 1;
        return acc;
    }, {});
    const stateData = Object.keys(stateMap)
        .map(state => ({ name: state, value: stateMap[state] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // Top 8 states

    // 4. Detailed Position Breakdown Table Data
    const positionBreakdown = applications.reduce((acc: any, app) => {
        const pos = app.position || 'Unspecified';
        if (!acc[pos]) {
            acc[pos] = { name: pos, total: 0, shortlisted: 0, rejected: 0, pending: 0, department: app.department };
        }
        acc[pos].total += 1;
        if (app.status === 'Shortlisted') acc[pos].shortlisted += 1;
        else if (app.status === 'Rejected') acc[pos].rejected += 1;
        else acc[pos].pending += 1;
        return acc;
    }, {});
    const tableData = Object.values(positionBreakdown).sort((a: any, b: any) => b.total - a.total);

    // 5. Existing Position Chart Data
    const positionChartData = tableData.slice(0, 10).map((d: any) => ({
        name: d.name.length > 30 ? d.name.substring(0, 30) + '...' : d.name,
        count: d.total
    }));

    // 6. Department Data
    const deptCounts = applications.reduce((acc: any, app) => {
        const dept = app.department || 'Unspecified';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
    }, {});
    const departmentData = Object.keys(deptCounts)
        .map(dept => ({ name: dept, value: deptCounts[dept] }))
        .sort((a, b) => b.value - a.value);

    // --- Export Logic ------------------------------
    const exportPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);

        try {
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // If report is long, we might need multiple pages, but for now fit to one scrolling page concept 
            // or split logic. For simplicity, we stretch height if reasonable or auto-page? 
            // jsPDF addImage creates one big image. If it's too long, it will look small or cut off.
            // For a "Report", typically we want clean pages. 
            // However, fitting to one long PDF page is often acceptable for digital viewing.

            if (pdfHeight > 297) {
                // Create a custom size PDF for long reports
                const customPdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight + 20]);
                customPdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                customPdf.save(`SRS_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`SRS_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            }

        } catch (error) {
            console.error('Export failed', error);
            alert('Failed to generate PDF');
        } finally {
            setIsExporting(false);
        }
    };

    const COLORS = ['#1e3a5f', '#3b82f6', '#06b6d4', '#10b981', '#4a9d7e', '#ef4444', '#8b5cf6'];

    return (
        <div className="space-y-8">
            {/* Control Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print">
                <div>
                    <h2 className="text-xl font-bold text-[#1e3a5f]">Executive Analytics</h2>
                    <p className="text-sm text-gray-500">Operational insights & performance metrics</p>
                </div>
                <button
                    onClick={exportPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#162a45] transition-colors shadow-lg disabled:opacity-70 font-medium"
                >
                    <Download size={18} />
                    {isExporting ? 'Generating Report...' : 'Download Executive Report'}
                </button>
            </div>

            {/* REPORT CONTAINER */}
            <div ref={reportRef} className="space-y-8 p-8 bg-white min-h-screen text-slate-800">

                {/* 1. Report Header */}
                <div className="border-b border-gray-200 pb-6 mb-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-extrabold text-[#1e3a5f] uppercase tracking-wide">Operations Status Report</h1>
                            <p className="text-gray-500 mt-2">Generated on {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Confidential</div>
                            <div className="text-xs text-gray-400">Internal Use Only</div>
                        </div>
                    </div>
                </div>

                {/* 2. Executive Summary Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Records</div>
                        <div className="text-3xl font-black text-[#1e3a5f]">{totalApps}</div>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                        <div className="text-green-600 text-xs font-bold uppercase tracking-wider mb-1">Shortlisted</div>
                        <div className="text-3xl font-black text-green-700">{shortlistedApps}</div>
                        <div className="text-xs font-medium text-green-600 mt-1">
                            {totalApps > 0 ? ((shortlistedApps / totalApps) * 100).toFixed(1) : 0}% Selection Rate
                        </div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="text-brand-blue text-xs font-bold uppercase tracking-wider mb-1">Pending Review</div>
                        <div className="text-3xl font-black text-brand-blue">{pendingApps}</div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Top Region</div>
                        <div className="text-xl font-bold text-blue-800 truncate" title={stateData[0]?.name}>{stateData[0]?.name || 'N/A'}</div>
                        <div className="text-xs text-blue-600 mt-1">{stateData[0]?.value} Records</div>
                    </div>
                </div>

                {/* 3. Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Trend Chart */}
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="text-brand-teal" size={20} />
                            <h3 className="font-bold text-gray-800">Application Velocity (Last 14 Days)</h3>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timelineData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="count" stroke="#0d9488" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Geography Chart */}
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="text-blue-600" size={20} />
                            <h3 className="font-bold text-gray-800">Top Regions</h3>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stateData} layout="vertical" margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} interval={0} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 4. Top Positions Bar Chart */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-10">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="text-[#1e3a5f]" size={20} />
                        <h3 className="font-bold text-gray-800">Most Competitive Positions (Top 10)</h3>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={positionChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#1e3a5f" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. Detailed Breakdown Table */}
                <div className="mt-12 break-before-page">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-2">
                        <FileText className="text-gray-600" size={24} />
                        <h3 className="text-2xl font-bold text-[#1e3a5f]">Detailed Position Directory</h3>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Position Title</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4 text-center bg-gray-200">Total</th>
                                    <th className="px-6 py-4 text-center text-green-700 bg-green-50">Shortlisted</th>
                                    <th className="px-6 py-4 text-center text-brand-blue bg-blue-50">Pending</th>
                                    <th className="px-6 py-4 text-center text-red-700 bg-red-50">Rejected</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {tableData.map((row: any, idx: number) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-3 font-medium text-gray-900">{row.name}</td>
                                        <td className="px-6 py-3 text-gray-500">{row.department}</td>
                                        <td className="px-6 py-3 text-center font-bold bg-gray-50">{row.total}</td>
                                        <td className="px-6 py-3 text-center text-green-600 font-medium bg-green-50/30">{row.shortlisted}</td>
                                        <td className="px-6 py-3 text-center text-brand-blue bg-blue-50/30">{row.pending}</td>
                                        <td className="px-6 py-3 text-center text-red-400 bg-red-50/30">{row.rejected}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 text-center text-xs text-gray-400">
                        <p>End of Report • Generated via Core Admin Module</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
