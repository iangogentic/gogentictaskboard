import { GlassLayout } from "@/components/glass-layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GlassLayout>{children}</GlassLayout>;
}
