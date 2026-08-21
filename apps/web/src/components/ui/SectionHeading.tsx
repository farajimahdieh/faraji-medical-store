export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="mb-2 text-sm font-medium text-primary">{eyebrow}</p>}
        <h2 className="text-[28px] font-bold text-navy sm:text-[32px]">{title}</h2>
        {subtitle && <p className="mt-2 text-base text-secondary-text">{subtitle}</p>}
      </div>
      {action && (
        <a
          href={action.href}
          className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
