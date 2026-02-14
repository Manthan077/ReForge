import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const LOGO_SRC = "/ReForge.png";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    // If not on clone page, navigate there first
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleGetStarted = () => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById("url-input");
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else {
      const element = document.getElementById("url-input");
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group"
          >
            <div className="h-10 w-10 rounded-full border border-[var(--border-subtle)] bg-white/10 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110">
              <img src={LOGO_SRC} alt="ReForge" className="h-full w-full object-cover" />
            </div>
            <div className="text-xl font-black tracking-tight group-hover:text-white/90 transition-colors">
              REFORGE
            </div>
          </button>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              How It Works
            </button>

            <button
              onClick={() => scrollToSection("about")}
              className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              About
            </button>

            {/* CTA Button */}
            <button
              onClick={handleGetStarted}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95"
            >
              Get Started →
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}