"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Calendar, Grid3X3, Send, Clock } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
// TerminalContact ✦ Command-Line Contact Interface
//
// A terminal-style contact section. Three CTAs presented as
// shell commands. Each triggers a GSAP timeline response.
// Blinking cursor, liquid-metal focus states, shake validation.
// ─────────────────────────────────────────────────────────────

type CommandState = "idle" | "consultation" | "portfolio" | "message";

const COMMANDS = [
  { id: "consultation" as const, label: "schedule_consultation", icon: Calendar, desc: "Book a 30-minute discovery call" },
  { id: "portfolio" as const, label: "view_portfolio", icon: Grid3X3, desc: "Browse selected case studies" },
  { id: "message" as const, label: "send_message", icon: Send, desc: "Direct inquiry via form" },
] as const;

export default function TerminalContact() {
  const sectionRef = useRef<HTMLElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const [activeCmd, setActiveCmd] = useState<CommandState>("idle");
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const shakeRef = useRef<HTMLFormElement>(null);

  // ─── Cursor blink ──
  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(cursorRef.current, { opacity: 0, duration: 0.4, ease: "steps(1)" })
      .to(cursorRef.current, { opacity: 1, duration: 0.4, ease: "steps(1)" });
    return () => { tl.kill(); };
  }, []);

  // ─── Scroll entrance ──
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        terminalRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  // ─── Command execution ──
  const runCommand = useCallback((cmd: CommandState) => {
    setActiveCmd(cmd);
    setSubmitted(false);

    const output = outputRef.current;
    if (!output) return;

    // Clear and type response
    gsap.set(output, { opacity: 0, y: 10 });
    gsap.to(output, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.15,
    });
  }, []);

  // ─── Form validation ──
  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = true;
    if (!formData.message.trim()) newErrors.message = true;
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0 && shakeRef.current) {
      gsap.fromTo(shakeRef.current,
        { x: 0 },
        { x: 8, duration: 0.05, repeat: 5, yoyo: true, ease: "power2.inOut" }
      );
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative scroll-mt-20"
    >
      {/* Decorative top rule */}
      <div className="flex justify-center px-6 md:px-10">
        <div className="h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-v-smoke/30 to-transparent" />
      </div>

      <div className="mx-auto max-w-[90rem] px-6 py-32 md:px-10">
        {/* Section heading */}
        <div className="mb-16">
          <span className="mb-5 block font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.5em] text-v-accent/70">
            005 — Initiate Contact
          </span>
          <div className="flex items-center gap-6 md:gap-10">
            <div className="hidden h-px w-16 bg-gradient-to-r from-v-accent/40 to-transparent md:block" />
            <h2 className="font-[family-name:var(--font-playfair)] text-[clamp(2rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.02em] text-v-chalk">
              Begin the <span className="italic text-v-accent">conversation</span>
            </h2>
          </div>
        </div>

        {/* Terminal container */}
        <div
          ref={terminalRef}
          className="relative overflow-hidden rounded-sm border border-v-smoke/15 bg-[#08080a]"
          style={{ opacity: 0 }}
        >
          {/* Terminal chrome bar */}
          <div className="flex items-center gap-3 border-b border-v-smoke/10 px-5 py-3">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-[#3a3a48]" />
              <div className="h-3 w-3 rounded-full bg-[#2a2a38]" />
              <div className="h-3 w-3 rounded-full bg-[#1a1a24]" />
            </div>
            <span className="ml-4 font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.3em] text-v-smoke/40">
              volari@studio ~ contact
            </span>
          </div>

          {/* Terminal body */}
          <div className="px-5 py-8 md:px-8 md:py-12">
            {/* Boot message */}
            <div className="mb-8 font-[family-name:var(--font-geist-mono)] text-[10px] leading-[2] tracking-[0.02em] text-v-smoke/50">
              <p>{`> system.ready — Volari Creative Studio v3.2`}</p>
              <p>{`> 3 available commands. Select to proceed.`}</p>
            </div>

            {/* Command prompt */}
            <div className="mb-8 flex items-center gap-2 font-[family-name:var(--font-geist-mono)] text-sm">
              <span className="text-v-accent">volari</span>
              <span className="text-v-smoke/30">~</span>
              <span ref={cursorRef} className="inline-block h-4 w-2 bg-v-chalk" />
            </div>

            {/* Command buttons */}
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:gap-4">
              {COMMANDS.map((cmd) => {
                const Icon = cmd.icon;
                const isActive = activeCmd === cmd.id;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => runCommand(cmd.id)}
                    className={[
                      "group relative flex items-center gap-3 rounded-sm border px-5 py-4",
                      "font-[family-name:var(--font-geist-mono)] text-[11px] tracking-[0.08em]",
                      "transition-all duration-300",
                      isActive
                        ? "border-v-accent/40 bg-v-accent/5 text-v-chalk"
                        : "border-v-smoke/15 text-v-silver/70 hover:border-v-accent/25 hover:text-v-chalk",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.2} />
                    <span className="font-normal">{cmd.label}</span>
                    <ArrowRight
                      className={[
                        "ml-auto h-3.5 w-3.5 shrink-0 transition-transform duration-300",
                        isActive ? "translate-x-0.5 text-v-accent" : "text-v-smoke/30 group-hover:translate-x-0.5",
                      ].join(" ")}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>

            {/* Command output */}
            <div ref={outputRef} className="min-h-[120px]">
              {activeCmd === "consultation" && (
                <div className="animate-fade-in">
                  <p className="mb-4 font-[family-name:var(--font-geist-mono)] text-[11px] leading-[1.8] text-v-silver/80">
                    {`> Opening calendar interface...`}
                  </p>
                  <div className="rounded-sm border border-v-smoke/15 bg-[#0c0c14] p-6">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-8 w-8 text-v-accent/60" strokeWidth={1} />
                      <div>
                        <p className="font-[family-name:var(--font-playfair)] text-lg text-v-chalk">Schedule a Consultation</p>
                        <p className="mt-1 font-[family-name:var(--font-geist-mono)] text-[10px] text-v-silver/60">30-minute discovery call — no commitment</p>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      {["Mon 14:00", "Tue 10:00", "Wed 16:00", "Thu 11:00"].map((slot) => (
                        <button
                          key={slot}
                          className="rounded-sm border border-v-smoke/20 px-4 py-2 font-[family-name:var(--font-geist-mono)] text-[10px] tracking-wider text-v-silver/70 transition-all duration-200 hover:border-v-accent/30 hover:text-v-chalk"
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                    <button className="mt-4 flex items-center gap-2 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.2em] text-v-accent transition-opacity hover:opacity-70">
                      View Full Calendar <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}

              {activeCmd === "portfolio" && (
                <div className="animate-fade-in">
                  <p className="mb-4 font-[family-name:var(--font-geist-mono)] text-[11px] leading-[1.8] text-v-silver/80">
                    {`> Loading portfolio grid...`}
                  </p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {["Brand Identity", "Web Platform", "Creative Tech", "Digital Strategy"].map((project, i) => (
                      <div
                        key={project}
                        className="group relative aspect-[4/3] overflow-hidden rounded-sm border border-v-smoke/15 bg-gradient-to-br from-[#0e0e16] to-[#0a0a12]"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.2em] text-v-smoke/40">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-v-black/80 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <p className="font-[family-name:var(--font-playfair)] text-xs text-v-chalk">{project}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 flex items-center gap-2 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.2em] text-v-accent transition-opacity hover:opacity-70">
                    View All Projects <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                </div>
              )}

              {activeCmd === "message" && (
                <div className="animate-fade-in">
                  <p className="mb-4 font-[family-name:var(--font-geist-mono)] text-[11px] leading-[1.8] text-v-silver/80">
                    {`> Initializing message form...`}
                  </p>
                  {!submitted ? (
                    <form onSubmit={handleSubmit} ref={shakeRef}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.3em] text-v-smoke/50">
                            Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={[
                              "w-full rounded-sm border bg-transparent px-4 py-3",
                              "font-[family-name:var(--font-geist-mono)] text-xs text-v-chalk",
                              "outline-none transition-all duration-300",
                              "focus:border-v-accent/40 focus:shadow-[0_0_12px_rgba(212,168,83,0.08)]",
                              errors.name ? "border-red-900/60" : "border-v-smoke/15",
                            ].join(" ")}
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.3em] text-v-smoke/50">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={[
                              "w-full rounded-sm border bg-transparent px-4 py-3",
                              "font-[family-name:var(--font-geist-mono)] text-xs text-v-chalk",
                              "outline-none transition-all duration-300",
                              "focus:border-v-accent/40 focus:shadow-[0_0_12px_rgba(212,168,83,0.08)]",
                              errors.email ? "border-red-900/60" : "border-v-smoke/15",
                            ].join(" ")}
                            placeholder="you@company.com"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="mb-2 block font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.3em] text-v-smoke/50">
                          Message
                        </label>
                        <textarea
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          rows={4}
                          className={[
                            "w-full resize-none rounded-sm border bg-transparent px-4 py-3",
                            "font-[family-name:var(--font-geist-mono)] text-xs text-v-chalk",
                            "outline-none transition-all duration-300",
                            "focus:border-v-accent/40 focus:shadow-[0_0_12px_rgba(212,168,83,0.08)]",
                            errors.message ? "border-red-900/60" : "border-v-smoke/15",
                          ].join(" ")}
                          placeholder="Tell us about your project..."
                        />
                      </div>
                      <button
                        type="submit"
                        className="mt-6 inline-flex items-center gap-3 rounded-full border border-v-smoke/20 bg-[#0a0a0e] px-6 py-3 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.15em] text-v-chalk transition-all duration-300 hover:border-v-accent/30 hover:shadow-[0_0_16px_rgba(212,168,83,0.1)]"
                      >
                        <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Transmit Message
                      </button>
                    </form>
                  ) : (
                    <div className="rounded-sm border border-v-accent/20 bg-v-accent/5 p-6">
                      <p className="font-[family-name:var(--font-geist-mono)] text-xs text-v-chalk">
                        {`> Message transmitted successfully.`}
                      </p>
                      <p className="mt-2 font-[family-name:var(--font-geist-mono)] text-[10px] text-v-silver/60">
                        We will respond within 24 hours.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeCmd === "idle" && (
                <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-v-smoke/30">
                  {`> Waiting for input...`}
                </p>
              )}
            </div>

            {/* Timezone footer */}
            <div className="mt-8 flex items-center gap-2 border-t border-v-smoke/10 pt-4">
              <Clock className="h-3 w-3 text-v-smoke/30" strokeWidth={1.5} />
              <span className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.2em] text-v-smoke/30">
                UTC-5 / New York — Available for global collaboration
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
