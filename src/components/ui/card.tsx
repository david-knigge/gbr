interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-card rounded-2xl border border-card-border p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
