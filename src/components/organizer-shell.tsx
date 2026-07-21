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
          <header className="mb-8 border-b border-gray-200 pb-6">
            <div>
              <div className="mb-5 lg:hidden">
                <Logo href="/organizer/dashboard" />
                <nav className="mt-5 grid grid-cols-2 gap-2" aria-label="Organizer navigation">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-white hover:text-bu-red"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <h1 className="text-2xl font-black text-gray-950 sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                {subtitle}
              </p>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
