import Link from "next/link";
import { LayoutDashboard, PlusCircle } from "lucide-react";
import { Logo } from "./logo";

const navItems = [
  { href: "/organizer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organizer/create-event", label: "Create Event", icon: PlusCircle },
];

export function OrganizerShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="page-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="hidden w-72 shrink-0 border-r border-gray-200 bg-gray-50 px-6 py-8 lg:block">
          <Logo href="/organizer/dashboard" />
          <nav className="mt-10 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-white hover:text-bu-red"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 px-5 py-6 sm:px-8 lg:px-10">
          <header className="mb-8 flex flex-col gap-5 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-5 lg:hidden">
                <Logo href="/organizer/dashboard" />
              </div>
              <h1 className="text-2xl font-black text-gray-950 sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                {subtitle}
              </p>
            </div>
            <Link href="/participant/welcome" className="btn-secondary">
              Participant preview
            </Link>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
