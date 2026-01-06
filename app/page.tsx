import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/api/auth-options";
import AnalyticsSummary from "./components/AnalyticsSummary";

/**
 * The home page retains the login/logout functionality and introduces an
 * embedded analytics view.  Once the user is authenticated the analytics
 * summary is displayed along with navigation links to the Ledgers,
 * Recurring items and Transactions pages.  The separate analytics link has
 * been removed in favour of showing analytics directly on the homepage.
 */
export default async function Home() {
  const session = await getServerSession(authOptions);
  const user = session?.user ?? null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl grid gap-6 p-6 rounded-lg border border-gray-700">
        {/* Header */}
        <header className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-0">Nero</h1>
            <p className="text-sm opacity-70 mb-0">Personal finance</p>
          </div>
          <div className="text-right flex flex-col gap-2 items-end">
            {user ? (
              <>
                <div className="text-sm opacity-85">
                  {user.name ?? user.email}
                </div>
                <Link
                  href="/api/auth/signout"
                  className="px-3 py-2 rounded border border-gray-600 text-sm opacity-90"
                >
                  Sign out
                </Link>
              </>
            ) : (
              <Link
                href="/api/auth/signin"
                className="px-3 py-2 rounded border border-gray-600 text-sm"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        {/* Show analytics and navigation when signed in */}
        {user && (
          <>
            {/* Analytics summary component */}
            <AnalyticsSummary />
            {/* Navigation links */}
            <nav className="grid gap-3 mt-4">
              <Link
                href="/ledgers"
                className="px-4 py-3 text-center rounded-lg border border-gray-600"
              >
                Ledgers
              </Link>
              <Link
                href="/recurring"
                className="px-4 py-3 text-center rounded-lg border border-gray-600"
              >
                Recurring items
              </Link>
              <Link
                href="/transactions"
                className="px-4 py-3 text-center rounded-lg border border-gray-600"
              >
                Transactions
              </Link>
            </nav>
          </>
        )}
      </div>
    </main>
  );
}