import { useNavigate } from "react-router-dom";
import { useMyShops } from "./shop.hooks";
import { Store, ArrowRight, AlertCircle, Loader2, PlusCircle, CheckCircle2 } from "lucide-react";

const ShopSelectionPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useMyShops();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
          <p className="text-sm font-medium text-slate-500 tracking-wide">Loading your storefronts...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center">
          <div className="w-12 h-12 bg-orange-100 border border-orange-200 rounded-xl flex items-center justify-center mx-auto mb-4 text-orange-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Failed to Load Shops</h2>
          <p className="text-sm text-slate-500 mb-6">We encountered an issue fetching your data. Please check your connection and try again.</p>
          <button
            onClick={() => refetch()}
            className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const shops = data?.data ?? [];

  return (
    <div className="min-h-screen bg-white text-slate-800 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-orange-50 border border-orange-200 rounded-xl text-orange-500">
                <Store className="w-5 h-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Select your shop</h1>
            </div>
            <p className="text-sm text-slate-500">These are all your shops</p>
          </div>
          
          <button
            onClick={() => navigate('/shops/new')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 font-medium text-sm rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-orange-500" />
            Create New Shop
          </button>
        </div>

        {/* Empty State */}
        {shops.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 border border-slate-200 rounded-2xl">
            <Store className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No shops found</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">You haven't set up any stores yet. Get started by creating your first shop.</p>
            <button
              onClick={() => navigate('/shops/new')}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
            >
              Create Shop Now
            </button>
          </div>
        ) : (
          /* Shop Grid with full-card click routing, pointer cursor, and hover effects */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {shops.map((shop) => {
              const isActive = shop.status?.toLowerCase() === 'active';
              
              return (
                <div
                  key={shop.id}
                  onClick={() => navigate(`/dashboard/shop/${shop.id}`)}
                  className="bg-white hover:border-orange-400 border border-slate-200 rounded-2xl p-5 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between relative group cursor-pointer"
                >
                  <div>
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider border ${
                          isActive
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-amber-50 text-amber-600 border-amber-200"
                        }`}
                      >
                        {shop.status || 'Active'}
                      </span>
                    </div>

                    {/* Shop Name */}
                    <h2 className="text-base font-semibold text-slate-900 group-hover:text-orange-500 transition-colors line-clamp-1 mb-1">
                      {shop.profile.name}
                    </h2>

                    {/* Verified store indicator */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Verified store</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 line-clamp-2 mb-6">
                      {shop.profile.description || "No description provided for this store."}
                    </p>
                  </div>

                  {/* Open Shop Action Button */}
                  <div className="w-full mt-auto inline-flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 group-hover:bg-orange-500 text-slate-700 group-hover:text-white font-medium text-xs rounded-xl transition-all duration-200 border border-slate-200 group-hover:border-transparent">
                    <span>Open Shop</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopSelectionPage;
