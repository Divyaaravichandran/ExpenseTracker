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
        className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4"
      >
        How It Works
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-slate-500 text-center max-w-2xl mx-auto mb-16"
      >
        Get started in four simple steps.
      </motion.p>
      <div className="relative">
        <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-slate-200" style={{ left: '12.5%', right: '12.5%' }} aria-hidden />
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
              <div className="w-24 h-24 rounded-full bg-white border-2 border-blue-500 shadow-lg flex items-center justify-center mb-4 relative z-10">
                <span className="text-2xl font-bold text-blue-600">
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-slate-500 text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
