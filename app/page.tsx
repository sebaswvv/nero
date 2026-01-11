import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/api/auth-options";
import AnalyticsOverview from "./components/AnalyticsOverview";
import ApiKey from "./components/ApiKey";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-8">
        <div className="border border-gray-700 rounded p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xl font-semibold">Nero</div>
              <div className="text-sm opacity-70">Personal finance tracker</div>
            </div>

            {session ? (
              <form action="/api/auth/signout" method="post">
                <button className="px-4 py-2 rounded bg-gray-800 border border-gray-700">
                  Sign out
                </button>
              </form>
            ) : (
              <form action="/api/auth/signin/google" method="post">
                <button className="px-4 py-2 rounded bg-blue-600">Sign in with Google</button>
              </form>
            )}
          </div>

          {session && (
            <div className="text-sm opacity-70 mt-3">
              Signed in as <span className="font-mono">{session.user?.email}</span>
              <div className="mt-2">
                <ApiKey />
              </div>
            </div>
          )}
        </div>

        {session ? (
          <>
            <div className="border border-gray-700 rounded p-4">
              <AnalyticsOverview />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/ledgers"
                className="border border-gray-700 rounded p-4 hover:bg-gray-900"
              >
                <div className="font-medium">Ledgers</div>
                <div className="text-sm opacity-70">Create and manage ledgers</div>
              </Link>

              <Link
                href="/recurring"
                className="border border-gray-700 rounded p-4 hover:bg-gray-900"
              >
                <div className="font-medium">Recurring items</div>
                <div className="text-sm opacity-70">Subscriptions and fixed costs</div>
              </Link>

              <Link
                href="/transactions"
                className="border border-gray-700 rounded p-4 hover:bg-gray-900"
              >
                <div className="font-medium">Transactions</div>
                <div className="text-sm opacity-70">Add and review transactions</div>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-sm opacity-70">
            Sign in to view analytics and manage your ledgers.
          </div>
        )}
      </div>
    </div>
  );
}
