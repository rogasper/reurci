import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@reurci/ui/components/button";
import { ArrowRight, CheckCircle2, ChevronDown, History, RefreshCw, FileText, BrainCircuit, Search } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function HeroSection() {
  return (
    <section className="pt-24 pb-16 px-4 max-w-6xl mx-auto relative z-10">
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8 relative">
        
        {/* Left Side: Text */}
        <div className="flex-1 text-center lg:text-left relative z-20">
          <span className="portrait-chip mb-6 bg-[var(--color-mint-wash)] animate-fade-in inline-flex">Tailor with AI</span>
          
          <h1 
            className="font-semibold tracking-tight leading-[1.05]"
            style={{ 
              fontFamily: "var(--font-heading)", 
              fontSize: "clamp(48px, 6vw, 76px)",
              letterSpacing: "-0.04em",
              color: "var(--color-portrait-ink)"
            }}
          >
            Tailor your CV <br />
            <em 
              className="not-italic" 
              style={{ 
                backgroundImage: "var(--gradient-rainbow)", 
                WebkitBackgroundClip: "text", 
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent"
              }}
            >
              perfectly.
            </em>
          </h1>
          
          <p className="mt-8 text-lg max-w-lg mx-auto lg:mx-0" style={{ color: "var(--color-graphite-body)", lineHeight: 1.45 }}>
            Automatically rewrite your CV to match any job description. Get past applicant tracking systems while sounding completely natural.
          </p>

          <div className="mt-10 lg:mb-0 mb-12">
            <Link to="/login">
              <Button variant="rainbow" size="lg" className="h-12 px-8 text-base font-semibold group relative overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Start tailoring for free
                  <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Right Side: CV Preview Mockup */}
        <div className="flex-1 w-full max-w-xl mx-auto relative perspective-1000 mt-4 lg:mt-0">
          <div className="w-full h-[400px] overflow-hidden rounded-[24px] border border-gray-200/60 shadow-2xl relative bg-white transform transition-all duration-700 hover:-translate-y-2 lg:-rotate-3 hover:rotate-0">
            
            {/* PDF Header mockup */}
            <div className="w-full h-12 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2 relative z-30">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              <div className="ml-4 w-48 h-6 bg-white rounded shadow-sm text-[11px] text-center flex items-center justify-center text-gray-500 font-medium border border-gray-100">
                Jordan_Lee_Resume.pdf
              </div>
            </div>

            {/* Document content mockup */}
            <div className="p-10 space-y-8 relative">
              {/* Name and Contact */}
              <div className="space-y-3 text-center border-b border-gray-100 pb-6">
                <div className="w-48 h-8 bg-gray-800 rounded mx-auto"></div>
                <div className="w-64 h-3 bg-gray-300 rounded mx-auto"></div>
              </div>
              
              {/* Experience section */}
              <div className="space-y-6">
                <div className="w-32 h-4 bg-[#08304c] rounded mb-2"></div>
                
                {/* Job 1 with Highlights */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="w-40 h-5 bg-gray-700 rounded"></div>
                    <div className="w-24 h-3 bg-gray-300 rounded"></div>
                  </div>
                  <div className="space-y-2.5 pl-4 border-l-2 border-gray-100">
                    <div className="w-full h-3 bg-blue-100 rounded relative overflow-hidden">
                       <div className="absolute inset-0 bg-blue-400/20 w-1/3 rounded animate-[ping_2s_ease-in-out_infinite]"></div>
                    </div>
                    <div className="w-11/12 h-3 bg-gray-200 rounded"></div>
                    <div className="w-4/5 h-3 bg-green-100 rounded relative overflow-hidden">
                      <div className="absolute inset-0 bg-green-400/20 w-1/2 rounded animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scanning laser effect over the CV */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-rainbow-spectrum)] opacity-40 blur-[2px] animate-pulse" style={{ animation: "scan-vertical 3s infinite linear" }}></div>
            </div>
            
            {/* Floating "Tailoring in progress" badge */}
            <div className="absolute bottom-12 right-12 bg-[#08304c] text-white px-4 py-2 rounded-full text-xs shadow-xl flex items-center gap-2 animate-bounce font-medium z-30">
              <BrainCircuit className="w-4 h-4 text-[#d7ffe2]" />
              Optimizing...
            </div>
          </div>
          
          {/* Gradient fade out at bottom */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[var(--color-white-canvas)] to-transparent z-20 pointer-events-none rounded-b-[24px]"></div>
        </div>
      </div>
      <style>{`
        @keyframes scan-vertical {
          0% { transform: translateY(-50px); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(300px); opacity: 0; }
        }
      `}</style>
    </section>
  );
}

function TrustedBy() {
  return (
    <section className="py-12 px-4 border-y border-[var(--color-ash-divider)] border-opacity-30">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-wider mb-8" style={{ color: "var(--color-slate-helper)" }}>
          Trusted by job seekers landing roles at
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
          <div className="text-xl font-bold font-sans">Google</div>
          <div className="text-xl font-bold font-serif italic">Stripe</div>
          <div className="text-xl font-bold font-sans tracking-tight">Vercel</div>
          <div className="text-xl font-bold font-sans">Meta</div>
          <div className="text-xl font-bold font-sans tracking-wide">NETFLIX</div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: "AI-Powered Matching",
      description: "Our AI highlights relevant experience and optimizes your past work to align directly with the required skills.",
      chip: "Core Match",
      chipColor: "var(--color-sky-wash)",
      visual: (
        <div className="w-full space-y-3">
          <div className="rounded-[16px] border p-4 bg-[#e8f1ff] hover:-translate-y-1 transition-transform duration-300 shadow-sm" style={{ borderColor: "#084e72" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center size-5 rounded-full text-[10px] font-bold bg-[#08304c] text-white animate-pulse">1</span>
              <span className="text-[12px] font-medium" style={{ color: "#08304c" }}>Software Engineer Role</span>
              <span className="rounded-full px-2 py-0.5 text-[9px] tracking-wide uppercase font-semibold bg-[#d7ffe2] text-[#08304c]">Recommended</span>
            </div>
            <div className="text-[11px] leading-relaxed text-[#2c2c2c] space-y-1">
              <div className="flex gap-1">
                <span className="text-gray-400">•</span>
                <span>Architected scalable microservices using Node.js and React...</span>
              </div>
            </div>
          </div>
          <div className="rounded-[16px] border p-4 bg-white/50 border-gray-100 opacity-60 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center size-5 rounded-full text-[10px] font-bold bg-[#e8f1ff] text-[#08304c]">2</span>
              <span className="text-[12px] font-medium text-gray-500">Frontend Developer Role</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "ATS-Optimized format",
      description: "Ensure your keywords naturally pass standard tracking systems while remaining highly readable to human recruiters.",
      chip: "ATS Ready",
      chipColor: "var(--color-mint-wash)",
      visual: (
        <div className="w-full flex flex-col gap-3">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between hover:border-green-200 transition-colors cursor-default group">
            <span className="text-xs font-medium text-gray-600 group-hover:text-green-600 transition-colors">Keyword: React</span>
            <CheckCircle2 className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between hover:border-green-200 transition-colors cursor-default group">
            <span className="text-xs font-medium text-gray-600 group-hover:text-green-600 transition-colors">Keyword: TypeScript</span>
            <CheckCircle2 className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between hover:border-orange-200 transition-colors cursor-default group">
            <span className="text-xs font-medium text-gray-600 group-hover:text-orange-600 transition-colors">Keyword: System Design</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ffebd6] text-[#c77000] group-hover:animate-pulse">Missing</span>
          </div>
        </div>
      ),
    },
    {
      title: "Track Versions",
      description: "Save multiple CV versions per role. Compare iterations and instantly download your tailored CV anytime.",
      chip: "Version Control",
      chipColor: "var(--color-peach-wash)",
      visual: (
        <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/80 transition-colors cursor-pointer">
            <span className="text-xs font-medium text-gray-600">v3 - Google SWE</span>
            <span className="text-[10px] text-gray-400">Today</span>
          </div>
          <div className="p-3 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50/80 transition-colors cursor-pointer">
            <span className="text-xs font-medium text-gray-600">v2 - Meta Frontend</span>
            <span className="text-[10px] text-gray-400">Yesterday</span>
          </div>
          <div className="p-3 flex items-center justify-between opacity-50 hover:opacity-80 transition-opacity cursor-pointer">
            <span className="text-xs font-medium text-gray-600">v1 - Base Master CV</span>
            <span className="text-[10px] text-gray-400">2 days ago</span>
          </div>
        </div>
      ),
    },
    {
      title: "Context-Aware Rewriting",
      description: "Understands industry jargon and subtly reframes your bullets without losing your original tone or hallucinating.",
      chip: "Smart Tone",
      chipColor: "var(--color-sky-wash)",
      visual: (
        <div className="w-full space-y-2 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-[11px] text-gray-500 line-through">Built a website for users to buy things.</div>
          <div className="text-[11px] font-medium text-[#08304c] p-2 bg-[#e8f1ff] rounded-lg">
            Developed an e-commerce platform driving a 20% increase in user conversion.
          </div>
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
            <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-1.5 text-[10px] text-gray-400 overflow-hidden relative">
              <span className="inline-block animate-[pulse_2s_ease-in-out_infinite]">Make it sound more technical...</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-blue-400 animate-pulse"></span>
            </div>
            <div className="rounded-lg bg-[#08304c] px-3 py-1.5 text-[10px] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm">
              Go
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Smart Extraction",
      description: "Automatically pulls out the most critical hard and soft skills from any job posting URL you provide.",
      chip: "Data Parse",
      chipColor: "var(--color-mint-wash)",
      visual: (
        <div className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="h-2 w-24 bg-gray-200 rounded mb-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-blue-400/20 w-1/2 rounded animate-[ping_2s_ease-in-out_infinite]"></div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] leading-relaxed text-gray-400">
              We are looking for a <span className="text-[#08304c] font-medium bg-[#d7ffe2] px-1 rounded transition-colors hover:bg-green-300">Full Stack Engineer</span> with 
              experience in <span className="text-[#08304c] font-medium bg-[#d7ffe2] px-1 rounded transition-colors hover:bg-green-300">React</span> and 
              <span className="text-[#08304c] font-medium bg-[#d7ffe2] px-1 rounded transition-colors hover:bg-green-300">Node.js</span>...
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="px-2 py-1 bg-gray-100 text-[9px] rounded-full text-gray-600 animate-bounce shadow-sm">Extracted 12 skills</div>
          </div>
        </div>
      ),
    },
    {
      title: "Cover Letter Sync",
      description: "Generate a perfectly aligned cover letter that matches the exact themes of your newly tailored resume.",
      chip: "Automated",
      chipColor: "var(--color-peach-wash)",
      visual: (
        <div className="w-full flex items-center justify-center gap-4 group">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-16 bg-white rounded shadow-sm border border-gray-100 flex items-start p-2 transition-transform group-hover:-translate-y-1">
               <div className="w-6 h-1 bg-gray-200 rounded"></div>
            </div>
            <span className="text-[9px] font-medium text-gray-500">CV.pdf</span>
          </div>
          <RefreshCw className="w-4 h-4 text-[#08304c] opacity-50 animate-spin-slow group-hover:opacity-100 group-hover:text-blue-500 transition-colors" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-16 bg-white rounded shadow-sm border border-blue-200 flex items-start p-2 relative overflow-hidden transition-transform group-hover:-translate-y-1">
               <div className="absolute inset-0 bg-blue-50/50 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-700 ease-in-out"></div>
               <div className="w-full h-1 bg-blue-100 rounded mb-1 relative z-10"></div>
               <div className="w-3/4 h-1 bg-blue-100 rounded relative z-10"></div>
            </div>
            <span className="text-[9px] font-medium text-[#08304c]">Cover_Letter.pdf</span>
          </div>
        </div>
      ),
    }
  ];

  return (
    <section className="py-24 px-4 max-w-5xl mx-auto space-y-24 mt-12">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-semibold mb-4" style={{ color: "var(--color-portrait-ink)", letterSpacing: "-0.02em" }}>
          Everything you need to stand out
        </h2>
        <p style={{ color: "var(--color-graphite-body)" }}>
          Reurci is built to save you hours of manual editing while increasing your application success rate.
        </p>
      </div>

      <div className="flex flex-col gap-24">
        {features.map((f, i) => {
          const isEven = i % 2 === 0;
          return (
            <div key={i} className={`flex flex-col md:flex-row items-center gap-12 ${isEven ? '' : 'md:flex-row-reverse'}`}>
              <div className="flex-1 space-y-6">
                <span className="portrait-chip" style={{ backgroundColor: f.chipColor }}>{f.chip}</span>
                <h3 className="text-2xl sm:text-3xl font-semibold leading-tight" style={{ color: "var(--color-portrait-ink)", letterSpacing: "-0.02em" }}>
                  {f.title}
                </h3>
                <p className="text-lg leading-relaxed max-w-md" style={{ color: "var(--color-graphite-body)" }}>
                  {f.description}
                </p>
              </div>
              <div className="flex-1 w-full">
                <div className="aspect-[4/3] rounded-[24px] bg-[#f8f9fb] p-8 relative flex items-center justify-center overflow-hidden transition-colors duration-500" style={{ boxShadow: "var(--shadow-card)", backgroundColor: f.chipColor }}>
                   <div className="absolute inset-0 bg-white/40 backdrop-blur-md m-6 rounded-2xl flex items-center justify-center shadow-sm border border-white/60 hover:scale-[1.02] transition-transform duration-500 p-6">
                     {f.visual}
                   </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  );
}

function Solutions() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      chip: "Step 1",
      chipColor: "var(--color-sky-wash)",
      title: "Upload your base CV",
      desc: "Connect your core experience document. We securely parse your history, education, and skills without altering your personal tone.",
      points: ["Supports PDF and DOCX", "Keeps formatting logic intact", "Private & encrypted"],
      visual: (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
          <FileText className="w-16 h-16 text-[#08304c] animate-bounce" />
          <div className="h-2 w-32 bg-[#08304c]/10 rounded-full overflow-hidden">
             <div className="h-full bg-[var(--color-rainbow-spectrum)] w-full animate-[pulse_2s_ease-in-out_infinite]" />
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--color-portrait-ink)" }}>Parsing profile...</span>
        </div>
      )
    },
    {
      chip: "Step 2",
      chipColor: "var(--color-mint-wash)",
      title: "Paste the job link",
      desc: "Found your dream role? Just drop the URL. Our Mastra-powered agent breaks down the core requirements, required tech stack, and soft skills.",
      points: ["Extracts hidden requirements", "Identifies priority keywords", "Matches against your base CV"],
      visual: (
        <div className="w-full h-full flex flex-col items-center justify-center p-6">
          <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="size-8 rounded-full bg-[#084e72]/10 flex items-center justify-center">
              <Search className="size-4 text-[#084e72]" />
            </div>
            <div className="flex-1">
              <div className="h-2 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-1.5 w-16 bg-gray-100 rounded"></div>
            </div>
            <div className="size-4 rounded-full border-2 border-[var(--color-mint-wash)] animate-ping"></div>
          </div>
        </div>
      )
    },
    {
      chip: "Step 3",
      chipColor: "var(--color-peach-wash)",
      title: "Get hired.",
      desc: "Instantly receive a meticulously tailored CV and Cover Letter perfectly aligned with the role, designed to breeze through ATS filters.",
      points: ["ATS-optimized output", "Zero hallucination guarantee", "One-click PDF export"],
      visual: (
        <div className="w-full h-full flex items-center justify-center relative">
          <div className="absolute inset-0 bg-[var(--gradient-rainbow)] opacity-10 rounded-2xl animate-pulse"></div>
          <div className="bg-white rounded-xl p-6 shadow-xl border border-gray-100 relative z-10 transform -rotate-2">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-sm">98% Match</span>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 w-32 bg-gray-200 rounded"></div>
              <div className="h-1.5 w-40 bg-gray-200 rounded"></div>
              <div className="h-1.5 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((s) => (s + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="py-20 px-4 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6 relative h-[400px]">
          {slides.map((slide, idx) => (
            <div 
              key={idx}
              className={`absolute inset-0 transition-all duration-500 flex flex-col justify-center ${idx === activeSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}
            >
              <div>
                <span className="portrait-chip" style={{ backgroundColor: slide.chipColor }}>{slide.chip}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold leading-tight mt-6" style={{ color: "var(--color-portrait-ink)", letterSpacing: "-0.02em" }}>
                {slide.title}
              </h2>
              <p className="text-lg leading-relaxed max-w-md mt-4" style={{ color: "var(--color-graphite-body)" }}>
                {slide.desc}
              </p>
              <ul className="space-y-4 pt-6">
                {slide.points.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--color-nautical-teal)" }} />
                    <span style={{ color: "var(--color-graphite-body)" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Carousel indicators */}
          <div className="absolute bottom-0 left-0 flex gap-2">
            {slides.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeSlide ? 'w-8 bg-[#08304c]' : 'w-2 bg-gray-200'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
        
        <div className="flex-1 w-full">
          {/* Mockup visual area */}
          <div className="aspect-[4/3] rounded-[24px] bg-[#f8f9fb] p-8 relative overflow-hidden flex items-center justify-center transition-colors duration-500" style={{ boxShadow: "var(--shadow-card)", backgroundColor: slides[activeSlide].chipColor }}>
             {slides[activeSlide].visual}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    {
      name: "Alex Rivera",
      role: "Product Designer",
      text: "Reurci completely changed how I apply. Instead of spending 2 hours per application, I spend 2 minutes. Landed interviews at two FAANG companies.",
    },
    {
      name: "Sam Chen",
      role: "Frontend Engineer",
      text: "The ATS optimization actually works. I was getting auto-rejected before, but now my tailored resume gets through the screens consistently.",
    },
    {
      name: "Jordan Lee",
      role: "Marketing Manager",
      text: "I love that it doesn't invent fake experience. It just highlights the relevant projects from my master CV that I would have forgotten to emphasize.",
    }
  ];

  return (
    <section className="py-20 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-semibold mb-4" style={{ color: "var(--color-portrait-ink)", letterSpacing: "-0.02em" }}>
          Loved by job seekers
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((r, i) => (
          <div key={i} data-slot="card" className="p-6 bg-white border border-[var(--color-ash-divider)]" style={{ 
            transform: `rotate(${i === 1 ? -2 : 3}deg)`
          }}>
            <div className="flex text-yellow-400 mb-4">
              {[...Array(5)].map((_, j) => (
                <svg key={j} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-portrait-ink)" }}>
              "{r.text}"
            </p>
            <div className="flex items-center gap-3 mt-auto">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                {r.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-portrait-ink)" }}>{r.name}</div>
                <div className="text-xs" style={{ color: "var(--color-slate-helper)" }}>{r.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Does Reurci hallucinate or make up experience?",
      a: "No. Reurci is strictly instructed to only use the facts provided in your base CV. It reframes and highlights existing experience rather than inventing new skills."
    },
    {
      q: "Will my resume pass ATS systems?",
      a: "Yes. Our AI specifically identifies key terms in the job description and ensures they are naturally integrated into your tailored CV to maximize ATS scoring."
    },
    {
      q: "Can I edit the tailored CV before downloading?",
      a: "Absolutely. You can review and manually tweak any generated version before exporting it to PDF."
    },
    {
      q: "Is my data secure?",
      a: "We do not use your personal CV data to train public AI models, and you can delete your data from our servers at any time."
    }
  ];

  return (
    <section className="py-20 px-4 max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold mb-4" style={{ color: "var(--color-portrait-ink)", letterSpacing: "-0.02em" }}>
          Frequently asked questions
        </h2>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details key={i} className="group border-b border-[var(--color-ash-divider)] pb-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium py-2" style={{ color: "var(--color-portrait-ink)" }}>
              {faq.q}
              <ChevronDown className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180 text-[var(--color-slate-helper)]" />
            </summary>
            <p className="mt-4 leading-relaxed text-sm px-1 pb-2" style={{ color: "var(--color-graphite-body)" }}>
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 text-center border-t border-[var(--color-ash-divider)] border-opacity-30">
      <div className="flex items-center justify-center gap-1.5 mb-6">
        <div
          className="w-2.5 h-2.5 rounded-sm grayscale"
          style={{ backgroundImage: "var(--gradient-rainbow)" }}
        />
        <span className="font-semibold text-sm" style={{ color: "var(--color-iron-quiet)" }}>
          Reurci
        </span>
      </div>
      <div className="flex justify-center gap-6 text-sm mb-6" style={{ color: "var(--color-slate-helper)" }}>
        <Link to="/" className="hover:text-[#08304c]">Terms</Link>
        <Link to="/" className="hover:text-[#08304c]">Privacy</Link>
        <Link to="/" className="hover:text-[#08304c]">Contact</Link>
      </div>
      <div className="flex justify-center items-center gap-6 text-sm mb-8" style={{ color: "var(--color-slate-helper)" }}>
        <a href="https://github.com/rogasper/reurci" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#08304c] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4"></path></svg>
          <span>Open Source</span>
        </a>
        <a href="https://rogasper.com" target="_blank" rel="noreferrer" className="hover:text-[#08304c] transition-colors">
          by Rogasper
        </a>
      </div>
      <p className="text-xs" style={{ color: "var(--color-iron-quiet)" }}>
        © {new Date().getFullYear()} Reurci. All rights reserved.
      </p>
    </footer>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-white-canvas)] selection:bg-[var(--color-sky-wash)] selection:text-[var(--color-portrait-ink)] pb-12">
      <HeroSection />
      <TrustedBy />
      <Features />
      <Solutions />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}
