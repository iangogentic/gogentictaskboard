import { redirect } from "next/navigation";
import ModernPage from "./(modern)/page";

export default function HomePage() {
  const useModernUI = process.env.NEXT_PUBLIC_NEW_UI === "true";

  if (!useModernUI) {
    redirect("/dashboard");
  }

  // Render the modern page directly
  return <ModernPage />;
}
