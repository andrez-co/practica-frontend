import { useState, type FC, type ReactNode } from 'react';
import './TarjetaTramite.css';

export interface PQRSData {
  id: string;
  solicitante: string;
  categoria: string;
  descripcion: string;
  estado: string;
  fechaRadicacion: string;
  plazoLegal: string;
  respuestaOficial: string;
}

export interface TarjetaTramiteProps {
  // PQRS Mode
  pqrs?: PQRSData;
  onOpenDetail?: (pqrs: PQRSData) => void;

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
  titulo,
  descripcion,
  categoria,
  icono,
  onConsultar,
}) => {
  const [expanded, setExpanded] = useState(false);

  // If rendering Home Page Category Card
  if (!pqrs) {
    return (
      <article className="tarjeta-tramite">
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

      {/* Solicitante */}
      <div className="clean-card__solicitante">
        <span>Solicitante:</span> <strong>{pqrs.solicitante}</strong>
      </div>

      {/* Description */}
      <p className="clean-card__desc">{pqrs.descripcion}</p>

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

      {/* Expandable Official Response */}
      {expanded && (
        <div className="clean-card__response">
          <div className="response-title">Respuesta Oficial Institucional</div>
          <p className="response-body">{pqrs.respuestaOficial}</p>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="clean-card__footer">
        <button
          type="button"
          className="clean-btn clean-btn--outline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Ocultar respuesta' : 'Ver respuesta oficial'}
        </button>

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
    </article>
  );
};

export default TarjetaTramite;
