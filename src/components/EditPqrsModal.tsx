import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import type { PQRSData } from './TarjetaTramite';
import './CreatePqrsModal.css';

interface EditPqrsModalProps {
  isOpen: boolean;
  pqrsItem: PQRSData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditPqrsModal: React.FC<EditPqrsModalProps> = ({
  isOpen,
  pqrsItem,
  onClose,
  onSuccess,
}) => {
  const { user, userName } = useAuth();

  const [solicitante, setSolicitante] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('Agua');
  const [descripcion, setDescripcion] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && pqrsItem) {
      setSolicitante(pqrsItem.solicitante || userName || '');
      setDireccion(pqrsItem.direccion || '');
      setCategoria(pqrsItem.categoria || 'Agua');
      setDescripcion(pqrsItem.descripcion || '');
      setSelectedFile(null);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, pqrsItem, userName]);

  if (!isOpen || !pqrsItem) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMsg('El archivo adjunto debe ser en formato PDF (.pdf).');
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('El archivo PDF no puede superar los 10MB.');
        setSelectedFile(null);
        return;
      }
      setErrorMsg(null);
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!descripcion.trim()) {
      setErrorMsg('Por favor incluye la descripción de la PQR.');
      return;
    }

    setLoading(true);

    try {
      let pdfUrl: string | null = pqrsItem.adjuntoUrl || null;
      let pdfName: string | null = pqrsItem.adjuntoNombre || null;

      if (selectedFile) {
        pdfName = selectedFile.name;
        try {
          const fileExt = selectedFile.name.split('.').pop();
          const filePath = `${user?.id || 'anon'}/${pqrsItem.id}_${Date.now()}.${fileExt}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('documentos')
            .upload(filePath, selectedFile);

          if (!uploadErr && uploadData) {
            const { data: publicUrlData } = supabase.storage.from('documentos').getPublicUrl(filePath);
            pdfUrl = publicUrlData.publicUrl;
          } else {
            pdfUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(selectedFile);
            });
          }
        } catch (e) {
          console.warn('Fallback DataURL al editar PDF:', e);
          pdfUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(selectedFile);
          });
        }
      }

      // 1. Actualizar la tabla 'pqrs' en Supabase
      let finalDescripcion = descripcion;
      const updateData: any = {
        solicitante: solicitante || userName || 'Ciudadano',
        categoria,
        descripcion: finalDescripcion,
        direccion: direccion.trim(),
      };

      if (pdfUrl) updateData.adjunto_url = pdfUrl;
      if (pdfName) updateData.adjunto_nombre = pdfName;

      let { error } = await supabase
        .from('pqrs')
        .update(updateData)
        .eq('id', pqrsItem.id);

      // Si la columna 'direccion' aún no ha sido agregada en la BD por SQL, fallback
      if (error && error.message && error.message.includes('direccion')) {
        console.warn('⚠️ Columna "direccion" no encontrada. Guardando dirección en la descripción como fallback...');
        delete updateData.direccion;
        finalDescripcion = `[Dirección: ${direccion.trim()}]\n\n${descripcion}`;
        updateData.descripcion = finalDescripcion;
        const fallbackRes = await supabase.from('pqrs').update(updateData).eq('id', pqrsItem.id);
        error = fallbackRes.error;
      }

      if (error) {
        console.error('❌ Error de Supabase al actualizar PQR:', error);
        throw new Error(`Error Supabase: ${error.message}`);
      }

      // 2. Si se subió un nuevo PDF, actualizar también en 'documentos_formativos'
      if (selectedFile && pdfUrl) {
        try {
          const docTitulo = `${pqrsItem.id} - ${pdfName || selectedFile.name}`;
          await supabase.from('documentos_formativos').insert([
            {
              titulo: docTitulo,
              url: pdfUrl,
            },
          ]);
        } catch (docEx) {
          console.warn('⚠️ Excepción al actualizar documento formativo:', docEx);
        }
      }

      setSuccessMsg(`¡Radicado ${pqrsItem.id} actualizado con éxito!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('❌ Error al editar PQR:', err);
      setErrorMsg(err.message || 'No se pudo actualizar la PQR en Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-pqrs-backdrop" onClick={onClose}>
      <div className="create-pqrs-card" onClick={(e) => e.stopPropagation()}>
        <div className="create-pqrs-card__header">
          <div>
            <h3 className="create-pqrs-card__title">Editar Radicado {pqrsItem.id}</h3>
            <p className="create-pqrs-card__subtitle">Actualiza la información de tu solicitud en Supabase</p>
          </div>
          <button type="button" className="create-pqrs-card__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="create-pqrs-card__body" onSubmit={handleSubmit}>
          {errorMsg && <div className="create-pqrs-alert create-pqrs-alert--error">{errorMsg}</div>}
          {successMsg && <div className="create-pqrs-alert create-pqrs-alert--success">{successMsg}</div>}

          <div className="create-pqrs-field">
            <label htmlFor="editSolicitante">Nombre del Solicitante</label>
            <input
              id="editSolicitante"
              type="text"
              className="create-pqrs-input"
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
              required
            />
          </div>

          <div className="create-pqrs-field">
            <label htmlFor="editDireccion">Dirección Específica del Incidente / Causa *</label>
            <input
              id="editDireccion"
              type="text"
              className="create-pqrs-input"
              placeholder="Ej. Calle 45 # 12-34, Barrio El Poblado / Manzana 3 Casa 12"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              required
            />
          </div>

          <div className="create-pqrs-field">
            <label htmlFor="editCategoria">Categoría del Servicio</label>
            <select
              id="editCategoria"
              className="create-pqrs-select"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="Agua">Agua Potable</option>
              <option value="Basuras">Aseo y Basuras</option>
              <option value="Alumbrado">Alumbrado Público</option>
            </select>
          </div>

          <div className="create-pqrs-field">
            <label htmlFor="editDescripcion">Descripción Detallada</label>
            <textarea
              id="editDescripcion"
              className="create-pqrs-textarea"
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
          </div>

          {/* Adjuntar o Reemplazar Documento PDF */}
          <div className="create-pqrs-field">
            <label htmlFor="editPdfFileInput">
              Documento Soporte PDF {pqrsItem.adjuntoNombre ? '(Actual: ' + pqrsItem.adjuntoNombre + ')' : '(Opcional)'}
            </label>
            <div className="create-pqrs-file-wrapper">
              <input
                id="editPdfFileInput"
                type="file"
                accept=".pdf,application/pdf"
                className="create-pqrs-file-input"
                onChange={handleFileChange}
              />
              {selectedFile && (
                <div className="create-pqrs-file-selected">
                  <span>📄 Nuevo PDF: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  <button type="button" className="create-pqrs-file-remove" onClick={() => setSelectedFile(null)}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="create-pqrs-actions">
            <button type="button" className="create-pqrs-btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="create-pqrs-btn-submit" disabled={loading}>
              {loading ? 'Guardando cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPqrsModal;
