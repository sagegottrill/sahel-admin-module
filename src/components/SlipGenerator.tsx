import { useState, useEffect } from 'react';
import { generateSlip } from '../utils/generateSlip';
import { FileText, Upload, Printer, RefreshCw } from 'lucide-react';

export default function SlipGenerator() {
    const [formData, setFormData] = useState({
        full_name: '',
        reference_number: '',
        position: '',
        department: '',
        date_of_birth: '',
        state_of_origin: ''
    });
    const [passportFile, setPassportFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        generateRef();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPassportFile(file);
            // Create preview
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);

        try {
            await generateSlip({
                ...formData,
                passportFile: passportFile
            });
        } catch (error) {
            console.error("Failed to generate slip", error);
            alert("Error generating slip. Please check inputs.");
        } finally {
            setIsGenerating(false);
        }
    };

    const generateRef = () => {
        const uniqueRef = `SRS-ENROLL-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90)}`;
        setFormData(prev => ({ ...prev, reference_number: uniqueRef }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
                        <Printer className="text-brand-teal" /> Manual Receipt Generator
                    </h2>
                    <p className="text-gray-500">Create enrollment receipts for offline workflows.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <form onSubmit={handleGenerate} className="p-6 md:p-8 space-y-8">

                    {/* Top Section: Photo & Basic Info */}
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Passport Upload */}
                        <div className="w-full md:w-1/3 flex flex-col items-center space-y-4">
                            <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative group">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <Upload className="mx-auto mb-2" />
                                        <span className="text-sm">Upload Passport</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Click to Change
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 text-center">Required for the slip. JPG/PNG supported.</p>
                        </div>

                        {/* Basic Info */}
                        <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a9d7e] focus:border-transparent"
                                    placeholder="Surname Firstname Middle"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={formData.reference_number}
                                        onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a9d7e] focus:border-transparent font-mono"
                                        placeholder="SRS-ENROLL-..."
                                    />
                                    <button
                                        type="button"
                                        onClick={generateRef}
                                        className="p-2 text-gray-500 hover:text-brand-teal hover:bg-gray-100 rounded-lg"
                                        title="Generate Random"
                                    >
                                        <RefreshCw size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date_of_birth}
                                    onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a9d7e] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State of Origin</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.state_of_origin}
                                    onChange={e => setFormData({ ...formData, state_of_origin: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a9d7e] focus:border-transparent"
                                    placeholder="e.g. Region A"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Position Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Position Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.position}
                                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a9d7e] focus:border-transparent"
                                    placeholder="e.g. Data Scout"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a9d7e] focus:border-transparent"
                                    placeholder="e.g. Field Operations"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="bg-[#1e3a5f] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#2d5587] transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            {isGenerating ? 'Generating PDF...' : (
                                <>
                                    <FileText size={20} /> Generate & Download Receipt
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
