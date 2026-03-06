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
      className="sticky top-0 z-50 border-b border-[#8ab4ff1a] bg-[linear-gradient(145deg,rgba(16,32,67,0.62),rgba(8,20,44,0.68))] backdrop-blur-md"
    >
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-bold text-white transition duration-300 hover:opacity-80"
          aria-label="ExpenseAI home"
        >
          ExpenseAI
        </Link>
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="text-slate-300 hover:text-white transition duration-300"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl border border-[#2f4e83] bg-[#0c1b3b] px-4 py-2 text-slate-100 transition hover:bg-[#11264f]"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 px-4 py-2 font-semibold text-[#04222e] shadow-[0_10px_24px_rgba(45,212,191,0.38)] transition hover:brightness-105"
          >
            Sign Up
          </Link>
        </div>
      </nav>
    </motion.header>
  );
};
