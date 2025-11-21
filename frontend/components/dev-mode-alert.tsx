"use client";

import { AlertCircle, Construction } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DevModeAlertProps {
  pageName?: string;
  message?: string;
  showIcon?: boolean;
}

/**
 * Alert component to display on pages that are under development
 * Shows a warning message to users that the page is not yet complete
 */
export function DevModeAlert({
  pageName,
  message = "This page is currently under development. Some features may be incomplete or not fully functional.",
  showIcon = true,
}: DevModeAlertProps) {
  if (process.env.NODE_ENV === 'production') {
    // In production, we might want to hide this or show a different message
    // For now, we'll still show it to inform users
  }

  return (
    <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <div className="flex items-start gap-3">
        {showIcon && <Construction className="h-5 w-5 text-yellow-600 mt-0.5" />}
        <div className="flex-1">
          <AlertTitle className="text-yellow-800 dark:text-yellow-400 mb-1">
            {pageName ? `${pageName} - Under Development` : 'Page Under Development'}
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            {message}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
