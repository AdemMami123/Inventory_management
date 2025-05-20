"use client";
import { useState, useEffect } from "react";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart,
  Settings,
  LogOut,
  ChevronDown,
  Eye,
  PlusCircle,
  List,
  Clock,
  FileText,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import RoleIndicator from "../common/RoleIndicator";

const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-gray-900 text-white p-4 border-r border-gray-700">
      <div className="flex flex-col h-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">Inventory Manager</h1>
        </div>
        <SidebarContent />
        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Current Role:</span>
            <RoleIndicator showLabel={true} className="px-3" />
          </div>
          <SidebarItem icon={LogOut} text="Logout" link="/logout" />
        </div>
      </div>
    </aside>
  );
};

const SidebarContent = () => {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    products: false,
    orders: false
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Toggle a menu's expanded state
  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // Fetch user role on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users/getuser", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
        } else {
          // If not authenticated, set as guest
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

  // Auto-expand menus based on current path
  useEffect(() => {
    if (pathname?.includes('/product')) {
      setExpandedMenus(prev => ({ ...prev, products: true }));
    }
    if (pathname?.includes('/orders')) {
      setExpandedMenus(prev => ({ ...prev, orders: true }));
    }
  }, [pathname]);

  if (isLoading) {
    return <div className="p-4 text-gray-400">Loading...</div>;
  }

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isStaff = isAdmin || isManager;
  const isCustomer = userRole === 'customer';

  return (
    <nav className="flex flex-col space-y-1">
      <SidebarItem
        icon={Home}
        text="Dashboard"
        link={isStaff ? "/dashboard/admin" : "/dashboard/customer"}
        active={pathname === '/' || pathname?.includes('/dashboard')}
      />

      {/* Products Menu */}
      <div>
        <button
          className={`flex items-center justify-between w-full p-2 hover:bg-gray-800 rounded transition ${
            pathname?.includes('/product') ? 'bg-gray-800' : ''
          }`}
          onClick={() => toggleMenu('products')}
        >
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Products</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition ${expandedMenus.products ? "rotate-180" : ""}`} />
        </button>

        {expandedMenus.products && (
          <div className="ml-6 flex flex-col space-y-1 mt-1">
            {/* Only staff can add/edit products */}
            {isStaff && (
              <SidebarSubItem
                icon={PlusCircle}
                text="Add Product"
                link="/product/addProduct"
                active={pathname === '/product/addProduct'}
              />
            )}
            {/* Everyone can view products */}
            <SidebarSubItem
              icon={List}
              text="View Products"
              link="/product/viewProducts"
              active={pathname === '/product/viewProducts'}
            />
            {isStaff && (
              <SidebarSubItem
                icon={Clock}
                text="Product History"
                link="/product/history"
                active={pathname === '/product/history'}
              />
            )}
          </div>
        )}
      </div>

      {/* Orders Menu */}
      <div>
        <button
          className={`flex items-center justify-between w-full p-2 hover:bg-gray-800 rounded transition ${
            pathname?.includes('/orders') ? 'bg-gray-800' : ''
          }`}
          onClick={() => toggleMenu('orders')}
        >
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Orders</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition ${expandedMenus.orders ? "rotate-180" : ""}`} />
        </button>

        {expandedMenus.orders && (
          <div className="ml-6 flex flex-col space-y-1 mt-1">
            {/* Place new order - available to all */}
            <SidebarSubItem
              icon={ShoppingBag}
              text="Place New Order"
              link="/orders/create"
              active={pathname === '/orders/create'}
            />

            {/* Customer-specific options */}
            {isCustomer && (
              <>
                <SidebarSubItem
                  icon={FileText}
                  text="My Orders"
                  link="/orders/my-orders"
                  active={pathname === '/orders/my-orders'}
                />
              </>
            )}

            {/* Staff-specific options */}
            {isStaff && (
              <>
                <SidebarSubItem
                  icon={List}
                  text="All Orders"
                  link="/orders/manage"
                  active={pathname === '/orders/manage'}
                />
                <SidebarSubItem
                  icon={Clock}
                  text="Pending Orders"
                  link="/orders/pending"
                  active={pathname === '/orders/pending'}
                />
                <SidebarSubItem
                  icon={Truck}
                  text="Shipped Orders"
                  link="/orders/shipped"
                  active={pathname === '/orders/shipped'}
                />
                <SidebarSubItem
                  icon={CheckCircle}
                  text="Delivered Orders"
                  link="/orders/delivered"
                  active={pathname === '/orders/delivered'}
                />
                <SidebarSubItem
                  icon={XCircle}
                  text="Cancelled Orders"
                  link="/orders/cancelled"
                  active={pathname === '/orders/cancelled'}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Admin/Manager-only sections */}
      {isStaff && (
        <>
          <SidebarItem
            icon={Users}
            text="Customers"
            link="/customers"
            active={pathname?.includes('/customers')}
          />
          <SidebarItem
            icon={BarChart}
            text="Reports"
            link="/reports"
            active={pathname?.includes('/reports')}
          />
        </>
      )}

      {/* Settings - available to all */}
      <SidebarItem
        icon={Settings}
        text="Settings"
        link="/settings"
        active={pathname?.includes('/settings')}
      />
    </nav>
  );
};

interface SidebarItemProps {
  icon: React.ElementType;
  text: string;
  link: string;
  active?: boolean;
}

const SidebarItem = ({ icon: Icon, text, link, active = false }: SidebarItemProps) => (
  <Link
    href={link}
    className={`flex items-center space-x-2 p-2 hover:bg-gray-800 rounded transition ${
      active ? 'bg-gray-800 text-white' : 'text-gray-300'
    }`}
  >
    <Icon className="h-5 w-5" />
    <span>{text}</span>
  </Link>
);

interface SidebarSubItemProps {
  icon?: React.ElementType;
  text: string;
  link: string;
  active?: boolean;
}

const SidebarSubItem = ({ icon: Icon, text, link, active = false }: SidebarSubItemProps) => (
  <Link
    href={link}
    className={`flex items-center p-2 text-sm hover:bg-gray-800 rounded transition ${
      active ? 'bg-gray-700 text-white' : 'text-gray-300'
    }`}
  >
    {Icon && <Icon className="h-4 w-4 mr-2" />}
    <span>{text}</span>
  </Link>
);

export default Sidebar;
