import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';

interface AdminChartsProps {
    applications: any[];
}

export default function AdminCharts({ applications }: AdminChartsProps) {
    // Process data for Status Pie Chart
    const statusData = [
        { name: 'Pending', value: applications.filter(a => !a.status || a.status === 'Pending').length, color: '#EAB308' },
        { name: 'Shortlisted', value: applications.filter(a => a.status === 'Shortlisted').length, color: '#22C55E' },
        { name: 'Rejected', value: applications.filter(a => a.status === 'Rejected').length, color: '#EF4444' },
    ].filter(item => item.value > 0);

    // Process data for Department Bar Chart
    const deptCounts = applications.reduce((acc: any, app: any) => {
        const dept = app.department || 'Unspecified';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
    }, {});

    const departmentData = Object.keys(deptCounts)
        .map(dept => ({
            name: dept,
            count: deptCounts[dept]
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 departments

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Status Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#1e3a5f] mb-4">Application Status</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Department Breakdown */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#1e3a5f] mb-4">Top Departments</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={departmentData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="count" fill="#1e3a5f" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
