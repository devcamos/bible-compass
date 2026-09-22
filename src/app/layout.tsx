import type { Metadata } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteChrome";
import { SplashController } from "@/components/SplashScreen";
import { SHELL_CRITICAL_CSS } from "@/lib/shell-critical-css";
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl, isPreviewDeployment } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600"],
});

const siteUrl = getSiteUrl();

const themeBootstrap = `(function(){try{var k='bible-compass-theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

const splashBootstrap = `(function(){try{var root=document.documentElement;var seen=sessionStorage.getItem('bible-compass-splash-seen')==='1';var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(seen||reduce){root.setAttribute('data-splash','seen');if(reduce&&!seen){try{sessionStorage.setItem('bible-compass-splash-seen','1');}catch(e2){}}}}catch(e){}window.addEventListener('error',function(e){var t=e&&e.target;if(!t||!t.tagName)return;if(t.tagName==='SCRIPT'||t.tagName==='LINK'){document.documentElement.setAttribute('data-shell','fault');document.documentElement.removeAttribute('data-splash');}},true);})();`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: isPreviewDeployment()
    ? { index: false, follow: false }
    : { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffaf1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${sourceSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: SHELL_CRITICAL_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <script dangerouslySetInnerHTML={{ __html: splashBootstrap }} />
      </head>
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              url: siteUrl,
              description: SITE_DESCRIPTION,
            }),
          }}
        />
        <div
          id="bc-splash"
          className="bc-splash"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="bc-splash__mark" aria-hidden="true">
            📖
          </div>
          <p className="bc-splash__title bc-title">{SITE_NAME}</p>
          <p className="bc-splash__kicker bc-kicker">A quiet start</p>
          <div className="bc-splash__recover">
            <p data-splash-recover-copy>
              Something needed for this page did not finish loading. Check your
              connection, then try again.
            </p>
            <button type="button" className="bc-splash__retry" data-splash-retry>
              Try again
            </button>
          </div>
        </div>
        <SplashController />
        <noscript>
          <div className="mx-auto max-w-[40rem] px-4 py-8">
            <p className="bc-title text-xl">Bible Compass</p>
            <p>
              JavaScript is off, so the splash and interactive chrome stay
              quiet. The reader content below still works.
            </p>
          </div>
        </noscript>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="mx-auto w-full max-w-[40rem] flex-1 px-4 sm:px-6">
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
