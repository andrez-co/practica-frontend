import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithPassword, signUp, signInWithGoogle, authError } = useAuth();

  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeError = errorMsg || authError;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        const { data, error } = await signUp(email, password, fullName);
        if (error) throw error;

        // Si se requiere confirmación por email en Supabase
        if (data?.user && !data?.session) {
          setSuccessMsg('¡Registro exitoso! Por favor revisa tu correo electrónico para confirmar la cuenta.');
        } else {
          setSuccessMsg('¡Cuenta creada e inicio de sesión exitoso!');
          setTimeout(() => onClose(), 1500);
        }
      } else {
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;

        setSuccessMsg('¡Inicio de sesión exitoso!');
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      let msg = err.message || 'Ocurrió un error al procesar la autenticación';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Credenciales inválidas. Verifica tu correo y contraseña o regístrate si es tu primera vez.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Tu correo electrónico aún no ha sido confirmado en Supabase. Revisa tu bandeja de entrada.';
      } else if (msg.includes('User already registered')) {
        msg = 'Este correo ya está registrado. Por favor cambia a la pestaña "Iniciar Sesión".';
      } else if (msg.includes('Database error saving new user')) {
        msg = '⚠️ Error en el Trigger de la base de datos de Supabase al guardar el nuevo usuario. Ejecuta el script "fix_login_trigger.sql" en el Editor SQL de tu Supabase Dashboard para solucionarlo.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      const msg = err?.message || err?.msg || '';
      if (msg.includes('provider is not enabled') || err?.error_code === 'validation_failed') {
        setErrorMsg(
          '⚠️ El inicio de sesión con Google está desactivado en Supabase. Actívalo en tu Dashboard en: Authentication -> Providers -> Google'
        );
      } else {
        setErrorMsg(msg || 'Error al iniciar sesión con Google');
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-card__header">
          <div className="auth-card__header-info">
            <h3 className="auth-card__title">
              {isRegister ? 'Crear una cuenta' : 'Iniciar Sesión'}
            </h3>
            <p className="auth-card__subtitle">
              {isRegister
                ? 'Ingresa tus datos para registrarte en el portal'
                : 'Accede a tus trámites y servicios guardados'}
            </p>
          </div>
          <button type="button" className="auth-card__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="auth-card__body">
          {/* Tabs switch */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${!isRegister ? 'auth-tab--active' : ''}`}
              onClick={() => {
                setIsRegister(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              className={`auth-tab ${isRegister ? 'auth-tab--active' : ''}`}
              onClick={() => {
                setIsRegister(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Registrarse
            </button>
          </div>

          {/* Alert Messages */}
          {activeError && (
            <div className="auth-alert auth-alert--error">
              {activeError}
            </div>
          )}
          {successMsg && <div className="auth-alert auth-alert--success">{successMsg}</div>}

          {/* Google OAuth Button */}
          <button
            type="button"
            className="auth-btn-google"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continuar con Google
          </button>

          <div className="auth-divider">
            <span>o usar correo electrónico</span>
          </div>

          {/* Email / Password Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="auth-field">
                <label htmlFor="fullName">Nombre Completo</label>
                <input
                  id="fullName"
                  type="text"
                  className="auth-input"
                  placeholder="Ej. Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isRegister}
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                id="email"
                type="email"
                className="auth-input"
                placeholder="tu.correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="auth-btn-submit" disabled={loading}>
              {loading
                ? 'Procesando...'
                : isRegister
                ? 'Crear Cuenta'
                : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
