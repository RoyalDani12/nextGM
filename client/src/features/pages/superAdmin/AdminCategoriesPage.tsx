import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    FolderTree,
    Plus,
    Search,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Edit2,
    Trash2,
    Copy,
    Check,
    Layers,
    Folder,
    FolderPlus,
    Eye,
    EyeOff,
    Package,
    UploadCloud,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Star,
} from "lucide-react";
import { api } from "@/lib/axios";
import { getUploadSignatureRequest, uploadToCloudinary } from "@/features/upload/upload.api";
import { ModalPortal } from "@/components/ui/ds-components";

// Category type matching backend schema
export type Category = {
    id: string;
    name: string;
    slug?: string;
    path: string;
    parentId?: string | null;
    imageUrl?: string | null;
    icon?: string | null;
    description?: string | null;
    isActive: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
    createdAt?: string;
    productCount: number;
};

// Filter tabs definition (no icons, matching design system)
const CATEGORY_TABS = [
    { id: "ALL", label: "All Categories" },
    { id: "DEPARTMENTS", label: "Departments" },
    { id: "SUBCATEGORIES", label: "Subcategories" },
    { id: "ACTIVE", label: "Active" },
    { id: "HIDDEN", label: "Hidden" },
] as const;

type CategoryTab = (typeof CATEGORY_TABS)[number]["id"];

// Quick emoji suggestions for easy category setup
const QUICK_EMOJIS = ["📱", "💻", "👕", "👟", "🏠", "🎮", "🚗", "📚", "💄", "🍔", "⚡", "🎁"];

