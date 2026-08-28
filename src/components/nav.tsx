import Link from "next/link";

const links = [
  { href: "/", label: "Tableau de bord" },
  { href: "/commandes", label: "Commandes" },
  { href: "/stock", label: "Stock" },
  { href: "/tables", label: "Tables & Réservations" },
  { href: "/caisse", label: "Caisse" },
];

export function Nav() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3 sm:gap-2">
        <Link href="/" className="mr-4 font-semibold">
          🍽️ Snack-Bar-Resto
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
