import React, { useEffect, useRef, useState } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const CHAT_ENDPOINT = `${SUPABASE_URL}/functions/v1/chat`;

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: 'Hola, soy el asistente virtual de NOVASTONE. ¿En qué puedo ayudarte?',
};

export default function TestChat() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json();

      if (data.ok && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Hubo un error. Por favor intentá de nuevo.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'No pudimos conectar con el servidor.' },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#080808',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', paddingBottom: '4px' }}>
          <p
            style={{
              color: '#555',
              fontSize: '10px',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              margin: '0 0 10px',
            }}
          >
            Entorno de prueba · No compartir
          </p>
          <h1
            style={{
              color: '#e8e8e8',
              fontSize: '18px',
              fontWeight: 300,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Asistente NOVASTONE
          </h1>
        </div>

        {/* Chat window */}
        <div
          style={{
            backgroundColor: '#0f0f0f',
            border: '1px solid #1e1e1e',
            borderRadius: '2px',
            height: '500px',
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '4px',
              }}
            >
              <span
                style={{
                  color: '#3a3a3a',
                  fontSize: '9px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                {msg.role === 'user' ? 'Vos' : 'Asistente'}
              </span>
              <div
                style={{
                  backgroundColor: msg.role === 'user' ? '#181818' : '#131313',
                  border: `1px solid ${msg.role === 'user' ? '#2a2a2a' : '#1a1a1a'}`,
                  borderRadius: '2px',
                  padding: '11px 15px',
                  maxWidth: '82%',
                }}
              >
                <p
                  style={{
                    color: msg.role === 'user' ? '#d4d4d4' : '#b8b8b8',
                    fontSize: '14px',
                    lineHeight: '1.65',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '4px',
              }}
            >
              <span
                style={{
                  color: '#3a3a3a',
                  fontSize: '9px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                Asistente
              </span>
              <div
                style={{
                  backgroundColor: '#131313',
                  border: '1px solid #1a1a1a',
                  borderRadius: '2px',
                  padding: '11px 15px',
                }}
              >
                <p style={{ color: '#3a3a3a', fontSize: '14px', margin: 0 }}>
                  · · ·
                </p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu consulta... (Enter para enviar)"
            rows={2}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: '#0f0f0f',
              border: '1px solid #252525',
              borderRadius: '2px',
              color: '#d4d4d4',
              fontSize: '14px',
              lineHeight: '1.5',
              padding: '11px 14px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              opacity: loading ? 0.5 : 1,
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              backgroundColor:
                loading || !input.trim() ? 'transparent' : '#e8e8e8',
              border: '1px solid #252525',
              borderRadius: '2px',
              color: loading || !input.trim() ? '#333' : '#080808',
              fontSize: '10px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s, color 0.2s',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
            }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
