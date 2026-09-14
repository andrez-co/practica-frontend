import React, { useEffect } from 'react';
import './ConfirmDeleteModal.css';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  itemCategory?: string;
  itemSubtitle?: string;
  description?: string;
  warningText?: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Eliminar solicitud',
  itemName,
  itemCategory,
  itemSubtitle,
  description,
  warningText = 'Esta acción no se puede deshacer. Se eliminarán permanentemente los registros y documentos asociados de la base de datos.',
  confirmText = 'Eliminar definitivamente',
  cancelText = 'Cancelar',
  isDeleting = false,
}) => {
  // Manejo de teclado (Escape para cancelar)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cd-overlay" onClick={isDeleting ? undefined : onClose} role="dialog" aria-modal="true">
      <div className="cd-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cd-header">
          <div className="cd-title-group">
            <div className="cd-danger-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="cd-title">{title}</h3>
          </div>
          
          <button
            type="button"
            className="cd-close-btn"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="cd-body">
          <p className="cd-message">
            {warningText}
          </p>

          {/* Minimal Item Preview Card */}
          {(itemName || itemCategory || itemSubtitle || description) && (
            <div className="cd-item-card">
              <div className="cd-item-header">
                {itemName && <span className="cd-item-mono">{itemName}</span>}
                {itemCategory && (
                  <span className={`cd-item-cat cd-item-cat--${itemCategory.toLowerCase()}`}>
                    {itemCategory}
                  </span>
                )}
              </div>
              {itemSubtitle && <span className="cd-item-sub">{itemSubtitle}</span>}
              {description && <p className="cd-item-desc" title={description}>{description}</p>}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="cd-footer">
          <button
            type="button"
            className="cd-btn cd-btn--cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            className="cd-btn cd-btn--danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="cd-spinner" />
                <span>Eliminando...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
