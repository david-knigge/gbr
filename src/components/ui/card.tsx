interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-card rounded-lg border border-card-border p-5 ${className}`}
    >
      {children}
    </div>
  );
}
