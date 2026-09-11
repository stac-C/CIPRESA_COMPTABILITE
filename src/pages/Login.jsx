import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState("login");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function changeMode(nextMode) {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === "signup" && password !== passwordConfirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    let result;
    try {
      if (mode === "login") {
        result = await signIn(email, password);
      } else if (mode === "signup") {
        result = await signUp({ email, password, nom, prenom, telephone });
      } else {
        result = await resetPassword(email);
      }
    } catch (requestError) {
      result = { error: requestError };
    } finally {
      setSubmitting(false);
    }

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === "signup") {
      setSuccess("Votre compte est créé. Consultez votre e-mail pour confirmer votre adresse.");
      setMode("login");
      setPassword("");
      setPasswordConfirmation("");
    } else if (mode === "forgot") {
      setSuccess("Si cette adresse correspond à un compte, un lien de réinitialisation vient d’être envoyé.");
    }
  }

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  return (
    <div className="login-screen">
      <div className="login-layout">
        <section className="login-intro">
          <div className="brand-mark">C</div>
          <p className="eyebrow">GESTION & COMPTABILITÉ</p>
          <h1>COMPTA-CIPRESA</h1>
          <p>Centralisez votre activité et gardez une vision claire de vos finances.</p>
          <ul>
            <li>Clients et factures au même endroit</li>
            <li>Données sécurisées par Supabase</li>
            <li>Accès simple depuis tous vos appareils</li>
          </ul>
        </section>

        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-header">
            <p className="mobile-brand">COMPTA-CIPRESA</p>
            <h2>{isSignup ? "Créer votre compte" : isForgot ? "Mot de passe oublié ?" : "Bon retour !"}</h2>
            <p className="subtitle">
              {isSignup
                ? "Inscrivez-vous pour accéder à votre espace."
                : isForgot
                  ? "Recevez un lien sécurisé pour choisir un nouveau mot de passe."
                  : "Connectez-vous à votre espace comptabilité."}
            </p>
          </div>

          {isSignup && (
            <div className="form-row">
              <div>
                <label htmlFor="prenom">Prénom</label>
                <input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required autoComplete="given-name" />
              </div>
              <div>
                <label htmlFor="nom">Nom</label>
                <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required autoComplete="family-name" />
              </div>
            </div>
          )}

          {isSignup && (
            <>
              <label htmlFor="telephone">Téléphone <span>(facultatif)</span></label>
              <input id="telephone" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} autoComplete="tel" />
            </>
          )}

          <label htmlFor="email">Adresse e-mail</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="vous@exemple.com" />

          {!isForgot && (
            <>
              <div className="label-line">
                <label htmlFor="password">Mot de passe</label>
                {mode === "login" && <span className="password-hint">6 caractères minimum</span>}
              </div>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={isSignup ? "new-password" : "current-password"} placeholder="6 caractères minimum" />
            </>
          )}

          {isSignup && (
            <>
              <label htmlFor="password-confirmation">Confirmer le mot de passe</label>
              <input id="password-confirmation" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required minLength={6} autoComplete="new-password" />
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>J’accepte les <a href="mailto:support@cipresa.com?subject=Conditions%20d’utilisation">conditions d’utilisation</a> et la <a href="mailto:support@cipresa.com?subject=Politique%20de%20confidentialité">politique de confidentialité</a>.</span>
              </label>
            </>
          )}

          {error && <p className="message error" role="alert">{error}</p>}
          {success && <p className="message success" role="status">{success}</p>}

          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting ? "Veuillez patienter..." : isSignup ? "Créer mon compte" : isForgot ? "Envoyer le lien" : "Se connecter"}
          </button>

          {mode === "login" && (
            <button className="link-button forgot-link" type="button" onClick={() => changeMode("forgot")}>
              Mot de passe oublié ?
            </button>
          )}

          <div className="auth-switch">
            {isSignup ? "Vous avez déjà un compte ?" : "Vous n’avez pas encore de compte ?"}
            <button className="link-button" type="button" onClick={() => changeMode(isSignup ? "login" : "signup")}>
              {isSignup ? "Se connecter" : "Créer un compte"}
            </button>
          </div>

          {isForgot && (
            <button className="link-button back-link" type="button" onClick={() => changeMode("login")}>
              ← Retour à la connexion
            </button>
          )}

          <footer className="login-footer">
            <a href="mailto:support@cipresa.com">Besoin d’aide ?</a>
            <span>·</span>
            <a href="mailto:support@cipresa.com?subject=Confidentialité">Confidentialité</a>
          </footer>
        </form>
      </div>
    </div>
  );
}
