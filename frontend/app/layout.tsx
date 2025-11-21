import type { Metadata } from "next";
import {
  DM_Sans,
  Fira_Sans,
  IBM_Plex_Sans,
  IBM_Plex_Sans_JP,
  Inter,
  Lato,
  Libre_Franklin,
  Lora,
  Manrope,
  Montserrat,
  Noto_Sans_JP,
  Nunito,
  Open_Sans,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Poppins,
  Roboto,
  Rubik,
  Sora,
  Source_Sans_3,
  Space_Grotesk,
  Urbanist,
  Work_Sans,
} from "next/font/google";
import "./globals.css";
import "@/lib/compact-mode.css";
import "@/lib/animations.css";
import "@/styles/design-preferences.css";
import { Providers } from "@/components/providers";
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper";
import { ChunkErrorHandler } from "@/components/global-error-handler";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const urbanist = Urbanist({ subsets: ["latin"], variable: "--font-urbanist", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });

// New professional fonts
const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-work-sans",
  display: "swap",
});
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});
const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-rubik",
  display: "swap",
});
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900", "1000"],
  variable: "--font-nunito",
  display: "swap",
});
const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-source-sans-3",
  display: "swap",
});
const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});
const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-fira-sans",
  display: "swap",
});
const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-open-sans",
  display: "swap",
});
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});
const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-libre-franklin",
  display: "swap",
});

// Japanese fonts
const notoSansJP = Noto_Sans_JP({
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: true,
});

const ibmPlexSansJP = IBM_Plex_Sans_JP({
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-jp",
  display: "swap",
  preload: true,
});

const fontVariables = [
  inter.variable,
  manrope.variable,
  spaceGrotesk.variable,
  urbanist.variable,
  lora.variable,
  poppins.variable,
  playfair.variable,
  dmSans.variable,
  plusJakarta.variable,
  sora.variable,
  montserrat.variable,
  workSans.variable,
  ibmPlexSans.variable,
  rubik.variable,
  nunito.variable,
  sourceSans3.variable,
  lato.variable,
  firaSans.variable,
  openSans.variable,
  roboto.variable,
  libreFranklin.variable,
  notoSansJP.variable,
  ibmPlexSansJP.variable,
].join(" ");

export const metadata: Metadata = {
  title: {
    default: "JPUNS - Sistema de Gestión de RRHH",
    template: "%s | JPUNS"
  },
  description: "Sistema de gestión de recursos humanos para empresas japonesas",
  keywords: ["RRHH", "gestión", "empleados", "candidatos", "recursos humanos"],
  authors: [{ name: "JPUNS Team" }],
  creator: "JPUNS",
  openGraph: {
    type: "website",
    locale: "es_ES",
    alternateLocale: "ja_JP",
    url: "https://jpuns.com",
    title: "JPUNS - Sistema de Gestión de RRHH",
    description: "Sistema de gestión de recursos humanos para empresas japonesas",
    siteName: "JPUNS",
  },
  twitter: {
    card: "summary_large_image",
    title: "JPUNS - Sistema de Gestión de RRHH",
    description: "Sistema de gestión de recursos humanos para empresas japonesas",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Sanitize theme from localStorage before next-themes loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('uns-theme');
                if (storedTheme && storedTheme.includes(' ')) {
                  // Convert theme names with spaces to IDs
                  const themeMap = {
                    'Forest Green': 'forest-green',
                    'Default Light': 'default-light',
                    'Default Dark': 'default-dark',
                    'Ocean Blue': 'ocean-blue',
                    'Mint Green': 'mint-green',
                    'Royal Purple': 'royal-purple',
                    'Vibrant Coral': 'vibrant-coral',
                    'UNS Kikaku': 'uns-kikaku',
                  };
                  const validThemeId = themeMap[storedTheme] || 'default-light';
                  localStorage.setItem('uns-theme', validThemeId);
                }
              } catch (e) {
                // Silently fail if localStorage is not available
              }
            `,
          }}
        />
      </head>
      <body className={`${fontVariables} font-sans antialiased`} suppressHydrationWarning>
        <ErrorBoundaryWrapper>
          <Providers>
            <ChunkErrorHandler />
            {children}
          </Providers>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
