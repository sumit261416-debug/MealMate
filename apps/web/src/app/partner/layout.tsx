import { PartnerShell } from "@/components/PartnerShell";

export const metadata = {
  title: "Kitchen Partner Portal · MealMate NCR",
  description: "Daily meal fulfilment, orders, and menu operations for MealMate kitchen partners.",
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PartnerShell>{children}</PartnerShell>;
}
