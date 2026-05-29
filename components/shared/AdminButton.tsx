"use client";

type AdminButtonProps = {
  href?: string;
  compact?: boolean;
};

export default function AdminButton({ href = "/admin", compact = false }: AdminButtonProps) {
  return (
    <a
      href={href}
      className={`ca-btn ca-btn-primary ${compact ? "px-3 py-1.5 text-xs" : ""}`}
    >
      Admin
    </a>
  );
}
