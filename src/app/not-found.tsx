import NotFoundContent from "@/components/NotFoundContent"

// Catches unmatched URLs across the whole app. Renders inside the root layout
// (no site header/footer), so the body is intentionally self-contained.
export default function NotFound() {
  return <NotFoundContent />
}
