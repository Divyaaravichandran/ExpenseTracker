import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const Hero = () => {
  return (
    <section id="home" className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 overflow-hidden">
      {/* Decorative blurred gradient */}
      <div
        className="absolute top-1/4 -right-32 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-30 pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute bottom-1/4 -left-32 w-80 h-80 bg-indigo-400 rounded-full blur-3xl opacity-20 pointer-events-none"
        aria-hidden
      />

      <div className="relative grid md:grid-cols-2 gap-12 items-center">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-5xl md:text-6xl font-bold leading-tight text-slate-900"
          >
            Smart Expense Tracking Made Effortless
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="mt-6 text-lg text-slate-500 max-w-xl"
          >
            Let AI scan your bills, categorize expenses, and give you real-time
            insights. Save time and take control of your finances with
            ExpenseAI.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Link
              to="/signup"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:border-slate-400 hover:scale-105 transition-all duration-300"
            >
              Login
            </Link>
          </motion.div>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-2xl shadow-xl bg-white p-6 border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-slate-500">
                This month
              </span>
              <span className="text-xs text-slate-400">Dashboard</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Expenses", value: "$2,340", color: "bg-blue-500" },
                { label: "Income", value: "$5,200", color: "bg-emerald-500" },
                { label: "Saved", value: "$860", color: "bg-amber-500" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-slate-50 p-3 text-center"
                >
                  <div
                    className={`h-1.5 w-8 mx-auto rounded-full mb-2 ${stat.color}`}
                  />
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            {/* Donut placeholder */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full border-8 border-slate-200 border-t-blue-500 border-r-indigo-500 border-b-blue-400 border-l-indigo-400 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-700">68%</span>
              </div>
            </div>
            {/* Bar graph */}
            <div className="flex items-end justify-between gap-2 h-20">
              {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-blue-500 to-indigo-500 opacity-80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              Weekly spending
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
