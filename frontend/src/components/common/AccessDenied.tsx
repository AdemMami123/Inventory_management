"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  requiredRole?: string | string[];
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export default function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to access this resource.",
  requiredRole,
  showBackButton = true,
  showHomeButton = true
}: AccessDeniedProps) {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  const goHome = () => {
    router.push("/");
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-xl text-red-600">{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {requiredRole && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm">
              <p className="font-medium">Required Permission:</p>
              <p className="text-gray-600 dark:text-gray-300">
                {Array.isArray(requiredRole)
                  ? `One of these roles: ${requiredRole.join(", ")}`
                  : `Role: ${requiredRole}`}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          {showBackButton && (
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
          {showHomeButton && (
            <Button onClick={goHome}>
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
