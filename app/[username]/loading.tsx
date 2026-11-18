import { LoadingScreen } from "@/components/LoadingScreen";

// The route-level pit wall: Next streams this while the server scouts the
// profile, so a cold GitHub fetch never shows a blank page.
export default function Loading() {
  return <LoadingScreen />;
}
