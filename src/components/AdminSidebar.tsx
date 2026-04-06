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
                    className="p-2 bg-white rounded-lg shadow-md text-gray-600"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Container */}
            <div
                className={`
          fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                        {!isCollapsed && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-brand-teal/10 rounded-lg flex items-center justify-center">
                                    <span className="text-brand-teal font-bold text-xl">S</span>
                                </div>
                                <span className="font-bold text-[#1e3a5f] text-lg">Admin</span>
                            </div>
                        )}
                        {isCollapsed && (
                            <div className="w-full flex justify-center">
                                <div className="w-8 h-8 bg-brand-teal/10 rounded-lg flex items-center justify-center">
                                    <span className="text-brand-teal font-bold text-xl">S</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={toggleCollapse}
                            className="hidden md:flex p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
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
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                    ${isActive
                                            ? 'bg-brand-blue text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-brand-blue'
                                        }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                                    title={isCollapsed ? item.label : ''}
                                >
                                    <Icon
                                        size={20}
                                        className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-brand-blue'}`}
                                    />

                                    {!isCollapsed && (
                                        <span className="font-medium">{item.label}</span>
                                    )}

                                    {/* Tooltip for collapsed state */}
                                    {isCollapsed && (
                                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                            {item.label}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* User Profile & Logout */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                            <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold shadow-sm">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>

                            {!isCollapsed && (
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {user?.email?.split('@')[0]}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">Administrator</p>
                                </div>
                            )}

                            {!isCollapsed && (
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            )}
                        </div>

                        {isCollapsed && (
                            <button
                                onClick={handleLogout}
                                className="mt-4 w-full p-2 flex justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    className="md:hidden fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
