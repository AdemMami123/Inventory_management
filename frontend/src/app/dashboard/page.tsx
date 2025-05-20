"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // First check if user is logged in
        const loginResponse = await fetch("http://localhost:5000/api/users/loggedin", {
          method: "GET",
          credentials: "include",
        });

        if (!loginResponse.ok) {
          // If there's an error or user is not logged in, redirect to login
          router.push("/login");
          return;
        }

        const isLoggedIn = await loginResponse.json();
        if (!isLoggedIn) {
          router.push("/login");
          return;
        }

        // If logged in, get user data to determine role
        const userResponse = await fetch("http://localhost:5000/api/users/getuser", {
          method: "GET",
          credentials: "include",
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();

          // Redirect based on user role
          if (userData.role === "admin" || userData.role === "manager") {
            router.push("/dashboard/admin");
          } else if (userData.role === "customer") {
            router.push("/dashboard/customer");
          } else {
            // Default fallback for other roles
            router.push("/dashboard/customer");
          }
        } else {
          // If can't get user data, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [router]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        {loading && (
          <>
            <div className="space-y-2">
              <Skeleton className="h-12 w-[250px]" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-[125px] w-full rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-[350px] md:col-span-2 rounded-xl" />
              <Skeleton className="h-[350px] rounded-xl" />
            </div>
            <Skeleton className="h-[350px] rounded-xl" />
          </>
        )}
      </div>
    </div>
  );
}
