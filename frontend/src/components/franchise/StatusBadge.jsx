import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, statusBadgeVariant } from "@/lib/franchiseDashboard";

export default function StatusBadge({ status }) {
  return (
    <Badge variant={statusBadgeVariant(status)}>
      {STATUS_LABEL[status] || status}
    </Badge>
  );
}