export function AdminCategoriesPage() {
    const client = useQueryClient();

    // Query all categories
    const {
        data: categories = [],
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["admin-categories"],
        queryFn: async () =>
            (await api.get("/categories/flat?includeInactive=true")).data.data as Category[],
    });

    // Active tab and search/filter states
    const [activeTab, setActiveTab] = useState<CategoryTab>("ALL");
    const [searchInput, setSearchInput] = useState("");
    const [parentFilter, setParentFilter] = useState<string>("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Toast feedback notice
    const [feedbackNotice, setFeedbackNotice] = useState<{
        text: string;
        type: "success" | "error";
    } | null>(null);

    // Modal states
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [presetParentId, setPresetParentId] = useState<string | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Copied feedback helper
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Viewport-fixed Actions Dropdown
    const [dropdownState, setDropdownState] = useState<{
        categoryId: string;
        category: Category;
        top: number;
        right: number;
        openUpwards: boolean;
    } | null>(null);

    // Close dropdown on window resize or scroll
    useEffect(() => {
        const handleScrollOrResize = () => setDropdownState(null);
        window.addEventListener("scroll", handleScrollOrResize, true);
        window.addEventListener("resize", handleScrollOrResize);
        return () => {
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
        };
    }, []);

    const showToast = (text: string, type: "success" | "error" = "success") => {
        setFeedbackNotice({ text, type });
        setTimeout(() => {
            setFeedbackNotice((curr) => (curr?.text === text ? null : curr));
        }, 4000);
    };

    // Calculate real-time KPI metrics
    const stats = useMemo(() => {
        const total = categories.length;
        const departments = categories.filter((c) => !c.parentId).length;
        const subcategories = categories.filter((c) => !!c.parentId).length;
        const active = categories.filter((c) => c.isActive).length;
        const hidden = categories.filter((c) => !c.isActive).length;
        const totalProducts = categories.reduce((acc, c) => acc + (c.productCount || 0), 0);

        return { total, departments, subcategories, active, hidden, totalProducts };
    }, [categories]);

    // List of root departments for dropdown filter
    const rootDepartments = useMemo(() => {
        return categories.filter((c) => !c.parentId);
    }, [categories]);

    // Filter categories based on search, tab, and parent department filter
    const filteredCategories = useMemo(() => {
        let list = [...categories];

        // 1. Tab filter
        if (activeTab === "DEPARTMENTS") {
            list = list.filter((c) => !c.parentId);
        } else if (activeTab === "SUBCATEGORIES") {
            list = list.filter((c) => !!c.parentId);
        } else if (activeTab === "ACTIVE") {
            list = list.filter((c) => c.isActive);
        } else if (activeTab === "HIDDEN") {
            list = list.filter((c) => !c.isActive);
        }

        // 2. Parent department filter
        if (parentFilter !== "ALL") {
            if (parentFilter === "ROOT_ONLY") {
                list = list.filter((c) => !c.parentId);
            } else {
                list = list.filter((c) => c.parentId === parentFilter || c.id === parentFilter);
            }
        }

        // 3. Search query (matches name, slug, or path)
        if (searchInput.trim()) {
            const q = searchInput.toLowerCase().trim();
            list = list.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    (c.slug && c.slug.toLowerCase().includes(q)) ||
                    (c.path && c.path.toLowerCase().includes(q)) ||
                    c.id.toLowerCase().includes(q)
            );
        }

        return list;
    }, [categories, activeTab, parentFilter, searchInput]);

    // Pagination calculations
    const totalItems = filteredCategories.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const paginatedCategories = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredCategories.slice(start, start + limit);
    }, [filteredCategories, page, limit]);

    // Quick tab click
    const handleTabClick = (tabId: CategoryTab) => {
        setActiveTab(tabId);
        setPage(1);
    };

    const handleClearFilters = () => {
        setActiveTab("ALL");
        setSearchInput("");
        setParentFilter("ALL");
        setPage(1);
    };

    const isFiltered = activeTab !== "ALL" || Boolean(searchInput.trim()) || parentFilter !== "ALL";

    // Open Actions Dropdown
    const handleOpenDropdown = (e: React.MouseEvent<HTMLButtonElement>, category: Category) => {
        e.stopPropagation();
        if (dropdownState?.categoryId === category.id) {
            setDropdownState(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < 220;

        setDropdownState({
            categoryId: category.id,
            category,
            top: openUpwards ? rect.top - 6 : rect.bottom + 6,
            right: window.innerWidth - rect.right,
            openUpwards,
        });
    };

    // Toggle category active/hidden status directly
    const handleToggleStatus = async (cat: Category) => {
        setDropdownState(null);
        try {
            const nextStatus = !cat.isActive;
            await api.put(`/categories/${cat.id}`, { isActive: nextStatus });
            client.invalidateQueries({ queryKey: ["admin-categories"] });
            client.invalidateQueries({ queryKey: ["marketplace-categories"] });
            showToast(
                `Category "${cat.name}" is now ${nextStatus ? "active and visible" : "hidden"}.`,
                "success"
            );
        } catch (err: any) {
            showToast(err?.response?.data?.message || "Failed to update category status.", "error");
        }
    };

    // Delete category
    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/categories/${categoryToDelete.id}`);
            client.invalidateQueries({ queryKey: ["admin-categories"] });
            client.invalidateQueries({ queryKey: ["marketplace-categories"] });
            showToast(`Category "${categoryToDelete.name}" was successfully deleted.`, "success");
            setCategoryToDelete(null);
        } catch (err: any) {
            showToast(
                err?.response?.data?.message ||
                    "Cannot delete category with assigned products or subcategories.",
                "error"
            );
        } finally {
            setIsDeleting(false);
        }
    };

    // Copy to clipboard
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        showToast(`${label} copied to clipboard`, "success");
        setTimeout(() => setCopiedId(null), 2000);
        setDropdownState(null);
    };

    return (
        <div className="space-y-5">
            {/* Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            Product Taxonomies
                        </h1>
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            <FolderTree className="size-3 text-emerald-600" />
                            Platform Taxonomy
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Catalog departments, hierarchical taxonomy branches, and storefront navigation tags.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                        title="Refresh category list"
                    >
                        <RefreshCw
                            size={13}
                            className={isLoading ? "animate-spin text-orange-500" : "text-slate-500"}
                        />
                        <span>Refresh</span>
                    </button>

                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            setPresetParentId(null);
                            setIsCategoryModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow-2xs transition-colors cursor-pointer font-semibold"
                    >
                        <Plus size={13} />
                        <span>Add Category</span>
                    </button>

                    {feedbackNotice && (
                        <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-md border animate-in fade-in ${
                                feedbackNotice.type === "success"
                                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                    : "text-rose-700 bg-rose-50 border-rose-200"
                            }`}
                        >
                            {feedbackNotice.text}
                        </span>
                    )}
                </div>
            </div>

            {/* KPI Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Total Categories */}
                <button
                    onClick={() => handleTabClick("ALL")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "ALL" && parentFilter === "ALL"
                            ? "bg-orange-50/40 border-orange-500 ring-1 ring-orange-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-orange-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-orange-800 font-medium mb-1">
                        <span>All Categories</span>
                        <Layers size={14} className="text-orange-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats.total.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Total catalog nodes</p>
                </button>

                {/* 2. Departments (Top-level) */}
                <button
                    onClick={() => handleTabClick("DEPARTMENTS")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "DEPARTMENTS"
                            ? "bg-slate-100 border-slate-900 ring-1 ring-slate-900 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1">
                        <span>Departments</span>
                        <Folder size={14} className="text-slate-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats.departments.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Root classifications</p>
                </button>

                {/* 3. Subcategories */}
                <button
                    onClick={() => handleTabClick("SUBCATEGORIES")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "SUBCATEGORIES"
                            ? "bg-orange-50/40 border-orange-500 ring-1 ring-orange-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-orange-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-orange-800 font-medium mb-1">
                        <span>Subcategories</span>
                        <FolderTree size={14} className="text-orange-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats.subcategories.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Nested taxonomy tiers</p>
                </button>

                {/* 4. Active (Good thing -> Green!) */}
                <button
                    onClick={() => handleTabClick("ACTIVE")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "ACTIVE"
                            ? "bg-emerald-50/40 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-emerald-800 font-medium mb-1">
                        <span>Active</span>
                        <CheckCircle2 size={14} className="text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats.active.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Visible in marketplace
                    </p>
                </button>

                {/* 5. Products Linked */}
                <div className="text-left p-3.5 rounded-lg border bg-white border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1">
                        <span>Products Linked</span>
                        <Package size={14} className="text-slate-500" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats.totalProducts.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Assigned inventory items</p>
                </div>

                {/* 6. Hidden Categories */}
                <button
                    onClick={() => handleTabClick("HIDDEN")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "HIDDEN"
                            ? "bg-slate-100 border-slate-600 ring-1 ring-slate-600 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1">
                        <span>Hidden</span>
                        <EyeOff size={14} className="text-slate-500" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats.hidden.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-slate-400" />
                        Unpublished / drafts
                    </p>
                </button>
            </div>

            {/* Navigation Tabs Bar with High-Visibility Orange 600 Tracker */}
            <div className="flex items-center gap-1 border-b border-slate-200 mt-5 overflow-x-auto no-scrollbar">
                {CATEGORY_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    let count = stats.total;
                    if (tab.id === "DEPARTMENTS") count = stats.departments;
                    else if (tab.id === "SUBCATEGORIES") count = stats.subcategories;
                    else if (tab.id === "ACTIVE") count = stats.active;
                    else if (tab.id === "HIDDEN") count = stats.hidden;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs border-b-2 whitespace-nowrap transition-all cursor-pointer rounded-t-md -mb-px ${
                                isActive
                                    ? "border-orange-600 bg-orange-50/80 font-semibold text-orange-950 shadow-2xs"
                                    : "border-transparent bg-transparent font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50/70 hover:border-slate-300"
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                                    isActive
                                        ? "bg-orange-200/90 text-orange-950 font-bold border border-orange-300"
                                        : "bg-slate-100 text-slate-600 border border-slate-200 font-medium"
                                }`}
                            >
                                {count.toLocaleString()}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Main Content Box: Search & Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                {/* Search & Filter Header Strip */}
                <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50/40">
                    {/* Search Form */}
                    <div className="relative flex-1 max-w-md">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            placeholder="Filter by category name, slug, or path…"
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-md placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput("");
                                    setPage(1);
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Parent Department Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 font-medium">Department:</span>
                            <select
                                value={parentFilter}
                                onChange={(e) => {
                                    setParentFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="h-8 text-xs border border-slate-200 rounded-md px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer max-w-[170px] truncate"
                            >
                                <option value="ALL">All Departments</option>
                                <option value="ROOT_ONLY">Root Departments Only</option>
                                {rootDepartments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.icon ? `${dept.icon} ` : ""}{dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Page limit selector */}
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                            <option value={50}>50 / page</option>
                            <option value={100}>100 / page</option>
                        </select>

                        {/* Reset Filters Pill */}
                        {isFiltered && (
                            <button
                                onClick={handleClearFilters}
                                className="h-8 inline-flex items-center gap-1 px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                            >
                                <X size={12} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
                        <Loader2 className="animate-spin text-slate-500" size={24} />
                        <span className="text-xs font-medium">Loading catalog taxonomy…</span>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-xs text-rose-600">
                        <AlertCircle className="mx-auto size-7 mb-2 text-rose-400" />
                        Failed to load categories. Please retry.
                    </div>
                ) : paginatedCategories.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <FolderTree className="mx-auto size-9 text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="text-sm font-medium text-slate-800">No categories found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isFiltered
                                ? "No taxonomy entries match your active filter criteria."
                                : "No marketplace categories have been created yet."}
                        </p>
                        {isFiltered ? (
                            <button
                                onClick={handleClearFilters}
                                className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                            >
                                Clear all filters
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setEditingCategory(null);
                                    setPresetParentId(null);
                                    setIsCategoryModalOpen(true);
                                }}
                                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow-2xs transition-colors cursor-pointer"
                            >
                                <Plus size={13} />
                                <span>Create First Category</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 text-[11px]">
                                    <th className="py-2.5 px-4 font-semibold">Category</th>
                                    <th className="py-2.5 px-4 font-semibold">Hierarchy Path</th>
                                    <th className="py-2.5 px-4 font-semibold">Parent Department</th>
                                    <th className="py-2.5 px-4 font-semibold text-center">Products</th>
                                    <th className="py-2.5 px-4 font-semibold">Status</th>
                                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedCategories.map((cat) => {
                                    const isRoot = !cat.parentId;
                                    const parentCat = categories.find((c) => c.id === cat.parentId);

                                    return (
                                        <tr
                                            key={cat.id}
                                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                                        >
                                            {/* Category Identity */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    {cat.imageUrl ? (
                                                        <img
                                                            src={cat.imageUrl}
                                                            alt={cat.name}
                                                            className="size-8 rounded-md object-cover border border-slate-200 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="size-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shrink-0">
                                                            {cat.icon || "📁"}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-slate-900 truncate">
                                                                {cat.name}
                                                            </span>
                                                            {cat.isFeatured && (
                                                                <span
                                                                    title="Featured in storefront navigation"
                                                                    className="inline-flex items-center text-amber-500"
                                                                >
                                                                    <Star size={11} className="fill-amber-400" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[10px] font-mono text-slate-400 truncate">
                                                                /{cat.slug || cat.id.slice(-8)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Hierarchy Path */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 max-w-xs truncate">
                                                    {cat.path}
                                                </div>
                                            </td>

                                            {/* Parent Department */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {isRoot ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                        <Layers size={10} className="text-slate-500" />
                                                        Root Department
                                                    </span>
                                                ) : parentCat ? (
                                                    <span className="inline-flex items-center gap-1 text-slate-700 text-xs font-medium">
                                                        {parentCat.icon && <span>{parentCat.icon}</span>}
                                                        <span>{parentCat.name}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">—</span>
                                                )}
                                            </td>

                                            {/* Products Linked */}
                                            <td className="py-3 px-4 whitespace-nowrap text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums border ${
                                                        cat.productCount > 0
                                                            ? "bg-slate-50 text-slate-800 border-slate-200"
                                                            : "bg-slate-50/50 text-slate-400 border-slate-100"
                                                    }`}
                                                >
                                                    <Package size={11} className={cat.productCount > 0 ? "text-slate-600" : "text-slate-300"} />
                                                    <span>{cat.productCount.toLocaleString()}</span>
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {cat.isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-emerald-50 text-emerald-800 border-emerald-200">
                                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                                        <span>Active</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-slate-50 text-slate-700 border-slate-200">
                                                        <span className="size-1.5 rounded-full bg-slate-400" />
                                                        <span>Hidden</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions Button - All in One Unified Dropdown */}
                                            <td className="py-3 px-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={(e) => handleOpenDropdown(e, cat)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border shadow-2xs ${
                                                        dropdownState?.categoryId === cat.id
                                                            ? "bg-slate-100 text-slate-900 border-slate-300"
                                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                                    }`}
                                                >
                                                    <span>Actions</span>
                                                    <ChevronDown size={12} className="text-slate-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-white text-xs text-slate-500">
                        <div>
                            Showing{" "}
                            <span className="font-semibold text-slate-900 tabular-nums">
                                {Math.min((page - 1) * limit + 1, totalItems)}
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold text-slate-900 tabular-nums">
                                {Math.min(page * limit, totalItems)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-slate-900 tabular-nums">
                                {totalItems.toLocaleString()}
                            </span>{" "}
                            categories
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                            >
                                <ChevronLeft size={13} />
                                <span>Previous</span>
                            </button>

                            <span className="px-2 text-xs text-slate-600 font-medium tabular-nums">
                                Page {page} of {totalPages}
                            </span>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                            >
                                <span>Next</span>
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Dropdown Menu (Fixed in viewport coordinates) */}
            {dropdownState && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setDropdownState(null)}
                    />
                    <div
                        className="fixed z-50 w-52 bg-white rounded-lg border border-slate-200 shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            top: `${dropdownState.top}px`,
                            right: `${dropdownState.right}px`,
                        }}
                    >
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            Category Actions
                        </div>

                        {/* Edit Category */}
                        <button
                            onClick={() => {
                                setEditingCategory(dropdownState.category);
                                setPresetParentId(null);
                                setIsCategoryModalOpen(true);
                                setDropdownState(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                            <Edit2 size={13} className="text-orange-500" />
                            <span>Edit Category</span>
                        </button>

                        {/* Add Subcategory under this category */}
                        <button
                            onClick={() => {
                                setEditingCategory(null);
                                setPresetParentId(dropdownState.category.id);
                                setIsCategoryModalOpen(true);
                                setDropdownState(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                            <FolderPlus size={13} className="text-blue-500" />
                            <span>Add Subcategory</span>
                        </button>

                        {/* Toggle Active / Hidden Status */}
                        <button
                            onClick={() => handleToggleStatus(dropdownState.category)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                            {dropdownState.category.isActive ? (
                                <>
                                    <EyeOff size={13} className="text-slate-500" />
                                    <span>Hide from Catalog</span>
                                </>
                            ) : (
                                <>
                                    <Eye size={13} className="text-emerald-600" />
                                    <span>Publish / Activate</span>
                                </>
                            )}
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        {/* Copy ID */}
                        <button
                            onClick={() => copyToClipboard(dropdownState.category.id, "Category ID")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                            {copiedId === dropdownState.category.id ? (
                                <Check size={13} className="text-emerald-600" />
                            ) : (
                                <Copy size={13} className="text-slate-400" />
                            )}
                            <span>Copy Category ID</span>
                        </button>

                        {/* Copy Hierarchy Path */}
                        <button
                            onClick={() => copyToClipboard(dropdownState.category.path, "Category Path")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                            <Copy size={13} className="text-slate-400" />
                            <span>Copy Path</span>
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        {/* Delete Category */}
                        <button
                            onClick={() => {
                                setCategoryToDelete(dropdownState.category);
                                setDropdownState(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                        >
                            <Trash2 size={13} className="text-rose-500" />
                            <span>Delete Category</span>
                        </button>
                    </div>
                </>
            )}

            {/* Create / Edit Category Modal */}
            {isCategoryModalOpen && (
                <CategoryModal
                    category={editingCategory}
                    categories={categories}
                    presetParentId={presetParentId}
                    onClose={() => {
                        setIsCategoryModalOpen(false);
                        setEditingCategory(null);
                        setPresetParentId(null);
                    }}
                    onSuccess={(msg) => {
                        setIsCategoryModalOpen(false);
                        setEditingCategory(null);
                        setPresetParentId(null);
                        client.invalidateQueries({ queryKey: ["admin-categories"] });
                        client.invalidateQueries({ queryKey: ["marketplace-categories"] });
                        showToast(msg, "success");
                    }}
                    onError={(msg) => showToast(msg, "error")}
                />
            )}

            {/* Delete Confirmation Modal */}
            {categoryToDelete && (
                <ModalPortal onClose={() => !isDeleting && setCategoryToDelete(null)}>
                    <div
                        className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget && !isDeleting) setCategoryToDelete(null);
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    <Trash2 size={15} className="text-rose-600" />
                                    <span>Delete Category</span>
                                </h3>
                                <button
                                    onClick={() => setCategoryToDelete(null)}
                                    disabled={isDeleting}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-pointer"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <div className="p-4 space-y-3 text-xs text-slate-600">
                                <p>
                                    Are you sure you want to permanently delete{" "}
                                    <strong className="text-slate-900 font-semibold">
                                        "{categoryToDelete.name}"
                                    </strong>
                                    ?
                                </p>

                                {categoryToDelete.productCount > 0 && (
                                    <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                                        <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <strong>{categoryToDelete.productCount} active products</strong> are
                                            assigned to this category. The system will prevent deletion until they
                                            are reassigned.
                                        </div>
                                    </div>
                                )}

                                <p className="text-[11px] text-slate-400">
                                    Path: <span className="font-mono text-slate-600">{categoryToDelete.path}</span>
                                </p>
                            </div>

                            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setCategoryToDelete(null)}
                                    disabled={isDeleting}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-2xs cursor-pointer font-semibold disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={13} />
                                    )}
                                    <span>{isDeleting ? "Deleting…" : "Confirm Delete"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}

// -----------------------------------------------------------------------------------------
// Category Create / Edit Modal Component
// -----------------------------------------------------------------------------------------
interface CategoryModalProps {
    category: Category | null;
    categories: Category[];
    presetParentId?: string | null;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

function CategoryModal({
    category,
    categories,
    presetParentId,
    onClose,
    onSuccess,
    onError,
}: CategoryModalProps) {
    const isEditing = Boolean(category);

    // Form fields
    const [name, setName] = useState(category?.name || "");
    const [slug, setSlug] = useState(category?.slug || "");
    const [parentId, setParentId] = useState<string>(
        category?.parentId || presetParentId || ""
    );
    const [icon, setIcon] = useState(category?.icon || "");
    const [description, setDescription] = useState(category?.description || "");
    const [imageUrl, setImageUrl] = useState(category?.imageUrl || "");
    const [isActive, setIsActive] = useState<boolean>(
        category ? category.isActive : true
    );
    const [isFeatured, setIsFeatured] = useState<boolean>(
        category?.isFeatured || false
    );
    const [sortOrder, setSortOrder] = useState<number>(category?.sortOrder || 0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Handle Cloudinary upload
    const handleFileUpload = async (file?: File) => {
        if (!file) return;
        setIsUploading(true);
        try {
            const signature = await getUploadSignatureRequest(
                "category_image",
                "category",
                file.type
            );
            const response = await uploadToCloudinary(file, signature);
            setImageUrl(response.secure_url || response.url);
        } catch (err: any) {
            onError(err?.response?.data?.message || "Failed to upload category image.");
        } finally {
            setIsUploading(false);
        }
    };

    // Form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            onError("Category name is required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: any = {
                name: name.trim(),
                parentId: parentId || null,
                icon: icon.trim() || null,
                imageUrl: imageUrl || null,
                description: description.trim() || null,
                isActive,
                isFeatured,
                sortOrder: Number(sortOrder) || 0,
            };

            if (slug.trim()) {
                payload.slug = slug.trim();
            }

            if (isEditing && category) {
                await api.put(`/categories/${category.id}`, payload);
                onSuccess(`Category "${name}" updated successfully.`);
            } else {
                await api.post("/categories", payload);
                onSuccess(`Category "${name}" created successfully.`);
            }
        } catch (err: any) {
            onError(err?.response?.data?.message || "Failed to save category.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter out the category itself and its descendants when selecting parent category
    const eligibleParentCategories = useMemo(() => {
        if (!category) return categories;
        return categories.filter((c) => c.id !== category.id && !c.path.startsWith(`${category.path} >`));
    }, [categories, category]);

    return (
        <ModalPortal onClose={onClose}>
            <div
                className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget && !isSubmitting) onClose();
                }}
            >
                <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-100 my-auto overflow-hidden">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-md bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                                {isEditing ? <Edit2 size={14} /> : <FolderPlus size={14} />}
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900 text-sm">
                                    {isEditing ? "Edit Category" : "New Platform Category"}
                                </h2>
                                <p className="text-[11px] text-slate-500">
                                    {isEditing
                                        ? "Update classification, routing path, or visual branding."
                                        : "Create a new department or nested subcategory in catalog taxonomy."}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 cursor-pointer"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Modal Form */}
                    <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
                        {/* Name & Slug */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Category Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Mechanical Keyboards"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Slug (URL identifier)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. mechanical-keyboards"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Parent Department */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Parent Department
                            </label>
                            <select
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 cursor-pointer"
                            >
                                <option value="">Top-Level Department (Root Category)</option>
                                {eligibleParentCategories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.path}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Leave as Top-Level Department to place this category at the root of catalog navigation.
                            </p>
                        </div>

                        {/* Icon & Quick Emojis */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Icon or Emoji
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="e.g. 📱 or package"
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-32 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                                />
                                <div className="flex items-center gap-1 flex-wrap">
                                    {QUICK_EMOJIS.map((emoji) => (
                                        <button
                                            type="button"
                                            key={emoji}
                                            onClick={() => setIcon(emoji)}
                                            className={`size-6 rounded border text-xs flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer ${
                                                icon === emoji ? "border-orange-500 bg-orange-50" : "border-slate-200"
                                            }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Banner Image with Cloudinary Upload */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Category Thumbnail / Image
                            </label>
                            <div className="flex items-center gap-3">
                                {imageUrl ? (
                                    <div className="relative size-14 rounded-md border border-slate-200 overflow-hidden shrink-0 group">
                                        <img
                                            src={imageUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setImageUrl("")}
                                            className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                            title="Remove image"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="size-14 rounded-md border border-dashed border-slate-200 flex items-center justify-center text-slate-400 shrink-0 bg-slate-50">
                                        <UploadCloud size={18} />
                                    </div>
                                )}

                                <div className="flex-1 space-y-1.5">
                                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer">
                                        {isUploading ? (
                                            <Loader2 size={13} className="animate-spin text-orange-500" />
                                        ) : (
                                            <UploadCloud size={13} className="text-slate-500" />
                                        )}
                                        <span>{isUploading ? "Uploading to Cloudinary…" : "Upload Image"}</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={isUploading}
                                            onChange={(e) => handleFileUpload(e.target.files?.[0])}
                                        />
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="Or paste external image URL…"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="w-full px-3 py-1 text-[11px] bg-white border border-slate-200 rounded-md text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Summary of products included under this category…"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                            />
                        </div>

                        {/* Visibility & Navigation Checkboxes & Sort Order */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                            {/* Active in Catalog */}
                            <label className="flex items-start gap-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-0 mt-0.5 cursor-pointer"
                                />
                                <div>
                                    <span className="block text-xs font-medium text-slate-900">Active</span>
                                    <span className="text-[10px] text-slate-500">Visible in platform</span>
                                </div>
                            </label>

                            {/* Featured in Navigation */}
                            <label className="flex items-start gap-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="size-4 rounded border-slate-300 text-orange-600 focus:ring-0 mt-0.5 cursor-pointer"
                                />
                                <div>
                                    <span className="block text-xs font-medium text-slate-900">Featured</span>
                                    <span className="text-[10px] text-slate-500">Highlighted on home</span>
                                </div>
                            </label>

                            {/* Sort Order */}
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={10000}
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(Number(e.target.value))}
                                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                                />
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || isUploading}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow-2xs transition-colors cursor-pointer font-semibold disabled:opacity-50"
                            >
                                {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                                <span>
                                    {isSubmitting
                                        ? "Saving…"
                                        : isEditing
                                        ? "Save Changes"
                                        : "Create Category"}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ModalPortal>
    );
}
