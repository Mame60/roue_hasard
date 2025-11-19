import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import "./App.css";

type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
};

type WheelEntry = {
  _id: string;
  label: string;
  isActive: boolean;
};

type Draw = {
  _id: string;
  resultLabel: string;
  drawnAt: string;
  cycleIndex: number;
  drawnBy?: {
    name: string;
  };
};

const API_BASE = import.meta.env.VITE_API_BASE ?? 
  (import.meta.env.PROD ? "/api" : "http://localhost:4000");

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Admin states
  const [namesInput, setNamesInput] = useState("");
  const [entries, setEntries] = useState<WheelEntry[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [editingEntry, setEditingEntry] = useState<{ id: string; label: string } | null>(null);
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; email: string } | null>(null);

  // User states
  const [lastDraw, setLastDraw] = useState<Draw | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/public/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          accessCode: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? "Identifiants invalides.");
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "Erreur de connexion."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setLoginEmail("");
    setLoginPassword("");
  };

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Admin functions
  const fetchEntries = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/public/entries`);
      if (!res.ok) throw new Error("Erreur de chargement.");
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNames = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    setError(null);

    const parsed = namesInput
      .split(/\r?\n|,/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (!parsed.length) {
      setError("Ajoute au moins un nom.");
      return;
    }

    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/admin/wheel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user!._id, names: parsed }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message ?? "Erreur.");

      setStatus(data.message || `${data.inserted ?? parsed.length} nom(s) ajouté(s).`);
      setNamesInput("");
      await fetchEntries();
      if (user?.role === "admin") {
        // Rafraîchir la liste des utilisateurs si admin
        await fetchUsers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveName = async (entryId: string) => {
    if (!confirm("Désactiver ce nom ?")) return;

    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/admin/wheel/${entryId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user!._id }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message ?? "Erreur.");

      setStatus("Nom désactivé.");
      await fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  };

  const handleDraw = async () => {
    setStatus(null);
    setError(null);

    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/admin/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user!._id }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message ?? "Erreur.");

      setStatus(`Tirage effectué : ${data.draw.resultLabel}.`);
      await fetchEntries();
      await fetchLastDraw();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateEntry = async (entryId: string, newLabel: string) => {
    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/admin/wheel/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user!._id, newLabel }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message ?? "Erreur.");

      setStatus("Nom modifié avec succès.");
      setEditingEntry(null);
      await fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users?adminId=${user!._id}`);
      if (!res.ok) throw new Error("Erreur de chargement.");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserEmail = async (userId: string, newEmail: string) => {
    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/email`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user!._id, newEmail }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message ?? "Erreur.");

      setStatus("Email modifié avec succès.");
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateUserName = async (userId: string, newName: string) => {
    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user!._id, newName }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message ?? "Erreur.");

      setStatus("Nom modifié avec succès.");
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  };

  // User functions
  const fetchLastDraw = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/public/last-draw`);
      if (!res.ok) throw new Error("Erreur.");
      const data = await res.json();
      setLastDraw(data.lastDraw ?? null);
      if (data.lastDraw) {
        setWheelRotation((prev) => prev + 360 * 5 + Math.random() * 360);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchEntries();
      fetchUsers();
    } else if (user?.role === "user") {
      fetchEntries();
      fetchLastDraw();
      const interval = setInterval(fetchLastDraw, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(value));

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Roue de hasard</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                placeholder="Entrez votre email"
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                placeholder="Entrez votre mot de passe"
                autoComplete="current-password"
              />
            </div>
            {loginError && <div className="error-banner">{loginError}</div>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="app">
        <header>
          <div>
            <h1>Roue de hasard - Administration</h1>
            <p>Bienvenue, {user.name}</p>
          </div>
          <button onClick={handleLogout} className="btn-secondary">
            Déconnexion
          </button>
        </header>

        {(status || error) && (
          <div className={`banner ${error ? "error" : "success"}`}>
            {error ?? status}
          </div>
        )}

        <div className="admin-grid">
          <section className="panel">
            <h2>Participants actifs ({entries.length})</h2>
            {entries.length ? (
              <ul className="entries-list">
                {entries.map((entry) => (
                  <li key={entry._id}>
                    {editingEntry?.id === entry._id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const newLabel = formData.get("label") as string;
                          if (newLabel.trim()) {
                            handleUpdateEntry(entry._id, newLabel);
                          }
                        }}
                        style={{ display: "flex", gap: "0.5rem", width: "100%" }}
                      >
                        <input
                          name="label"
                          defaultValue={entry.label}
                          style={{ flex: 1, padding: "0.5rem" }}
                          autoFocus
                        />
                        <button type="submit" className="btn-secondary" disabled={busy}>
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEntry(null)}
                          className="btn-secondary"
                        >
                          ✕
                        </button>
                      </form>
                    ) : (
                      <>
                        <span>{entry.label}</span>
                        <div>
                          <button
                            onClick={() => setEditingEntry({ id: entry._id, label: entry.label })}
                            className="btn-secondary"
                            disabled={busy}
                            title="Modifier"
                            style={{ marginRight: "0.5rem" }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRemoveName(entry._id)}
                            className="btn-remove"
                            disabled={busy}
                            title="Désactiver"
                          >
                            ✕
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">Aucun participant actif.</p>
            )}
          </section>

          <section className="panel">
            <h2>Ajouter des noms</h2>
            <form onSubmit={handleAddNames}>
              <textarea
                value={namesInput}
                onChange={(e) => setNamesInput(e.target.value)}
                placeholder="Un nom par ligne ou séparés par des virgules"
                rows={6}
                disabled={busy}
              />
              <button
                type="submit"
                className="btn-secondary"
                disabled={busy || !namesInput.trim()}
              >
                ➕ Ajouter
              </button>
            </form>
          </section>

          <section className="panel">
            <h2>Lancer la roue</h2>
            <p>
              {entries.length
                ? `${entries.length} participant(s) disponible(s).`
                : "Ajoutez des participants avant de lancer la roue."}
            </p>
            <button
              onClick={handleDraw}
              className="btn-primary btn-large"
              disabled={busy || !entries.length}
            >
              🎯 Lancer un tirage
            </button>
          </section>
        </div>

        <section className="panel" style={{ marginTop: "2rem" }}>
          <h2>Gestion des utilisateurs ({users.length})</h2>
          {users.length ? (
            <ul className="entries-list">
              {users.map((u) => (
                <li key={u._id}>
                  {editingUser?.id === u._id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const newName = formData.get("name") as string;
                        const newEmail = formData.get("email") as string;
                        if (newName.trim() && newEmail.trim()) {
                          Promise.all([
                            handleUpdateUserName(u._id, newName),
                            handleUpdateUserEmail(u._id, newEmail),
                          ]);
                        }
                      }}
                      style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}
                    >
                      <input
                        name="name"
                        defaultValue={u.name}
                        placeholder="Nom"
                        style={{ padding: "0.5rem" }}
                        autoFocus
                      />
                      <input
                        name="email"
                        type="email"
                        defaultValue={u.email}
                        placeholder="Email"
                        style={{ padding: "0.5rem" }}
                      />
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button type="submit" className="btn-secondary" disabled={busy}>
                          ✓ Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="btn-secondary"
                        >
                          ✕ Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <div><strong>{u.name}</strong> ({u.role})</div>
                        <div style={{ fontSize: "0.9rem", color: "#666" }}>{u.email}</div>
                      </div>
                      <button
                        onClick={() => setEditingUser({ id: u._id, name: u.name, email: u.email })}
                        className="btn-secondary"
                        disabled={busy}
                        title="Modifier"
                      >
                        ✏️ Modifier
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">Aucun utilisateur.</p>
          )}
        </section>
      </div>
    );
  }

  // User interface
  return (
    <div className="app user-view">
      <header>
        <div>
          <h1>Roue de hasard</h1>
          <p>Bienvenue, {user.name}</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary">
          Déconnexion
        </button>
      </header>

      <div className="wheel-container">
        {entries.length > 0 ? (
          <>
            <div
              className="wheel"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              {entries.map((entry, idx) => {
                const angle = (360 / entries.length) * idx;
                const segmentAngle = 360 / entries.length;
                return (
                  <div
                    key={entry._id}
                    className="wheel-segment"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      "--segment-angle": `${segmentAngle}deg`,
                    } as CSSProperties & { "--segment-angle": string }}
                  >
                    <span>{entry.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="wheel-center">
              <div className="winner">
                {lastDraw ? lastDraw.resultLabel : "?"}
              </div>
            </div>
          </>
        ) : (
          <div className="wheel-placeholder">
            <p>Aucun participant dans la roue</p>
          </div>
        )}
      </div>

      {lastDraw ? (
        <section className="panel draw-info">
          <h2>Dernier tirage</h2>
          <div className="draw-details">
            <div className="draw-item">
              <strong>Nom sélectionné :</strong>
              <span className="winner-name">{lastDraw.resultLabel}</span>
            </div>
            <div className="draw-item">
              <strong>Date et heure :</strong>
              <span>{formatDate(lastDraw.drawnAt)}</span>
            </div>
            <div className="draw-item">
              <strong>Cycle :</strong>
              <span>{lastDraw.cycleIndex}</span>
            </div>
            {lastDraw.drawnBy && (
              <div className="draw-item">
                <strong>Par :</strong>
                <span>{lastDraw.drawnBy.name}</span>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="panel">
          <p className="empty">Aucun tirage n'a encore été effectué.</p>
        </section>
      )}
    </div>
  );
}

export default App;
