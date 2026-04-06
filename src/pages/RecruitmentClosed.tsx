import React from 'react';

const ModuleDisabled = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <div className="bg-white p-10 rounded-2xl shadow-xl max-w-2xl w-full space-y-8 animate-fade-in-up">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-[#1e3a5f] font-serif">Module Temporarily Disabled</h1>
                    <p className="text-xl text-gray-600">
                        This administrative console is currently unavailable. Please contact your deployment administrator for access or status updates.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                    <p className="text-brand-blue font-medium">
                        If you already have an account, check the console later or reach out to your support channel for assistance.
                    </p>
                </div>

                <div className="text-sm text-gray-400 pt-8">
                    &copy; {new Date().getFullYear()} Sahel Resilience Stack - Core Admin Module
                </div>
            </div>
        </div>
    );
};

export default ModuleDisabled;
