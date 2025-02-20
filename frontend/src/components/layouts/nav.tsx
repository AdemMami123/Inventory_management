"use client";

import * as React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "../darkmode";

export function NavigationMenuDemo() {
  return (
    <nav className="bg-gray-900  w-full p-4">
      <NavigationMenu className="flex justify-end space-x-4">
        <NavigationMenuList className="flex items-center space-x-4">
          <NavigationMenuItem>
            <Link href="/login" legacyBehavior passHref>
              <NavigationMenuLink className={`${navigationMenuTriggerStyle()} px-4`}>
                Login
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/register" legacyBehavior passHref>
              <NavigationMenuLink className={`${navigationMenuTriggerStyle()} px-4`}>
                Register
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <ModeToggle />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
