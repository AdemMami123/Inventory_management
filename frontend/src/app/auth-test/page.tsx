"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, LogOut, LogIn } from "lucide-react";
import RoleIndicator from "@/components/common/RoleIndicator";
import { Toaster, toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthTestPage() {
  const [loginStatus, setLoginStatus] = useState<boolean | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check login status
      const loginResponse = await fetch("http://localhost:5000/api/users/loggedin", {
        method: "GET",
        credentials: "include",
      });

      if (!loginResponse.ok) {
        throw new Error(`Login status check failed: ${loginResponse.status}`);
      }

      const isLoggedIn = await loginResponse.json();
      setLoginStatus(isLoggedIn);

      if (isLoggedIn) {
        // Get user data
        const userResponse = await fetch("http://localhost:5000/api/users/getuser", {
          method: "GET",
          credentials: "include",
        });

        if (userResponse.ok) {
          const data = await userResponse.json();
          setUserData(data);
        } else {
          setError(`Failed to get user data: ${userResponse.status}`);
        }
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/users/logout", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Logged out successfully");
        setLoginStatus(false);
        setUserData(null);
      } else {
        toast.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="container mx-auto py-10 px-4">
      <Toaster position="top-right" />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Authentication Test</CardTitle>
            {loginStatus === true ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Logged In
              </Badge>
            ) : loginStatus === false ? (
              <Badge className="bg-red-100 text-red-800">
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Not Logged In
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800">
                <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                Checking...
              </Badge>
            )}
          </div>
          <CardDescription>
            This page tests your authentication status and displays relevant information
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {userData && (
                  <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-medium mb-2">User Information:</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">Name:</div>
                      <div>{userData.name}</div>

                      <div className="font-medium">Email:</div>
                      <div>{userData.email}</div>

                      <div className="font-medium">Role:</div>
                      <div>
                        <Badge className={
                          userData.role === 'admin' ? 'bg-red-100 text-red-800' :
                          userData.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                          userData.role === 'employee' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {userData.role}
                        </Badge>
                      </div>

                      <div className="font-medium">User ID:</div>
                      <div className="truncate">{userData._id}</div>
                    </div>
                  </div>
                )}

                {!loginStatus && !loading && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not Authenticated</AlertTitle>
                    <AlertDescription>
                      You are not currently logged in. Please log in to see your user information.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={checkAuth} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>

          <div className="space-x-2">
            {!loginStatus ? (
              <Button onClick={() => router.push('/login')}>
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          <Link href="/" className="text-blue-500 hover:underline">
            Return to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
