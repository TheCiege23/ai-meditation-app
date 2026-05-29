import PremiumBadge from "@/components/shared/PremiumBadge";

export default function LockedFeatureBadge({ label = "Premium" }: { label?: string }) {
  return <PremiumBadge label={label} subtle />;
}