import { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    PieChart,
    ShieldCheck,
    Printer
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export default function AdminSidebar({
    activeTab,
    setActiveTab,
    isCollapsed,
    setIsCollapsed
}: AdminSidebarProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'applications', label: 'Field Agent Records', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: PieChart },
        { id: 'smart-review', label: 'Smart Review', icon: ShieldCheck },
        { id: 'slip-generator', label: 'Receipt Generator', icon: Printer },
    ];

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-md"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Container */}
            <div
                className={`
          fixed inset-y-0 left-0 z-40 border-r border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
                        {!isCollapsed && (
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50">
                                    <span className="text-lg font-bold text-cyan-700">S</span>
                                </div>
                                <span className="text-lg font-bold text-[#1e3a5f]">Admin Core</span>
                            </div>
                        )}
                        {isCollapsed && (
                            <div className="flex w-full justify-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50">
                                    <span className="text-lg font-bold text-cyan-700">S</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={toggleCollapse}
                            className="hidden rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 md:flex"
                        >
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`
                    group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200
                    ${isActive
                                            ? 'bg-cyan-700 text-white shadow-md'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-cyan-800'
                                        }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                                    title={isCollapsed ? item.label : ''}
                                >
                                    <Icon
                                        size={20}
                                        className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-800'}`}
                                    />

                                    {!isCollapsed && (
                                        <span className="font-medium">{item.label}</span>
                                    )}

                                    {/* Tooltip for collapsed state */}
                                    {isCollapsed && (
                                        <div className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                                            {item.label}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* User Profile & Logout */}
                    <div className="border-t border-slate-100 bg-slate-50/80 p-4">
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-[#1e3a5f] font-bold text-white shadow-sm">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>

                            {!isCollapsed && (
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                        {user?.email?.split('@')[0]}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">System administrator</p>
                                </div>
                            )}

                            {!isCollapsed && (
                                <button
                                    onClick={handleLogout}
                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            )}
                        </div>

                        {isCollapsed && (
                            <button
                                onClick={handleLogout}
                                className="mt-4 flex w-full justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
