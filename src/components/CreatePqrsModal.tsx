import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import '../styles/CreatePqrsModal.css';

interface CreatePqrsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCategoria?: string;
  initialDescripcion?: string;
}

export const CreatePqrsModal: React.FC<CreatePqrsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCategoria,
  initialDescripcion,
}) => {
  const { user, userName } = useAuth();

  const [solicitante, setSolicitante] = useState<string>(userName || '');
  const [categoria, setCategoria] = useState<string>(initialCategoria || 'Agua');
  const [direccion, setDireccion] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pre-llenar el nombre del solicitante, categoría y descripción preseleccionada al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setSolicitante(userName || '');
      if (initialCategoria) {
        setCategoria(initialCategoria);
      }
      setDescripcion(initialDescripcion || '');
      setDireccion('');
      setSelectedFile(null);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, userName, initialCategoria, initialDescripcion]);

  if (!isOpen) return null;

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

    if (!direccion.trim()) {
      setErrorMsg('Por favor ingresa la dirección específica donde ocurre la falla o causa.');
      return;
    }

    if (!descripcion.trim()) {
      setErrorMsg('Por favor describe la solicitud PQR.');
      return;
    }

    setLoading(true);

    try {
      // Generar ID único de radicado
      const randomNum = Math.floor(100 + Math.random() * 900);
      const newId = `PQR-2026-${randomNum}`;

      let pdfUrl: string | null = null;
      let pdfName: string | null = null;

      if (selectedFile) {
        pdfName = selectedFile.name;
        try {
          const fileExt = selectedFile.name.split('.').pop();
          const filePath = `${user?.id || 'anon'}/${newId}_${Date.now()}.${fileExt}`;
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
          console.warn('Fallback a DataURL para el archivo PDF:', e);
          pdfUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(selectedFile);
          });
        }
      }

      // 1. Crear el objeto de registro con ID obligatorio (PQR-2026-XXX), campos de adjuntos y dirección
      const newRecord: any = {
        id: newId,
        ciudadano_id: user?.id || null,
        solicitante: solicitante || userName || 'Ciudadano',
        categoria,
        direccion: direccion.trim(),
        descripcion,
        estado: 'En trámite',
        fecha_radicacion: new Date().toISOString().split('T')[0],
        adjunto_url: pdfUrl,
        adjunto_nombre: pdfName,
      };

      // Insertar en la tabla 'pqrs' de Supabase
      let { error } = await supabase.from('pqrs').insert([newRecord]);

      // Fallback si la columna 'direccion' aún no ha sido creada en la base de datos de Supabase
      if (error && error.message && error.message.toLowerCase().includes('direccion')) {
        console.warn('Columna direccion aún no presente en Supabase. Guardando con prefijo en descripción...');
        delete newRecord.direccion;
        newRecord.descripcion = `[Dirección: ${direccion.trim()}]\n\n${descripcion}`;
        const fallbackRes = await supabase.from('pqrs').insert([newRecord]);
        error = fallbackRes.error;
      }

      if (error) {
        console.error('❌ Error de Supabase al insertar PQR:', error);
        throw new Error(`Error Supabase: ${error.message}`);
      }

      // 2. Si hay un archivo PDF seleccionado, registrarlo también en la tabla 'documentos_formativos'
      if (selectedFile && pdfUrl) {
        try {
          const docTitulo = `${newId} - ${pdfName || selectedFile.name}`;
          await supabase.from('documentos_formativos').insert([
            {
              titulo: docTitulo,
              url: pdfUrl,
            },
          ]);
        } catch (docEx) {
          console.warn('⚠️ Excepción al registrar documento formativo:', docEx);
        }
      }

      // 3. Insertar movimiento inicial en 'seguimiento_pqrs'
      try {
        await supabase.from('seguimiento_pqrs').insert([
          {
            pqr_id: newId,
            estado: 'En trámite',
            observacion: 'Radicación inicial registrada por el ciudadano.',
          },
        ]);
      } catch (segErr) {
        console.warn('Advertencia registrando seguimiento:', segErr);
      }

      setSuccessMsg(`¡PQR Radicada Exitosamente! Número de Radicado: ${newId}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('❌ Error en handleSubmit CreatePqrsModal:', err);
      setErrorMsg(err.message || 'Error de conexión con Supabase. Revisa las políticas RLS.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-pqrs-backdrop" onClick={onClose}>
      <div className="create-pqrs-card" onClick={(e) => e.stopPropagation()}>
        <div className="create-pqrs-card__header">
          <div>
            <h3 className="create-pqrs-card__title">Radicar Nueva PQRS</h3>
            <p className="create-pqrs-card__subtitle">Guarda directamente tu solicitud en Supabase</p>
          </div>
          <button type="button" className="create-pqrs-card__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="create-pqrs-card__body" onSubmit={handleSubmit}>
          {errorMsg && <div className="create-pqrs-alert create-pqrs-alert--error">{errorMsg}</div>}
          {successMsg && <div className="create-pqrs-alert create-pqrs-alert--success">{successMsg}</div>}

          <div className="create-pqrs-field">
            <label htmlFor="solicitanteName">Nombre del Solicitante</label>
            <input
              id="solicitanteName"
              type="text"
              className="create-pqrs-input"
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
              placeholder="Nombre completo"
              required
            />
          </div>

          <div className="create-pqrs-field">
            <label htmlFor="categoriaSelect">Categoría del Servicio</label>
            <select
              id="categoriaSelect"
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
            <label htmlFor="direccionInput" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Dirección Específica del Incidente / Inmueble</span>
            </label>
            <input
              id="direccionInput"
              type="text"
              className="create-pqrs-input"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej: Carrera 15 # 45-23, Barrio La Floresta"
              required
            />
          </div>

          <div className="create-pqrs-field">
            <label htmlFor="descripcionText">Descripción Detallada de los Hechos</label>
            <textarea
              id="descripcionText"
              className="create-pqrs-textarea"
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Escribe aquí los detalles del problema o trámite..."
              required
            />
          </div>

          {/* Adjuntar Documento Soporte PDF */}
          <div className="create-pqrs-field">
            <label htmlFor="pdfFileInput">Documento Soporte Adjunto (Opcional - Formato PDF)</label>
            <div className="create-pqrs-file-wrapper">
              <input
                id="pdfFileInput"
                type="file"
                accept=".pdf,application/pdf"
                className="create-pqrs-file-input"
                onChange={handleFileChange}
              />
              {selectedFile && (
                <div className="create-pqrs-file-selected">
                  <span>📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
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
              {loading ? 'Guardando en Supabase...' : 'Enviar y Radicar PQR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
