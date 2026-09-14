import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPqrs?: (tab?: 'todas' | 'enviadas' | 'respondidas') => void;
  totalPqrs?: number;
  enviadasCount?: number;
  respondidasCount?: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPqrs,
  totalPqrs = 0,
  enviadasCount = 0,
  respondidasCount = 0,
}) => {
  const { user, userName, userEmail, userAvatar, updateProfile, updatePassword, signOut } = useAuth();

  const [fullName, setFullName] = useState<string>(userName || '');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPasswordForm, setShowPasswordForm] = useState<boolean>(false);

  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [loadingPassword, setLoadingPassword] = useState<boolean>(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen && userName) {
      setFullName(userName);
    }
  }, [isOpen, userName]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0] ? parts[0][0] : 'U').toUpperCase();
  };

  if (!isOpen || !user) return null;

  const isAdmin = userEmail?.toLowerCase() === 'machoandres12@gmail.com';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setLoadingProfile(true);

    try {
      const { error } = await updateProfile(fullName);
      if (error) throw error;
      setProfileMsg({ text: 'Nombre actualizado correctamente.', type: 'success' });
      setTimeout(() => {
        setProfileMsg(null);
      }, 3000);
    } catch (err: any) {
      setProfileMsg({ text: err.message || 'Error al actualizar el perfil', type: 'error' });
      setTimeout(() => {
        setProfileMsg(null);
      }, 3000);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'La contraseña debe tener al menos 6 caracteres.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Las contraseñas no coinciden.', type: 'error' });
      return;
    }

    setLoadingPassword(true);

    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      setPasswordMsg({ text: 'Contraseña actualizada exitosamente.', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordMsg(null);
      }, 3000);
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'Error al cambiar la contraseña', type: 'error' });
      setTimeout(() => {
        setPasswordMsg(null);
      }, 3000);
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleGoToPqrs = (tab: 'todas' | 'enviadas' | 'respondidas' = 'todas') => {
    if (onNavigateToPqrs) {
      onNavigateToPqrs(tab);
    }
    onClose();
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-card" onClick={(e) => e.stopPropagation()}>
        {/* Header con estilo institucional sobrio */}
        <div className="profile-card__header">
          <div className="profile-card__header-info">
            <h3 className="profile-card__title">Mi Cuenta y Perfil</h3>
            <p className="profile-card__subtitle">Información del ciudadano y gestión de solicitudes</p>
          </div>
          <button type="button" className="profile-card__close" onClick={onClose} title="Cerrar ventana">
            ✕
          </button>
        </div>

        <div className="profile-card__body">
          {/* Tarjeta Principal de Identidad */}
          <div className="profile-user-hero">
            <div className="profile-avatar-large-wrapper">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="profile-avatar-large" />
              ) : (
                <div className="profile-avatar-large">{getInitials(userName)}</div>
              )}
            </div>
            <div className="profile-hero-info">
              <div className="profile-hero-top-row">
                <h4 className="profile-hero-name">{userName}</h4>
                <span className={`profile-role-pill ${isAdmin ? 'profile-role-pill--admin' : ''}`}>
                  {isAdmin ? 'Administrador' : 'Ciudadano'}
                </span>
              </div>
              <p className="profile-hero-email">{userEmail}</p>
              <span className="profile-hero-id">ID: {user.id.slice(0, 18)}...</span>
            </div>
          </div>

          {/* Resumen y Acceso Rápido a PQRS */}
          <div className="profile-pqrs-box">
            <div className="profile-pqrs-box__header">
              <div className="profile-pqrs-box__title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>Resumen de Radicados</span>
              </div>
              <button
                type="button"
                className="profile-pqrs-view-all-btn"
                onClick={() => handleGoToPqrs('todas')}
              >
                Ver tus PQRS &rarr;
              </button>
            </div>

            <div className="profile-stats-grid">
              <button
                type="button"
                className="profile-stat-item"
                onClick={() => handleGoToPqrs('todas')}
                title="Ver todas tus solicitudes"
              >
                <span className="profile-stat-label">Total Radicadas</span>
                <span className="profile-stat-number">{totalPqrs}</span>
              </button>

              <button
                type="button"
                className="profile-stat-item profile-stat-item--amber"
                onClick={() => handleGoToPqrs('enviadas')}
                title="Ver radicados sin respuesta"
              >
                <span className="profile-stat-label">Sin Respuesta</span>
                <span className="profile-stat-number profile-stat-number--amber">{enviadasCount}</span>
              </button>

              <button
                type="button"
                className="profile-stat-item profile-stat-item--green"
                onClick={() => handleGoToPqrs('respondidas')}
                title="Ver radicados respondidos"
              >
                <span className="profile-stat-label">Respondidas</span>
                <span className="profile-stat-number profile-stat-number--green">{respondidasCount}</span>
              </button>
            </div>
          </div>

          {/* Formulario 1: Actualizar Nombre */}
          <form className="profile-form-section" onSubmit={handleUpdateProfile}>
            <div className="profile-section-title-wrap">
              <h4 className="profile-section-title">Datos Personales</h4>
            </div>

            {profileMsg && (
              <div className={`profile-alert profile-alert--${profileMsg.type}`}>
                {profileMsg.text}
              </div>
            )}

            <div className="profile-field">
              <label htmlFor="profileName">Nombre Completo</label>
              <div className="profile-input-action-row">
                <input
                  id="profileName"
                  type="text"
                  className="profile-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                />
                <button
                  type="submit"
                  className="profile-btn-save"
                  disabled={loadingProfile || fullName.trim() === (userName || '').trim()}
                >
                  {loadingProfile ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </form>

          {/* Sección de Seguridad y Contraseña */}
          <div className="profile-security-section">
            <button
              type="button"
              className={`profile-toggle-password-btn ${showPasswordForm ? 'profile-toggle-password-btn--active' : ''}`}
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              <div className="profile-toggle-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <span className="profile-toggle-text">Seguridad y Cambio de Contraseña</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                className="profile-chevron-icon"
                style={{
                  transform: showPasswordForm ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  marginLeft: 'auto',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showPasswordForm && (
              <form className="profile-password-form" onSubmit={handleChangePassword}>
                {passwordMsg && (
                  <div className={`profile-alert profile-alert--${passwordMsg.type}`}>
                    {passwordMsg.text}
                  </div>
                )}

                <div className="profile-field">
                  <label htmlFor="newPassword">Nueva Contraseña</label>
                  <input
                    id="newPassword"
                    type="password"
                    className="profile-input"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="profile-input"
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="profile-btn-password-submit" disabled={loadingPassword}>
                  {loadingPassword ? 'Actualizando Contraseña...' : 'Actualizar Contraseña'}
                </button>
              </form>
            )}
          </div>

          <div className="profile-footer-actions">
            <button
              type="button"
              className="profile-btn-logout"
              onClick={async () => {
                await signOut();
                onClose();
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

