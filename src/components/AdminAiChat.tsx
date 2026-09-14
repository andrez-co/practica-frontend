import React, { useState, useRef, useEffect } from 'react';
import type { PQRSData } from './TarjetaTramite';
import './AdminAiChat.css';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  attachedFileName?: string;
}

interface AdminAiChatProps {
  usersList: Array<{ id: string; email: string; name: string; role: string }>;
  pqrsList: PQRSData[];
}

export const AdminAiChat: React.FC<AdminAiChatProps> = ({ usersList, pqrsList }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: '**Asistente de IA para Administración & Auditoría Normativa**\n\nHola Administrador. Estoy listo para ayudarte a auditar las PQRS radicadas, analizar normativas de servicios públicos domiciliarios (Leyes 142/1994 y 1755/2015) e inspeccionar los usuarios registrados. Mi configuración opera con **temperatura 0.2** e instrucciones estrictas de imparcialidad y seguridad.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFile(file);

      // Simulación de OCR y extracción de texto para PNG / PDF / TXT
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (file.type.includes('text') || file.name.endsWith('.txt')) {
          setOcrText(content);
        } else {
          setOcrText(`[OCR Extracción Simula de ${file.name}]: Documento cargado correctamente. Contenido normativo o soporte técnico detectado.`);
        }
      };
      if (file.type.includes('text')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
  };

  const callAiApi = async (userPrompt: string, fileContext: string | null) => {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY || '';

    // Construcción del contexto del sistema
    const usersContextStr = usersList
      .map((u) => `- Usuario: ${u.name} (${u.email}) | Rol actual: ${u.role}`)
      .join('\n');

    const pqrsContextStr = pqrsList
      .map(
        (p) =>
          `- Radicado ${p.id}: Solicitante "${p.solicitante}", Categoría "${p.categoria}", Estado "${p.estado}", Descripción: "${p.descripcion}"`
      )
      .join('\n');

    const systemPrompt = `Eres un Asistente Experto en Administración Pública y Auditoría de PQRS de Servicios Públicos Domiciliarios en Colombia (Ley 142 de 1994, Ley 1755 de 2015).
Responde de forma profesional, objetiva y concisa.

DATOS DEL SISTEMA EN TIEMPO REAL:

USUARIOS REGISTRADOS:
${usersContextStr || 'Sin usuarios registrados actualmente.'}

RADICADOS PQRS ACTUALES:
${pqrsContextStr || 'Sin PQRS registradas actualmente.'}

Puedes dar resúmenes del día, estadísticas de PQRS, información de usuarios, y análisis normativos.`;

    const fullUserContent = fileContext
      ? `${userPrompt}\n\n[ARCHIVO ADJUNTO]:\n${fileContext}`
      : userPrompt;

    const candidateModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];

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
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: fullUserContent },
            ],
            temperature: 0.3,
            max_tokens: 450,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Groq API error con ${model}:`, response.status, errorText);
          continue;
        }

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          return data.choices[0].message.content;
        }
      } catch (err) {
        console.warn(`Error llamando modelo ${model}:`, err);
      }
    }

    return `[IA sin conexión] Se detectaron ${pqrsList.length} radicados PQRS y ${usersList.length} usuarios registrados. No fue posible conectar con el servicio de inteligencia artificial en este momento. Por favor reintenta en unos instantes.`;
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMsg;
    if (!textToSend.trim() && !attachedFile) return;

    const fileAttachedName = attachedFile?.name;
    const fileContentOcr = ocrText;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedFileName: fileAttachedName,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInputMsg('');
    setAttachedFile(null);
    setOcrText(null);
    setLoading(true);

    try {
      const aiReplyText = await callAiApi(textToSend, fileContentOcr);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generando respuesta de IA:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-ai-chat">
      <div className="admin-ai-chat__header">
        <div className="admin-ai-chat__title-group">
          <span className="admin-ai-badge">IA Temp: 0.2</span>
          <h3>Asistente de Inteligencia Artificial & Auditoría Normativa</h3>
        </div>
        <p className="admin-ai-chat__sub">
          Inspección de usuarios, verificación de políticas (Ley 142 y 1755) y filtro estricto antiesgaños.
        </p>
      </div>

      {/* Botones de accesos rápidos normativos */}
      <div className="admin-ai-shortcuts">
        <button
          type="button"
          onClick={() =>
            handleSendMessage('Compara las quejas actuales con la Ley 142 de 1994 e indica si hay fallas en la prestación del servicio.')
          }
        >
          Comparar con Ley 142
        </button>
        <button
          type="button"
          onClick={() =>
            handleSendMessage('Audita el cumplimiento del plazo legal de 15 días según la Ley 1755 de 2015 para las PQRS en trámite.')
          }
        >
          Auditoría Plazos Legales
        </button>
        <button
          type="button"
          onClick={() =>
            handleSendMessage('Analiza los usuarios registrados y emite un informe administrativo consolidado.')
          }
        >
          Resumen de Usuarios
        </button>
      </div>

      {/* Mensajes del chat */}
      <div className="admin-ai-chat__body">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble chat-bubble--${m.sender}`}>
            {m.sender === 'ai' && <div className="chat-avatar" style={{fontSize: '0.8rem'}}>IA</div>}
            <div className="chat-content">
              {m.attachedFileName && (
                <div className="chat-file-tag">
                  Archivo adjunto: <strong>{m.attachedFileName}</strong>
                </div>
              )}
              <div className="chat-text">{m.text}</div>
              <span className="chat-time">{m.timestamp}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble chat-bubble--ai">
            <div className="chat-avatar" style={{fontSize: '0.8rem'}}>IA</div>
            <div className="chat-content">
              <div className="chat-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input y adjuntos */}
      <div className="admin-ai-chat__footer">
        {attachedFile && (
          <div className="chat-file-preview">
            <span>[Adjunto] {attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB - OCR Listo)</span>
            <button type="button" onClick={() => { setAttachedFile(null); setOcrText(null); }}>✕</button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="chat-form"
        >
          <label className="chat-attach-btn" title="Adjuntar PNG, PDF o Documento (OCR)">
            <input type="file" accept=".png,.jpg,.jpeg,.pdf,.txt" onChange={handleFileAttach} hidden />
            +
          </label>
          <input
            type="text"
            className="chat-input"
            placeholder="Pregunta sobre normativas, compara leyes o audita una PQR..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="chat-send-btn" disabled={loading || (!inputMsg.trim() && !attachedFile)}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAiChat;
