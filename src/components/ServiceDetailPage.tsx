import React, { useState } from 'react';
import type { ServiceDetail } from './ServiceDetailModal';
import './ServiceDetailPage.css';

interface ServiceDetailPageProps {
  service: ServiceDetail;
  onVolver: () => void;
  onRadicarPqr: (catFiltro: string, descPrefill?: string) => void;
  onVerRadicados: (catFiltro: string) => void;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({
  service,
  onVolver,
  onRadicarPqr,
  onVerRadicados,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Metadatos detallados de cada trámite frecuente para guiar al usuario
  const getProcedureMeta = (tramiteTitle: string) => {
    const t = tramiteTitle.toLowerCase();

    // Agua
    if (t.includes('fuga') || t.includes('matriz')) {
      return {
        tag: 'Prioridad Alta',
        badgeClass: 'proc-badge--urgent',
        desc: 'Atención técnica inmediata para reparación de roturas o fugas visibles en red matriz para evitar desperdicio y desabastecimiento.',
        draft: `Reporte de emergencia: ${tramiteTitle}. Se solicita la visita técnica urgente de la cuadrilla operativa de la ${service.dependencia} en la dirección señalada.`,
      };
    }
    if (t.includes('desobstrucción') || t.includes('limpieza') || t.includes('alcantarillado')) {
      return {
        tag: 'Mantenimiento Red',
        badgeClass: 'proc-badge--maintenance',
        desc: 'Intervención con camión succionador y equipo hidrocinético para desobstruir cajas domiciliarias y pozos de inspección.',
        draft: `Solicitud de servicio: ${tramiteTitle}. Se requiere mantenimiento y limpieza en la red de alcantarillado ante la ${service.dependencia} en la dirección indicada.`,
      };
    }
    if (t.includes('facturación') || t.includes('consumo') || t.includes('variaciones')) {
      return {
        tag: 'Revisión Técnica',
        badgeClass: 'proc-badge--technical',
        desc: 'Inspección técnica y contrastación de medidor para validar si existen fugas imperceptibles o cobros anormales en la factura.',
        draft: `Petición de revisión: ${tramiteTitle}. Solicito visita domiciliaria de un técnico calificado para verificación del medidor y consumo ante la ${service.dependencia}.`,
      };
    }
    if (t.includes('tapas') || t.includes('fracturadas') || t.includes('ausentes')) {
      return {
        tag: 'Seguridad Vial',
        badgeClass: 'proc-badge--urgent',
        desc: 'Instalación y reposición de tapas de pozos o sumideros rotos en vías públicas para prevenir accidentes peatonales y vehiculares.',
        draft: `Reporte de seguridad pública: ${tramiteTitle}. Solicito reposición o fijación inmediata de la tapa de alcantarillado en la dirección indicada ante la ${service.dependencia}.`,
      };
    }

    // Basuras / Aseo
    if (t.includes('rutas') || t.includes('frecuencias') || t.includes('incumplimiento')) {
      return {
        tag: 'Operativo Rutas',
        badgeClass: 'proc-badge--maintenance',
        desc: 'Notificación por retraso o falta de paso del camión recolector en los días y horarios correspondientes a tu sector.',
        draft: `Reporte operativo: ${tramiteTitle}. Se notifica retraso en el paso de las rutas de recolección en la dirección indicada ante la ${service.dependencia}.`,
      };
    }
    if (t.includes('escombros') || t.includes('poda') || t.includes('voluminosos')) {
      return {
        tag: 'Servicio Especial',
        badgeClass: 'proc-badge--special',
        desc: 'Programación de recolección especial para retiro de materiales de construcción, poda y muebles en volqueta autorizada.',
        draft: `Solicitud de servicio especial: ${tramiteTitle}. Solicito agendamiento y cotización de recolección especial de residuos voluminosos en mi domicilio ante la ${service.dependencia}.`,
      };
    }
    if (t.includes('contenedores') || t.includes('carga lateral')) {
      return {
        tag: 'Infraestructura',
        badgeClass: 'proc-badge--technical',
        desc: 'Mantenimiento, lavado, desinfección o reubicación de contenedores públicos comunales de residuos.',
        draft: `Solicitud institucional: ${tramiteTitle}. Se requiere inspección y mantenimiento del contenedor comunal ubicado en la dirección indicada ante la ${service.dependencia}.`,
      };
    }
    if (t.includes('críticos') || t.includes('satélites') || t.includes('basureros')) {
      return {
        tag: 'Control Ambiental',
        badgeClass: 'proc-badge--urgent',
        desc: 'Operativos especiales de recolección y limpieza intensiva en esquinas y espacios tomados como botaderos clandestinos.',
        draft: `Reporte ambiental: ${tramiteTitle}. Se reporta acumulación indebida de residuos en espacio público para operativo de aseo y sanción ante la ${service.dependencia}.`,
      };
    }

    // Alumbrado
    if (t.includes('luminarias') || t.includes('apagadas') || t.includes('intermitentes')) {
      return {
        tag: 'Alumbrado Vial',
        badgeClass: 'proc-badge--maintenance',
        desc: 'Cambio de bombillos LED, balastos o fotoceldas averiadas en postes de iluminación pública barrial.',
        draft: `Reporte de luminaria apagada: ${tramiteTitle}. Solicito reparación o cambio de fotocelda/bombillo en la dirección y poste indicado ante la ${service.dependencia}.`,
      };
    }
    if (t.includes('postes') || t.includes('caída') || t.includes('cables')) {
      return {
        tag: 'Emergencia Eléctrica',
        badgeClass: 'proc-badge--urgent',
        desc: 'Atención prioritaria para postes inclinados, chocados o con líneas de energía expuestas que generen peligro.',
        draft: `Reporte urgente de peligro: ${tramiteTitle}. Se solicita intervención de emergencia inmediata con grúa en la dirección indicada ante la ${service.dependencia}.`,
      };
    }
    if (t.includes('expansión') || t.includes('cobertura') || t.includes('nuevos puntos')) {
      return {
        tag: 'Expansión de Red',
        badgeClass: 'proc-badge--special',
        desc: 'Solicitud ciudadana para instalación de nuevos postes o extensión de la red lumínica en vías oscuras o senderos.',
        draft: `Petición ciudadana: ${tramiteTitle}. Solicito visita técnica para estudio de viabilidad de nuevos puntos de luz en el sector ante la ${service.dependencia}.`,
      };
    }

    return {
      tag: 'Trámite Oficial',
      badgeClass: 'proc-badge--default',
      desc: 'Radicación institucional directa con asignación de radicado para seguimiento transparente en línea.',
      draft: `Solicitud formal: ${tramiteTitle} ante la ${service.dependencia}. Solicito atención y trámite oficial.`,
    };
  };

  // Título estilizado con resalte específico por categoría
  const renderStyledTitle = () => {
    if (service.catFiltro === 'Agua') {
      return (
        <>
          Agua Potable y <span className="hero-title-accent hero-title-accent--agua">Alcantarillado</span>
        </>
      );
    } else if (service.catFiltro === 'Basuras') {
      return (
        <>
          Gestión de Aseo y <span className="hero-title-accent hero-title-accent--basuras">Recolección de Residuos</span>
        </>
      );
    } else {
      return (
        <>
          Sistema y Red de <span className="hero-title-accent hero-title-accent--alumbrado">Alumbrado Público</span>
        </>
      );
    }
  };

  // Preguntas frecuentes enriquecidas por categoría
  const getFaqs = () => {
    if (service.catFiltro === 'Agua') {
      return [
        {
          q: '¿Qué debo hacer en caso de una fuga de agua o daño en la vía pública?',
          a: 'Debes reportarla de inmediato a través de la línea de emergencia 116 o radicando una PQR en este portal seleccionando la categoría "Agua". Las cuadrillas de inspección priorizan fugas en tuberías matrices en un tiempo estimado de 2 a 4 horas.',
        },
        {
          q: '¿Cómo solicitar una revisión técnica por alto consumo en la factura?',
          a: 'Puedes radicar una solicitud formal adjuntando el número de contrato o foto del medidor. Un técnico de la Empresa de Acueducto agendará una visita domiciliaria para verificar posibles fugas invisibles o descalibración del contador.',
        },
        {
          q: '¿Cuál es el procedimiento para desobstrucción de alcantarillado?',
          a: 'Las solicitudes de limpieza y desobstrucción de redes sanitarias o pluviales se atienden mediante camiones succionadores en orden de radicación con un plazo de atención de 24 a 48 horas hábiles.',
        },
      ];
    } else if (service.catFiltro === 'Basuras') {
      return [
        {
          q: '¿Cómo solicitar la recolección especial de escombros o enseres?',
          a: 'Queda prohibido arrojar escombros o muebles en la vía pública. Puedes solicitar la recogida especial comunicándote a la línea 110 o radicando una solicitud en este portal. Se agendará una volqueta para su traslado a un sitio autorizado.',
        },
        {
          q: '¿Cuáles son los horarios y frecuencias de recolección en mi sector?',
          a: 'Las rutas operan según la zonificación urbana en frecuencias de Lunes-Miércoles-Viernes o Martes-Jueves-Sábado. Te recomendamos sacar los residuos en bolsas bien selladas máximo 2 horas antes del paso del camión.',
        },
        {
          q: '¿Cómo reportar un punto crítico o basurero clandestino?',
          a: 'Reporta la ubicación exacta en la sección "Radicar PQR". La Unidad Administrativa de Aseo programará un operativo de limpieza y la instalación de avisos de sanción ambiental.',
        },
      ];
    } else {
      return [
        {
          q: '¿Cómo reportar luminarias apagadas o intermitentes en mi cuadra?',
          a: 'Ingresa a "Radicar PQR", selecciona la categoría "Alumbrado" e indica la dirección exacta y el número del poste (placa amarilla o metálica). El equipo nocturno realizará la sustitución de fotoceldas o bombillos LED.',
        },
        {
          q: '¿Cuál es el canal para emergencias por postes con riesgo de caída?',
          a: 'Los postes chocados, inclinados o con cables expuestos son emergencias de prioridad máxima. Llama de inmediato a la línea 115 o radica la solicitud especificando "Riesgo de Caída" para despacho inmediato de grúa.',
        },
        {
          q: '¿Se puede solicitar la expansión de alumbrado en un parque o sendero?',
          a: 'Sí. Las solicitudes de ampliación de cobertura luminaria son evaluadas por la Subdirección de Alumbrado Público mediante un estudio técnico de viabilidad en un plazo de 15 días hábiles.',
        },
      ];
    }
  };

  const faqs = getFaqs();

  // Requisitos estructurados con título e ícono
  const requisitosDetallados = [
    {
      titulo: 'Identificación del Solicitante',
      desc: 'Nombre completo, número de cédula y teléfono de contacto para notificación.',
      icon: '👤',
    },
    {
      titulo: 'Ubicación de la Incidencia',
      desc: 'Dirección exacta (calle, carrera, número), barrio y punto de referencia.',
      icon: '📍',
    },
    {
      titulo: 'Identificador del Servicio',
      desc: 'Número de cuenta o matrícula del contrato (aplica para reclamos de facturación).',
      icon: '🔢',
    },
    {
      titulo: 'Evidencia Soporte (Opcional)',
      desc: 'Fotografías o documentos que permitan agilizar el diagnóstico técnico.',
      icon: '📷',
    },
  ];

  return (
    <div className={`service-page service-page--${service.catFiltro.toLowerCase()}`}>
      {/* Barra de Navegación / Breadcrumb Superior */}
      <div className="service-page__top-nav">
        <button type="button" className="service-page__back-btn" onClick={onVolver}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Volver a Trámites y Servicios
        </button>

        <div className="service-page__breadcrumb-pills">
          <span className="breadcrumb-pill">Portal Institucional</span>
          <span className="breadcrumb-slash">/</span>
          <span className="breadcrumb-pill">Servicios Públicos</span>
          <span className="breadcrumb-slash">/</span>
          <span className="breadcrumb-pill breadcrumb-pill--active">{service.categoria}</span>
        </div>
      </div>

      {/* Hero Header Ejecutivo de la Página del Servicio */}
      <header className={`service-page__hero service-page__hero--${service.catFiltro.toLowerCase()}`}>
        <div className="service-page__hero-overlay"></div>

        <div className="service-page__hero-content">
          <div className="service-page__hero-header-row">
            <div className="service-page__hero-badge">
              <span className="badge-dot"></span>
              Servicio Público Oficial
            </div>
            <span className="service-page__dept-tag">{service.dependencia}</span>
          </div>

          <div className="service-page__hero-title-box">
            <div className="service-page__hero-icon">{service.icono}</div>
            <div>
              <h1 className="service-page__hero-title">{renderStyledTitle()}</h1>
              <p className="service-page__hero-desc">{service.descripcion}</p>
            </div>
          </div>

          {/* Banner de Métricas y Canales Rápidos */}
          <div className="service-page__metrics-bar">
            <div className="metric-pill">
              <div className="metric-pill__icon">📞</div>
              <div className="metric-pill__data">
                <span className="metric-pill__label">Línea Directa 24/7</span>
                <strong className="metric-pill__val">{service.lineaAtencion}</strong>
              </div>
            </div>

            <div className="metric-pill">
              <div className="metric-pill__icon">⏰</div>
              <div className="metric-pill__data">
                <span className="metric-pill__label">Horarios Operativos</span>
                <strong className="metric-pill__val">{service.horario}</strong>
              </div>
            </div>

            <div className="metric-pill">
              <div className="metric-pill__icon">✉️</div>
              <div className="metric-pill__data">
                <span className="metric-pill__label">Correo de Atención</span>
                <strong className="metric-pill__val">{service.emailContacto}</strong>
              </div>
            </div>

            <div className="metric-pill">
              <div className="metric-pill__icon">🌐</div>
              <div className="metric-pill__data">
                <span className="metric-pill__label">Zona de Cobertura</span>
                <strong className="metric-pill__val">{service.cobertura}</strong>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Grid Principal de 2 Columnas */}
      <div className="service-page__grid">
        {/* COLUMNA IZQUIERDA: INFORMACIÓN Y PROCEDIMIENTOS */}
        <main className="service-page__main-col">
          {/* Bloque 1: Trámites y Solicitudes Atendidas */}
          <section className="service-section-card">
            <div className="service-section-card__title-row">
              <div className="section-title-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <h2>Trámites y Solicitudes Frecuentes</h2>
                <p className="section-subtitle">
                  Procedimientos institucionales habilitados para radicación y seguimiento ciudadano:
                </p>
              </div>
            </div>

            <div className="service-procedures-list">
              {service.tramitesFrecuentes.map((tramite, idx) => {
                const meta = getProcedureMeta(tramite);
                return (
                  <div
                    key={idx}
                    className="procedure-card"
                    onClick={() => onRadicarPqr(service.catFiltro, meta.draft)}
                    title={`Hacer clic para radicar: ${tramite}`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="procedure-card__index">{idx + 1}</div>
                    <div className="procedure-card__body">
                      <div className="procedure-card__header">
                        <h4>{tramite}</h4>
                        <span className={`procedure-tag ${meta.badgeClass}`}>{meta.tag}</span>
                      </div>
                      <p className="procedure-card__desc">
                        {meta.desc}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="procedure-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRadicarPqr(service.catFiltro, meta.draft);
                      }}
                    >
                      Radicar este trámite &rarr;
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bloque 2: Requisitos y Documentación */}
          <section className="service-section-card">
            <div className="service-section-card__title-row">
              <div className="section-title-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div>
                <h2>Requisitos Generales de Radicación</h2>
                <p className="section-subtitle">
                  Información requerida para procesar de forma ágil tu petición o reporte:
                </p>
              </div>
            </div>

            <div className="req-cards-grid">
              {requisitosDetallados.map((req, idx) => (
                <div key={idx} className="req-item-card">
                  <span className="req-item-icon">{req.icon}</span>
                  <div>
                    <h4 className="req-item-title">{req.titulo}</h4>
                    <p className="req-item-desc">{req.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bloque 3: Preguntas Frecuentes */}
          <section className="service-section-card">
            <div className="service-section-card__title-row">
              <div className="section-title-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h2>Preguntas Frecuentes y Guía Ciudadana</h2>
                <p className="section-subtitle">
                  Respuestas oficiales a las dudas más comunes sobre la prestación del servicio:
                </p>
              </div>
            </div>

            <div className="faq-accordion">
              {faqs.map((faq, idx) => (
                <div key={idx} className={`faq-card ${openFaq === idx ? 'faq-card--open' : ''}`}>
                  <button type="button" className="faq-header" onClick={() => toggleFaq(idx)}>
                    <span className="faq-question-text">{faq.q}</span>
                    <span className="faq-toggle-icon">{openFaq === idx ? '−' : '+'}</span>
                  </button>
                  {openFaq === idx && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* COLUMNA DERECHA: SIDEBAR CENTRO DE ACCIÓN */}
        <aside className="service-page__sidebar">
          {/* Card Principal: Radicar PQR */}
          <div className="sidebar-action-card sidebar-action-card--radicar">
            <div className="sidebar-card-header">
              <div className="sidebar-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <div>
                <span className="sidebar-card-badge">Radicación Oficial</span>
                <h3 className="sidebar-card-title">Radicar Solicitud o PQR</h3>
              </div>
            </div>

            <p className="sidebar-card-desc">
              Registra tu petición, queja o reporte formal para <strong>{service.titulo}</strong> con código de radicado inmediato.
            </p>

            <button
              type="button"
              className="sidebar-btn sidebar-btn--primary"
              onClick={() => onRadicarPqr(service.catFiltro, `Solicitud general para el servicio de ${service.titulo} ante ${service.dependencia}.`)}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Radicar Solicitud</span>
            </button>
          </div>

          {/* Card Secundaria: Ver Radicados */}
          <div className="sidebar-action-card">
            <h3>Consultar Radicados de {service.catFiltro}</h3>
            <p>Filtra y revisa el avance de las solicitudes ya registradas ante esta dependencia.</p>

            <button
              type="button"
              className="sidebar-btn sidebar-btn--secondary"
              onClick={() => onVerRadicados(service.catFiltro)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Ver Radicados de {service.catFiltro}
            </button>
          </div>

          {/* Card de Marco Legal / Respaldo */}
          <div className="sidebar-action-card sidebar-action-card--guarantee">
            <div className="guarantee-header">
              <span>🛡️</span>
              <h4>Garantía Legal de Respuesta</h4>
            </div>
            <p>
              Toda petición o reporte radicado cuenta con el respaldo legal del derecho de petición (término legal de <strong>15 días hábiles</strong>).
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
