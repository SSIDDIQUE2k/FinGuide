"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Eye, FileText } from "lucide-react"

export function SecurityNotice() {
  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <Shield className="h-5 w-5" />
          Your Documents Are Secure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">Private Access</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Only you can access your uploaded financial documents
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">User Isolation</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your data is completely isolated from other users
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">Secure Processing</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                All document analysis happens in your private workspace
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
