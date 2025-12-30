import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <Link href="/api/auth/signin">Sign in</Link>
      <Link href="/api/auth/signout" style={{ marginLeft: 16 }}>
        Sign out
      </Link>
    </main>
  );
}
