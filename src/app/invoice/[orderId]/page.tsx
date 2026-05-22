import type { Metadata } from "next"
import InvoicePage from "./InvoicePage"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string }>
}): Promise<Metadata> {
  const { orderId } = await params
  return {
    title: `Invoice ${orderId}`,
    description: `Buyer invoice for order ${orderId}.`,
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  return <InvoicePage orderId={orderId} />
}
