import { Link } from "@tanstack/react-router";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label="Prime Kicks KE home">
      <span className="grid h-9 w-9 place-items-center bg-primary text-primary-foreground display text-lg transition-transform duration-500 group-hover:rotate-6">
        PK
      </span>
      {!compact && (
        <span className="display text-lg leading-none tracking-wide">
          Prime Kicks
          <span className="text-primary"> KE</span>
        </span>
      )}
    </Link>
  );
}
