import { useState, useEffect, useMemo } from 'react';
import TarjetaTramite, { type PQRSData } from './components/TarjetaTramite';
import './App.css';

function App() {
  // Navigation state: 'inicio' vs 'pqrs'
  const [pagina, setPagina] = useState<'inicio' | 'pqrs'>('inicio');

  // PQRS API state
  const [pqrsList, setPqrsList] = useState<PQRSData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state for PQRS page
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [selectedEstado, setSelectedEstado] = useState<string>('Todos');

  // Selected PQRS item for modal
  const [activeModalItem, setActiveModalItem] = useState<PQRSData | null>(null);

  // 3 Classic Service Cards for Home Page
  const tramitesHome = [
    {
      id: 1,
      titulo: 'Agua y Alcantarillado',
      catFiltro: 'Agua',
      descripcion: 'Atención inmediata para reporte de fugas, cortes de servicio y mantenimiento del sistema de alcantarillado.',
      categoria: 'Agua Potable',
      icono: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      ),
    },
    {
      id: 2,
      titulo: 'Recolección de Basura',
      catFiltro: 'Basuras',
      descripcion: 'Información sobre horarios de recolección, reporte de acumulación de residuos y atención de puntos críticos.',
      categoria: 'Aseo Urbano',
      icono: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      ),
    },
    {
      id: 3,
      titulo: 'Alumbrado Público',
      catFiltro: 'Alumbrado',
      descripcion: 'Reporte de lámparas apagadas, postes caídos y fallas generales en la red de iluminación pública.',
      categoria: 'Energía y Luz',
      icono: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    },
  ];

  const fetchPqrs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pqrs');
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }
      const data: PQRSData[] = await response.json();
      setPqrsList(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de comunicación con el backend';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pagina === 'pqrs' && pqrsList.length === 0) {
      fetchPqrs();
    }
  }, [pagina, pqrsList.length]);

  const irAPqrsCategoria = (catFiltro: string) => {
    setSelectedCategoria(catFiltro);
    setPagina('pqrs');
  };

  // Compute Metrics
  const totalCount = pqrsList.length;
  const resueltosCount = useMemo(() => pqrsList.filter((i) => i.estado.toLowerCase() === 'resuelto').length, [pqrsList]);
  const tramiteCount = useMemo(() => pqrsList.filter((i) => i.estado.toLowerCase() === 'en trámite').length, [pqrsList]);

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

  // Filtered List
  const filteredPqrs = useMemo(() => {
    return pqrsList.filter((item) => {
      if (selectedCategoria !== 'Todas' && item.categoria.toLowerCase() !== selectedCategoria.toLowerCase()) {
        return false;
      }
      if (selectedEstado !== 'Todos' && item.estado.toLowerCase() !== selectedEstado.toLowerCase()) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        return (
          item.id.toLowerCase().includes(query) ||
          item.solicitante.toLowerCase().includes(query) ||
          item.descripcion.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [pqrsList, selectedCategoria, selectedEstado, searchTerm]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategoria('Todas');
    setSelectedEstado('Todos');
  };

  return (
    <div className="app-shell">
      {/* Modern Large Header */}
      <header className="modern-nav">
        <div className="modern-nav__container">
          <div className="modern-nav__brand" onClick={() => setPagina('inicio')}>
            <div className="modern-nav__logo">GOV</div>
            <div className="modern-nav__brand-info">
              <span className="modern-nav__title">Portal Institucional</span>
              <span className="modern-nav__subtitle">Atención Ciudadana y Control de Trámites</span>
            </div>
          </div>

          <nav className="modern-nav__menu">
            <button
              type="button"
              className={`nav-tab ${pagina === 'inicio' ? 'nav-tab--active' : ''}`}
              onClick={() => setPagina('inicio')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Consultar PQRS
            </button>
          </nav>
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
                onConsultar={() => irAPqrsCategoria(tramite.catFiltro)}
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
                Consola de Seguimiento en Tiempo Real
              </div>
              <h2 className="hero-card__title">
                Sistema General de <span className="hero-title-accent">Consultas PQRS</span>
              </h2>
              <p className="hero-card__desc">
                Inspección transparente de solicitudes. Revisa el estado de avance, plazos legales y respuestas expedidas por la entidad.
              </p>
            </div>
          </section>

          {/* Minimalist Summary Stats Bar */}
          <section className="clean-stats-bar">
            <div className="clean-stat-pill">
              <span>Total Radicados:</span> <strong>{loading ? '...' : totalCount}</strong>
            </div>
            <div className="clean-stat-pill clean-stat-pill--green">
              <span>Resueltos:</span> <strong>{loading ? '...' : resueltosCount}</strong>
            </div>
            <div className="clean-stat-pill clean-stat-pill--amber">
              <span>En Trámite:</span> <strong>{loading ? '...' : tramiteCount}</strong>
            </div>
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
              <div className="results-summary">
                <span>
                  Mostrando <strong>{filteredPqrs.length}</strong> de <strong>{pqrsList.length}</strong> radicados
                </span>
                {(searchTerm || selectedCategoria !== 'Todas' || selectedEstado !== 'Todos') && (
                  <button type="button" className="reset-btn" onClick={resetFilters}>
                    Restablecer filtros
                  </button>
                )}
              </div>

              {filteredPqrs.length === 0 ? (
                <div className="status-box">
                  <h3>No se encontraron radicados</h3>
                  <p>Intenta cambiar los términos de búsqueda o los filtros aplicados.</p>
                  <button type="button" className="status-box__btn" onClick={resetFilters}>
                    Ver todos los radicados
                  </button>
                </div>
              ) : (
                /* Spacious Grid aligned to top (align-items: start) */
                <section className="clean-pqrs-grid">
                  {filteredPqrs.map((item) => (
                    <TarjetaTramite
                      key={item.id}
                      pqrs={item}
                      onOpenDetail={(pqrsItem) => setActiveModalItem(pqrsItem)}
                    />
                  ))}
                </section>
              )}
            </>
          )}
        </main>
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

              <div className="modal-block">
                <h4 className="modal-block__title">Respuesta Oficial Institucional</h4>
                <p className="modal-block__content modal-block__content--official">{activeModalItem.respuestaOficial}</p>
              </div>
            </div>

            <div className="modal-card__footer">
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
    </div>
  );
}

export default App;
