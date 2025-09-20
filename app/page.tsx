import { redirect } from "next/navigation";

export default function HomePage() {
  // Check for modern UI feature flag
  const useModernUI = process.env.NEXT_PUBLIC_NEW_UI === "true";

  if (useModernUI) {
    // Show modern glassmorphic UI directly
    redirect("/(modern)");
  } else {
    // Redirect to classic UI dashboard
    redirect("/dashboard");
  }
}
