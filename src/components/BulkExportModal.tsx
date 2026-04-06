import { useState } from 'react';
import { X, FolderDown, Loader, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


interface Application {
    id: string;
    reference_number: string;
    full_name: string;
    department: string;
    position: string;
    cv_url: string;
    photo_url: string;
    other_documents: { name: string; path: string }[];
    date_of_birth: string;
    state_of_origin: string;
}

interface BulkExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    applications: Application[]; // All applications
    stats: { total: number };
}

export default function BulkExportModal({ isOpen, onClose, applications }: BulkExportModalProps) {
    const [selectedPos, setSelectedPos] = useState('All Positions');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processedCount, setProcessedCount] = useState(0);
    const [totalToProcess, setTotalToProcess] = useState(0);
    const [currentAction, setCurrentAction] = useState('');
    const [logs, setLogs] = useState<string[]>([]);

    if (!isOpen) return null;

    const positions = ['All Positions', ...Array.from(new Set(applications.map(a => a.position)))];

    const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), msg]);

    // --- Helper to fetch file as Blob ---
    const fetchFile = async (url: string): Promise<Blob | null> => {
        try {
            const response = await fetch(url, { mode: 'cors', cache: 'no-store' });
            if (!response.ok) throw new Error(`Status ${response.status}`);
            return await response.blob();
        } catch (error) {
            console.warn(`Failed to fetch ${url}`, error);
            return null;
        }
    };

    const handleBulkExport = async () => {
        setIsProcessing(true);
        setProgress(0);
        setProcessedCount(0);
        setLogs([]);

        try {
            addLog("Initializing Document Engine...");
            const zip = new JSZip();

            const targetApps = selectedPos === 'All Positions'
                ? applications
                : applications.filter(app => app.position === selectedPos);

            setTotalToProcess(targetApps.length);
            addLog(`Found ${targetApps.length} candidates.`);

            let count = 0;

            for (const app of targetApps) {
                count++;
                setProcessedCount(count);
                const percent = Math.round((count / targetApps.length) * 100);
                setProgress(percent);
                setCurrentAction(`Downloading: ${app.full_name}`);

                // 1. Create Folder based on Position
                const safePos = app.position.replace(/[^a-z0-9]/gi, '_'); // Organize by Position
                const safeName = `${app.full_name.replace(/[^a-z0-9]/gi, '_')}_${app.reference_number}`;
                const folder = zip.folder(safePos)?.folder(safeName);

                if (!folder) continue;

                // 2. Fetch CV
                if (app.cv_url) {
                    try {
                        if (app.cv_url.includes('mock')) {
                            folder.file("CV_Mock.txt", `This is a mock CV for ${app.full_name}.`);
                        } else {
                            // Extract filename from URL
                            const filename = app.cv_url.split('/').pop();
                            if (filename) {
                                // Use proxy for download to bypass CORS and ensure correct headers
                                // Assuming the PHP script is at the root of the domain
                                const domain = app.cv_url.split('/uploads/')[0];
                                const proxyUrl = `${domain}/download.php?file=${encodeURIComponent(filename)}`;

                                const extension = filename.split('.').pop()?.split('?')[0] || 'pdf';
                                const cvBlob = await fetchFile(proxyUrl);

                                if (cvBlob) {
                                    folder.file(`CV.${extension}`, cvBlob);
                                    addLog(`Saved CV for ${app.full_name}`);
                                } else {
                                    // Fallback: Try direct fetch if proxy fails (e.g. if script not deployed yet)
                                    addLog(`Proxy failed, trying direct...`);
                                    const directBlob = await fetchFile(app.cv_url);
                                    if (directBlob) {
                                        folder.file(`CV.${extension}`, directBlob);
                                        addLog(`Saved CV (Direct) for ${app.full_name}`);
                                    } else {
                                        addLog(`Failed to download CV for ${app.full_name}`);
                                        folder.file("CV_Error.txt", "Could not download file. URL: " + app.cv_url);
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        addLog(`Error fetching CV for ${app.full_name}`);
                    }
                }

                // 3. Fetch Other Documents
                if (app.other_documents && app.other_documents.length > 0) {
                    for (const doc of app.other_documents) {
                        if (doc.path) {
                            try {
                                const extension = doc.path.split('.').pop()?.split('?')[0] || 'pdf';
                                const docBlob = await fetchFile(doc.path);
                                const safeDocName = doc.name.replace(/[^a-z0-9]/gi, '_');

                                if (docBlob) {
                                    folder.file(`${safeDocName}.${extension}`, docBlob);
                                }
                            } catch (e) {
                                addLog(`Error fetching ${doc.name} for ${app.full_name}`);
                            }
                        }
                    }
                }

                await new Promise(r => setTimeout(r, 20)); // Small yield
            }

            addLog("Compressing...");
            setCurrentAction("Finalizing ZIP archive...");

            const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
                if (metadata.percent) {
                    setCurrentAction(`Zipping: ${metadata.percent.toFixed(0)}%`);
                }
            });

            const filename = `SRS_Export_${selectedPos.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;
            saveAs(content, filename);

            addLog("Done!");
            setCurrentAction("Completed");

        } catch (error) {
            console.error("Export Error:", error);
            addLog("Critical Error: Export failed.");
        } finally {
            setTimeout(() => setIsProcessing(false), 2000); // Wait a bit before reset
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70] backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="bg-[#1e3a5f] p-6 text-white flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FolderDown className="text-brand-teal" />
                            Document Engine
                        </h2>
                        <p className="text-blue-200 text-sm mt-1">Bulk export slips & documents for verification</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {!isProcessing ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Target Position</label>
                                <div className="relative">
                                    <select
                                        value={selectedPos}
                                        onChange={(e) => setSelectedPos(e.target.value)}
                                        className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal bg-white"
                                    >
                                        {positions.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {selectedPos === 'All Positions'
                                        ? `Will process all ${applications.length} applications from ${positions.length - 1} positions.`
                                        : `Will process ${applications.filter(a => a.position === selectedPos).length} applications.`}
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3">
                                <AlertCircle className="text-brand-blue shrink-0" size={20} />
                                <div className="text-sm text-brand-blue">
                                    <p className="font-semibold mb-1">Large Export Warning</p>
                                    <p>Check your internet connection. We are dynamically generating PDFs and downloading files. This limits speed.</p>
                                </div>
                            </div>

                            <button
                                onClick={handleBulkExport}
                                className="w-full py-3 bg-brand-teal text-white rounded-lg font-bold hover:bg-[#3d8568] transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Download size={20} />
                                Start Bulk Export
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 py-4">
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-gray-800 mb-1">{currentAction}</h3>
                                <p className="text-gray-500 text-sm mb-6">Processing {processedCount} of {totalToProcess} candidates</p>

                                {/* Linear Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                                    <div
                                        className="bg-brand-teal h-full transition-all duration-300 ease-out flex items-center justify-center text-[10px] text-white font-bold"
                                        style={{ width: `${progress}%` }}
                                    >
                                        {progress > 5 && `${progress}%`}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400 h-32 overflow-y-auto shadow-inner">
                                <div className="flex flex-col gap-1">
                                    {logs.map((log, i) => (
                                        <span key={i} className="border-l-2 border-green-500 pl-2 opacity-90">&gt; {log}</span>
                                    ))}
                                    <span className="animate-pulse">_</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
