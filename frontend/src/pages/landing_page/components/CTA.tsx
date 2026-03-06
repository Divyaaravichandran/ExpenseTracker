import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const CTA = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-7xl mx-auto px-6 py-20"
    >
      <div className="rounded-2xl border border-[#8ab4ff1f] bg-[linear-gradient(145deg,rgba(16,32,67,0.7),rgba(8,20,44,0.72))] p-12 text-center shadow-[0_20px_45px_rgba(0,0,0,0.35)] md:p-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Start managing your expenses smarter today.
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-slate-300">
          Join thousands of users who save time and stay on top of their
          finances with ExpenseAI.
        </p>
        <Link to="/signup">
          <motion.span
            className="inline-block rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 px-8 py-4 font-semibold text-[#04222e] shadow-[0_10px_24px_rgba(45,212,191,0.38)] transition hover:brightness-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started Free
          </motion.span>
        </Link>
      </div>
    </motion.section>
  );
};
