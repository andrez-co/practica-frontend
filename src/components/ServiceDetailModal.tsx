import React from 'react';
import './ServiceDetailModal.css';

export interface ServiceDetail {
  id: number;
  titulo: string;
  catFiltro: string;
  categoria: string;
  descripcion: string;
  icono: React.ReactNode;
  lineaAtencion: string;
  horario: string;
  emailContacto: string;
  dependencia: string;
  tramitesFrecuentes: string[];
  cobertura: string;
}

interface ServiceDetailModalProps {
  service: ServiceDetail | null;
  onClose: () => void;
  onRadicarPqr: (catFiltro: string) => void;
  onVerRadicados: (catFiltro: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onRadicarPqr,
  onVerRadicados,
}) => {
  if (!service) return null;

  return (
    <div className="service-modal-backdrop" onClick={onClose}>
      <div className="service-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="service-modal-header">
          <div className="service-modal-header__info">
            <span className="service-modal-badge">{service.categoria}</span>
            <h3 className="service-modal-title">{service.titulo}</h3>
          </div>
          <button type="button" className="service-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="service-modal-body">
          {/* Main Overview Box */}
          <div className="service-overview-box">
            <div className="service-overview-icon">{service.icono}</div>
            <div className="service-overview-text">
              <p className="service-overview-desc">{service.descripcion}</p>
              <div className="service-dept-tag">
                <span>Entidad Responsable:</span> <strong>{service.dependencia}</strong>
              </div>
            </div>
          </div>

          {/* Emergency & Attention Info Grid */}
          <div className="service-info-grid">
            <div className="service-info-card">
              <div className="service-info-card__icon">📞</div>
              <div className="service-info-card__content">
                <span className="service-info-label">Línea de Atención 24/7</span>
                <strong className="service-info-value">{service.lineaAtencion}</strong>
              </div>
            </div>

            <div className="service-info-card">
              <div className="service-info-card__icon">✉️</div>
              <div className="service-info-card__content">
                <span className="service-info-label">Correo Oficial</span>
                <strong className="service-info-value">{service.emailContacto}</strong>
              </div>
            </div>

            <div className="service-info-card">
              <div className="service-info-card__icon">⏰</div>
              <div className="service-info-card__content">
                <span className="service-info-label">Horarios de Operación</span>
                <strong className="service-info-value">{service.horario}</strong>
              </div>
            </div>

            <div className="service-info-card">
              <div className="service-info-card__icon">📍</div>
              <div className="service-info-card__content">
                <span className="service-info-label">Zona de Cobertura</span>
                <strong className="service-info-value">{service.cobertura}</strong>
              </div>
            </div>
          </div>

          {/* Frequent Services & Procedures List */}
          <div className="service-procedures-block">
            <h4 className="service-procedures-title">Trámites y Solicitudes Atendidas</h4>
            <ul className="service-procedures-list">
              {service.tramitesFrecuentes.map((tramite, idx) => (
                <li key={idx} className="service-procedure-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{tramite}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="service-modal-footer">
          <button
            type="button"
            className="service-btn service-btn--secondary"
            onClick={() => {
              onVerRadicados(service.catFiltro);
              onClose();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Ver PQRS de este Servicio
          </button>

          <button
            type="button"
            className="service-btn service-btn--primary"
            onClick={() => {
              onRadicarPqr(service.catFiltro);
              onClose();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Radicar PQR para este Servicio
          </button>
        </div>
      </div>
    </div>
  );
};
