'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import { INITIAL_CHAT, QUICK_PROMPTS } from '@/lib/mock-data';
import AgentTag from '@/components/primitives/AgentTag';
import { useAegis } from '@/context/AegisContext';

const TYPING_TEXTS = [
  'SENTINEL: Scanning active LEO catalog...',
  'ANALYST: Quantifying encounter covariance...',
  'ANALYST: Evaluating NASA STD-8719.14 action thresholds...',
  'COMMANDER: Computing optimal avoidance delta-V...',
  'COMMANDER: Verifying burn windows and Isp constraints...',
  'HERALD: Formatting operator tactical bulletin...'
];

interface AgentStepperProps {
  step: number;
}

function AgentStepper({ step }: AgentStepperProps) {
  const agents = [
    { name: 'SENTINEL', role: 'Scanning', color: 'var(--agent-sentinel)', steps: [0] },
    { name: 'ANALYST', role: 'Quantifying', color: 'var(--agent-analyst)', steps: [1, 2] },
    { name: 'COMMANDER', role: 'Planning', color: 'var(--agent-commander)', steps: [3, 4] },
    { name: 'HERALD', role: 'Briefing', color: 'var(--agent-herald)', steps: [5] }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      background: 'rgba(21,17,0,0.5)',
      border: '0.5px solid var(--b1)',
      borderRadius: 4,
      padding: '12px 16px',
      marginTop: 4,
      marginBottom: 16,
      animation: 'fade-in-up 200ms ease-out'
    }}>
      {/* Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '0.5px solid var(--b0)',
        paddingBottom: 6,
        marginBottom: 2
      }}>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: '0.15em',
          color: 'var(--t2)'
        }}>
          AEGIS SECURE PIPELINE ORCHESTRATOR
        </span>
        <span style={{
          fontFamily: "'Source Code Pro', monospace",
          fontSize: 9,
          color: 'var(--gold)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--gold)',
            boxShadow: '0 0 6px var(--gold)',
            animation: 'live-pulse 1s infinite'
          }} />
          ORBITAL PIPELINE SCANNING
        </span>
      </div>

      {/* Steps */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        padding: '0 10px',
        marginTop: 4
      }}>
        {/* Connection Line */}
        <div style={{
          position: 'absolute',
          top: 14,
          left: 30,
          right: 30,
          height: 1,
          background: 'var(--b0)',
          zIndex: 1
        }} />

        {/* Animated Active Line */}
        <div style={{
          position: 'absolute',
          top: 14,
          left: 30,
          width: `${(step / (TYPING_TEXTS.length - 1)) * 82}%`,
          height: 1.5,
          background: 'linear-gradient(90deg, var(--agent-sentinel), var(--agent-analyst), var(--agent-commander), var(--agent-herald))',
          boxShadow: '0 0 8px var(--gold)',
          transition: 'width 0.4s ease',
          zIndex: 2
        }} />

        {agents.map((agent, i) => {
          const isActive = agent.steps.includes(step);
          const isDone = agent.steps.every(s => step > s);
          
          return (
            <div key={agent.name} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 3,
              width: 90
            }}>
              {/* Node Circle */}
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: isDone 
                  ? agent.color 
                  : isActive 
                    ? 'var(--bg)' 
                    : 'var(--bg-2)',
                border: isActive 
                  ? `2px solid ${agent.color}` 
                  : isDone 
                    ? `1px solid ${agent.color}` 
                    : '1.5px solid var(--b2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isActive 
                  ? `0 0 12px ${agent.color}` 
                  : isDone 
                    ? `0 0 6px ${agent.color}` 
                    : 'none',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}>
                {isDone ? (
                  <span style={{ fontSize: 11, color: '#000', fontWeight: 900 }}>✓</span>
                ) : (
                  <span style={{ 
                    fontSize: 9, 
                    color: isActive ? agent.color : 'var(--t2)',
                    fontWeight: 700,
                    fontFamily: "'Source Code Pro', monospace"
                  }}>
                    0{i+1}
                  </span>
                )}
                
                {/* Active Outer Ring */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    inset: -5,
                    border: `1.5px solid ${agent.color}`,
                    borderRadius: '50%',
                    opacity: 0.8,
                    animation: 'live-pulse 1s ease-in-out infinite'
                  }} />
                )}
              </div>

              {/* Node Label */}
              <span style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: 10,
                color: isActive ? '#fff' : isDone ? 'var(--t1)' : 'var(--t3)',
                marginTop: 6,
                letterSpacing: '0.05em',
                transition: 'color 0.3s ease'
              }}>
                {agent.name}
              </span>

              {/* Node Status Text */}
              <span style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 500,
                fontSize: 8,
                color: isActive ? agent.color : isDone ? 'var(--t2)' : 'transparent',
                marginTop: 2,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                transition: 'color 0.3s ease'
              }}>
                {isActive ? agent.role : isDone ? 'COMPLETED' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingStep, setTypingStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { objects, setSelectedObjectId, stats } = useAegis();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Cycle status texts when processing
  useEffect(() => {
    if (!isTyping) {
      setTypingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setTypingStep((prev) => (prev + 1) % TYPING_TEXTS.length);
    }, 600);
    return () => clearInterval(interval);
  }, [isTyping]);

  const parseInlineMarkdown = (text: string, keyPrefix: string): React.ReactNode => {
    if (!text) return '';
    const inlineRegex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    const segments = text.split(inlineRegex);
    if (segments.length === 1) {
      return text;
    }
    return segments.map((seg, idx) => {
      const key = `${keyPrefix}-${idx}`;
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return <strong key={key} style={{ fontWeight: 600, color: 'var(--t0)' }}>{seg.slice(2, -2)}</strong>;
      }
      if (seg.startsWith('`') && seg.endsWith('`')) {
        return (
          <code 
            key={key} 
            style={{ 
              fontFamily: "'Source Code Pro', monospace", 
              background: 'rgba(255,255,255,0.06)', 
              padding: '1px 4px', 
              borderRadius: 2, 
              fontSize: 12, 
              color: 'var(--gold)',
              border: '0.5px solid var(--b0)'
            }}
          >
            {seg.slice(1, -1)}
          </code>
        );
      }
      if (seg.startsWith('*') && seg.endsWith('*')) {
        return <em key={key} style={{ fontStyle: 'italic', color: 'var(--t1)' }}>{seg.slice(1, -1)}</em>;
      }
      return seg;
    });
  };

  const renderMessageLine = (line: string, i: number) => {
    const trimmed = line.trim();
    if (trimmed === '---') {
      return (
        <div key={i} style={{
          height: '0.5px',
          background: 'var(--b0)',
          margin: '14px 0',
        }} />
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h1 key={i} style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: 'var(--gold)',
          margin: '14px 0 8px 0',
          borderBottom: '0.5px solid var(--b0)',
          paddingBottom: 4,
        }}>
          {parseAegisMessage(line.substring(2))}
        </h1>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: 'var(--gold)',
          margin: '12px 0 6px 0',
          letterSpacing: '0.05em',
        }}>
          {parseAegisMessage(line.substring(3))}
        </h2>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h3 key={i} style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 600,
          fontSize: 14,
          color: 'var(--gold)',
          margin: '10px 0 6px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {parseAegisMessage(line.substring(4))}
        </h3>
      );
    }
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const cleanLine = trimmed.replace(/^[*+-]\s+/, '');
      return (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          paddingLeft: 8,
          margin: '4px 0',
        }}>
          <span style={{
            color: 'var(--gold)',
            fontFamily: 'monospace',
            fontSize: 10,
            userSelect: 'none',
            marginTop: 4,
          }}>▪</span>
          <div style={{ flex: 1 }}>
            {parseAegisMessage(cleanLine)}
          </div>
        </div>
      );
    }

    // Default line rendering
    return (
      <div key={i} style={{ minHeight: trimmed === '' ? '8px' : 'auto', marginBottom: 2 }}>
        {parseAegisMessage(line)}
      </div>
    );
  };

  const parseAegisMessage = (text: string) => {
    const tokenRegex = /(DEFCON\s*[1-5]|NORAD\s*(?:ID:?)?\s*\d{5}|Pc\s*[=:]\s*[0-9.eE+-]+|Maneuver\s+Recommendation\s*:\s*\w+|Maneuver\s*:\s*\w+)/gi;
    
    if (!text) return '';
    
    const parts = text.split(tokenRegex);
    return parts.map((part, index) => {
      if (/DEFCON\s*[1-5]/i.test(part)) {
        const levelMatch = part.match(/\d/);
        const level = levelMatch ? parseInt(levelMatch[0]) : 5;
        let color = 'var(--t3)';
        let bg = 'rgba(255,255,255,0.05)';
        let border = '0.5px solid var(--b1)';
        
        if (level === 1) {
          color = 'var(--red)';
          bg = 'var(--red-dim)';
          border = '0.5px solid rgba(255,48,48,0.4)';
        } else if (level === 2) {
          color = 'var(--orange)';
          bg = 'rgba(255,104,32,0.1)';
          border = '0.5px solid rgba(255,104,32,0.4)';
        } else if (level === 3) {
          color = 'var(--gold)';
          bg = 'rgba(255,194,0,0.1)';
          border = '0.5px solid rgba(255,194,0,0.4)';
        } else if (level === 4) {
          color = 'var(--blue)';
          bg = 'rgba(68,136,255,0.1)';
          border = '0.5px solid rgba(68,136,255,0.4)';
        } else {
          color = 'var(--green)';
          bg = 'var(--green-dim)';
          border = '0.5px solid rgba(46,216,122,0.3)';
        }
        
        return (
          <span 
            key={index} 
            style={{ 
              color, 
              background: bg, 
              border, 
              padding: '1px 5px', 
              borderRadius: 2, 
              fontSize: 10, 
              fontWeight: 700,
              fontFamily: "'Source Code Pro', monospace",
              display: 'inline-flex',
              alignItems: 'center',
              margin: '0 4px',
              boxShadow: level <= 2 ? '0 0 8px rgba(255,48,48,0.2)' : 'none',
            }}
          >
            {part.toUpperCase()}
          </span>
        );
      }
      
      if (/NORAD\s*(?:ID:?)?\s*\d{5}/i.test(part)) {
        const numMatch = part.match(/\d{5}/);
        const noradId = numMatch ? numMatch[0] : '';
        const obj = objects.find(o => String(o.noradId) === noradId);
        
        return (
          <button
            key={index}
            onClick={() => {
              if (obj) {
                setSelectedObjectId(obj.id);
              }
            }}
            style={{
              background: 'var(--bg-2)',
              border: obj ? '0.5px solid var(--gold)' : '0.5px solid var(--b1)',
              borderRadius: 2,
              padding: '1px 5px',
              fontSize: 11,
              fontFamily: "'Source Code Pro', monospace",
              color: obj ? 'var(--gold)' : 'var(--t2)',
              cursor: obj ? 'pointer' : 'default',
              display: 'inline-flex',
              alignItems: 'center',
              margin: '0 2px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (obj) {
                e.currentTarget.style.background = 'var(--gold)';
                e.currentTarget.style.color = '#000';
              }
            }}
            onMouseLeave={(e) => {
              if (obj) {
                e.currentTarget.style.background = 'var(--bg-2)';
                e.currentTarget.style.color = 'var(--gold)';
              }
            }}
            title={obj ? `Track ${obj.name}` : 'Orbital target offline'}
          >
            🛰️ {part} {obj ? `(${obj.name.split(' ')[0]})` : ''}
          </button>
        );
      }
      
      if (/Pc\s*[=:]\s*[0-9.eE+-]+/i.test(part)) {
        return (
          <span 
            key={index} 
            style={{ 
              color: 'var(--t0)', 
              fontFamily: "'Source Code Pro', monospace", 
              fontWeight: 600, 
              background: 'rgba(255,255,255,0.06)',
              border: '0.5px solid var(--b0)',
              padding: '1px 4px',
              borderRadius: 2,
              fontSize: 11,
              margin: '0 2px'
            }}
          >
            {part}
          </span>
        );
      }

      if (/Maneuver\s+Recommendation\s*:\s*\w+|Maneuver\s*:\s*\w+/i.test(part)) {
        const isGo = part.toUpperCase().includes('GO') && !part.toUpperCase().includes('NO_GO') && !part.toUpperCase().includes('NONE');
        return (
          <span 
            key={index} 
            style={{ 
              color: isGo ? 'var(--gold)' : 'var(--orange)', 
              fontFamily: "'Rajdhani', sans-serif", 
              fontWeight: 700, 
              background: isGo ? 'var(--gold-glow)' : 'rgba(255,104,32,0.08)',
              border: isGo ? '0.5px solid var(--gold)' : '0.5px solid rgba(255,104,32,0.3)',
              padding: '1px 5px',
              borderRadius: 2,
              fontSize: 11,
              display: 'inline-flex',
              alignItems: 'center',
              margin: '0 2px'
            }}
          >
            {part}
          </span>
        );
      }
      
      return <React.Fragment key={index}>{parseInlineMarkdown(part, String(index))}</React.Fragment>;
    });
  };

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: msg,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Call the real AEGIS AI Chat endpoint
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: msg,
        sessionId: 'operator-console-session'
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('API communication failed');
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);

        const aegisMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'aegis',
          agent: 'HERALD',
          text: data.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aegisMsg]);
      })
      .catch((err) => {
        console.error(err);
        const fallbackMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'aegis',
          agent: 'HERALD',
          text: 'Operator, communications link degraded. Unable to establish connection to AEGIS core. Verify that your GEMINI_API_KEY is configured.',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, fallbackMsg]);
      })
      .finally(() => {
        setIsTyping(false);
      });
  };

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerSquare} />
          <span style={styles.headerTitle}>AEGIS INTELLIGENCE</span>
        </div>
        <div style={styles.headerRight}>
          <span style={{ ...styles.agentDot, background: 'var(--agent-sentinel)' }} />
          <span style={{ ...styles.agentDot, background: 'var(--agent-analyst)' }} />
          <span style={{ ...styles.agentDot, background: 'var(--agent-commander)' }} />
          <span style={{ ...styles.agentDot, background: 'var(--agent-herald)' }} />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={styles.messages} className="scrollable">
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--gold)', display: 'inline-block' }} />
              <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: '11px', color: 'var(--gold)', fontWeight: 'bold' }}>AEGIS ONLINE</span>
            </div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', color: 'var(--t0)', lineHeight: '1.6', margin: 0 }}>
              All systems nominal. Currently monitoring {stats.activeConjunctions} active conjunctions. DEFCON {stats.criticalAlerts > 0 ? '2' : '5'} declared.
              {stats.criticalAlerts > 0 && ` ${stats.criticalAlerts} event${stats.criticalAlerts > 1 ? 's' : ''} require immediate attention.`}
            </p>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', color: 'var(--t0)', margin: 0 }}>Ask me anything about orbital safety.</p>
            
            {/* Quick starters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {[
                'What is Kessler Syndrome?',
                'Show highest risk right now',
                'How many debris objects exist?',
                'What happened in 2009?',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '12px',
                    color: 'var(--t1)',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--b1)',
                    borderRadius: '3px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--gold)';
                    e.currentTarget.style.borderColor = 'var(--gold-20)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--t1)';
                    e.currentTarget.style.borderColor = 'var(--b1)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={msg.role === 'user' ? styles.userMsgWrap : styles.aegisMsgWrap}>
            {msg.role === 'aegis' ? (
              <>
                <div style={styles.agentCol}>
                  <AgentTag agent={msg.agent!} size={8} />
                  <span style={styles.msgTimestamp}>
                    {mounted ? new Date(msg.timestamp).toISOString().slice(11, 19) : ''}
                  </span>
                </div>
                <div style={styles.aegisText}>
                  {msg.text.split('\n').map((line, i) => renderMessageLine(line, i))}
                </div>
                <div style={styles.aegisSep} />
              </>
            ) : (
              <div style={styles.userBubble}>{msg.text}</div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={styles.aegisMsgWrap}>
            <AgentStepper step={typingStep} />
            <div style={styles.typing}>
              <span style={styles.typingText}>{TYPING_TEXTS[typingStep]}</span>
              <span style={styles.cursor}>▊</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div style={styles.quickPrompts}>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            style={styles.quickBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--b3)';
              e.currentTarget.style.color = 'var(--gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--b1)';
              e.currentTarget.style.color = 'var(--t1)';
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={styles.inputWrap}>
        <input
          type="text"
          placeholder="Ask about any object or conjunction..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={styles.input}
        />
        <button
          onClick={() => handleSend()}
          style={styles.sendBtn}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--t0)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--gold)'; }}
        >
          SEND →
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    top: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 640,
    height: 'calc(100vh - 68px)',
    background: 'rgba(6, 5, 10, 0.91)',
    backdropFilter: 'blur(16px) saturate(110%)',
    WebkitBackdropFilter: 'blur(16px) saturate(110%)',
    border: '1px solid rgba(255, 194, 0, 0.09)',
    borderRadius: '4px',
    zIndex: 30,
    display: 'flex',
    flexDirection: 'column',
    animation: 'fade-in-up 280ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  header: {
    height: 44,
    borderBottom: '0.5px solid var(--b0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerSquare: {
    width: 10,
    height: 10,
    background: 'var(--gold)',
    borderRadius: 1,
  },
  headerTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--gold)',
  },
  headerRight: {
    display: 'flex',
    gap: 4,
  },
  agentDot: {
    width: 8,
    height: 8,
    borderRadius: 1,
    display: 'inline-block',
  },
  messages: {
    flex: 1,
    padding: '24px 28px',
    overflowY: 'auto',
  },
  aegisMsgWrap: {
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  agentCol: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  msgTimestamp: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 9,
    color: 'var(--t3)',
  },
  aegisText: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 400,
    fontSize: 14,
    color: 'var(--t1)',
    lineHeight: 1.7,
    paddingLeft: 0,
  },
  aegisSep: {
    height: 0.5,
    background: 'var(--b0)',
    marginTop: 16,
  },
  userMsgWrap: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  userBubble: {
    maxWidth: '75%',
    background: 'var(--bg-2)',
    border: '0.5px solid var(--b1)',
    borderRadius: 3,
    padding: '10px 14px',
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 400,
    fontSize: 14,
    color: 'var(--t0)',
    lineHeight: 1.5,
  },
  typing: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  typingText: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 13,
    color: 'var(--t3)',
  },
  cursor: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 14,
    color: 'var(--t3)',
    animation: 'live-pulse 1s ease-in-out infinite',
  },
  quickPrompts: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    padding: '8px 28px',
    flexShrink: 0,
  },
  quickBtn: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 500,
    fontSize: 11,
    color: 'var(--t1)',
    background: 'var(--bg-2)',
    border: '0.5px solid var(--b1)',
    borderRadius: 2,
    padding: '4px 10px',
    cursor: 'pointer',
    transition: 'border-color var(--ms-0), color var(--ms-0)',
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-2)',
    borderTop: '0.5px solid var(--b1)',
    padding: '12px 16px',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 13,
    color: 'var(--t0)',
    background: 'none',
    border: 'none',
    outline: 'none',
  },
  sendBtn: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: '0.1em',
    color: 'var(--gold)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    transition: 'color var(--ms-0)',
    padding: '4px 8px',
  },
};
