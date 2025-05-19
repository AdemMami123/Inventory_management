"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldCheck, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RoleIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export default function RoleIndicator({ className = "", showLabel = false }: RoleIndicatorProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          console.log("User role:", userData.role);
          setUserRole(userData.role);
        } else {
          console.log("Failed to get user data:", response.status);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse h-6 w-20 bg-gray-200 rounded-full"></div>;
  }

  // Show guest badge when not logged in
  if (!userRole) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${className} flex items-center bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400`}>
              <User className="h-4 w-4 mr-1" />
              {showLabel && <span>Guest</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Not logged in</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const getRoleBadge = () => {
    switch (userRole) {
      case "admin":
        return {
          icon: <ShieldAlert className="h-4 w-4 mr-1" />,
          label: "Admin",
          variant: "destructive" as const,
          tooltip: "Administrator with full system access"
        };
      case "manager":
        return {
          icon: <ShieldCheck className="h-4 w-4 mr-1" />,
          label: "Manager",
          variant: "default" as const,
          tooltip: "Manager with product and order management access"
        };
      case "employee":
        return {
          icon: <Shield className="h-4 w-4 mr-1" />,
          label: "Employee",
          variant: "secondary" as const,
          tooltip: "Employee with limited management access"
        };
      case "customer":
        return {
          icon: <User className="h-4 w-4 mr-1" />,
          label: "Customer",
          variant: "outline" as const,
          tooltip: "Customer with order placement access"
        };
      default:
        return {
          icon: <User className="h-4 w-4 mr-1" />,
          label: "Guest",
          variant: "outline" as const,
          tooltip: "Guest user with limited access"
        };
    }
  };

  const { icon, label, variant, tooltip } = getRoleBadge();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className={`${className} flex items-center`}>
            {icon}
            {showLabel && <span>{label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
