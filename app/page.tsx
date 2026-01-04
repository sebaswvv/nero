import Link from "next/link";

export default function Home() {
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
        <header style={{ display: "grid", gap: 6 }}>
          <h1 style={{ margin: 0 }}>Nero</h1>
          <p style={{ margin: 0, opacity: 0.7 }}>
            Personal finance playground
          </p>
        </header>

        <nav
          style={{
            display: "grid",
            gap: 10,
            marginTop: 8,
          }}
        >
          <Link
            href="/api/auth/signin"
            style={{
              padding: "12px",
              textAlign: "center",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            Sign in
          </Link>

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
            href="/api/auth/signout"
            style={{
              padding: "12px",
              textAlign: "center",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              textDecoration: "none",
              color: "inherit",
              opacity: 0.8,
            }}
          >
            Sign out
          </Link>
        </nav>
      </div>
    </main>
  );
}
