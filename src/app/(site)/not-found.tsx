import NotFoundContent from "@/components/NotFoundContent"

// Handles notFound() thrown by public pages (e.g. a product/brand/article that
// doesn't exist). Renders inside the (site) layout, so it keeps the full site
// header and footer for easy navigation.
export default function SiteNotFound() {
  return <NotFoundContent />
}
