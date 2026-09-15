import { useState, type FC, type ReactNode } from 'react';
import { openPdfInNewTab } from '../utils/pdfHelper';
import '../styles/TarjetaTramite.css';

export interface PQRSData {
  id: string;
  solicitante: string;
  categoria: string;
  direccion?: string;
  descripcion: string;
  estado: string;
  fechaRadicacion: string;
  plazoLegal: string;
  respuestaOficial: string;
  adjuntoUrl?: string | null;
  adjuntoNombre?: string | null;
  ciudadanoId?: string | null;
}

export interface TarjetaTramiteProps {
  // PQRS Mode
  pqrs?: PQRSData;
  onOpenDetail?: (pqrs: PQRSData) => void;
  onEditPqrs?: (pqrs: PQRSData) => void;
  onDeletePqrs?: (pqrs: PQRSData) => void;

  // Standard Category Card Mode (Home Page)
  titulo?: string;
  descripcion?: string;
  categoria?: string;
  icono?: ReactNode;
  onConsultar?: () => void;
}

export const TarjetaTramite: FC<TarjetaTramiteProps> = ({
  pqrs,
  onOpenDetail,
  onEditPqrs,
  onDeletePqrs,
  titulo,
  descripcion,
  categoria,
  icono,
  onConsultar,
}) => {
  const [expanded, setExpanded] = useState(false);

  // If rendering Home Page Category Card
  if (!pqrs) {
    const catSlug = categoria
      ? categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
      : '';
    return (
      <article className={`tarjeta-tramite ${catSlug ? `tarjeta-tramite--${catSlug}` : ''}`}>
        <div className="tarjeta-tramite__header">
          <span className="tarjeta-tramite__categoria">{categoria}</span>
          {icono && <div className="tarjeta-tramite__icono">{icono}</div>}
        </div>
        <h3 className="tarjeta-tramite__titulo">{titulo}</h3>
        <p className="tarjeta-tramite__descripcion">{descripcion}</p>
        <div className="tarjeta-tramite__footer">
          <button type="button" className="tarjeta-tramite__btn" onClick={onConsultar}>
            Consultar Servicio &rarr;
          </button>
        </div>
      </article>
    );
  }

  // Ultra-Clean & Elegant PQRS Card
  const isResuelto = pqrs.estado.toLowerCase() === 'resuelto';

  return (
    <article className={`clean-card ${isResuelto ? 'clean-card--resuelto' : 'clean-card--tramite'}`}>
      {/* Top Header: ID & Status */}
      <div className="clean-card__header">
        <div className="clean-card__id-tag">
          <span className="clean-card__id">{pqrs.id}</span>
          <span className="clean-card__category">{pqrs.categoria}</span>
        </div>
        <span className={`clean-card__status ${isResuelto ? 'status--resuelto' : 'status--tramite'}`}>
          <span className="status-dot"></span>
          {pqrs.estado}
        </span>
      </div>

      {/* Solicitante & Dirección */}
      <div className="clean-card__solicitante">
        <span>Solicitante:</span> <strong>{pqrs.solicitante}</strong>
      </div>

      {pqrs.direccion && (
        <div className="clean-card__location" title={`Ubicación del reporte: ${pqrs.direccion}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{pqrs.direccion}</span>
        </div>
      )}

      {/* Description */}
      <p className="clean-card__desc">{pqrs.descripcion}</p>

      {/* Adjunto PDF Soporte */}
      {pqrs.adjuntoUrl && (
        <div className="clean-card__adjunto">
          <button
            type="button"
            className="clean-pdf-badge"
            onClick={() => openPdfInNewTab(pqrs.adjuntoUrl!)}
            title="Abrir documento PDF en pestaña aparte"
          >
            <div className="clean-pdf-icon-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <span className="clean-pdf-name">{pqrs.adjuntoNombre || 'Documento_Soporte.pdf'}</span>
            <span className="clean-pdf-action-tag">Abrir PDF ↗</span>
          </button>
        </div>
      )}

      {/* Dates & Legal Deadlines */}
      <div className="clean-card__meta">
        <div className="clean-meta-item">
          <span>Radicado el:</span>
          <strong>{pqrs.fechaRadicacion}</strong>
        </div>
        <div className="clean-meta-item">
          <span>Plazo legal:</span>
          <strong>{pqrs.plazoLegal}</strong>
        </div>
      </div>

      {/* Respuesta Oficial Institucional (Visible para el Ciudadano) */}
      {pqrs.respuestaOficial && pqrs.respuestaOficial.trim() ? (
        <div className="clean-card__response">
          <div className="response-title-row">
            <div className="response-title">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Respuesta Oficial de la Entidad</span>
            </div>
            {pqrs.respuestaOficial.length > 110 && (
              <button
                type="button"
                className="response-toggle-btn"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Ocultar' : 'Ver detalle'}
              </button>
            )}
          </div>
          <p className={`response-body ${!expanded && pqrs.respuestaOficial.length > 110 ? 'response-body--preview' : ''}`}>
            {pqrs.respuestaOficial}
          </p>
        </div>
      ) : (
        <div className="clean-card__response clean-card__response--pending">
          <div className="response-title-row">
            <div className="response-title response-title--pending">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 15 14" />
              </svg>
              <span>Respuesta en proceso</span>
            </div>
          </div>
          <p className="response-body response-body--pending">
            Su solicitud está en análisis técnico por la entidad competente. Se responderá dentro del plazo legal.
          </p>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="clean-card__footer">
        <div className="clean-card__primary-actions">
          {onOpenDetail && (
            <button
              type="button"
              className="clean-btn clean-btn--primary"
              onClick={() => onOpenDetail(pqrs)}
            >
              Detalles &rarr;
            </button>
          )}
        </div>

        {(onEditPqrs || onDeletePqrs) && (
          <div className="clean-card__user-actions">
            {onEditPqrs && (
              <button
                type="button"
                className="clean-action-btn clean-action-btn--edit"
                title="Editar esta PQR"
                onClick={() => onEditPqrs(pqrs)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Editar</span>
              </button>
            )}
            {onDeletePqrs && (
              <button
                type="button"
                className="clean-action-btn clean-action-btn--delete"
                title="Eliminar esta PQR"
                onClick={() => onDeletePqrs(pqrs)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                <span>Eliminar</span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default TarjetaTramite;
