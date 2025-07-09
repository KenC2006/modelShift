import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  GitCompare,
  Key,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

const Layout = ({ children }) => {
  const { userData, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const navigation = [
    { name: "AI Comparison", href: "/", icon: GitCompare },
    { name: "API Manager", href: "/api-manager", icon: Key },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-theme-bg-secondary">
      {/* Navigation */}
      <nav className="bg-theme-surface shadow-sm border-b border-theme-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <Link to="/" className="flex items-center">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">MS</span>
                </div>
                <span className="ml-2 text-xl font-bold text-theme-text">
                  modelShift
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "border-primary-500 text-theme-text"
                          : "border-transparent text-theme-text-secondary hover:border-theme-border hover:text-theme-text"
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-1" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-sm rounded-full"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    {userData?.picture ? (
                      <img
                        src={userData.picture}
                        alt={userData.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <User className="h-4 w-4 text-primary-600" />
                    )}
                  </div>
                  <span className="hidden md:block text-theme-text-secondary">
                    {userData?.name || "User"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-theme-text-muted" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-theme-surface rounded-lg shadow-lg py-1 z-50 border border-theme-border-light">
                    <div className="px-4 py-2 text-sm text-theme-text-secondary border-b border-theme-border-light">
                      <p className="font-medium truncate text-theme-text">
                        {userData?.name || "User"}
                      </p>
                      <p className="text-theme-text-muted truncate">
                        {userData?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-theme-text-secondary hover:bg-theme-surface-hover flex items-center focus:outline-none transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden ml-2">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                      isActive
                        ? "bg-primary-50 border-primary-500 text-primary-700"
                        : "border-transparent text-theme-text-secondary hover:bg-theme-surface-hover hover:border-theme-border hover:text-theme-text"
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-5 w-5 mr-2" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>

      {/* Click outside to close dropdowns */}
      {(isUserMenuOpen || isMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMenuOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Layout;
