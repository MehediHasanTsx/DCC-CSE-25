'use client';

const WHATSAPP_URL =
  'https://api.whatsapp.com/send/?phone=8801999924202&text=Hi%20Admin,%20I%20have%20a%20question%20about%20the%20DCC%20CSE%20Dashboard';

/**
 * Authentic WhatsApp Official Icon Glyph (Speech bubble outline + Phone handset)
 * Rendered in pure white with realistic 3D depth shadows cast on the green pillow.
 */
function OfficialWhatsAppGlyph() {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8 sm:h-9 sm:w-9 select-none pointer-events-none transition-transform duration-200 group-hover:scale-105"
      fill="#FFFFFF"
      aria-hidden="true"
      style={{
        filter:
          'drop-shadow(0 3px 2.5px rgba(5, 50, 20, 0.50)) drop-shadow(0 1px 1px rgba(0, 0, 0, 0.20))',
      }}
    >
      <title>WhatsApp</title>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z" />
    </svg>
  );
}

export function AskAdminWidget() {
  return (
    <aside
      aria-label="WhatsApp Support"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 print:hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
    >
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center cursor-pointer select-none focus-visible:outline-hidden"
        aria-label="Chat with Admin on WhatsApp"
      >
        {/* Hover Pill Tooltip */}
        <div
          role="tooltip"
          className="pointer-events-none absolute right-full mr-3.5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-zinc-950/95 dark:bg-black/90 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-xl shadow-black/40 border border-white/15 backdrop-blur-md opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out"
        >
          WhatsApp
        </div>

        {/* ── Symmetrical 3D Claymorphic Cushion (No extra bottom padding / shelf) ── */}
        <div
          className="wa-clay-tile relative flex h-14 w-14 sm:h-14.5 sm:w-14.5 items-center justify-center rounded-[18px] sm:rounded-4xl transition-all duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1 group-hover:scale-105 group-active:translate-y-0.5 group-active:scale-[0.98]"
          style={{
            background:
              'linear-gradient(155deg, #3DE272 0%, #25D366 42%, #1EB853 78%, #149D42 100%)',
            boxShadow: [
              /* Inset top-left soft highlight */
              'inset 0 2px 3px rgba(255, 255, 255, 0.45)',
              /* Inset bottom shaded curvature */
              'inset 0 -2.5px 3.5px rgba(8, 70, 26, 0.40)',
              /* Soft ambient green glow */
              '0 8px 20px -2px rgba(37, 211, 102, 0.42)',
              /* Soft natural floor shadow */
              '0 12px 28px -4px rgba(0, 0, 0, 0.32)',
            ].join(', '),
          }}
        >
          {/* Subtle top reflection sheen */}
          <div
            className="pointer-events-none absolute inset-x-2.5 top-1 h-2.5 rounded-t-2xl"
            style={{
              background:
                'linear-gradient(to bottom, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.04) 80%, transparent 100%)',
            }}
          />

          {/* Official WhatsApp Glyph (Speech bubble outline + handset) */}
          <OfficialWhatsAppGlyph />
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              .wa-clay-tile:hover {
                box-shadow:
                  inset 0 2.5px 3.5px rgba(255, 255, 255, 0.55),
                  inset 0 -3px 4px rgba(8, 70, 26, 0.45),
                  0 12px 26px -2px rgba(37, 211, 102, 0.52),
                  0 16px 36px -4px rgba(0, 0, 0, 0.38) !important;
              }
              .wa-clay-tile:active {
                box-shadow:
                  inset 0 1.5px 2.5px rgba(255, 255, 255, 0.40),
                  inset 0 -2px 3px rgba(8, 70, 26, 0.50),
                  0 4px 12px -2px rgba(37, 211, 102, 0.35),
                  0 6px 16px -3px rgba(0, 0, 0, 0.25) !important;
              }
            `,
          }}
        />
      </a>
    </aside>
  );
}
