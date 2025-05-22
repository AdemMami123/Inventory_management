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

interface NavigationMenuDemoProps {
  showMinimal?: boolean;
}

export function NavigationMenuDemo({ showMinimal = false }: NavigationMenuDemoProps) {
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
          const isLoggedIn = await response.json();
          setIsLoggedIn(isLoggedIn);

          // If logged in, get user role
          if (isLoggedIn) {
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
    <nav className="w-full p-4">
      <NavigationMenu className="flex justify-between w-full">
        {/* Left side - Brand and main navigation (only shown in full mode) */}
        {!showMinimal && (
          <div className="flex items-center">
            <NavigationMenuList className="flex items-center space-x-4">
              <NavigationMenuItem>
                <Link href="/" className="text-lg font-bold">
                  Inventory Manager
                </Link>
              </NavigationMenuItem>

              {isLoggedIn && (
                <>
                  {/* Dashboard link based on role */}
                  <NavigationMenuItem>
                    <Link
                      href={userRole === 'customer' ? "/dashboard/customer" : "/dashboard/admin"}
                      className={`${navigationMenuTriggerStyle()} px-4`}
                    >
                      Dashboard
                    </Link>
                  </NavigationMenuItem>

                  {/* Admin/Manager specific links */}
                  {(userRole === 'admin' || userRole === 'manager') && (
                    <>
                      <NavigationMenuItem>
                        <Link href="/product/viewProducts" className={`${navigationMenuTriggerStyle()} px-4`}>
                          Products
                        </Link>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <Link href="/orders/manage" className={`${navigationMenuTriggerStyle()} px-4`}>
                          Orders
                        </Link>
                      </NavigationMenuItem>
                    </>
                  )}

                  {/* Customer specific links */}
                  {userRole === 'customer' && (
                    <>
                      <NavigationMenuItem>
                        <Link href="/product/viewProducts" className={`${navigationMenuTriggerStyle()} px-4`}>
                          Shop
                        </Link>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <Link href="/orders/history" className={`${navigationMenuTriggerStyle()} px-4`}>
                          My Orders
                        </Link>
                      </NavigationMenuItem>
                    </>
                  )}
                </>
              )}
            </NavigationMenuList>
          </div>
        )}

        {/* Right side - User actions */}
        <NavigationMenuList className={`flex items-center space-x-4 ${showMinimal ? 'ml-auto' : ''}`}>
          {isLoggedIn ? (
            // Logged in navigation items
            <>
              {/* Only show notifications for customers */}
              {userRole === 'customer' && (
                <NavigationMenuItem>
                  <OrderNotifications />
                </NavigationMenuItem>
              )}

              {/* Profile link */}
              <NavigationMenuItem>
                <Link href="/profile" className={`${navigationMenuTriggerStyle()} px-4`}>
                  Profile
                </Link>
              </NavigationMenuItem>

              {/* Logout link (only shown in full mode) */}
              {!showMinimal && (
                <NavigationMenuItem>
                  <Link href="/logout" className={`${navigationMenuTriggerStyle()} px-4`}>
                    Logout
                  </Link>
                </NavigationMenuItem>
              )}
            </>
          ) : (
            // Logged out navigation items (only shown in full mode)
            !showMinimal && (
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
            )
          )}
          <NavigationMenuItem>
            <ModeToggle />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
