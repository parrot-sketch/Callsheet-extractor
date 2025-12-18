interface ContactCardProps {
  name: string;
  role?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * ContactCard - Single contact display
 */
export function ContactCard({ name, role, phone, email }: ContactCardProps) {
  return (
    <div className="border-b py-3 last:border-0">
      <div className="flex items-baseline gap-2">
        <span className="font-medium">{name}</span>
        {role && (
          <span className="text-sm text-muted-foreground">{role}</span>
        )}
      </div>
      
      {(phone || email) && (
        <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
          {phone && (
            <a href={`tel:${phone}`} className="hover:text-foreground">
              {phone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="hover:text-foreground">
              {email}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

