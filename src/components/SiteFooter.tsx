export default function SiteFooter() {
  const year = new Date().getFullYear();

  const sectionTitle =
    "mb-0 font-[family-name:var(--font-geist-mono)] text-[10px] font-medium uppercase leading-normal tracking-[0.28em] text-v-smoke";
  const linkClass =
    "inline-block font-[family-name:var(--font-geist-mono)] text-[11px] uppercase leading-snug tracking-[0.18em] text-v-silver transition-colors hover:text-v-chalk";

  return (
    <footer
      id="contact"
      className="relative scroll-mt-20 border-t border-v-smoke/20 bg-v-black/30 px-8 py-16 sm:px-12 md:px-20 lg:px-28 xl:px-40 2xl:px-52"
    >
      <div className="mx-auto max-w-7xl">
        {/* Primary: link groups — stable grid, no column squeeze */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-x-10 sm:gap-y-8 md:gap-x-16">
          <div className="min-w-0">
            <h2 className={sectionTitle}>Studio</h2>
            <ul className="mt-5 space-y-3">
              <li className="min-w-0">
                <a
                  href="#studio"
                  className={linkClass}
                  data-cursor-magnetic
                  data-cursor-label="View"
                >
                  Method
                </a>
              </li>
              <li className="min-w-0">
                <a
                  href="#about"
                  className={linkClass}
                  data-cursor-magnetic
                  data-cursor-label="Read"
                >
                  Philosophy
                </a>
              </li>
            </ul>
          </div>

          <div className="min-w-0">
            <h2 className={sectionTitle}>Work</h2>
            <ul className="mt-5 space-y-3">
              <li className="min-w-0">
                <a
                  href="#services"
                  className={linkClass}
                  data-cursor-magnetic
                  data-cursor-label="Explore"
                >
                  Services
                </a>
              </li>
            </ul>
          </div>

          <div className="min-w-0">
            <h2 className={sectionTitle}>Contact</h2>
            <ul className="mt-5 space-y-3">
              <li className="min-w-0">
                <a
                  href="#contact"
                  className={linkClass}
                  data-cursor-magnetic
                  data-cursor-label="Connect"
                >
                  Inquire
                </a>
              </li>
              <li className="min-w-0 break-all sm:break-normal">
                <a
                  href="mailto:hello@volari.studio"
                  className="inline-block font-[family-name:var(--font-geist-mono)] text-[11px] leading-snug tracking-[0.06em] text-v-accent/90 transition-colors hover:text-v-chalk"
                  data-cursor-magnetic
                  data-cursor-label="Email"
                >
                  hello@volari.studio
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Secondary: brand + legal — stacked flow, tagline full width (fixes overlap) */}
        <div className="mt-14 border-t border-v-smoke/15 pt-10">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <p className="font-[family-name:var(--font-playfair)] text-[1.625rem] leading-none tracking-[-0.02em] text-v-chalk md:text-[1.75rem]">
                Volari
              </p>
              <p className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase leading-normal tracking-[0.2em] text-v-smoke/75 sm:text-right">
                © {year} Volari
              </p>
            </div>
            <p className="max-w-2xl text-pretty font-[family-name:var(--font-geist-mono)] text-[10px] uppercase leading-[1.65] tracking-[0.12em] text-v-smoke sm:text-[11px] sm:tracking-[0.14em]">
              Digital Experiences Studio — Bespoke Creative Technology
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
