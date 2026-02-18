import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";

const AVATARS = ["/female 1.png", "/male 1.png", "/male 2.png"];

const testimonials = [
  { name: "Sarah L.", role: "Boutique Owner", quote: "I was honestly not sure if a chatbot would work for my small shop. But Askio surprised me. It took maybe ten minutes to set up and now it answers customer questions about shipping and returns all day long, even when I'm not around." },
  { name: "Mark L.", role: "E-commerce Entrepreneur", quote: "I run three different online stores so managing support was getting out of hand. Askio let me spin up a custom chatbot for each one in the same afternoon. Cart abandonment dropped 15% in the first month. Can't believe it's free." },
  { name: "Pat M.", role: "Freelance Designer", quote: "What sold me was the customization. I matched the chatbot to my portfolio's look and feel so it doesn't feel out of place at all. Clients get instant answers to common questions and I spend less time on repetitive emails. Win win." },
];

export default function TestimonialsSection() {
  const [testimonialsRef, testimonialsInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        setTimeout(() => setIsTransitioning(false), 100);
      }, 300);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleTestimonialNav = (index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTestimonial(index);
      setTimeout(() => setIsTransitioning(false), 100);
    }, 300);
  };

  return (
    <motion.section
      ref={testimonialsRef}
      initial={{ opacity: 0, y: 40 }}
      animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      id="testimonials"
      className="border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C] bg-white dark:bg-[#262220]"
    >
      <div className="py-20 flex flex-col md:flex-row justify-center items-end gap-6 px-4 sm:px-6 md:px-12 relative">
        {/* Decorative Quote Mark */}
        <div className="absolute top-8 left-4 sm:left-8 md:left-12 text-[180px] md:text-[240px] font-serif leading-none text-[rgba(55,50,47,0.04)] dark:text-[rgba(255,255,255,0.03)] select-none pointer-events-none" aria-hidden="true">
          &ldquo;
        </div>

        {/* Quote + Name */}
        <div className="flex-1 flex flex-col gap-6 relative z-10">
          <div
            className="text-[#49423D] dark:text-[#F5F5F4] text-h2 md:text-[32px] font-medium leading-10 md:leading-[42px] font-sans tracking-tight min-h-[120px] md:min-h-[160px] transition-all duration-700 ease-in-out"
            style={{ filter: isTransitioning ? "blur(4px)" : "blur(0px)" }}
          >
            "{testimonials[activeTestimonial].quote}"
          </div>
          <div
            className="flex items-center gap-3 transition-all duration-700 ease-in-out"
            style={{ filter: isTransitioning ? "blur(4px)" : "blur(0px)" }}
          >
            {/* Avatar */}
            <img
              src={AVATARS[activeTestimonial]}
              alt={testimonials[activeTestimonial].name}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#E0DEDB] dark:border-[#44403C]"
            />
            <div className="flex flex-col">
              <div className="text-[rgba(73,66,61,0.90)] dark:text-[#D6D3D1] text-lg font-medium font-sans">
                {testimonials[activeTestimonial].name}
              </div>
              <div className="text-[rgba(73,66,61,0.70)] dark:text-[#A8A29E] text-sm font-medium font-sans">
                {testimonials[activeTestimonial].role}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex flex-col items-end gap-4 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={() => handleTestimonialNav((activeTestimonial - 1 + testimonials.length) % testimonials.length)}
              className="w-9 h-9 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] rounded-full border border-[rgba(0,0,0,0.15)] dark:border-[#57534E] flex items-center justify-center hover:bg-[rgba(55,50,47,0.04)] dark:hover:bg-[#44403C] hover:scale-110 transition-all duration-200"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5 text-[#46413E] dark:text-[#F5F5F4]" />
            </button>
            <button
              onClick={() => handleTestimonialNav((activeTestimonial + 1) % testimonials.length)}
              className="w-9 h-9 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] rounded-full border border-[rgba(0,0,0,0.15)] dark:border-[#57534E] flex items-center justify-center hover:bg-[rgba(55,50,47,0.04)] dark:hover:bg-[#44403C] hover:scale-110 transition-all duration-200"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5 text-[#46413E] dark:text-[#F5F5F4]" />
            </button>
          </div>
          {/* Pagination Dots */}
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => handleTestimonialNav(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeTestimonial
                    ? "w-6 bg-[#37322F] dark:bg-[#F5F5F4]"
                    : "w-1.5 bg-[rgba(55,50,47,0.2)] dark:bg-[rgba(255,255,255,0.15)] hover:bg-[rgba(55,50,47,0.4)] dark:hover:bg-[rgba(255,255,255,0.3)]"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
