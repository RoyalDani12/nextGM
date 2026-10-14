import { useParams, Link } from "react-router-dom";
import { useMyShops } from "@/features/shop/shop.hooks";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  ArrowLeft,
  ExternalLink,
  Building2,
  ImageIcon,
  CheckCircle2,
  Clock,
  PauseCircle,
  XCircle,
  Hash,
  FileText,
  Package
} from "lucide-react";
import { Button } from "@base-ui/react";
import { CloseShopDialog } from "./CloseShopDialog";
import { ShopStatusToggle } from "./ShopStatusToggle";
import { ShopProfileEditDialog } from "./ShopProfileEditDialog";
export interface ShopProfile {
  name: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
}

export interface Shop {
  id: string;
  slug: string;
  status: "PENDING" | "ACTIVE" | "PAUSED" | "SUSPENDED" | "CLOSED";
  createdAt: string;
 profile: ShopProfile;
}



const getStatusBadge = (status: Shop["status"]) => {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" /> Active
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" /> Pending
        </span>
      );
    case "PAUSED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
          <PauseCircle className="w-3.5 h-3.5" /> Paused
        </span>
      );
    case "SUSPENDED":
    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <XCircle className="w-3.5 h-3.5" /> {status}
        </span>
      );
    default:
      return null;
  }
};

const ShopDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useMyShops();
   const { id: shopId } = useParams<{ id: string }>();

  if (!shopId) {
    return <div>Shop ID is missing from the URL.</div>;
  }

  if (isLoading) {
    return (
      <div className="pt-0 p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <Store className="w-8 h-8" />
          <p className="text-sm font-medium">Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pt-0 p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Failed to load shop information.</p>
          <Link to="/dashboard/shops" className="text-sm underline text-muted-foreground hover:text-foreground">
            Return to shops
          </Link>
        </div>
      </div>
    );
  }

  const shop = data?.data?.find((shop) => shop.id === id);

  if (!shop) {
    return (
      <div className="pt-0 p-6 max-w-md mx-auto mt-12 text-center space-y-4 border rounded-xl bg-card p-8 shadow-sm">
        <Store className="w-12 h-12 mx-auto text-muted-foreground/50" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Shop not found</h1>
          <p className="text-sm text-muted-foreground">The shop you are looking for doesn't exist or has been removed.</p>
        </div>
        <Link
          to="/dashboard/shops"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow transition-colors hover:bg-primary/90"
        >
          Back to Shops
        </Link>
      </div>
    );
  }

  const profile = shop.profile;

  return (
    <div className="pt-0 px-6 pb-12 max-w-6xl mx-auto space-y-8">
      
      {/* Top Navigation & Header */}
      <div className="space-y-4">
        <Link
          to="/dashboard/shops"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shops
        </Link>

        <div>
      {/* Existing shop information */}

      <ShopStatusToggle
        shopId={shop.id}
        status={shop.status}
      />
        <CloseShopDialog shop={shop} />
        <div>
          <Link to={`/dashboard/shops/${shopId}/products`}>
            <Button>
              <Package className="mr-2 h-4 w-4" />
              Products
            </Button>
          </Link>
        </div>
    </div>
       
    

        {/* Banner Hero Section */}
        <div className="relative rounded-2xl overflow-hidden border bg-muted/30 shadow-sm">
          {profile?.banner ? (
            <img 
              src={profile.banner} 
              alt="Shop Banner" 
              className="w-full h-48 sm:h-56 object-cover"
            />
          ) : (
            <div className="w-full h-48 sm:h-56 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/20 flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" /> No banner uploaded
              </span>
            </div>
          )}

          {/* Floating Header Details */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent p-6 pt-16 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {/* Logo Avatar */}
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-background bg-card shadow-lg flex items-center justify-center flex-shrink-0">
                {profile?.logo ? (
                  <img src={profile.logo} alt={profile.name || "Shop Logo"} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-muted-foreground/60" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {profile?.name || "Unnamed Shop"}
                  </h1>
                  {getStatusBadge(shop.status)}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                  <Hash className="w-3.5 h-3.5" /> ID: {shop.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        
        {/* Left Column: Quick Details & Media */}
        <div className="space-y-6 md:col-span-1">
          
          {/* Overview Card */}
          <div className="border rounded-xl p-5 bg-card shadow-sm space-y-4">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Overview
            </h2>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Shop Slug</span>
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded mt-0.5 inline-block text-foreground">
                  /{shop.slug}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Created Date</span>
                <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {new Date(shop.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Media Summary Card */}
          <div className="border rounded-xl p-5 bg-card shadow-sm space-y-4">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" /> Brand Assets
            </h2>
            

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground text-xs">Logo Status</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${profile?.logo ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  {profile?.logo ? "Uploaded" : "Missing"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground text-xs">Banner Status</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${profile?.banner ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  {profile?.banner ? "Uploaded" : "Missing"}
                </span>
              </div>

<ShopProfileEditDialog shop={shop} />
            </div>
          </div>

        </div>

        {/* Right Column: Information Sections */}
        <div className="space-y-6 md:col-span-2">
          
          {/* Shop Information Section */}
          <div className="border rounded-xl p-6 bg-card shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Shop Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Shop Name</span>
                <p className="text-sm font-medium text-foreground">{profile?.name || "Not provided"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Current Status</span>
                <div className="pt-0.5">{getStatusBadge(shop.status)}</div>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Description</span>
                <p className="text-sm text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
                  {profile?.description || "No description provided for this shop."}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="border rounded-xl p-6 bg-card shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Phone Number
                </span>
                <p className="text-sm font-medium text-foreground">{profile?.phone || "Not provided"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </span>
                <p className="text-sm font-medium text-foreground">{profile?.email || "Not provided"}</p>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Website
                </span>
                {profile?.website ? (
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {profile.website} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-sm font-medium text-foreground">Not provided</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="border rounded-xl p-6 bg-card shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Location Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Address</span>
                <p className="text-sm font-medium text-foreground">{profile?.address || "Not provided"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">City</span>
                <p className="text-sm font-medium text-foreground">{profile?.city || "Not provided"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Country</span>
                <p className="text-sm font-medium text-foreground">{profile?.country || "Not provided"}</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ShopDetail;