"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Logout = () => {
  const router = useRouter();

  useEffect(() => {
    const logoutUser = async () => {
      try {
        await fetch("http://localhost:5000/api/users/logout", {
          method: "GET",
          credentials: "include", 
        });

        
        localStorage.removeItem("token"); 

        console.log("✅ Logged out successfully!");
        router.push("/login"); 
      } catch (error) {
        console.error("❌ Logout failed:", error);
      }
    };

    logoutUser();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-black">
      <h2 className="text-lg text-gray-800 dark:text-white">Logging out...</h2>
    </div>
  );
};

export default Logout;
