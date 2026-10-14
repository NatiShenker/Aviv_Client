import type { ReactNode } from "react";

interface CatalogSectionProps {
  title: string;
  children: ReactNode;
}

export default function CatalogSection({ title, children }: CatalogSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-card bg-paper p-4">
      <h2 className="text-base font-medium text-text-primary">{title}</h2>
      {children}
    </section>
  );
}
