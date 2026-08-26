import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { User, Shield, Activity, AlertTriangle, ArrowRight, Lock, Laptop, Trash2 } from "lucide-react"

import ProfileSection from "./ProfileSection"

export default function SettingsPage() {
  const navigate = useNavigate()
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 md:px-8">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Manage your personal profile, secure your account, and oversee your active web sessions.
        </p>
      </div>

      <Separator className="my-8 bg-slate-200" />

      <div className="space-y-12">
        
        {/* Profile Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Public Profile</h2>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Update your identifying details and profile picture. This information will be displayed publicly.
            </p>
          </div>
          <div className="md:col-span-8">
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-6 bg-white">
                <ProfileSection /> 
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* Security Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Shield className="h-5 w-5 text-slate-700" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Security & Access</h2>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Ensure your account stays secure. Update your password regularly and manage credentials.
            </p>
          </div>
          <div className="md:col-span-8">
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-6 bg-white flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium text-slate-800 text-sm">
                    <Lock className="h-4 w-4 text-slate-500" />
                    <span>Password & Authentication</span>
                  </div>
                  <p className="text-xs text-slate-500">Last changed 3 months ago</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate("/dashboard/settings/security")} 
                >
                  Manage Security <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* Sessions Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Active Sessions</h2>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Review the devices currently logged into your account. Revoke unfamiliar sessions immediately.
            </p>
          </div>
          <div className="md:col-span-8">
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-6 bg-white flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium text-slate-800 text-sm">
                    <Laptop className="h-4 w-4 text-green-600" />
                    <span>Active Device Management</span>
                  </div>
                  <p className="text-xs text-slate-500">You are currently logged in on this browser</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate("/dashboard/settings/sessions")}
                >
                  View Sessions <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* Danger Zone Section with Popups */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-base font-semibold text-red-600">Danger Zone</h2>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Permanently remove your account and all associated data. Proceed with caution.
            </p>
          </div>
          <div className="md:col-span-8">
            <Card className="border-red-100 shadow-sm rounded-xl overflow-hidden bg-red-50/30">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-medium text-slate-900 text-sm">Deactivate or Delete Account</span>
                  <p className="text-xs text-slate-500">Once deleted, your data cannot be recovered.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Deactivate Popup Modal */}
                  <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                    <DialogTrigger 
                      render={
                        <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 bg-white" />
                      }
                    >
                      Deactivate
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle>Deactivate Account?</DialogTitle>
                        <DialogDescription>
                          Your profile will be hidden and your access suspended. You can reactivate anytime by logging back in.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>Cancel</Button>
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => {
                          setShowDeactivateDialog(false)
                        }}>
                          Confirm Deactivation
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Delete Popup Modal */}
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger 
                      render={
                        <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 gap-1 text-white" />
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" /> Permanently Delete Account?
                        </DialogTitle>
                        <DialogDescription>
                          This action is irreversible. All your stores, orders, products, and data will be permanently wiped out.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => {
                          setShowDeleteDialog(false)
                        }}>
                          Yes, Delete Forever
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}