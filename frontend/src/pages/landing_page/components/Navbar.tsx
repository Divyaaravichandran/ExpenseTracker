import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
];

export const Navbar = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200"
    >
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-bold text-slate-900 transition duration-300 hover:opacity-80"
          aria-label="ExpenseAI home"
        >
          ExpenseAI
        </Link>
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="text-slate-600 hover:text-slate-900 transition duration-300"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:border-slate-400 hover:scale-105 transition-all duration-300"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 transition-all duration-300"
          >
            Sign Up
          </Link>
        </div>
      </nav>
    </motion.header>
  );
};
