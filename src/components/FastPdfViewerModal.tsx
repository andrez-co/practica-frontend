import React, { useState, useEffect, useMemo } from 'react';
import { getFastPdfUrl, downloadPdf, openPdfInNewTab } from '../utils/pdfHelper';
import './FastPdfViewerModal.css';

interface FastPdfViewerModalProps {
  isOpen: boolean;
  pdfUrl: string | null;
  pdfTitle?: string;
  pqrId?: string;
  onClose: () => void;
}

export const FastPdfViewerModal: React.FC<FastPdfViewerModalProps> = ({
  isOpen,
  pdfUrl,
  pdfTitle,
  pqrId,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Compute the fast cached blob URL
  const fastUrl = useMemo(() => {
    if (!pdfUrl) return '';
    return getFastPdfUrl(pdfUrl);
  }, [pdfUrl]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !pdfUrl) return null;

  const displayName = pdfTitle || (pqrId ? `Soporte_${pqrId}.pdf` : 'Documento_Soporte.pdf');

  return (
    <div className="pdf-modal-backdrop" onClick={onClose}>
      <div
        className={`pdf-modal-container ${isFullscreen ? 'pdf-modal-container--fullscreen' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Executive Header */}
        <div className="pdf-modal-header">
          <div className="pdf-modal-header-info">
            <div className="pdf-modal-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="pdf-modal-titles">
              <div className="pdf-modal-badge-row">
                <span className="pdf-modal-doc-type">Visor Rápido PDF</span>
                {pqrId && <span className="pdf-modal-pqr-tag">{pqrId}</span>}
              </div>
              <h3 className="pdf-modal-filename" title={displayName}>
                {displayName}
              </h3>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pdf-modal-actions">
            {/* Download Button */}
            <button
              type="button"
              className="pdf-action-btn"
              title="Descargar archivo PDF"
              onClick={() => downloadPdf(fastUrl, displayName)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Descargar</span>
            </button>

            {/* Open in new tab button */}
            <button
              type="button"
              className="pdf-action-btn"
              title="Abrir en pestaña nueva del navegador"
              onClick={() => openPdfInNewTab(fastUrl)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Pestaña nueva</span>
            </button>

            {/* Toggle Fullscreen */}
            <button
              type="button"
              className="pdf-action-btn pdf-action-btn--icon-only"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="pdf-modal-close-btn"
              title="Cerrar visor (Esc)"
              onClick={onClose}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="pdf-modal-body">
          {isLoading && (
            <div className="pdf-modal-loader">
              <div className="pdf-spinner"></div>
              <p>Cargando documento en alta resolución...</p>
            </div>
          )}

          <iframe
            src={`${fastUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            title={displayName}
            className="pdf-iframe"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default FastPdfViewerModal;
