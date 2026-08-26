import React from 'react';
import { 
  Users, 
  Store, 
  CreditCard, 
  Activity, 
  TrendingUp,
  MoreVertical,
  AlertCircle
} from 'lucide-react';

// --- Subcomponents ---

const MetricCard = ({ title, value, trend, trendUp, icon: Icon }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
    <div className="flex justify-between items-center">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
        <Icon size={20} />
      </div>
    </div>
    <div>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-sm font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trendUp ? '+' : '-'}{trend}
        </span>
        <span className="text-sm text-gray-500">vs last month</span>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    trial: "bg-blue-50 text-blue-700 ring-blue-600/20",
    churned: "bg-rose-50 text-rose-700 ring-rose-600/20"
  };
  
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// --- Main Dashboard ---

export const SuperAdminHome = () => {
  // Mock data for the presentation layer
  const recentStores = [
    { id: '1', name: 'Nova Athletics', plan: 'Enterprise', mrr: '$2,499', status: 'active', date: 'Oct 12' },
    { id: '2', name: 'Lumina Coffee', plan: 'Pro', mrr: '$299', status: 'trial', date: 'Oct 12' },
    { id: '3', name: 'TechGear Pro', plan: 'Basic', mrr: '$29', status: 'active', date: 'Oct 11' },
    { id: '4', name: 'Botanica', plan: 'Pro', mrr: '$0', status: 'churned', date: 'Oct 10' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Header Shell */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold">Platform Overview</h1>
          <p className="text-sm text-gray-500">Global metrics across all tenants</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            All Systems Operational
          </div>
          <button className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-medium">
            SA
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Top Level Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Global MRR" value="$1.24M" trend="12.5%" trendUp={true} icon={CreditCard} />
          <MetricCard title="Total Active Stores" value="14,205" trend="4.2%" trendUp={true} icon={Store} />
          <MetricCard title="Platform GMV (30d)" value="$84.5M" trend="8.1%" trendUp={true} icon={TrendingUp} />
          <MetricCard title="System Error Rate" value="0.01%" trend="0.04%" trendUp={false} icon={Activity} />
        </section>

        {/* Complex Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Table Area */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-base font-semibold">Recent Store Signups</h2>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Store Name</th>
                    <th className="px-6 py-4 font-medium">Plan</th>
                    <th className="px-6 py-4 font-medium">MRR</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentStores.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{store.name}</td>
                      <td className="px-6 py-4 text-gray-600">{store.plan}</td>
                      <td className="px-6 py-4 text-gray-600">{store.mrr}</td>
                      <td className="px-6 py-4"><StatusBadge status={store.status} /></td>
                      <td className="px-6 py-4 text-gray-500">{store.date}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Secondary Panel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold">Action Required</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-4">
              {[
                { label: 'Pending KYC Verifications', count: 12 },
                { label: 'High-Risk Transactions', count: 3 },
                { label: 'Database Shard Warnings', count: 1 }
              ].map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={18} className="text-rose-600" />
                    <span className="text-sm font-medium text-rose-900">{alert.label}</span>
                  </div>
                  <span className="bg-white px-2 py-1 rounded text-xs font-bold text-rose-700 shadow-sm">
                    {alert.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};