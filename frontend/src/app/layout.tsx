import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import ClientLayout from "@/components/layouts/client-layout";
import { SettingsProvider } from "@/contexts/SettingsContext";

export const metadata = {
  title: "Inventory Management System",
  description: "A comprehensive inventory management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <ClientLayout>{children}</ClientLayout>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
