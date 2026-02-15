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
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-12 md:p-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Start managing your expenses smarter today.
        </h2>
        <p className="text-blue-100 max-w-xl mx-auto mb-8">
          Join thousands of users who save time and stay on top of their
          finances with ExpenseAI.
        </p>
        <Link to="/signup">
          <motion.span
            className="inline-block px-8 py-4 rounded-2xl bg-white text-blue-600 font-semibold shadow-lg hover:scale-105 transition-transform duration-300"
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
