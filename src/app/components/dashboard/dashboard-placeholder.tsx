import { Link } from "react-router";
import { motion } from "motion/react";

interface DashboardPlaceholderProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}

export function DashboardPlaceholder({
  title,
  description,
  actionLabel = "Compare policies",
  actionTo = "/dashboard/compare",
}: DashboardPlaceholderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto text-center py-20"
    >
      <h2 className="text-2xl font-bold mb-3">{title}</h2>
      <p className="text-muted-foreground mb-8 leading-relaxed">{description}</p>
      <Link
        to={actionTo}
        className="inline-flex px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
      >
        {actionLabel}
      </Link>
      <p className="text-xs text-muted-foreground mt-6">Full data wiring ships in Module 9.</p>
    </motion.div>
  );
}
