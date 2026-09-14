import { useState, useEffect, useMemo } from 'react';
import TarjetaTramite, { type PQRSData } from './components/TarjetaTramite';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { CreatePqrsModal } from './components/CreatePqrsModal';
import EditPqrsModal from './components/EditPqrsModal';
import AdminDashboard from './components/AdminDashboard';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { openPdfInNewTab } from './utils/pdfHelper';
import type { ServiceDetail } from './components/ServiceDetailModal';
import { ServiceDetailPage } from './components/ServiceDetailPage';
import { supabase } from './lib/supabaseClient';
import './App.css';

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0] ? parts[0][0] : 'U').toUpperCase();
};

function App() {
  // Auth state de Supabase
  const { user, userName, userEmail, userAvatar, signOut, authError } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isCreatePqrsModalOpen, setIsCreatePqrsModalOpen] = useState<boolean>(false);
  const [editingPqrsItem, setEditingPqrsItem] = useState<PQRSData | null>(null);
  const [selectedPqrCategory, setSelectedPqrCategory] = useState<string>('Agua');
  const [selectedPqrInitialDesc, setSelectedPqrInitialDesc] = useState<string>('');
  const [deleteModalItem, setDeleteModalItem] = useState<PQRSData | null>(null);
  const [isDeletingPqrs, setIsDeletingPqrs] = useState<boolean>(false);

  // Selected Service Detail Page/Modal
  const [selectedServiceModal, setSelectedServiceModal] = useState<ServiceDetail | null>(null);

  // Navigation state: 'inicio' vs 'pqrs' vs 'servicio-detalle' vs 'admin'
  const [pagina, setPagina] = useState<'inicio' | 'pqrs' | 'servicio-detalle' | 'admin'>('inicio');

  // PQRS API state
  const [pqrsList, setPqrsList] = useState<PQRSData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Control modal de autenticación reactivo
  useEffect(() => {
    if (user) {
      setIsAuthModalOpen(false);
    } else if (authError) {
      setIsAuthModalOpen(true);
    }
  }, [user, authError]);

  // Filters state for PQRS page
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [selectedEstado, setSelectedEstado] = useState<string>('Todos');

  // Selected PQRS item for modal
  const [activeModalItem, setActiveModalItem] = useState<PQRSData | null>(null);

  // View Mode: 'table' (compact list) vs 'grid' (cards)
  const [pqrsViewMode, setPqrsViewMode] = useState<'table' | 'grid'>('table');

  // Apartado / Segmented Section Tab: 'todas' | 'enviadas' | 'respondidas'
  const [pqrsSectionTab, setPqrsSectionTab] = useState<'todas' | 'enviadas' | 'respondidas'>('todas');

  // Expanded Response IDs for citizen table
  const [expandedResponseIds, setExpandedResponseIds] = useState<Record<string, boolean>>({});

  const toggleResponseExpand = (id: string) => {
    setExpandedResponseIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // 3 Service Cards for Home Page with Full Details
  const tramitesHome: ServiceDetail[] = [
    {
      id: 1,
      titulo: 'Agua y Alcantarillado',
      catFiltro: 'Agua',
      categoria: 'Agua Potable',
      descripcion: 'Atención inmediata para reporte de fugas, cortes de servicio y mantenimiento del sistema de alcantarillado.',
      icono: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      ),
      lineaAtencion: 'Línea 116 / (601) 555-0101',
      horario: 'Operación Emergencias 24/7',
      emailContacto: 'acueducto@ciudad.gov.co',
      dependencia: 'Empresa de Acueducto y Alcantarillado',
      cobertura: 'Red urbana y sectores suburbano/rural',
      tramitesFrecuentes: [
        'Reporte urgente de fugas e imprevistos en red matriz de agua potable.',
        'Mantenimiento, desobstrucción y limpieza de alcantarillado sanitario y pluvial.',
        'Solicitud de inspección técnica domiciliaria por variaciones en facturación.',
        'Reposición e instalación de tapas de alcantarillado fracturadas o ausentes.',
      ],
    },
    {
      id: 2,
      titulo: 'Recolección de Basura',
      catFiltro: 'Basuras',
      categoria: 'Aseo Urbano',
      descripcion: 'Información sobre horarios de recolección, reporte de acumulación de residuos y atención de puntos críticos.',
      icono: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      ),
      lineaAtencion: 'Línea 110 / (601) 555-0102',
      horario: 'Lunes a Sábado 6:00am - 10:00pm',
      emailContacto: 'aseo@ciudad.gov.co',
      dependencia: 'Unidad Administrativa de Aseo Urbano',
      cobertura: 'Sectores residenciales y comerciales',
      tramitesFrecuentes: [
        'Reporte por incumplimiento en rutas o frecuencias habituales de recolección.',
        'Solicitud de servicio especial de recolección de escombros, poda y voluminosos.',
        'Instalación y mantenimiento de contenedores comunitarios de carga lateral.',
        'Operativos de limpieza e inspección en puntos críticos y basureros satélites.',
      ],
    },
    {
      id: 3,
      titulo: 'Alumbrado Público',
      catFiltro: 'Alumbrado',
      categoria: 'Energía y Luz',
      descripcion: 'Atención de luminarias apagadas, postes con riesgo de caída y mantenimientos de la red de iluminación pública.',
      icono: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
      ),
      lineaAtencion: 'Línea 115 / (601) 555-0103',
      horario: 'Cuadrillas Nocturnas 6:00pm - 4:00am',
      emailContacto: 'alumbrado@ciudad.gov.co',
      dependencia: 'Subdirección de Alumbrado Público',
      cobertura: 'Vías públicas, parques y senderos',
      tramitesFrecuentes: [
        'Reporte de luminarias LED o de vapor de sodio apagadas en vía pública.',
        'Atención prioritaria de emergencia por postes de alumbrado con riesgo de caída.',
        'Solicitudes de expansión de la red luminaria en parques y senderos oscuros.',
        'Sustitución preventiva de fotoceldas, fotocroles y transformadores averiados.',
      ],
    },
  ];

  const fetchPqrs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Consultar directamente la tabla 'pqrs' en Supabase
      const { data, error: sbError } = await supabase
        .from('pqrs')
        .select('*')
        .order('id', { ascending: false });

      if (sbError) {
        console.error('❌ Error de Supabase al consultar PQRS:', sbError);
        throw sbError;
      }

      // Filtrar de forma que cada usuario vea sus PQRS sin ocultar radicados recién creados
      let rawPqrs = data || [];
      if (user) {
        const uName = (userName || '').trim().toLowerCase();
        const uEmail = (userEmail || '').trim().toLowerCase();
        const uId = user.id;

        rawPqrs = rawPqrs.filter((item: any) => {
          const itemCid = item.ciudadano_id;
          const itemSol = (item.solicitante || '').trim().toLowerCase();
          const itemEmail = (item.email || '').trim().toLowerCase();

          if (itemCid && itemCid === uId) return true;
          if (uName && itemSol && (itemSol.includes(uName) || uName.includes(itemSol))) return true;
          if (uEmail && itemEmail && itemEmail === uEmail) return true;
          
          // Si el registro no tiene ID de ciudadano o correo, se muestra al usuario si coincide la inicial o el nombre
          if (!itemCid && !itemEmail) return true;

          return false;
        });
      } else {
        // Si no ha iniciado sesión, no muestra radicados
        rawPqrs = [];
      }

      // Consultar tabla 'documentos_formativos' para relacionar los archivos PDF adjuntos
      let docsMap: Record<string, { url: string; nombre: string }> = {};
      try {
        let { data: docsData } = await supabase.from('documentos_formativos').select('*');
        if (!docsData || docsData.length === 0) {
          const { data: normData } = await supabase.from('documentos_normativos').select('*');
          docsData = normData;
        }
        if (docsData) {
          docsData.forEach((doc: any) => {
            if (doc.titulo && doc.url) {
              const match = doc.titulo.match(/(PQR-\d{4}-\d+)/i);
              if (match) {
                const pqrId = match[1];
                docsMap[pqrId] = {
                  url: doc.url,
                  nombre: doc.titulo.replace(`${pqrId} - `, '').replace(`${pqrId}: `, ''),
                };
              }
            }
          });
        }
      } catch (docErr) {
        console.warn('⚠️ Nota al consultar documentos_formativos:', docErr);
      }

      const extractDireccion = (rawDesc: string) => {
        if (!rawDesc) return '';
        const match = rawDesc.match(/\[Dirección:\s*([^\]]+)\]/i);
        return match ? match[1].trim() : '';
      };

      const mappedData: PQRSData[] = rawPqrs.map((item: any) => {
        const docInfo = docsMap[item.id];
        const rawDesc = item.descripcion || '';
        let itemDireccion = item.direccion ? item.direccion.trim() : '';
        if (!itemDireccion) {
          itemDireccion = extractDireccion(rawDesc);
        }
        let cleanDesc = rawDesc.replace(/\[Dirección:\s*[^\]]+\]\s*/gi, '').trim();
        if (!cleanDesc) cleanDesc = rawDesc;

        return {
          id: item.id,
          solicitante: item.solicitante || 'Ciudadano',
          direccion: itemDireccion,
          categoria: item.categoria || 'Agua',
          descripcion: cleanDesc,
          estado: item.estado || 'En trámite',
          fechaRadicacion: item.fecha_radicacion || new Date().toISOString().split('T')[0],
          plazoLegal: '15 días hábiles',
          respuestaOficial: item.respuesta_oficial || '',
          adjuntoUrl: item.adjunto_url || docInfo?.url || null,
          adjuntoNombre: item.adjunto_nombre || docInfo?.nombre || null,
          ciudadanoId: item.ciudadano_id || null,
        };
      });
      setPqrsList(mappedData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al consultar la base de datos de Supabase';
      setError(msg);
      setPqrsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePqrs = (itemToDelete: PQRSData) => {
    setDeleteModalItem(itemToDelete);
  };

  const executeDeletePqrs = async () => {
    if (!deleteModalItem) return;

    setIsDeletingPqrs(true);
    try {
      // 1. Eliminar registro en la tabla 'pqrs'
      const { error } = await supabase.from('pqrs').delete().eq('id', deleteModalItem.id);
      if (error) {
        console.error('❌ Error al eliminar de pqrs:', error);
        throw error;
      }

      // 2. Limpieza en tablas relacionadas
      try {
        await supabase.from('documentos_formativos').delete().ilike('titulo', `${deleteModalItem.id}%`);
        await supabase.from('seguimiento_pqrs').delete().eq('pqr_id', deleteModalItem.id);
      } catch (cleanErr) {
        console.warn('Advertencia limpiando registros asociados:', cleanErr);
      }

      if (activeModalItem?.id === deleteModalItem.id) {
        setActiveModalItem(null);
      }

      setPqrsList((prev) => prev.filter((p) => p.id !== deleteModalItem.id));
      setDeleteModalItem(null);
    } catch (err: any) {
      alert(`No se pudo eliminar la PQR: ${err.message || 'Error de conexión'}`);
    } finally {
      setIsDeletingPqrs(false);
    }
  };

  useEffect(() => {
    if (pagina === 'pqrs') {
      fetchPqrs();
    }
  }, [pagina, user, userName, userEmail]);


  // Counts for the Apartados (Enviadas vs Respondidas)
  const enviadasCount = useMemo(() => {
    return pqrsList.filter((p) => p.estado.toLowerCase() !== 'resuelto' && (!p.respuestaOficial || !p.respuestaOficial.trim())).length;
  }, [pqrsList]);

  const respondidasCount = useMemo(() => {
    return pqrsList.filter((p) => p.estado.toLowerCase() === 'resuelto' || (p.respuestaOficial && p.respuestaOficial.trim().length > 0)).length;
  }, [pqrsList]);

  // Compute counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Todas: pqrsList.length,
      Agua: 0,
      Basuras: 0,
      Alumbrado: 0,
    };
    pqrsList.forEach((item) => {
      if (counts[item.categoria] !== undefined) {
        counts[item.categoria]++;
      } else {
        counts[item.categoria] = 1;
      }
    });
    return counts;
  }, [pqrsList]);

  // Filtered List based on Section Tab, Categories, Status, and Search
  const filteredPqrs = useMemo(() => {
    return pqrsList.filter((item) => {
      const isAnswered = item.estado.toLowerCase() === 'resuelto' || (item.respuestaOficial && item.respuestaOficial.trim().length > 0);

      // 1. Filtrado por apartado (Enviadas vs Respondidas)
      if (pqrsSectionTab === 'enviadas' && isAnswered) {
        return false;
      }
      if (pqrsSectionTab === 'respondidas' && !isAnswered) {
        return false;
      }

      // 2. Filtro de Categoría
      if (selectedCategoria !== 'Todas' && item.categoria.toLowerCase() !== selectedCategoria.toLowerCase()) {
        return false;
      }

      // 3. Filtro de Estado
      if (selectedEstado !== 'Todos' && item.estado.toLowerCase() !== selectedEstado.toLowerCase()) {
        return false;
      }

      // 4. Búsqueda por texto
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        return (
          item.id.toLowerCase().includes(query) ||
          item.solicitante.toLowerCase().includes(query) ||
          item.descripcion.toLowerCase().includes(query) ||
          (item.respuestaOficial && item.respuestaOficial.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [pqrsList, pqrsSectionTab, selectedCategoria, selectedEstado, searchTerm]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategoria('Todas');
    setSelectedEstado('Todos');
    setPqrsSectionTab('todas');
  };

  return (
    <div className="app-shell">
      {/* Header Navbar Ejecutivo y Elegante */}
      <header className="modern-nav">
        <div className="modern-nav__container">
          {/* LADO IZQUIERDO: MARCA E INSTITUCIÓN CON LOGO PROFESIONAL */}
          <div className="modern-nav__brand" onClick={() => setPagina('inicio')}>
            <div className="modern-nav__logo-badge">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z" fill="url(#logoGradient)" />
                <path d="M12 6L16.5 9.5V14.5L12 18L7.5 14.5V9.5L12 6Z" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 9V15M9 12H15" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="logoGradient" x1="3" y1="2" x2="21" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0B2545" />
                    <stop offset="1" stopColor="#1D4E89" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="modern-nav__brand-info">
              <span className="modern-nav__title">Portal Institucional</span>
              <span className="modern-nav__subtitle">Atención Ciudadana y Control de Trámites</span>
            </div>
          </div>

          {/* CENTRO: MENÚ CENTRADO (TRÁMITES Y PQRS) */}
          <nav className="modern-nav__center">
            <button
              type="button"
              className={`nav-tab ${pagina === 'inicio' || pagina === 'servicio-detalle' ? 'nav-tab--active' : ''}`}
              onClick={() => setPagina('inicio')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Trámites y Servicios
            </button>

            <button
              type="button"
              className={`nav-tab ${pagina === 'pqrs' ? 'nav-tab--active' : ''}`}
              onClick={() => setPagina('pqrs')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Consultar PQRS
            </button>
          </nav>

          {/* LADO DERECHO: FOTO DE PERFIL / MI PERFIL / BOTÓN ADMIN (EXCLUSIVO) / SALIR */}
          <div className="modern-nav__right">
            {userEmail?.toLowerCase() === 'machoandres12@gmail.com' && (
              <button
                type="button"
                className="admin-trigger-btn"
                onClick={() => setPagina('admin')}
                style={{
                  background: 'var(--azul-noche, #0B2545)',
                  color: '#ffffff',
                  border: '1px solid var(--azul-noche, #0B2545)',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginRight: '0.65rem',
                  boxShadow: '0 2px 6px rgba(11, 37, 69, 0.2)',
                }}
                title="Consola de Administración para machoandres12@gmail.com"
              >
                👑 Admin
              </button>
            )}

            {user ? (
              <div className="user-profile-badge">
                <div
                  className="user-profile-clickable"
                  onClick={() => setIsProfileModalOpen(true)}
                  title="Mi Perfil y Configuración de Cuenta"
                >
                  <div className="user-avatar-wrapper">
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} className="user-avatar" />
                    ) : (
                      <div className="user-avatar">{getInitials(userName)}</div>
                    )}
                    <span className="user-status-dot" title="Usuario Conectado"></span>
                  </div>
                  <div className="user-info">
                    <span className="user-name">{userName}</span>
                    <span className="user-badge-tag">Ciudadano Verificado</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-logout"
                  onClick={async () => {
                    await signOut();
                    setIsAuthModalOpen(true);
                  }}
                  title="Cerrar sesión e iniciar con otra cuenta"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-auth-trigger"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </header>

      {/* VISTA 1: INICIO Y TRÁMITES */}
      {pagina === 'inicio' && (
        <main className="main-content">
          <section className="hero-card">
            <div className="hero-card__content">
              <div className="hero-card__badge">
                <span className="badge-dot"></span>
                Portal Oficial de Atención Ciudadana
              </div>
              <h2 className="hero-card__title">
                Servicios Públicos y <span className="hero-title-accent">Atención de Trámites</span>
              </h2>
              <p className="hero-card__desc">
                Consulta la información oficial, reporta incidencias y accede al seguimiento transparente de los servicios públicos municipales.
              </p>
            </div>
          </section>

          <section className="tarjetas-grid">
            {tramitesHome.map((tramite) => (
              <TarjetaTramite
                key={tramite.id}
                titulo={tramite.titulo}
                descripcion={tramite.descripcion}
                categoria={tramite.categoria}
                icono={tramite.icono}
                onConsultar={() => {
                  setSelectedServiceModal(tramite);
                  setPagina('servicio-detalle');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </section>

          <section className="pqrs-cta-card">
            <div className="pqrs-cta-card__body">
              <div className="pqrs-cta-card__badge">Seguimiento Oficial</div>
              <h3>¿Tienes un número de radicado PQR?</h3>
              <p>Consulta el estado actual, plazos legales y respuestas institucionales en tiempo real.</p>
            </div>
            <button
              type="button"
              className="pqrs-cta-card__btn"
              onClick={() => setPagina('pqrs')}
            >
              Buscar Radicado de PQRS &rarr;
            </button>
          </section>
        </main>
      )}

      {/* VISTA 2: PÁGINA PERSONALIZADA DE DETALLE DE SERVICIO */}
      {pagina === 'servicio-detalle' && selectedServiceModal && (
        <main className="main-content">
          <ServiceDetailPage
            service={selectedServiceModal}
            onVolver={() => setPagina('inicio')}
            onRadicarPqr={(catFiltro, descPrefill) => {
              setSelectedPqrCategory(catFiltro);
              setSelectedPqrInitialDesc(descPrefill || '');
              setIsCreatePqrsModalOpen(true);
            }}
            onVerRadicados={(catFiltro) => {
              setSelectedCategoria(catFiltro);
              setPagina('pqrs');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </main>
      )}

      {/* VISTA 2: PÁGINA DE CONSULTAS PQRS */}
      {pagina === 'pqrs' && (
        <main className="main-content">
          <div className="breadcrumb-bar">
            <button type="button" className="breadcrumb-btn" onClick={() => setPagina('inicio')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Volver a Trámites y Servicios
            </button>
          </div>

          <section className="hero-card hero-card--pqrs">
            <div className="hero-card__content">
              <div className="hero-card__badge">
                <span className="badge-dot"></span>
                Consola de Seguimiento Exclusiva
              </div>
              <h2 className="hero-card__title">
                Tus <span className="hero-title-accent">PQRS Personales</span>
              </h2>
              <p className="hero-card__desc">
                Consola privada de seguimiento. Revisa tus radicados, consulta las respuestas oficiales emitidas por la entidad y adjunta documentos soporte en formato PDF.
              </p>
            </div>
          </section>

          {/* APARTADOS DE NAVEGACIÓN: TODAS / ENVIADAS / RESPONDIDAS */}
          <section className="citizen-section-header">
            <div className="citizen-tabs-container">
              <button
                type="button"
                className={`citizen-tab-btn ${pqrsSectionTab === 'todas' ? 'citizen-tab-btn--active' : ''}`}
                onClick={() => setPqrsSectionTab('todas')}
              >
                <div className="citizen-tab-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <span className="citizen-tab-text">Todas las PQRS</span>
                <span className="citizen-tab-counter">{pqrsList.length}</span>
              </button>

              <button
                type="button"
                className={`citizen-tab-btn citizen-tab-btn--pending ${pqrsSectionTab === 'enviadas' ? 'citizen-tab-btn--active' : ''}`}
                onClick={() => setPqrsSectionTab('enviadas')}
              >
                <div className="citizen-tab-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 15 14" />
                  </svg>
                </div>
                <span className="citizen-tab-text">Enviadas sin Respuesta</span>
                <span className="citizen-tab-counter citizen-tab-counter--amber">{enviadasCount}</span>
              </button>

              <button
                type="button"
                className={`citizen-tab-btn citizen-tab-btn--answered ${pqrsSectionTab === 'respondidas' ? 'citizen-tab-btn--active' : ''}`}
                onClick={() => setPqrsSectionTab('respondidas')}
              >
                <div className="citizen-tab-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span className="citizen-tab-text">Respondidas</span>
                <span className="citizen-tab-counter citizen-tab-counter--green">{respondidasCount}</span>
              </button>
            </div>

            <button
              type="button"
              className="btn-create-pqrs"
              onClick={() => setIsCreatePqrsModalOpen(true)}
              style={{
                background: 'var(--azul-noche, #0B2545)',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 5px rgba(11, 37, 69, 0.15)',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Radicar Nueva PQR</span>
            </button>
          </section>

          {/* Search & Filter Panel */}
          <section className="search-filter-card">
            <div className="search-field">
              <svg className="search-field__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-field__input"
                placeholder="Buscar por N° radicado (ej. PQR-2026-001), solicitante o palabra clave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button type="button" className="search-field__clear" onClick={() => setSearchTerm('')}>
                  ✕
                </button>
              )}
            </div>

            <div className="filters-flex">
              <div className="filter-item">
                <span className="filter-item__label">Servicio:</span>
                <div className="filter-item__pills">
                  {['Todas', 'Agua', 'Basuras', 'Alumbrado'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`filter-pill ${selectedCategoria === cat ? 'filter-pill--active' : ''}`}
                      onClick={() => setSelectedCategoria(cat)}
                    >
                      {cat}
                      <span className="filter-pill__count">{categoryCounts[cat] ?? 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-item">
                <span className="filter-item__label">Estado:</span>
                <div className="filter-item__pills">
                  {['Todos', 'En trámite', 'Resuelto'].map((est) => (
                    <button
                      key={est}
                      type="button"
                      className={`filter-pill ${selectedEstado === est ? 'filter-pill--active' : ''}`}
                      onClick={() => setSelectedEstado(est)}
                    >
                      {est}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Loading / Error States */}
          {loading && (
            <div className="status-box">
              <div className="status-box__spinner"></div>
              <p>Consultando el servicio backend `/api/pqrs`...</p>
            </div>
          )}

          {error && !loading && (
            <div className="status-box status-box--error">
              <h3>Error de conexión</h3>
              <p>{error}</p>
              <button type="button" className="status-box__btn" onClick={fetchPqrs}>
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {!user ? (
                <div className="status-box" style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔐</div>
                  <h3>Consola de PQRS Personales</h3>
                  <p style={{ maxWidth: '480px', margin: '0.5rem auto 1.5rem', color: '#64748b' }}>
                    Este apartado es exclusivo para cada usuario. Inicia sesión para radicar y consultar el historial de tus solicitudes y documentos PDF adjuntos.
                  </p>
                  <button
                    type="button"
                    className="btn-create-pqrs"
                    onClick={() => setIsAuthModalOpen(true)}
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.65rem 1.4rem',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                    }}
                  >
                    Iniciar Sesión / Registrarse
                  </button>
                </div>
              ) : (
                <>
                  {/* Barra de Control y Resumen Ejecutiva */}
                  <div className="citizen-pqrs-toolbar">
                    <div className="citizen-toolbar-left">
                      <div className="citizen-count-badge">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <span>
                          Mostrando <strong>{filteredPqrs.length}</strong> de <strong>{pqrsList.length}</strong> de tus radicados
                        </span>
                      </div>

                      {(searchTerm || selectedCategoria !== 'Todas' || selectedEstado !== 'Todos') && (
                        <button type="button" className="citizen-reset-btn" onClick={resetFilters} title="Limpiar todos los filtros">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          <span>Limpiar filtros</span>
                        </button>
                      )}
                    </div>

                    <div className="citizen-toolbar-right">
                      <div className="citizen-view-switcher">
                        <button
                          type="button"
                          className={`citizen-view-btn ${pqrsViewMode === 'table' ? 'citizen-view-btn--active' : ''}`}
                          onClick={() => setPqrsViewMode('table')}
                          title="Vista Lista Compacta (Fácil de buscar y ver muchas solicitudes)"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                          </svg>
                          <span>Lista Compacta</span>
                        </button>

                        <button
                          type="button"
                          className={`citizen-view-btn ${pqrsViewMode === 'grid' ? 'citizen-view-btn--active' : ''}`}
                          onClick={() => setPqrsViewMode('grid')}
                          title="Vista Cuadrícula de Tarjetas"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <rect x="3" y="3" width="7" height="7" rx="1.5" />
                            <rect x="14" y="3" width="7" height="7" rx="1.5" />
                            <rect x="14" y="14" width="7" height="7" rx="1.5" />
                            <rect x="3" y="14" width="7" height="7" rx="1.5" />
                          </svg>
                          <span>Cuadrícula</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {filteredPqrs.length === 0 ? (
                    <div className="status-box">
                      {pqrsSectionTab === 'enviadas' ? (
                        <>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                          <h3>No tienes solicitudes pendientes de respuesta</h3>
                          <p>Todas tus solicitudes radicadas han recibido atención o cuentan con respuesta oficial emitida.</p>
                        </>
                      ) : pqrsSectionTab === 'respondidas' ? (
                        <>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                          <h3>No tienes solicitudes con respuesta emitida aún</h3>
                          <p>Tus radicados enviados se encuentran en análisis técnico dentro del plazo legal de 15 días hábiles.</p>
                        </>
                      ) : (
                        <>
                          <h3>No tienes radicados registrados aún</h3>
                          <p>Haz clic en "Radicar Nueva PQR" para registrar tu primera solicitud y adjuntar documentos soporte en PDF.</p>
                        </>
                      )}
                      <button
                        type="button"
                        className="btn-create-pqrs"
                        onClick={() => setIsCreatePqrsModalOpen(true)}
                        style={{
                          background: 'var(--azul-noche, #0B2545)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.55rem 1.1rem',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          marginTop: '0.5rem',
                        }}
                      >
                        + Radicar Nueva PQR
                      </button>
                    </div>
                  ) : pqrsViewMode === 'table' ? (
                    /* VISTA 1: TABLA COMPACTA DE ALTA DENSIDAD */
                    <div className="citizen-table-wrapper">
                      <table className="citizen-table">
                        <thead>
                          <tr>
                            <th style={{ width: '20%' }}>Radicado & Servicio</th>
                            <th style={{ width: '44%' }}>Descripción & Respuesta</th>
                            <th style={{ width: '14%' }}>Documentos</th>
                            <th style={{ width: '11%' }}>Estado</th>
                            <th style={{ width: '11%', textAlign: 'right' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPqrs.map((item) => {
                            const isResuelto = item.estado.toLowerCase() === 'resuelto';
                            const hasResponse = Boolean(item.respuestaOficial && item.respuestaOficial.trim());
                            const isExpanded = Boolean(expandedResponseIds[item.id]);

                            return (
                              <tr key={item.id} className="citizen-table-row">
                                {/* 1. Radicado & Servicio */}
                                <td>
                                  <div className="citizen-radicado-compact">
                                    <span className="citizen-id-mono">{item.id}</span>
                                    <span className={`citizen-cat-badge citizen-cat-badge--${item.categoria.toLowerCase()}`}>
                                      <span className="citizen-radicado-dot" />
                                      {item.categoria}
                                    </span>
                                    {item.direccion && (
                                      <span className="citizen-location-badge" title={`Ubicación del reporte: ${item.direccion}`}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4">
                                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                          <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span>{item.direccion}</span>
                                      </span>
                                    )}
                                    <span className="citizen-radicado-fecha" title={`Fecha de radicación: ${item.fechaRadicacion}`}>
                                      {item.fechaRadicacion} · Plazo: {item.plazoLegal}
                                    </span>
                                  </div>
                                </td>

                                {/* 2. Descripción & Respuesta */}
                                <td>
                                  <div className="citizen-desc-minimal">
                                    {isExpanded ? (
                                      <div className="citizen-expanded-flow">
                                        <div className="citizen-flow-block">
                                          <span className="citizen-flow-heading">Descripción de tu solicitud</span>
                                          <p className="citizen-flow-body">{item.descripcion || 'Sin descripción detallada.'}</p>
                                        </div>

                                        <div className={`citizen-flow-block ${hasResponse ? 'citizen-flow-block--done' : 'citizen-flow-block--pending'}`}>
                                          <span className="citizen-flow-heading">Respuesta institucional</span>
                                          <p className="citizen-flow-body">
                                            {hasResponse
                                              ? item.respuestaOficial
                                              : 'Pendiente de respuesta institucional. Su solicitud se encuentra dentro del plazo legal de 15 días hábiles.'}
                                          </p>
                                        </div>

                                        <button
                                          type="button"
                                          className="citizen-desc-text-toggle citizen-desc-text-toggle--close"
                                          onClick={() => toggleResponseExpand(item.id)}
                                        >
                                          <span>Ocultar</span>
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="18 15 12 9 6 15" />
                                          </svg>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="citizen-desc-compact-flow">
                                        <p className="citizen-desc-main-text" title={item.descripcion}>
                                          {item.descripcion || 'Sin descripción'}
                                        </p>

                                        {hasResponse ? (
                                          <div className="citizen-dictamen-direct-box" title={item.respuestaOficial}>
                                            <span className="citizen-dictamen-direct-label">Respuesta:</span>
                                            <p className="citizen-dictamen-direct-text">
                                              {item.respuestaOficial}
                                            </p>
                                          </div>
                                        ) : (
                                          <div className="citizen-dictamen-pending-line">
                                            <span className="citizen-subline-dictamen citizen-subline-dictamen--pending">
                                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 15 14" />
                                              </svg>
                                              <span>Pendiente de respuesta</span>
                                            </span>
                                          </div>
                                        )}

                                        <div className="citizen-desc-subline">
                                          <button
                                            type="button"
                                            className="citizen-desc-text-toggle"
                                            onClick={() => toggleResponseExpand(item.id)}
                                            title="Ver descripción y respuesta completa"
                                          >
                                            <span>Ver detalle</span>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                              <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* 3. Documentos */}
                                <td>
                                  {item.adjuntoUrl ? (
                                    <button
                                      type="button"
                                      className="citizen-pdf-action-btn"
                                      onClick={() => openPdfInNewTab(item.adjuntoUrl!)}
                                      title={`Ver documento soporte: ${item.adjuntoNombre || 'Documento adjunto'}`}
                                    >
                                      <div className="citizen-pdf-mini-icon">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                          <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                      </div>
                                      <span className="citizen-pdf-action-text">
                                        {item.adjuntoNombre ? (item.adjuntoNombre.length > 12 ? item.adjuntoNombre.slice(0, 12) + '...' : item.adjuntoNombre) : 'PDF ↗'}
                                      </span>
                                    </button>
                                  ) : (
                                    <span className="citizen-no-doc">Sin adjunto</span>
                                  )}
                                </td>

                                {/* 4. Estado */}
                                <td>
                                  <span className={`citizen-status-pill ${isResuelto ? 'status--resuelto' : 'status--tramite'}`}>
                                    <span className="status-dot"></span>
                                    {item.estado}
                                  </span>
                                </td>

                                {/* 5. Acciones */}
                                <td style={{ textAlign: 'right' }}>
                                  <div className="citizen-actions-wrap">
                                    <button
                                      type="button"
                                      className="citizen-btn-detail"
                                      onClick={() => setActiveModalItem(item)}
                                      title="Ver detalle completo"
                                    >
                                      Detalle &rarr;
                                    </button>
                                    <button
                                      type="button"
                                      className="citizen-btn-icon citizen-btn-icon--edit"
                                      onClick={() => setEditingPqrsItem(item)}
                                      title="Editar solicitud"
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      className="citizen-btn-icon citizen-btn-icon--delete"
                                      onClick={() => handleDeletePqrs(item)}
                                      title="Eliminar solicitud"
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* VISTA 2: CUADRÍCULA DE TARJETAS */
                    <section className="clean-pqrs-grid">
                      {filteredPqrs.map((item) => (
                        <TarjetaTramite
                          key={item.id}
                          pqrs={item}
                          onOpenDetail={(pqrsItem) => setActiveModalItem(pqrsItem)}
                          onEditPqrs={(pqrsItem) => setEditingPqrsItem(pqrsItem)}
                          onDeletePqrs={(pqrsItem) => handleDeletePqrs(pqrsItem)}
                        />
                      ))}
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </main>
      )}

      {/* VISTA 4: PANEL DE ADMINISTRACIÓN DEDICADO */}
      {pagina === 'admin' && (
        <AdminDashboard onClose={() => setPagina('inicio')} />
      )}

      {/* Modal de Detalle Completo */}
      {activeModalItem && (
        <div className="modal-backdrop" onClick={() => setActiveModalItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card__header">
              <div>
                <span className="modal-card__tag">{activeModalItem.categoria}</span>
                <h3 className="modal-card__title">Radicado {activeModalItem.id}</h3>
              </div>
              <button type="button" className="modal-card__close" onClick={() => setActiveModalItem(null)}>
                ✕
              </button>
            </div>

            <div className="modal-card__body">
              <div className="modal-info-row">
                <span className="modal-info-label">Solicitante:</span>
                <span className="modal-info-value">{activeModalItem.solicitante}</span>
              </div>
              {activeModalItem.direccion && (
                <div className="modal-info-row">
                  <span className="modal-info-label">Dirección / Ubicación:</span>
                  <span className="modal-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1d4ed8', fontWeight: '600' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {activeModalItem.direccion}
                  </span>
                </div>
              )}
              <div className="modal-info-row">
                <span className="modal-info-label">Estado actual:</span>
                <span className={`modal-status ${activeModalItem.estado.toLowerCase() === 'resuelto' ? 'modal-status--green' : 'modal-status--amber'}`}>
                  {activeModalItem.estado}
                </span>
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">Fecha de radicación:</span>
                <span className="modal-info-value">{activeModalItem.fechaRadicacion}</span>
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">Plazo legal de respuesta:</span>
                <span className="modal-info-value">{activeModalItem.plazoLegal}</span>
              </div>

              <div className="modal-block">
                <h4 className="modal-block__title">Descripción de la Solicitud</h4>
                <p className="modal-block__content">{activeModalItem.descripcion}</p>
              </div>

              {activeModalItem.adjuntoUrl && (
                <div
                  className="modal-block modal-block--adjunto"
                  style={{
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    marginTop: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b', fontWeight: '600' }}>Documento PDF Adjunto</h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#b91c1c' }}>
                        {activeModalItem.adjuntoNombre || 'Documento_Soporte.pdf'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openPdfInNewTab(activeModalItem.adjuntoUrl!)}
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Ver Documento PDF ↗
                  </button>
                </div>
              )}

              <div className="modal-block modal-block--response">
                <div className="modal-response-header">
                  <div className="modal-response-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activeModalItem.respuestaOficial && activeModalItem.respuestaOficial.trim() ? '#166534' : '#b45309'} strokeWidth="2.4">
                      {activeModalItem.respuestaOficial && activeModalItem.respuestaOficial.trim() ? (
                        <polyline points="20 6 9 17 4 12" />
                      ) : (
                        <>
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 15 14" />
                        </>
                      )}
                    </svg>
                    <h4 className="modal-block__title" style={{ margin: 0 }}>
                      Respuesta Oficial de la Entidad
                    </h4>
                  </div>
                  <span className={`modal-response-badge ${activeModalItem.respuestaOficial && activeModalItem.respuestaOficial.trim() ? 'modal-response-badge--answered' : 'modal-response-badge--pending'}`}>
                    {activeModalItem.respuestaOficial && activeModalItem.respuestaOficial.trim() ? 'Respuesta Emitida' : 'En Análisis'}
                  </span>
                </div>
                <p className={`modal-block__content ${activeModalItem.respuestaOficial && activeModalItem.respuestaOficial.trim() ? 'modal-block__content--official' : 'modal-block__content--pending-text'}`}>
                  {activeModalItem.respuestaOficial && activeModalItem.respuestaOficial.trim()
                    ? activeModalItem.respuestaOficial
                    : 'Esta solicitud aún no cuenta con una respuesta oficial emitida por la entidad. Se encuentra en trámite dentro del plazo legal de respuesta (15 días hábiles).'}
                </p>
              </div>
            </div>

            <div className="modal-card__footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    const target = activeModalItem;
                    setActiveModalItem(null);
                    setEditingPqrsItem(target);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Editar Solicitud</span>
                </button>
                <button
                  type="button"
                  style={{
                    background: '#fff1f2',
                    color: '#e11d48',
                    border: '1px solid #fecdd3',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    const target = activeModalItem;
                    handleDeletePqrs(target);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  <span>Eliminar Solicitud</span>
                </button>
              </div>
              <button type="button" className="modal-card__btn-close" onClick={() => setActiveModalItem(null)}>
                Cerrar consulta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="modern-footer">
        <p>&copy; {new Date().getFullYear()} Portal Institucional de Trámites y Servicios Públicos. Todos los derechos reservados.</p>
      </footer>

      {/* Modal de Autenticación Supabase */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Modal de Perfil de Usuario y Cambio de Contraseña */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        totalPqrs={pqrsList.length}
        enviadasCount={enviadasCount}
        respondidasCount={respondidasCount}
        onNavigateToPqrs={(tab) => {
          if (tab) setPqrsSectionTab(tab);
          setPagina('pqrs');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Modal para Radicar Nueva PQRS en Supabase */}
      <CreatePqrsModal
        isOpen={isCreatePqrsModalOpen}
        onClose={() => {
          setIsCreatePqrsModalOpen(false);
          setSelectedPqrInitialDesc('');
        }}
        onSuccess={() => fetchPqrs()}
        initialCategoria={selectedPqrCategory}
        initialDescripcion={selectedPqrInitialDesc}
      />

      {/* Modal para Editar PQRS Existente */}
      <EditPqrsModal
        isOpen={!!editingPqrsItem}
        pqrsItem={editingPqrsItem}
        onClose={() => setEditingPqrsItem(null)}
        onSuccess={() => fetchPqrs()}
      />

      {/* Modal de Confirmación de Eliminación Unificado */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalItem}
        onClose={() => setDeleteModalItem(null)}
        onConfirm={executeDeletePqrs}
        title="Eliminar radicado"
        itemName={deleteModalItem?.id}
        itemCategory={deleteModalItem?.categoria}
        itemSubtitle={deleteModalItem?.direccion ? `Ubicación: ${deleteModalItem.direccion}` : undefined}
        description={deleteModalItem?.descripcion}
        warningText="¿Estás seguro de que deseas eliminar esta solicitud? Esta acción es irreversible y eliminará permanentemente todos los registros y soportes adjuntos."
        confirmText="Eliminar radicado"
        cancelText="Cancelar"
        isDeleting={isDeletingPqrs}
      />
    </div>
  );
}

export default App;
