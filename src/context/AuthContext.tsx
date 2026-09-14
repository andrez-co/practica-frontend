import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  setAuthError: (msg: string | null) => void;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ data: any; error: AuthError | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ data: any; error: AuthError | null }>;
  updateProfile: (fullName: string) => Promise<{ data: any; error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string | null>(null);

  const extractName = (u: User | null): string => {
    if (!u) return 'Usuario';
    const meta = u.user_metadata;
    if (meta?.custom_name && meta.custom_name.trim()) return meta.custom_name.trim();
    if (meta?.full_name && meta.full_name.trim()) return meta.full_name.trim();
    if (meta?.name && meta.name.trim()) return meta.name.trim();
    if (meta?.given_name && meta.given_name.trim()) {
      return `${meta.given_name} ${meta.family_name || ''}`.trim();
    }
    if (u.email) {
      const emailPrefix = u.email.split('@')[0];
      return emailPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return 'Usuario';
  };

  const syncCiudadano = async (currentUser: User) => {
    if (!currentUser || !currentUser.id) return;

    try {
      const avatarUrl = currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null;

      // 1. Buscar si la tabla ciudadanos ya tiene un nombre guardado para este usuario
      const { data: dbData } = await supabase
        .from('ciudadanos')
        .select('nombre, avatar_url')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (dbData?.nombre && dbData.nombre.trim()) {
        setCustomName(dbData.nombre.trim());
        if (avatarUrl && !dbData.avatar_url) {
          await supabase.from('ciudadanos').update({ avatar_url: avatarUrl }).eq('id', currentUser.id);
        }
      } else {
        // 2. Si no hay registro o nombre guardado, guardamos el nombre y avatar de Google / Email
        const defaultName = extractName(currentUser);
        setCustomName(defaultName);
        await supabase.from('ciudadanos').upsert(
          {
            id: currentUser.id,
            email: currentUser.email || '',
            nombre: defaultName,
            avatar_url: avatarUrl,
            fecha_registro: currentUser.created_at || new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }
    } catch (err) {
      console.warn('Advertencia al sincronizar ciudadano:', err);
    }
  };

  useEffect(() => {
    // Detectar si la URL contiene errores de respuesta de Google OAuth o Supabase
    const hash = window.location.hash || window.location.search;
    if (hash && (hash.includes('error=') || hash.includes('error_description='))) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const errDesc = params.get('error_description') || params.get('error') || '';
      if (errDesc.includes('access_denied') || errDesc.includes('not_granted') || hash.includes('403')) {
        setAuthError(
          '⚠️ Google ha restringido el acceso a esta cuenta de correo porque tu proyecto en Google Cloud Console está en modo "En Pruebas" (Testing). Para permitir cualquier correo: Ve a Google Cloud Console -> Pantalla de consentimiento de OAuth -> "Usuarios de prueba" (agrega la cuenta) o presiona "Publicar la App".'
        );
      } else if (errDesc) {
        setAuthError(`⚠️ Error de autenticación: ${decodeURIComponent(errDesc)}`);
      }
    }

    // 1. Obtener la sesión activa actual al montar la aplicación
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        syncCiudadano(session.user);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('Error obteniendo sesión inicial:', err);
      setLoading(false);
    });

    // 2. Escuchar cambios de estado (LOGIN, LOGOUT, TOKEN_REFRESHED, SIGNED_IN, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        syncCiudadano(session.user);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Funciones wrapper de Supabase Auth

  // A. Registro con correo y contraseña
  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
          name: fullName || '',
        },
        emailRedirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  // B. Inicio de sesión tradicional (Email/Password)
  const signInWithPassword = async (email: string, password: string) => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      // Ignorar errores al limpiar estado previo
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data?.user) {
      setUser(data.user);
      setSession(data.session);
      syncCiudadano(data.user);
    }
    return { data, error };
  };

  // C. Inicio de sesión OAuth con Google
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    return { data, error };
  };

  // D. Cierre de sesión completo (limpia local y sesión Supabase)
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error al cerrar sesión en Supabase:', err);
    }

    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Error limpiando memoria local:', e);
    }

    setUser(null);
    setSession(null);
    setCustomName(null);
    return { error: null };
  };

  // E. Cambiar Contraseña
  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  };

  // F. Actualizar Nombre / Perfil
  const updateProfile = async (fullName: string) => {
    const trimmed = fullName.trim();
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: trimmed,
        name: trimmed,
        custom_name: trimmed,
      },
    });

    if (!error) {
      setCustomName(trimmed);
      if (data?.user) {
        setUser(data.user);
      }
      if (user?.id) {
        try {
          await supabase.from('ciudadanos').upsert(
            {
              id: user.id,
              email: user.email || '',
              nombre: trimmed,
              fecha_registro: user.created_at || new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch (err) {
          console.warn('No se pudo actualizar el nombre en la tabla ciudadanos:', err);
        }
      }
    }

    return { data, error };
  };

  // Extraer datos del perfil de usuario (Soporta Auth tradicional y OAuth Google)
  const userName = customName || extractName(user);

  const userEmail = user?.email || '';

  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authError,
        setAuthError,
        userName,
        userEmail,
        userAvatar,
        signUp,
        signInWithPassword,
        signInWithGoogle,
        signOut,
        updatePassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom Hook useAuth para acceder fácilmente a la autenticación de Supabase
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un <AuthProvider>');
  }
  return context;
};
