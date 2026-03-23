import { useState, useRef, useEffect } from 'react';
import ChatMessage from '../components/ChatMessage';
import { askAI } from '../api';
import { FiSend, FiMic, FiMicOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AiChat() {
  const defaultMessage = { role: 'assistant', content: 'Hello! I\'m your AI academic assistant. Ask me anything about your department subjects — I\'ll search through department resources to give you the best answer. 📚🤖' };

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse chatHistory", e);
      }
    }
    return [defaultMessage];
  });
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const loadingRef = useRef(false);
  const inputRef = useRef('');

  // Sync refs with state
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // Core submit logic
  const submitQuestion = async (questionText) => {
    if (!questionText.trim()) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: questionText }]);
    setLoading(true);

    try {
      const res = await askAI(questionText);
      const data = res.data;
      let answer = data.answer || 'Sorry, I couldn\'t find an answer.';

      if (data.sources && data.sources.length > 0) {
        const uniqueSources = [...new Set(data.sources.map((s) => s.title?.trim()).filter(Boolean))];
        answer += '\n\n📎 Sources: ' + uniqueSources.join(', ');
      }
      if (data.context_used === false) {
        answer += '\n\n⚠️ Note: No matching department resources found — this is a general answer.';
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '❌ Error: ' + (err.response?.data?.detail || 'Failed to get response') }]);
    }
    setLoading(false);
  };

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListening(true);
    };


    recognition.onresult = (event) => {
      let transcript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          transcript += result[0].transcript;
        }
      }
    
      transcript = transcript.trim();
    
      if (!transcript) {
        toast.error("Speech not detected properly");
        return;
      }
    
      setInput(transcript);
      submitQuestion(transcript);
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed') toast.error("Microphone access denied");
      else if (event.error === 'no-speech') {
        // Silently handled by state reset
      } else {
        toast.error("Voice recognition error: " + event.error);
      }
    };

    recognition.onend = () => {
      setListening(false);
    
      if (!inputRef.current.trim()) {
        toast.error("No clear speech detected. Speak louder or closer to mic.");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Handle case where it might already be starting
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.start();
        }, 200);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (loading) return;
    submitQuestion(input.trim());
  };

  const suggestions = [
    'Explain recursion with examples',
    'What is OS scheduling?',
    'Advantages of linked lists',
    'Explain DBMS normalization',
  ];

  return (
    <div>
      <div className="page-header">
        <h1>AI Doubt Assistant</h1>
        <p>Ask questions and get answers from your department knowledge base (RAG-powered)</p>
      </div>

      <div className="glass-card-static chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="avatar">🤖</div>
              <div className="bubble">
                <div className="loading-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0' }}>
            {suggestions.map((s) => (
              <button key={s} className="btn btn-secondary btn-sm"
                onClick={() => { setInput(s); }}>
                {s}
              </button>
            ))}
          </div>
        )}

        <form className="chat-input-area" onSubmit={handleSend}>
          <input
            id="chat-input"
            type="text"
            placeholder={listening ? "Listening..." : "Ask about any concept..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button 
            type="button" 
            className={`btn ${listening ? 'btn-danger' : 'btn-secondary'}`} 
            onClick={toggleListening}
            title="Voice Input"
          >
            {listening ? <FiMicOff /> : <FiMic />}
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
}
