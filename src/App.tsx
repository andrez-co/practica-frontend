import TarjetaTramite from './components/TarjetaTramite';
import './App.css';

function App() {
  const tramites = [
    {
      id: 1,
      titulo: 'Agua y Alcantarillado',
      descripcion: 'Atención inmediata para reporte de fugas, cortes de servicio y mantenimiento del sistema de alcantarillado.',
      categoria: 'fugas, cortes, alcantarillado',
      icono: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      ),
    },
    {
      id: 2,
      titulo: 'Recolección de Basura',
      descripcion: 'Información sobre horarios de recolección, reporte de acumulación de residuos y atención de puntos críticos.',
      categoria: 'Horarios, acumulación, puntos críticos',
      icono: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      descripcion: 'Reporte de lámparas apagadas, postes caídos y fallas generales en la red de iluminación pública.',
      categoria: 'lámparas apagadas, postes caídos',
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
    },
  ];

  return (
    <>
      {/* Encabezado Institucional */}
      <header className="inst-header">
        <div className="inst-header__container">
          <div className="inst-header__brand">
            <div className="inst-header__logo-badge">GOV</div>
            <div>
              <h1 className="inst-header__title">Portal Institucional de Trámites</h1>
              <span className="inst-header__subtitle">Atención Ciudadana y Servicios Públicos</span>
            </div>
          </div>
          <nav className="inst-header__nav">
            <a href="#inicio" className="inst-header__link">Inicio</a>
            <a href="#tramites" className="inst-header__link">Trámites</a>
            <a href="#contacto" className="inst-header__link">Contacto</a>
          </nav>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="main-container">
        <section className="section-header">
          <span className="section-header__badge">Consulta y Atención</span>
          <h2 className="section-header__title">Respuestas</h2>
          <p className="section-header__subtitle">
            Selecciona la categoría del servicio para consultar la información correspondiente a tus reportes y trámites.
          </p>
        </section>

        {/* Grid de Tarjetas */}
        <section className="tarjetas-grid">
          {tramites.map((tramite) => (
            <TarjetaTramite
              key={tramite.id}
              titulo={tramite.titulo}
              descripcion={tramite.descripcion}
              categoria={tramite.categoria}
              icono={tramite.icono}
            />
          ))}
        </section>
      </main>

      {/* Pie de Página */}
      <footer className="inst-footer">
        <p>&copy; {new Date().getFullYear()} Portal Institucional - Todos los derechos reservados.</p>
      </footer>
    </>
  );
}

export default App;
