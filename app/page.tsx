import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const user = session?.user ?? null;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          display: "grid",
          gap: 16,
          padding: 24,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <header
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}
        >
          <div>
            <h1 style={{ margin: 0 }}>Nero</h1>
            <p style={{ margin: 0, opacity: 0.7 }}>Personal finance</p>
          </div>
          <div
            style={{
              textAlign: "right",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              alignItems: "flex-end",
            }}
          >
            {user ? (
              <>
                <div style={{ fontSize: 13, opacity: 0.85 }}>{user.name ?? user.email}</div>
                <Link
                  href="/api/auth/signout"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.15)",
                    textDecoration: "none",
                    color: "inherit",
                    opacity: 0.9,
                  }}
                >
                  Sign out
                </Link>
              </>
            ) : (
              <Link
                href="/api/auth/signin"
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.15)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        {user && (
          <nav
            style={{
              display: "grid",
              gap: 10,
              marginTop: 8,
            }}
          >
            <Link
              href="/ledgers"
              style={{
                padding: "12px",
                textAlign: "center",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Ledgers
            </Link>

            <Link
              href="/recurring"
              style={{
                padding: "12px",
                textAlign: "center",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Recurring items
            </Link>

            <Link
              href="/transactions"
              style={{
                padding: "12px",
                textAlign: "center",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Transactions
            </Link>

            <Link
              href="/analytics"
              style={{
                padding: "12px",
                textAlign: "center",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Analytics
            </Link>
          </nav>
        )}
      </div>
    </main>
  );
}
