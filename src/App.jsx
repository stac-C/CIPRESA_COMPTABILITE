import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { Toaster } from "sonner";
import useRealtimeNotifications from "./hooks/useRealtimeNotifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
import "./index.css";
import "./components/PageStyles.css";

function Gate() {
  const { session, profile, roles, accessError, accessLoading, loading, signOut } = useAuth();
  useRealtimeNotifications(Boolean(session));

  if (loading) {
    return (
      <div className="login-screen">
        <p className="empty">Chargement…</p>
      </div>
    );
  }

  if (!session) return <Login />;

  if (accessLoading) {
    return (
      <div className="login-screen">
        <p className="empty">Vérification des accès…</p>
      </div>
    );
  }

  if (accessError || !profile || profile.actif === false || !roles.length) {
    return (
      <div className="access-denied">
        <h1>Accès indisponible</h1>
        <p>
          {accessError || !profile
            ? "Votre profil n'est pas accessible avec les policies Supabase actuelles."
            : profile.actif === false
              ? "Votre compte est désactivé."
              : "Aucun rôle n'est associé à votre compte."}
        </p>
        <button className="btn-secondary" onClick={signOut}>Déconnexion</button>
      </div>
    );
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Gate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
