import React from "react";
import { AdminNavLinks } from "./AdminNavLinks";

export const AdminSidebar = () => {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-background border-r border-border h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
            S
          </div>
          <span className="font-semibold text-foreground tracking-tight">
            SystemOS Admin
          </span>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <AdminNavLinks />
      </div>
    </aside>
  );
};