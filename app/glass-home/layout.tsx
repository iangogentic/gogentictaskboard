import { ThemeProvider } from "@/lib/themes/provider";
import "./glass-home.css";

export default function GlassHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
