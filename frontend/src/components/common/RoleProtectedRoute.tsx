"use client";

import { useState, useEffect, ReactNode } from "react";
import AccessDenied from "./AccessDenied";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export default function RoleProtectedRoute({
  children,
  allowedRoles,
  fallback
}: RoleProtectedRouteProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First check login status
        const statusCheck = await fetch("http://localhost:5000/api/users/loggedin", {
          method: "GET",
          credentials: "include",
        });

        const isLoggedIn = await statusCheck.json();

        if (!isLoggedIn) {
          console.log("User is not logged in");
          setUserRole(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // If logged in, get user data
        const response = await fetch("http://localhost:5000/api/users/getuser", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log("User role for protected route:", userData.role);
          setUserRole(userData.role);
          setIsAuthenticated(true);
        } else {
          console.log("Failed to get user data:", response.status);
          setUserRole(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserRole(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full p-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show access denied
  if (!isAuthenticated) {
    return fallback || (
      <AccessDenied
        title="Authentication Required"
        message="Please log in to access this page."
        showBackButton={false}
      />
    );
  }

  // If authenticated but not authorized, show access denied
  if (userRole && !allowedRoles.includes(userRole)) {
    return fallback || (
      <AccessDenied
        title="Access Denied"
        message="You don't have permission to access this page."
        requiredRole={allowedRoles}
      />
    );
  }

  // If authenticated and authorized, render children
  return <>{children}</>;
}
