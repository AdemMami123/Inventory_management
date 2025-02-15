"use client";
import { useState } from "react";
import { Home, Package, ShoppingCart, Users, BarChart, Settings, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";

const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-gray-900 text-white p-4 border-r border-gray-700">
      <SidebarContent />
    </aside>
  );
};

const SidebarContent = () => {
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  return (
    <nav className="flex flex-col space-y-4">
      <SidebarItem icon={Home} text="Dashboard" link="/" />
      {/* Products with Dropdown */}
      <div>
        <button
          className="flex items-center justify-between w-full p-2 hover:bg-gray-800 rounded transition"
          onClick={() => setIsProductsOpen(!isProductsOpen)}
        >
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Products</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition ${isProductsOpen ? "rotate-180" : ""}`} />
        </button>
        {isProductsOpen && (
          <div className="ml-6 flex flex-col space-y-2 mt-2">
            <SidebarSubItem text="Add Product" link="/product/addProduct" />
            <SidebarSubItem text="View Products" link="/product/viewProducts" />
          </div>
        )}
      </div>
      <SidebarItem icon={ShoppingCart} text="Orders" link="/orders" />
      <SidebarItem icon={Users} text="Customers" link="/customers" />
      <SidebarItem icon={BarChart} text="Reports" link="/reports" />
      <SidebarItem icon={Settings} text="Settings" link="/settings" />
      <div className="border-t border-gray-700 pt-4">
        <SidebarItem icon={LogOut} text="Logout" link="/logout" />
      </div>
    </nav>
  );
};

const SidebarItem = ({ icon: Icon, text, link }: any) => (
  <Link href={link} className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded transition">
    <Icon className="h-5 w-5" />
    <span>{text}</span>
  </Link>
);

const SidebarSubItem = ({ text, link }: any) => (
  <Link href={link} className="block text-sm p-2 hover:bg-gray-700 rounded transition">
    {text}
  </Link>
);

export default Sidebar;
