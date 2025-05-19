"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Toaster, toast } from "react-hot-toast";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Initialize router

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Proceed directly with registration without checking email
      // The backend will handle duplicate email validation
      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      });

      // Try to parse the response as JSON
      let data;
      const responseText = await response.text();

      try {
        // First check if the response is valid JSON
        if (responseText.trim()) {
          try {
            data = JSON.parse(responseText);
          } catch (jsonError) {
            console.error("Invalid JSON response:", responseText);
            console.error("JSON parse error:", jsonError);

            // Check if it's an HTML response (likely an error page)
            if (responseText.includes("<!DOCTYPE html>") || responseText.includes("<html>")) {
              throw new Error("Server returned an HTML page instead of JSON. The server might be experiencing issues.");
            } else {
              throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
            }
          }
        }
      } catch (parseError) {
        console.error("Error handling response:", parseError);
        throw parseError;
      }

      if (!response.ok) {
        // If we have data with a message, use it
        if (data && data.message) {
          throw new Error(data.message);
        } else if (data && data.error) {
          throw new Error(data.error);
        } else {
          throw new Error(`Registration failed (${response.status}). Please try again.`);
        }
      }

      console.log("✅ Registration successful!");

      // Show success message and redirect after a short delay
      setError(null);

      // Show success message using toast
      toast.success("Registration successful! Redirecting to login...", {
        duration: 3000,
      });

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-black">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl md:p-8 shadow-input bg-white dark:bg-black">
        <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
          Sign Up 🚀
        </h2>
        <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
          Create an account to get started
        </p>

        {error && <p className="text-red-500 mt-2">{error}</p>}

        <form className="my-8" onSubmit={handleSubmit}>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Your Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </LabelInputContainer>

          <LabelInputContainer className="mb-4">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              placeholder="your-email@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </LabelInputContainer>

          <LabelInputContainer className="mb-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </LabelInputContainer>

          <button
            className="bg-gradient-to-br from-black to-neutral-600 dark:from-zinc-900 dark:to-zinc-900 w-full text-white rounded-md h-10 font-medium shadow-input"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign up →"}
          </button>

          <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-6 h-[1px] w-full" />

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn("flex flex-col space-y-2 w-full", className)}>{children}</div>;
};

export default Signup;
