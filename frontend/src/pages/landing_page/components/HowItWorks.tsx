import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    title: "Create Account",
    description: "Sign up in seconds with your email. No credit card required.",
  },
  {
    number: 2,
    title: "Upload Bill",
    description: "Take a photo or upload a PDF of your receipt or bill.",
  },
  {
    number: 3,
    title: "AI Extracts Data",
    description: "Our AI reads amounts, dates, and categories automatically.",
  },
  {
    number: 4,
    title: "View Insights",
    description: "See dashboards, trends, and reports in one place.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-4 text-center text-3xl font-bold text-white md:text-4xl"
      >
        How It Works
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mx-auto mb-16 max-w-2xl text-center text-slate-300"
      >
        Get started in four simple steps.
      </motion.p>
      <div className="relative">
        <div className="absolute left-0 right-0 top-12 hidden h-0.5 bg-[#294673] lg:block" style={{ left: "12.5%", right: "12.5%" }} aria-hidden />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-cyan-400 bg-[#0f2246] shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
                <span className="text-2xl font-bold text-cyan-300">
                  {step.number}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-sm text-slate-300">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
