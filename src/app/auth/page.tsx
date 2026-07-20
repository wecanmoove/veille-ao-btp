import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion · Renov Midi",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/", error } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 16,
      }}
    >
      <form
        method="POST"
        action="/api/auth/login"
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            RM
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, lineHeight: 1.2 }}>Renov Midi</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>Veille AO BTP — accès protégé</div>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.4)",
              color: "#fca5a5",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            Mot de passe incorrect.
          </div>
        )}

        <input type="hidden" name="next" value={next} />
        <label style={{ color: "#cbd5e1", fontSize: 13, display: "block", marginBottom: 6 }}>
          Mot de passe
        </label>
        <input
          type="password"
          name="password"
          autoFocus
          required
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "#020617",
            color: "#fff",
            fontSize: 15,
            marginBottom: 16,
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "11px 12px",
            borderRadius: 8,
            border: "none",
            background: "#f97316",
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}
