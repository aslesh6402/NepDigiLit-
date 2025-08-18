import { Shield, Menu, LogOut, User } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguageStore } from "@/lib/stores/languageStore";
import { useUserStore } from "@/lib/stores/userStore";
import { Button } from "@/components/ui/button";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguageStore();
  const { user, logout } = useUserStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    localStorage.removeItem("auth-token");
    router.push("/");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              {t("portal_name", {
                en: "NepDigiLit Portal",
                ne: "नेपडिजिलिट पोर्टल",
              })}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/chat"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              {t("ai_assistant", { en: "AI Assistant", ne: "AI सहायक" })}
            </Link>

            {user && (
              <>
                {user.role !== "TEACHER" && <LanguageSwitcher />}

                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{user.name}</span>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t("logout", { en: "Logout", ne: "लगआउट" })}</span>
                </Button>
              </>
            )}

            {!user && (
              <Link
                href="/login"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                {t("login", { en: "Login", ne: "लगइन" })}
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link
                href="/chat"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("ai_assistant", { en: "AI Assistant", ne: "AI सहायक" })}
              </Link>

              {user && (
                <>
                  {user.role === "TEACHER" && (
                    <Link
                      href="/dashboard"
                      className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t("dashboard", { en: "Dashboard", ne: "ड्यासबोर्ड" })}
                    </Link>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{user.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t("logout", { en: "Logout", ne: "लगआउट" })}</span>
                    </Button>
                  </div>
                </>
              )}

              {!user && (
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("login", { en: "Login", ne: "लगइन" })}
                </Link>
              )}

              <div className="pt-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
