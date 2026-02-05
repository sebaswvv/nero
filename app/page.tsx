import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/api/auth-options";
import AnalyticsOverview from "./components/AnalyticsOverview";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";
import Navigation from "./components/Navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center" padding="lg">
          <div className="text-6xl mb-6">💰</div>
          <h1 className="text-3xl font-bold text-white mb-3">Welcome to Nero</h1>
          <p className="text-slate-400 mb-8">
            Take control of your finances with our modern personal finance tracker. Monitor
            expenses, track income, and visualize your financial health.
          </p>
          <form action="/api/auth/signin/google" method="post">
            <Button type="submit" variant="primary" size="lg" fullWidth>
              Sign in with Google
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400">Welcome back, {session.user?.email}</p>
          </div>

          {/* Analytics Overview */}
          <div className="mb-8">
            <AnalyticsOverview />
          </div>

          {/* Quick Actions Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/ledgers">
                <Card hover padding="md">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">📒</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Ledgers</h3>
                      <p className="text-sm text-slate-400">
                        Create and manage your financial ledgers
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/recurring">
                <Card hover padding="md">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🔄</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Recurring Items</h3>
                      <p className="text-sm text-slate-400">Manage subscriptions and fixed costs</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/transactions">
                <Card hover padding="md">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">💰</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Transactions</h3>
                      <p className="text-sm text-slate-400">Add and review your transactions</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
