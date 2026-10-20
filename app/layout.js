import "./globals.css";

export const metadata = {
  title: "Fitivo",
  description: "Fitivo gym management.",
};

export default function RootLayout({ children }) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
