import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AdminAiChat from './AdminAiChat';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { openPdfInNewTab } from '../utils/pdfHelper';
import './AdminDashboard.css';

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string | null;
}

interface AdminPqrsItem {
  id: string;
  ciudadano_id: string;
  solicitante: string;
  direccion?: string;
  categoria: string;
  descripcion: string;
  estado: string;
  fecha_radicacion: string;
  plazo_legal?: string;
  respuesta_oficial: string;
  adjunto_url?: string | null;
  adjunto_nombre?: string | null;
}

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { userEmail, userAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'pqrs' | 'ai'>('pqrs');
  
  // Users State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // PQRS State
  const [pqrsList, setPqrsList] = useState<AdminPqrsItem[]>([]);
  const [pqrsSearch, setPqrsSearch] = useState('');
  const [pqrsStatusFilter, setPqrsStatusFilter] = useState<'Todos' | 'En trámite' | 'Resuelto'>('Todos');
  const [pqrsCategoryFilter, setPqrsCategoryFilter] = useState('Todas');
  const [expandedPqrIds, setExpandedPqrIds] = useState<Record<string, boolean>>({});

  // Unified Confirm Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'pqr' | 'user';
    id: string;
    name?: string;
    category?: string;
    subtitle?: string;
    description?: string;
  } | null>(null);
  const [isDeletingTarget, setIsDeletingTarget] = useState<boolean>(false);

  const togglePqrExpand = (id: string) => {
    setExpandedPqrIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Notification State
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // History Modal State
  const [historyUser, setHistoryUser] = useState<UserItem | null>(null);

  // Detail & Management Modal State
  const [selectedPqrForDetail, setSelectedPqrForDetail] = useState<AdminPqrsItem | null>(null);
  const [modalEditEstado, setModalEditEstado] = useState<string>('En trámite');
  const [modalEditRespuesta, setModalEditRespuesta] = useState<string>('');

  // AI Loading State for PQRS
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [isRegeneratingAi, setIsRegeneratingAi] = useState(false);

  // Bulk Audit with AI State
  const [isAuditingAll, setIsAuditingAll] = useState(false);
  const [auditProgress, setAuditProgress] = useState<{ current: number; total: number } | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditCurrentItem, setAuditCurrentItem] = useState<string>('');
  const [auditSummaryResult, setAuditSummaryResult] = useState<{
    total: number;
    resueltos: number;
    enTramite: number;
  } | null>(null);

  // AI Suggestion Pending Confirmation
  const [aiPending, setAiPending] = useState<{
    pqrId: string;
    nuevoEstado: string;
    nuevaRespuesta: string;
  } | null>(null);

  const isAdmin = userEmail?.toLowerCase() === 'machoandres12@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      fetchRealUsers();
      fetchAllPqrs();
      if (userAvatar && userEmail) {
        supabase
          .from('ciudadanos')
          .update({ avatar_url: userAvatar })
          .eq('email', userEmail)
          .then(() => {});
      }
    }
  }, [isAdmin, userAvatar, userEmail]);

  const fetchRealUsers = async () => {
    const { data, error } = await supabase.from('ciudadanos').select('*');
    if (error) {
      console.error('Error al cargar usuarios:', error);
      return;
    }
    if (data) {
      const mapped: UserItem[] = data.map((d: any) => ({
        id: d.id,
        email: d.email || 'sin-correo@example.com',
        name: d.nombre || 'Usuario Desconocido',
        role: d.rol || 'ciudadano promedio',
        avatar_url: d.avatar_url || null,
      }));
      mapped.sort((a, b) => a.email === 'machoandres12@gmail.com' ? -1 : b.email === 'machoandres12@gmail.com' ? 1 : 0);
      setUsers(mapped);
    }
  };

  const fetchAllPqrs = async () => {
    const { data, error } = await supabase.from('pqrs').select('*').order('id', { ascending: false });
    if (error) {
      console.error('Error al cargar PQRS:', error);
      return;
    }

    let docsMap: Record<string, { url: string; nombre: string }> = {};
    try {
      let { data: docsData } = await supabase.from('documentos_formativos').select('*');
      if (!docsData || docsData.length === 0) {
        const { data: normData } = await supabase.from('documentos_normativos').select('*');
        docsData = normData;
      }
      if (docsData) {
        docsData.forEach((doc: any) => {
          if (doc.titulo && doc.url) {
            const match = doc.titulo.match(/(PQR-\d{4}-\d+)/i);
            if (match) {
              const pqrId = match[1];
              docsMap[pqrId] = {
                url: doc.url,
                nombre: doc.titulo.replace(`${pqrId} - `, '').replace(`${pqrId}: `, ''),
              };
            }
          }
        });
      }
    } catch (docErr) {
      console.warn('Nota al consultar documentos adjuntos:', docErr);
    }

    if (data) {
      const extractDireccion = (rawDesc: string) => {
        if (!rawDesc) return '';
        const match = rawDesc.match(/\[Dirección:\s*([^\]]+)\]/i);
        return match ? match[1].trim() : '';
      };

      const mapped: AdminPqrsItem[] = data.map((d: any) => {
        const docInfo = docsMap[d.id];
        const rawDesc = d.descripcion || '';
        let itemDireccion = d.direccion ? d.direccion.trim() : '';
        if (!itemDireccion) {
          itemDireccion = extractDireccion(rawDesc);
        }
        let cleanDesc = rawDesc.replace(/\[Dirección:\s*[^\]]+\]\s*/gi, '').trim();
        if (!cleanDesc) cleanDesc = rawDesc;

        return {
          id: d.id,
          ciudadano_id: d.ciudadano_id || '',
          solicitante: d.solicitante || 'Ciudadano',
          direccion: itemDireccion,
          categoria: d.categoria || 'Agua',
          descripcion: cleanDesc,
          estado: d.estado || 'En trámite',
          fecha_radicacion: d.fecha_radicacion || new Date().toISOString().split('T')[0],
          plazo_legal: '15 días hábiles',
          respuesta_oficial: d.respuesta_oficial || '',
          adjunto_url: d.adjunto_url || docInfo?.url || null,
          adjunto_nombre: d.adjunto_nombre || docInfo?.nombre || null,
        };
      });
      setPqrsList(mapped);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    const { error } = await supabase.from('ciudadanos').update({ rol: newRole }).eq('id', userId);
    
    if (error) {
      showAlert(`Error al actualizar rol: ${error.message}`);
    } else {
      showAlert(`Rol actualizado a "${newRole}".`);
    }
  };

  const handleUpdatePqrs = async (id: string, newEstado: string, newRespuesta: string) => {
    const { error: errorPqrs } = await supabase
      .from('pqrs')
      .update({ 
        estado: newEstado,
        respuesta_oficial: newRespuesta
      })
      .eq('id', id);

    if (errorPqrs) {
      showAlert(`Error al actualizar PQR: ${errorPqrs.message}`);
      return;
    }

    if (newRespuesta && newRespuesta.trim()) {
      const { error: errorSeg } = await supabase
        .from('seguimiento_pqrs')
        .insert({
          pqr_id: id,
          estado: newEstado,
          observacion: newRespuesta,
        });

      if (errorSeg) {
        console.warn('Error al guardar seguimiento:', errorSeg.message);
      }
    }

    setPqrsList((prev) => prev.map((p) => (p.id === id ? { ...p, estado: newEstado, respuesta_oficial: newRespuesta } : p)));
    showAlert(`PQR ${id} actualizada con éxito (${newEstado}).`);
  };

  const handleDeletePqrs = (id: string) => {
    const pqr = pqrsList.find((p) => p.id === id) || (selectedPqrForDetail?.id === id ? selectedPqrForDetail : undefined);
    setDeleteTarget({
      type: 'pqr',
      id,
      name: id,
      category: pqr?.categoria,
      subtitle: pqr?.solicitante ? `Solicitante: ${pqr.solicitante}` : undefined,
      description: pqr?.descripcion,
    });
  };

  const handleDeleteUser = (id: string) => {
    const usr = users.find((u) => u.id === id);
    setDeleteTarget({
      type: 'user',
      id,
      name: usr?.name || usr?.email || id,
      subtitle: usr?.email ? `Email: ${usr.email} · Rol: ${usr.role}` : undefined,
    });
  };

  const executeDeleteTarget = async () => {
    if (!deleteTarget) return;

    setIsDeletingTarget(true);
    try {
      if (deleteTarget.type === 'pqr') {
        const { error } = await supabase.from('pqrs').delete().eq('id', deleteTarget.id);
        if (error) {
          showAlert(`Error al eliminar PQR: ${error.message}`);
        } else {
          try {
            await supabase.from('documentos_formativos').delete().ilike('titulo', `${deleteTarget.id}%`);
            await supabase.from('seguimiento_pqrs').delete().eq('pqr_id', deleteTarget.id);
          } catch (cleanErr) {
            console.warn('Limpieza de registros asociados:', cleanErr);
          }
          setPqrsList((prev) => prev.filter((p) => p.id !== deleteTarget.id));
          if (selectedPqrForDetail?.id === deleteTarget.id) {
            setSelectedPqrForDetail(null);
          }
          showAlert(`PQR ${deleteTarget.id} eliminada correctamente.`);
          setDeleteTarget(null);
        }
      } else {
        const { error } = await supabase.from('ciudadanos').delete().eq('id', deleteTarget.id);
        if (error) {
          showAlert(`Error al eliminar usuario: ${error.message}`);
        } else {
          setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
          showAlert(`Usuario eliminado correctamente.`);
          setDeleteTarget(null);
        }
      }
    } catch (err: any) {
      showAlert(`Error: ${err.message || 'Error de conexión'}`);
    } finally {
      setIsDeletingTarget(false);
    }
  };

  const callGroqForPqr = async (
    pqr: AdminPqrsItem,
    isAlternative: boolean = false,
    previousResponse?: string
  ): Promise<{ estado: string; respuesta: string }> => {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY || '';
    const altInstruction = isAlternative
      ? `IMPORTANTE: Proporciona una redacción alternativa, fresca y diferente a la siguiente propuesta previa que no convenció al auditor: "${previousResponse || ''}". Varía el enfoque y vocabulario manteniendo el rigor legal y técnico.`
      : '';

    const prompt = `Analiza esta PQR de servicios públicos domiciliarios en Colombia.
Categoría: ${pqr.categoria}
Ubicación / Dirección del Incidente: ${pqr.direccion || 'No especificada / Sector general'}
Descripción: ${pqr.descripcion}
Solicitante: ${pqr.solicitante}

${altInstruction}

Decide si la PQR puede ser "Resuelto" o debe quedarse "En trámite".
Responde EXACTAMENTE en este formato (2 líneas, sin encabezados Markdown adicionales):
ESTADO: Resuelto
RESPUESTA: [Tu respuesta oficial profesional, formal, empática y sustentada al ciudadano explicando la solución o trámite dado a su petición]`;

    const candidateModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await fetch('/api/groq/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: isAlternative ? 0.65 : 0.3,
            max_tokens: 420,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`Groq error con modelo ${model}:`, response.status, errBody);
          continue;
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0]?.message?.content) continue;
        const content = data.choices[0].message.content;

        const estadoMatch = content.match(/ESTADO:\s*(.+)/i);
        const respuestaMatch = content.match(/RESPUESTA:\s*([\s\S]+)/i);
        let nuevoEstado = estadoMatch ? estadoMatch[1].trim() : 'En trámite';
        if (nuevoEstado.toLowerCase().includes('resuelto')) nuevoEstado = 'Resuelto';
        else nuevoEstado = 'En trámite';
        const nuevaRespuesta = respuestaMatch ? respuestaMatch[1].trim() : content;
        return { estado: nuevoEstado, respuesta: nuevaRespuesta };
      } catch (err) {
        lastError = err;
        console.warn(`Intento fallido con modelo ${model}:`, err);
      }
    }

    throw lastError || new Error('No se pudo obtener respuesta del servicio de IA');
  };

  const handleAiResolve = async (pqr: AdminPqrsItem) => {
    setAiLoadingId(pqr.id);
    try {
      const result = await callGroqForPqr(pqr);
      setAiPending({ pqrId: pqr.id, nuevoEstado: result.estado, nuevaRespuesta: result.respuesta });
    } catch (e) {
      console.error('Error IA PQRS:', e);
      showAlert('Error al generar respuesta asistida.');
    } finally {
      setAiLoadingId(null);
    }
  };

  const handleAiRegenerate = async () => {
    if (!aiPending) return;
    const targetPqr = pqrsList.find((p) => p.id === aiPending.pqrId);
    if (!targetPqr) return;

    setIsRegeneratingAi(true);
    try {
      const result = await callGroqForPqr(targetPqr, true, aiPending.nuevaRespuesta);
      setAiPending((prev) =>
        prev
          ? {
              ...prev,
              nuevoEstado: result.estado,
              nuevaRespuesta: result.respuesta,
            }
          : null
      );
      showAlert('Nueva alternativa generada por IA.');
    } catch (err) {
      console.error('Error regenerando respuesta IA:', err);
      showAlert('Error al generar una alternativa de respuesta.');
    } finally {
      setIsRegeneratingAi(false);
    }
  };

  const handleModalAiResolve = async (pqr: AdminPqrsItem) => {
    setAiLoadingId(pqr.id);
    try {
      const isAlt = Boolean(modalEditRespuesta && modalEditRespuesta.trim());
      const result = await callGroqForPqr(pqr, isAlt, modalEditRespuesta);
      setModalEditEstado(result.estado);
      setModalEditRespuesta(result.respuesta);
      showAlert('Respuesta sugerida generada con éxito.');
    } catch (e) {
      console.error('Error IA Modal:', e);
      showAlert('Error al generar sugerencia asistida.');
    } finally {
      setAiLoadingId(null);
    }
  };

  const handleAiAccept = async () => {
    if (!aiPending) return;
    await handleUpdatePqrs(aiPending.pqrId, aiPending.nuevoEstado, aiPending.nuevaRespuesta);
    showAlert('PQR actualizada y dictamen guardado.');
    setAiPending(null);
  };

  const handleAiCancel = () => {
    setAiPending(null);
  };

  const handleOpenAuditModal = () => {
    if (pqrsList.length === 0) {
      showAlert('No hay solicitudes registradas para auditar.');
      return;
    }
    setAuditSummaryResult(null);
    setAuditProgress(null);
    setShowAuditModal(true);
  };

  const handleStartAuditAll = async () => {
    setIsAuditingAll(true);
    setAuditProgress({ current: 0, total: pqrsList.length });
    setAuditSummaryResult(null);

    let updatedCount = 0;
    let newResueltos = 0;
    let newEnTramite = 0;
    const currentList = [...pqrsList];

    for (let i = 0; i < currentList.length; i++) {
      const pqr = currentList[i];
      setAuditCurrentItem(`Radicado ${pqr.id} • ${pqr.categoria} (${pqr.solicitante})`);
      setAuditProgress({ current: i + 1, total: currentList.length });
      try {
        const result = await callGroqForPqr(pqr);

        if (result.estado.toLowerCase() === 'resuelto') {
          newResueltos++;
        } else {
          newEnTramite++;
        }

        // Actualizar en Supabase
        await supabase
          .from('pqrs')
          .update({
            estado: result.estado,
            respuesta_oficial: result.respuesta,
          })
          .eq('id', pqr.id);

        if (result.respuesta && result.respuesta.trim()) {
          await supabase
            .from('seguimiento_pqrs')
            .insert({
              pqr_id: pqr.id,
              estado: result.estado,
              observacion: result.respuesta,
            });
        }

        currentList[i] = {
          ...pqr,
          estado: result.estado,
          respuesta_oficial: result.respuesta,
        };
        setPqrsList([...currentList]);
        updatedCount++;
      } catch (err) {
        console.error(`Error auditando PQR ${pqr.id}:`, err);
      }
    }

    setIsAuditingAll(false);
    setAuditSummaryResult({
      total: updatedCount,
      resueltos: newResueltos,
      enTramite: newEnTramite,
    });
    showAlert(`¡Auditoría masiva completada! Se dictaminaron ${updatedCount} solicitudes.`);
  };

  const handleOpenDetailModal = (pqr: AdminPqrsItem) => {
    setSelectedPqrForDetail(pqr);
    setModalEditEstado(pqr.estado || 'En trámite');
    setModalEditRespuesta(pqr.respuesta_oficial || '');
  };

  const handleSaveFromModal = async () => {
    if (!selectedPqrForDetail) return;
    await handleUpdatePqrs(selectedPqrForDetail.id, modalEditEstado, modalEditRespuesta);
    setSelectedPqrForDetail(null);
  };

  const showAlert = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3500);
  };

  if (!isAdmin) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__header">
          <h2>Acceso Restringido</h2>
          <button className="admin-close-btn" onClick={onClose}>Volver al Inicio</button>
        </div>
        <div className="admin-panel-content">
          <p>El apartado de administración está reservado exclusivamente para la cuenta de auditoría machoandres12@gmail.com.</p>
        </div>
      </div>
    );
  }

  // Filters
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const categoriesList = ['Todas', ...Array.from(new Set(pqrsList.map(p => p.categoria || 'Agua')))];

  const filteredPqrs = pqrsList.filter(p => {
    const term = pqrsSearch.toLowerCase();
    const matchSearch = 
      p.id.toLowerCase().includes(term) || 
      p.solicitante.toLowerCase().includes(term) ||
      p.descripcion.toLowerCase().includes(term) ||
      p.categoria.toLowerCase().includes(term);
    
    const matchStatus = pqrsStatusFilter === 'Todos' || p.estado === pqrsStatusFilter;
    const matchCategory = pqrsCategoryFilter === 'Todas' || p.categoria === pqrsCategoryFilter;
    
    return matchSearch && matchStatus && matchCategory;
  });

  // KPI calculations
  const totalPqrsCount = pqrsList.length;
  const enTramiteCount = pqrsList.filter(p => p.estado === 'En trámite').length;
  const resueltoCount = pqrsList.filter(p => p.estado.toLowerCase() === 'resuelto').length;
  const resolutionRate = totalPqrsCount > 0 ? Math.round((resueltoCount / totalPqrsCount) * 100) : 0;

  return (
    <div className="admin-dashboard">
      {/* HEADER PRINCIPAL */}
      <header className="admin-dashboard__header">
        <div className="admin-header__title-group">
          <div className="admin-badge-crown">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>Panel de Control</span>
          </div>
          <h2>Administración y Auditoría Institucional</h2>
          <p>Gestión de peticiones ciudadanas • Sesión: <strong>{userEmail}</strong></p>
        </div>
        <button className="admin-close-btn" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Volver al Portal</span>
        </button>
      </header>

      {/* PESTAÑAS PRINCIPALES */}
      <nav className="admin-tabs" aria-label="Secciones del panel">
        <button 
          className={`admin-tab ${activeTab === 'pqrs' ? 'admin-tab--active' : ''}`} 
          onClick={() => setActiveTab('pqrs')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>Gestión de PQRS</span>
          <span className="admin-tab__count">{totalPqrsCount}</span>
        </button>
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'admin-tab--active' : ''}`} 
          onClick={() => setActiveTab('users')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Usuarios</span>
          <span className="admin-tab__count">{users.length}</span>
        </button>
        <button 
          className={`admin-tab ${activeTab === 'ai' ? 'admin-tab--active' : ''}`} 
          onClick={() => setActiveTab('ai')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
            <circle cx="12" cy="12" r="6" />
          </svg>
          <span>Asistente de Auditoría</span>
        </button>
      </nav>

      {/* ALERTA / TOAST */}
      {alertMsg && (
        <div className="admin-alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{alertMsg}</span>
        </div>
      )}

      {/* CONTENIDO DEL PANEL */}
      <main className="admin-panel-content">
        {/* =========================================================================
            TAB 1: GESTIÓN DE PQRS
            ========================================================================= */}
        {activeTab === 'pqrs' && (
          <div className="admin-pqrs-view">
            {/* KPI METRICS CARDS */}
            <div className="admin-kpi-grid">
              <div className="admin-kpi-card">
                <div className="admin-kpi-card__icon admin-kpi-card__icon--blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <div className="admin-kpi-card__info">
                  <span className="admin-kpi-card__label">Total Radicados</span>
                  <div className="admin-kpi-card__val">{totalPqrsCount}</div>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-card__icon admin-kpi-card__icon--amber">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="admin-kpi-card__info">
                  <span className="admin-kpi-card__label">En Trámite</span>
                  <div className="admin-kpi-card__val admin-kpi-card__val--amber">{enTramiteCount}</div>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-card__icon admin-kpi-card__icon--green">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="admin-kpi-card__info">
                  <span className="admin-kpi-card__label">Resueltos</span>
                  <div className="admin-kpi-card__val admin-kpi-card__val--green">{resueltoCount}</div>
                </div>
              </div>

              <div className="admin-kpi-card admin-kpi-card--action">
                <div className="admin-kpi-card__info" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.2rem' }}>
                    <span className="admin-kpi-card__label">Efectividad: <strong>{resolutionRate}%</strong></span>
                    {isAuditingAll && auditProgress && (
                      <span className="admin-audit-badge-live">
                        <span className="admin-spin">◌</span> {auditProgress.current}/{auditProgress.total}
                      </span>
                    )}
                  </div>
                  <div className="admin-resolution-bar-bg">
                    <div className="admin-resolution-bar-fill" style={{ width: `${resolutionRate}%` }} />
                  </div>
                  <p className="admin-kpi-card__desc">Resolución y asistencia normativa con IA</p>
                  <button
                    type="button"
                    className="admin-btn--ai-bulk"
                    onClick={handleOpenAuditModal}
                    disabled={isAuditingAll || totalPqrsCount === 0}
                    title="Ejecutar revisión y dictamen institucional de todas las solicitudes con IA"
                    style={{ marginTop: '0.65rem', width: '100%', justifyContent: 'center' }}
                  >
                    {isAuditingAll ? (
                      <>
                        <span className="admin-spin">◌</span>
                        <span>Auditando ({auditProgress?.current} de {auditProgress?.total})...</span>
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>Revisar y Dictaminar Todas ⚡</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* CONTROLES DE BÚSQUEDA Y FILTRADO */}
            <div className="admin-controls-bar">
              <div className="admin-search-box">
                <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Buscar por radicado, ciudadano, detalle o servicio..." 
                  value={pqrsSearch} 
                  onChange={e => setPqrsSearch(e.target.value)} 
                  className="admin-search-input"
                />
                {pqrsSearch && (
                  <button className="admin-search-clear" onClick={() => setPqrsSearch('')} title="Limpiar búsqueda">✕</button>
                )}
              </div>

              <div className="admin-filter-group">
                {/* Selector de Categoría Alineado con Icono */}
                <div className="admin-category-filter-wrap">
                  <svg className="admin-category-filter-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <select 
                    value={pqrsCategoryFilter} 
                    onChange={e => setPqrsCategoryFilter(e.target.value)}
                    className="admin-category-select"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'Todas' ? 'Todas las Categorías' : `Categoría: ${cat}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chips de Estado */}
                <div className="admin-status-chips">
                  <button 
                    type="button"
                    className={`admin-chip ${pqrsStatusFilter === 'Todos' ? 'admin-chip--active' : ''}`}
                    onClick={() => setPqrsStatusFilter('Todos')}
                  >
                    Todos ({totalPqrsCount})
                  </button>
                  <button 
                    type="button"
                    className={`admin-chip admin-chip--amber ${pqrsStatusFilter === 'En trámite' ? 'admin-chip--active' : ''}`}
                    onClick={() => setPqrsStatusFilter('En trámite')}
                  >
                    En trámite ({enTramiteCount})
                  </button>
                  <button 
                    type="button"
                    className={`admin-chip admin-chip--green ${pqrsStatusFilter === 'Resuelto' ? 'admin-chip--active' : ''}`}
                    onClick={() => setPqrsStatusFilter('Resuelto')}
                  >
                    Resueltos ({resueltoCount})
                  </button>
                </div>
              </div>
            </div>

            {/* TABLA EJECUTIVA DE PQRS */}
            <div className="admin-table-wrapper">
              <table className="admin-table admin-table--pqrs">
                <thead>
                  <tr>
                    <th style={{ width: '16%' }}>Radicado & Servicio</th>
                    <th style={{ width: '16%' }}>Ciudadano</th>
                    <th style={{ width: '36%' }}>Descripción & Respuesta</th>
                    <th style={{ width: '10%' }}>Documentos</th>
                    <th style={{ width: '10%' }}>Estado</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPqrs.map(pqr => {
                    const isResuelto = pqr.estado.toLowerCase() === 'resuelto';
                    const hasResponse = Boolean(pqr.respuesta_oficial && pqr.respuesta_oficial.trim());
                    const isExpanded = Boolean(expandedPqrIds[pqr.id]);

                    // Buscar usuario para avatar y rol
                    const matchedUser = users.find(u => 
                      (pqr.ciudadano_id && u.id === pqr.ciudadano_id) || 
                      (u.name && u.name.toLowerCase() === pqr.solicitante.toLowerCase()) || 
                      (u.email && u.email.toLowerCase() === pqr.solicitante.toLowerCase())
                    );
                    const avatarUrl = matchedUser?.avatar_url;

                    return (
                      <tr key={pqr.id} className="admin-table__row">
                        {/* 1. Radicado & Servicio (Compacto, ordenado y limpio) */}
                        <td>
                          <div className="admin-radicado-compact">
                            <span className="admin-radicado-code">{pqr.id}</span>
                            <span className={`admin-radicado-service admin-radicado-service--${pqr.categoria.toLowerCase()}`}>
                              <span className="admin-radicado-dot" />
                              {pqr.categoria}
                            </span>
                            {pqr.direccion && (
                              <span className="admin-radicado-location" title={`Ubicación: ${pqr.direccion}`}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>{pqr.direccion}</span>
                              </span>
                            )}
                            <span className="admin-radicado-fecha" title={`Fecha de radicación: ${pqr.fecha_radicacion}`}>
                              {pqr.fecha_radicacion}
                            </span>
                          </div>
                        </td>

                        {/* 2. Solicitante / Ciudadano (Solo avatar y nombre) */}
                        <td>
                          <div className="admin-citizen-card">
                            <div className="admin-citizen-avatar-wrap">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={pqr.solicitante} className="admin-citizen-avatar-img" />
                              ) : (
                                <div className="admin-citizen-avatar-initial">
                                  {pqr.solicitante ? pqr.solicitante[0].toUpperCase() : 'C'}
                                </div>
                              )}
                            </div>
                            <strong className="admin-citizen-name" title={pqr.solicitante}>{pqr.solicitante}</strong>
                          </div>
                        </td>

                        {/* 3. Descripción & Respuesta */}
                        <td>
                          <div className="admin-desc-minimal">
                            {isExpanded ? (
                              <div className="admin-expanded-flow">
                                <div className="admin-flow-block">
                                  <span className="admin-flow-heading">Descripción de la solicitud</span>
                                  <p className="admin-flow-body">{pqr.descripcion || 'Sin descripción detallada.'}</p>
                                </div>

                                <div className={`admin-flow-block ${hasResponse ? 'admin-flow-block--done' : 'admin-flow-block--pending'}`}>
                                  <span className="admin-flow-heading">Respuesta institucional</span>
                                  <p className="admin-flow-body">
                                    {hasResponse
                                      ? pqr.respuesta_oficial
                                      : 'Pendiente de respuesta institucional.'}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  className="admin-desc-text-toggle admin-desc-text-toggle--close"
                                  onClick={() => togglePqrExpand(pqr.id)}
                                >
                                  <span>Ocultar</span>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="18 15 12 9 6 15" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="admin-desc-compact-flow">
                                <p className="admin-desc-main-text" title={pqr.descripcion}>
                                  {pqr.descripcion || 'Sin descripción'}
                                </p>

                                {hasResponse ? (
                                  <div className="admin-dictamen-direct-box" title={pqr.respuesta_oficial}>
                                    <span className="admin-dictamen-direct-label">Respuesta:</span>
                                    <p className="admin-dictamen-direct-text">
                                      {pqr.respuesta_oficial}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="admin-dictamen-pending-line">
                                    <span className="admin-subline-dictamen admin-subline-dictamen--pending">
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 15 14" />
                                      </svg>
                                      <span>Pendiente de respuesta</span>
                                    </span>
                                  </div>
                                )}

                                <div className="admin-desc-subline">
                                  <button
                                    type="button"
                                    className="admin-desc-text-toggle"
                                    onClick={() => togglePqrExpand(pqr.id)}
                                    title="Ver descripción y respuesta completa"
                                  >
                                    <span>Ver detalle</span>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 4. Archivos Enviados */}
                        <td>
                          {pqr.adjunto_url ? (
                            <button
                              type="button"
                              className="admin-pdf-pill"
                              onClick={() => openPdfInNewTab(pqr.adjunto_url!)}
                              title={pqr.adjunto_nombre ? `Abrir soporte: ${pqr.adjunto_nombre}` : 'Abrir documento PDF adjunto'}
                            >
                              <div className="admin-pdf-pill__icon">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M7 2H14.5L19 6.5V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V4C5 2.89543 5.89543 2 7 2Z" fill="#FFF1F2" stroke="#BE123C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M14 2V7H19" stroke="#BE123C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                  <rect x="6.5" y="11" width="11" height="6.5" rx="1.5" fill="#BE123C" />
                                  <text x="12" y="15.8" fill="#FFFFFF" fontSize="4.6" fontWeight="900" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="0.3">PDF</text>
                                </svg>
                              </div>
                              <span className="admin-pdf-pill__text">Ver PDF</span>
                              <svg className="admin-pdf-pill__arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M7 17L17 7M17 7H7M17 7V17" />
                              </svg>
                            </button>
                          ) : (
                            <span className="admin-pdf-none">
                              <span className="admin-pdf-none-dot"></span>
                              Sin adjunto
                            </span>
                          )}
                        </td>

                        {/* 4. Estado */}
                        <td>
                          <div className="admin-status-select-wrap">
                            <select
                              value={pqr.estado}
                              onChange={async (e) => {
                                const newEst = e.target.value;
                                await handleUpdatePqrs(pqr.id, newEst, pqr.respuesta_oficial);
                              }}
                              className={`admin-status-dropdown ${isResuelto ? 'admin-status-dropdown--green' : 'admin-status-dropdown--amber'}`}
                            >
                              <option value="En trámite">En trámite</option>
                              <option value="Resuelto">Resuelto</option>
                            </select>
                          </div>
                        </td>

                        {/* 5. Acciones Reorganizadas y Profesionales */}
                        <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                          <div className="admin-actions-group">
                            <button 
                              type="button"
                              className="admin-btn-action admin-btn-action--detail"
                              onClick={() => handleOpenDetailModal(pqr)}
                              title="Ver detalles completos y gestionar dictamen"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span>Gestionar</span>
                            </button>

                            <button 
                              type="button"
                              className="admin-btn-action admin-btn-action--ai"
                              onClick={() => handleAiResolve(pqr)}
                              disabled={aiLoadingId === pqr.id}
                              title="Sugerir respuesta con Inteligencia Artificial"
                            >
                              {aiLoadingId === pqr.id ? (
                                <span className="admin-spin">◌</span>
                              ) : (
                                <>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                  </svg>
                                  <span>IA</span>
                                </>
                              )}
                            </button>

                            <button 
                              type="button"
                              className="admin-btn-action admin-btn-action--delete"
                              onClick={() => handleDeletePqrs(pqr.id)}
                              title="Eliminar esta PQR permanentemente"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredPqrs.length === 0 && (
                <div className="admin-empty-state">
                  <div className="admin-empty-state__icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <h3>No se encontraron solicitudes</h3>
                  <p>No hay PQRS que coincidan con los criterios de búsqueda aplicados.</p>
                  {(pqrsSearch || pqrsStatusFilter !== 'Todos' || pqrsCategoryFilter !== 'Todas') && (
                    <button 
                      type="button"
                      className="admin-btn admin-btn--save" 
                      onClick={() => { setPqrsSearch(''); setPqrsStatusFilter('Todos'); setPqrsCategoryFilter('Todas'); }}
                      style={{ marginTop: '1rem' }}
                    >
                      Restablecer filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: GESTIÓN DE USUARIOS
            ========================================================================= */}
        {activeTab === 'users' && (
          <div className="admin-users-view">
            <div className="admin-controls-bar">
              <div className="admin-search-box">
                <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Buscar usuario por nombre o correo electrónico..." 
                  value={userSearch} 
                  onChange={e => setUserSearch(e.target.value)} 
                  className="admin-search-input"
                />
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table admin-table--users">
                <thead>
                  <tr>
                    <th style={{ width: '36%' }}>Usuario & Perfil</th>
                    <th style={{ width: '28%' }}>Correo Electrónico</th>
                    <th style={{ width: '20%' }}>Rol en la Plataforma</th>
                    <th style={{ width: '16%', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(usr => {
                    const isCurrentAdmin = usr.email.toLowerCase() === (userEmail || '').toLowerCase();
                    const realPhoto = (isCurrentAdmin && userAvatar) ? userAvatar : (usr.avatar_url || null);
                    
                    const initial = usr.name && usr.name.trim() 
                      ? usr.name.trim().charAt(0).toUpperCase() 
                      : (usr.email ? usr.email.charAt(0).toUpperCase() : 'U');

                    const getAvatarBg = () => {
                      if (isCurrentAdmin) return '#2563eb';
                      if (usr.role === 'administrador') return '#2563eb';
                      if (usr.role === 'gobernante') return '#7c3aed';
                      if (usr.role === 'ciudadano rico') return '#059669';
                      if (usr.role === 'ciudadano pobre') return '#ea580c';
                      return '#475569';
                    };

                    return (
                      <tr key={usr.id} className={isCurrentAdmin ? 'admin-table__row--current-user' : ''}>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar-wrapper">
                              {realPhoto ? (
                                <img 
                                  src={realPhoto} 
                                  alt={usr.name} 
                                  className="admin-user-avatar-img"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                    const fb = (e.target as HTMLElement).parentElement?.querySelector('.admin-user-avatar-fallback') as HTMLElement;
                                    if (fb) fb.style.display = 'flex';
                                  }} 
                                />
                              ) : null}
                              <div 
                                className="admin-user-avatar-fallback"
                                style={{
                                  display: realPhoto ? 'none' : 'flex',
                                  backgroundColor: getAvatarBg(),
                                  color: '#ffffff',
                                }}
                              >
                                {initial}
                              </div>
                            </div>
                            <div className="admin-user-info-group">
                              <div className="admin-user-name-line">
                                <strong className="admin-user-name">{usr.name}</strong>
                                {isCurrentAdmin && (
                                  <span className="admin-you-pill">Tú (Sesión Actual)</span>
                                )}
                              </div>
                              <span className="admin-user-id-sub">ID: {usr.id.substring(0, 8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td className="admin-user-email">
                          <span>{usr.email}</span>
                        </td>
                        <td>
                          <select
                            value={usr.role}
                            onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                            className={`admin-role-select admin-role-select--${usr.role.toLowerCase().replace(/\s+/g, '-')}`}
                            title="Cambiar rol en la plataforma"
                          >
                            <option value="ciudadano pobre">Ciudadano Pobre</option>
                            <option value="ciudadano promedio">Ciudadano Promedio</option>
                            <option value="ciudadano rico">Ciudadano Rico</option>
                            <option value="gobernante">Gobernante</option>
                            <option value="administrador">Administrador</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="admin-actions-group">
                            <button 
                              type="button"
                              className="admin-btn admin-btn--history" 
                              onClick={() => setHistoryUser(usr)}
                              title="Ver historial de PQRS radicadas por este usuario"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span>Historial</span>
                            </button>
                            <button 
                              type="button"
                              className="admin-btn admin-btn--delete" 
                              onClick={() => handleDeleteUser(usr.id)}
                              disabled={isCurrentAdmin}
                              title={isCurrentAdmin ? "No puedes eliminar tu propia cuenta" : "Eliminar este usuario"}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && <div className="admin-empty-state">No se encontraron usuarios.</div>}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: ASISTENTE IA
            ========================================================================= */}
        {activeTab === 'ai' && (
          <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            <AdminAiChat usersList={users} pqrsList={pqrsList as any} />
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL 1: HISTORIAL DE PQRS DE USUARIO
          ========================================================================= */}
      {historyUser && (
        <div className="modal-backdrop" onClick={() => setHistoryUser(null)}>
          <div className="modal-card modal-card--history" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card__header">
              <div>
                <span className="modal-card__tag">HISTORIAL DE USUARIO</span>
                <h3 className="modal-card__title">PQRS radicadas por {historyUser.name}</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>{historyUser.email}</p>
              </div>
              <button type="button" className="modal-card__close" onClick={() => setHistoryUser(null)}>✕</button>
            </div>
            
            <div className="modal-card__body">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                     <tr>
                       <th>Radicado</th>
                       <th>Categoría</th>
                       <th>Descripción</th>
                       <th>Estado</th>
                     </tr>
                  </thead>
                  <tbody>
                    {pqrsList.filter(p => p.ciudadano_id === historyUser.id).map(p => (
                      <tr key={p.id}>
                        <td><span className="admin-pqr-id-mono">{p.id}</span></td>
                        <td><span className="admin-cat-pill">{p.categoria}</span></td>
                        <td style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.descripcion}
                        </td>
                        <td>
                          <span className={`modal-status ${p.estado.toLowerCase() === 'resuelto' ? 'modal-status--green' : 'modal-status--amber'}`}>
                            {p.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {pqrsList.filter(p => p.ciudadano_id === historyUser.id).length === 0 && (
                      <tr><td colSpan={4} style={{textAlign:'center', padding:'2.5rem', color: '#64748b'}}>No hay PQRS registradas para este usuario.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-card__footer">
              <button type="button" className="modal-card__btn-close" onClick={() => setHistoryUser(null)}>
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: VER Y GESTIONAR PQR (ADMINISTRADOR)
          ========================================================================= */}
      {selectedPqrForDetail && (
        <div className="modal-backdrop" onClick={() => setSelectedPqrForDetail(null)}>
          <div className="modal-card modal-card--admin-pqr" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card__header">
              <div>
                <span className="modal-card__tag">{selectedPqrForDetail.categoria}</span>
                <h3 className="modal-card__title">Radicado {selectedPqrForDetail.id}</h3>
              </div>
              <button 
                type="button" 
                className="modal-card__close" 
                onClick={() => setSelectedPqrForDetail(null)}
                title="Cerrar ventana"
              >
                ✕
              </button>
            </div>

            <div className="modal-card__body">
              {/* Metadatos */}
              <div className="modal-info-row">
                <span className="modal-info-label">Ciudadano / Solicitante:</span>
                <span className="modal-info-value">{selectedPqrForDetail.solicitante}</span>
              </div>

              {selectedPqrForDetail.direccion && (
                <div className="modal-info-row">
                  <span className="modal-info-label">Dirección / Inmueble Causa:</span>
                  <span className="modal-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1d4ed8', fontWeight: '600' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {selectedPqrForDetail.direccion}
                  </span>
                </div>
              )}

              <div className="modal-info-row">
                <span className="modal-info-label">Estado Actual:</span>
                <span className={`modal-status ${selectedPqrForDetail.estado.toLowerCase() === 'resuelto' ? 'modal-status--green' : 'modal-status--amber'}`}>
                  ● {selectedPqrForDetail.estado}
                </span>
              </div>

              <div className="modal-info-row">
                <span className="modal-info-label">Fecha de Radicación:</span>
                <span className="modal-info-value">{selectedPqrForDetail.fecha_radicacion || 'No registrada'}</span>
              </div>

              <div className="modal-info-row">
                <span className="modal-info-label">Plazo Legal de Respuesta:</span>
                <span className="modal-info-value">{selectedPqrForDetail.plazo_legal || '15 días hábiles'}</span>
              </div>

              {/* Descripción */}
              <div className="modal-block">
                <h4 className="modal-block__title">Descripción de la Solicitud</h4>
                <p className="modal-block__content">{selectedPqrForDetail.descripcion}</p>
              </div>

              {/* Soporte PDF */}
              {selectedPqrForDetail.adjunto_url && (
                <div
                  className="modal-block modal-block--adjunto"
                  style={{
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '10px',
                    padding: '0.85rem 1.1rem',
                    marginTop: '0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: '#fee2e2', color: '#dc2626', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b', fontWeight: '700' }}>Documento PDF Adjunto</h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#b91c1c' }}>
                        {selectedPqrForDetail.adjunto_nombre || 'Documento_Soporte.pdf'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openPdfInNewTab(selectedPqrForDetail.adjunto_url!)}
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      padding: '0.45rem 0.95rem',
                      borderRadius: '7px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Ver Documento PDF ↗
                  </button>
                </div>
              )}

              {/* GESTIÓN OFICIAL */}
              <div className="admin-manage-section">
                <div className="admin-manage-section__header">
                  <div>
                    <h4 className="modal-block__title" style={{ margin: 0, color: '#0f172a' }}>
                      Gestión y Dictamen Oficial (Administrador)
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Esta respuesta se registrará oficialmente en el seguimiento de la PQR
                    </span>
                  </div>

                  <button
                    type="button"
                    className="admin-btn admin-btn--ai-sparkle"
                    onClick={() => handleModalAiResolve(selectedPqrForDetail)}
                    disabled={aiLoadingId === selectedPqrForDetail.id}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>{aiLoadingId === selectedPqrForDetail.id ? 'Generando...' : 'Sugerir con IA'}</span>
                  </button>
                </div>

                <div className="admin-manage-form">
                  <div className="admin-manage-field">
                    <label className="admin-manage-label">Estado del Radicado:</label>
                    <select
                      value={modalEditEstado}
                      onChange={(e) => setModalEditEstado(e.target.value)}
                      className="admin-select admin-select--modal"
                    >
                      <option value="En trámite">En trámite</option>
                      <option value="Resuelto">Resuelto</option>
                    </select>
                  </div>

                  <div className="admin-manage-field">
                    <label className="admin-manage-label">Respuesta Oficial Institucional:</label>
                    <textarea
                      className="admin-textarea-modal"
                      rows={5}
                      placeholder="Redacta la resolución formal y clara que recibirá el ciudadano..."
                      value={modalEditRespuesta}
                      onChange={(e) => setModalEditRespuesta(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del modal */}
            <div className="modal-card__footer admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn--danger-outline"
                onClick={() => {
                  handleDeletePqrs(selectedPqrForDetail.id);
                  setSelectedPqrForDetail(null);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Eliminar PQR</span>
              </button>

              <div className="admin-modal-footer-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--cancel"
                  onClick={() => setSelectedPqrForDetail(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--save-modal"
                  onClick={handleSaveFromModal}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Guardar Dictamen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: CONFIRMACIÓN Y EDICIÓN DE SUGERENCIA IA
          ========================================================================= */}
      {aiPending && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={handleAiCancel}>
          <div className="modal-card modal-card--ai-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card__header" style={{ borderBottom: '2px solid #4f46e5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="modal-card__title" style={{ fontSize: '1.2rem', margin: 0 }}>Sugerencia Normativa (IA)</h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Radicado: <strong>{aiPending.pqrId}</strong>
                  </p>
                </div>
              </div>
              <button type="button" className="modal-card__close" onClick={handleAiCancel} title="Cerrar">✕</button>
            </div>

            <div className="modal-card__body">
              {/* Selector de Estado */}
              <div className="admin-manage-field" style={{ marginBottom: '1rem' }}>
                <label className="admin-manage-label">Estado de Resolución Sugerido:</label>
                <select
                  value={aiPending.nuevoEstado}
                  onChange={(e) => setAiPending({ ...aiPending, nuevoEstado: e.target.value })}
                  className="admin-select admin-select--modal"
                >
                  <option value="Resuelto">Resuelto</option>
                  <option value="En trámite">En trámite</option>
                </select>
              </div>

              {/* Dictamen editable + Botón Regenerar */}
              <div className="admin-manage-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label className="admin-manage-label" style={{ color: '#4338ca' }}>
                    Dictamen Oficial Sugerido (Editable):
                  </label>
                  <button
                    type="button"
                    className="admin-btn-regenerate"
                    onClick={handleAiRegenerate}
                    disabled={isRegeneratingAi}
                    title="Pedirle a la IA otra redacción alternativa"
                  >
                    {isRegeneratingAi ? (
                      <>
                        <span className="admin-spin">◌</span>
                        <span>Generando otra...</span>
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        <span>Generar otra respuesta 🔄</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  className="admin-textarea-modal"
                  rows={6}
                  value={aiPending.nuevaRespuesta}
                  onChange={(e) => setAiPending({ ...aiPending, nuevaRespuesta: e.target.value })}
                  placeholder="Puedes editar o personalizar el dictamen sugerido antes de aplicar..."
                  disabled={isRegeneratingAi}
                />
                <span style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.35rem' }}>
                  💡 Puedes modificar el texto libremente según tu criterio, o pulsar <strong>"Generar otra respuesta"</strong> para que la IA proponga una alternativa diferente.
                </span>
              </div>
            </div>

            <div className="modal-card__footer admin-modal-footer">
              <button type="button" className="admin-btn admin-btn--cancel" onClick={handleAiCancel}>
                Descartar
              </button>

              <div className="admin-modal-footer-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--save-modal"
                  onClick={handleAiAccept}
                  disabled={isRegeneratingAi}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Aplicar y Guardar Dictamen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: AUDITORÍA Y RESOLUCIÓN MASIVA CON IA (EXECUTIVE MODAL)
          ========================================================================= */}
      {showAuditModal && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={() => { if (!isAuditingAll) setShowAuditModal(false); }}>
          <div className="modal-card modal-card--audit-executive" onClick={(e) => e.stopPropagation()}>
            {/* Encabezado */}
            <div className="modal-card__header admin-audit-modal-hdr">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="admin-audit-glow-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <div className="admin-audit-sub-tag">
                    <span className="admin-audit-dot-pulse" />
                    <span>Inteligencia Artificial • Auditoría Normativa</span>
                  </div>
                  <h3 className="modal-card__title" style={{ fontSize: '1.25rem', margin: 0, color: '#0F172A', letterSpacing: '-0.01em' }}>
                    {auditSummaryResult 
                      ? 'Auditoría Institucional Finalizada' 
                      : isAuditingAll 
                        ? 'Auditando Solicitudes en Tiempo Real...' 
                        : 'Auditoría y Resolución Masiva'}
                  </h3>
                </div>
              </div>
              {!isAuditingAll && (
                <button type="button" className="modal-card__close" onClick={() => setShowAuditModal(false)} title="Cerrar">✕</button>
              )}
            </div>

            {/* Cuerpo del Modal */}
            <div className="modal-card__body admin-audit-body-modern">
              {/* ESTADO 1: Confirmación Previa */}
              {!isAuditingAll && !auditSummaryResult && (
                <div className="admin-audit-flow-confirm">
                  {/* Hero Card */}
                  <div className="admin-audit-hero-card">
                    <div className="admin-audit-hero-top">
                      <span className="admin-audit-hero-chip">PROCESO AUTOMATIZADO</span>
                      <span className="admin-audit-hero-count">{totalPqrsCount} radicados</span>
                    </div>
                    <h4 className="admin-audit-hero-title">Evaluación Integral y Dictamen Oficial de PQRS</h4>
                    <p className="admin-audit-hero-text">
                      El motor de IA analizará cada solicitud bajo las <strong>Leyes 142 de 1994 y 1755 de 2015</strong>, emitirá la resolución oficial institucional correspondiente y actualizará el estado del radicado de forma permanente en Supabase.
                    </p>
                  </div>

                  {/* Metadatos Rápidos */}
                  <div className="admin-audit-pills-grid">
                    <div className="admin-audit-pill-card">
                      <span className="admin-audit-pill-lbl">Total Solicitudes</span>
                      <strong className="admin-audit-pill-val">{totalPqrsCount}</strong>
                    </div>
                    <div className="admin-audit-pill-card admin-audit-pill-card--amber">
                      <span className="admin-audit-pill-lbl">En Trámite Actual</span>
                      <strong className="admin-audit-pill-val">{enTramiteCount}</strong>
                    </div>
                    <div className="admin-audit-pill-card admin-audit-pill-card--green">
                      <span className="admin-audit-pill-lbl">Resueltas Actual</span>
                      <strong className="admin-audit-pill-val">{resueltoCount}</strong>
                    </div>
                  </div>

                  {/* Garantías y Acciones con Iconos Vectoriales */}
                  <div className="admin-audit-features-box">
                    <div className="admin-audit-feature-row">
                      <div className="admin-audit-feat-icon admin-audit-feat-icon--indigo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </div>
                      <div className="admin-audit-feat-content">
                        <strong>Calificación Jurídica Objetiva</strong>
                        <p>Evaluación técnica e imparcial según la urgencia y tipo de servicio público domiciliario.</p>
                      </div>
                    </div>

                    <div className="admin-audit-feature-row">
                      <div className="admin-audit-feat-icon admin-audit-feat-icon--blue">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                      <div className="admin-audit-feat-content">
                        <strong>Redacción Institucional Oficial</strong>
                        <p>Dictamen empático y claro formulado para notificación directa al ciudadano.</p>
                      </div>
                    </div>

                    <div className="admin-audit-feature-row">
                      <div className="admin-audit-feat-icon admin-audit-feat-icon--emerald">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div className="admin-audit-feat-content">
                        <strong>Trazabilidad y Bitácora Oficial</strong>
                        <p>Registro histórico inmutable en la tabla de seguimiento de PQRS en base de datos.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ESTADO 2: En Proceso / Ejecución */}
              {isAuditingAll && auditProgress && (
                <div className="admin-audit-flow-running">
                  <div className="admin-audit-circle-progress-wrap">
                    <div className="admin-audit-pulse-ring" />
                    <div className="admin-audit-center-val">
                      <span className="admin-audit-big-pct">
                        {Math.round((auditProgress.current / auditProgress.total) * 100)}%
                      </span>
                      <span className="admin-audit-small-label">
                        {auditProgress.current} de {auditProgress.total}
                      </span>
                    </div>
                  </div>

                  <div className="admin-audit-bar-track">
                    <div 
                      className="admin-audit-bar-fill" 
                      style={{ width: `${Math.round((auditProgress.current / auditProgress.total) * 100)}%` }} 
                    />
                  </div>

                  <div className="admin-audit-active-tag">
                    <div className="admin-audit-tag-dot" />
                    <div className="admin-audit-tag-text">
                      <span className="admin-audit-tag-label">Procesando solicitud:</span>
                      <strong className="admin-audit-tag-name">{auditCurrentItem || 'Analizando caso con IA...'}</strong>
                    </div>
                  </div>

                  <p className="admin-audit-live-note">
                    Por favor mantén esta ventana abierta. Los dictámenes se están guardando en tiempo real en la base de datos.
                  </p>
                </div>
              )}

              {/* ESTADO 3: Resultados Finales */}
              {auditSummaryResult && (
                <div className="admin-audit-flow-done">
                  <div className="admin-audit-success-icon-wrap">
                    <div className="admin-audit-success-ring">
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>

                  <h4 className="admin-audit-done-title">¡Auditoría Completada con Éxito!</h4>
                  <p className="admin-audit-done-sub">
                    Se han analizado, categorizado y dictaminado oficialmente todas las solicitudes registradas.
                  </p>

                  <div className="admin-audit-results-grid">
                    <div className="admin-audit-res-card">
                      <span className="admin-audit-res-lbl">Total Auditadas</span>
                      <strong className="admin-audit-res-val">{auditSummaryResult.total}</strong>
                    </div>
                    <div className="admin-audit-res-card admin-audit-res-card--green">
                      <span className="admin-audit-res-lbl">Resueltas</span>
                      <strong className="admin-audit-res-val">{auditSummaryResult.resueltos}</strong>
                    </div>
                    <div className="admin-audit-res-card admin-audit-res-card--amber">
                      <span className="admin-audit-res-lbl">En Trámite</span>
                      <strong className="admin-audit-res-val">{auditSummaryResult.enTramite}</strong>
                    </div>
                    <div className="admin-audit-res-card admin-audit-res-card--blue">
                      <span className="admin-audit-res-lbl">Efectividad Global</span>
                      <strong className="admin-audit-res-val">{resolutionRate}%</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="modal-card__footer admin-modal-footer" style={{ justifyContent: 'flex-end', gap: '0.65rem' }}>
              {!isAuditingAll && !auditSummaryResult && (
                <>
                  <button type="button" className="admin-btn admin-btn--cancel" onClick={() => setShowAuditModal(false)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--start-audit"
                    onClick={handleStartAuditAll}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>Iniciar Auditoría Masiva ⚡</span>
                  </button>
                </>
              )}

              {auditSummaryResult && (
                <button
                  type="button"
                  className="admin-btn admin-btn--save-modal"
                  onClick={() => setShowAuditModal(false)}
                >
                  <span>Entendido y Ver Solicitudes</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación Unificado */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDeleteTarget}
        title={deleteTarget?.type === 'pqr' ? 'Eliminar radicado' : 'Eliminar usuario'}
        itemName={deleteTarget?.name}
        itemCategory={deleteTarget?.category}
        itemSubtitle={deleteTarget?.subtitle}
        description={deleteTarget?.description}
        warningText={
          deleteTarget?.type === 'pqr'
            ? '¿Estás seguro de que deseas eliminar este radicado? Esta acción es permanente y eliminará todos los registros de la base de datos.'
            : '¿Estás seguro de que deseas eliminar este usuario? Esta acción es permanente y eliminará su cuenta de la base de datos.'
        }
        confirmText={deleteTarget?.type === 'pqr' ? 'Eliminar radicado' : 'Eliminar usuario'}
        cancelText="Cancelar"
        isDeleting={isDeletingTarget}
      />
    </div>
  );
};

export default AdminDashboard;
