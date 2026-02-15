import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const stats = [
  { end: 10000, suffix: "+", label: "Bills Processed" },
  { end: 98, suffix: "%", label: "Extraction Accuracy" },
  { end: 5, suffix: "s", label: "Avg Processing Time" },
];

const AnimatedCounter = ({
  end,
  suffix,
  inView,
}: {
  end: number;
  suffix: string;
  inView: boolean;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const steps = 40;
    const stepValue = end / steps;
    const stepDuration = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);
    return () => clearInterval(timer);
  }, [end, inView]);

  const display = end >= 1000 ? count.toLocaleString() : count;
  return (
    <span>
      {display}
      {suffix}
    </span>
  );
};

export const Stats = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-12 md:p-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <p className="text-5xl font-bold text-blue-600 mb-2">
                <AnimatedCounter
                  end={stat.end}
                  suffix={stat.suffix}
                  inView={inView}
                />
              </p>
              <p className="text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};
