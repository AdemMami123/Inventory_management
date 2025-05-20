"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "../darkmode";
import OrderNotifications from "../notifications/OrderNotifications";

export function NavigationMenuDemo() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check login status
    const checkLoginStatus = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users/loggedin", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(data.status);

          // If logged in, get user role
          if (data.status) {
            const userResponse = await fetch("http://localhost:5000/api/users/getuser", {
              method: "GET",
              credentials: "include",
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUserRole(userData.role);
            }
          }
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <nav className="bg-gray-900 w-full p-4">
      <NavigationMenu className="flex justify-end space-x-4">
        <NavigationMenuList className="flex items-center space-x-4">
          {isLoggedIn ? (
            // Logged in navigation items
            <>
              {/* Only show notifications for customers */}
              {userRole === 'customer' && (
                <NavigationMenuItem>
                  <OrderNotifications />
                </NavigationMenuItem>
              )}
              <NavigationMenuItem>
                <Link href="/logout" className={`${navigationMenuTriggerStyle()} px-4`}>
                  Logout
                </Link>
              </NavigationMenuItem>
            </>
          ) : (
            // Logged out navigation items
            <>
              <NavigationMenuItem>
                <Link href="/login" className={`${navigationMenuTriggerStyle()} px-4`}>
                  Login
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/register" className={`${navigationMenuTriggerStyle()} px-4`}>
                  Register
                </Link>
              </NavigationMenuItem>
            </>
          )}
          <NavigationMenuItem>
            <ModeToggle />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
