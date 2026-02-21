import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

const LOGO_SRC = "/ReForge.png";

export default function AuthNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  useEffect(() => {
    setIsLoggingOut(false);
    setShowProfileMenu(false);
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e]/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-lg overflow-hidden border border-white/10 group-hover:border-white/20 transition-all">
            <img src={LOGO_SRC} alt="ReForge" className="h-full w-full object-cover" />
          </div>
          <span className="text-lg font-bold tracking-widest text-white uppercase">REFORGE</span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {user && !isAuthPage ? (
            <>
              {/* User pill */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all"
                >
                  {user.photo ? (
                    <img src={user.photo} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                      <span className="text-black text-xs font-black">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-300">{user.name}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/profile');
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Edit Profile
                      </button>
                    </div>
                    <div className="p-2 border-t border-white/10">
                      <button
                        onClick={async () => {
                          setIsLoggingOut(true);
                          await new Promise(resolve => setTimeout(resolve, 500));
                          logout();
                          navigate('/');
                        }}
                        disabled={isLoggingOut}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoggingOut ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Logging out...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            (
              <>
                {location.pathname === "/login" && (
  <Link
    to="/signup"
    className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all"
  >
    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
    Create Account
  </Link>
)}
{location.pathname === "/signup" && (
  <Link
    to="/login"
    className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all"
  >
    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
    Sign In
  </Link>
)}
{!isAuthPage && (
  <>
    <Link
      to="/login"
      className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all"
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      Sign In
    </Link>
    <Link
      to="/signup"
      className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white text-sm text-black font-semibold hover:bg-gray-100 transition-all"
    >
      Get Started
    </Link>
  </>
)}
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
}