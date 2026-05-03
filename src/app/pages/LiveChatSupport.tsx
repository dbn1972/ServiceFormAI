import { Send, Paperclip, Phone, Video, MoreVertical, CheckCheck, Clock, User, Minimize2, Maximize2, Star } from 'lucide-react';
import { useState, useRef, useEffect, FormEvent } from 'react';
import { toast } from 'sonner';

interface Message {
  id: number;
  type: 'system' | 'agent' | 'user';
  sender?: string;
  text: string;
  time: string;
  status?: 'sending' | 'sent' | 'read';
}

export default function LiveChatSupport() {
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'system',
      text: 'Chat started with Support Agent Rajesh Kumar',
      time: '10:30 AM',
    },
    {
      id: 2,
      type: 'agent',
      sender: 'Rajesh Kumar',
      text: 'Hello Ananya! Welcome to ServiceFormAI support. How can I help you today?',
      time: '10:30 AM',
      status: 'read',
    },
    {
      id: 3,
      type: 'user',
      text: 'Hi! I submitted my Driving License Renewal application (APP-2026-8901) on April 20, but the status has been stuck on "Document Under Verification" for a week now.',
      time: '10:31 AM',
      status: 'read',
    },
    {
      id: 4,
      type: 'agent',
      sender: 'Rajesh Kumar',
      text: 'I understand your concern. Let me check the status of your application right away.',
      time: '10:32 AM',
      status: 'read',
    },
    {
      id: 5,
      type: 'system',
      text: 'Rajesh is checking your application details...',
      time: '10:32 AM',
    },
    {
      id: 6,
      type: 'agent',
      sender: 'Rajesh Kumar',
      text: "Thank you for waiting. I can see your application APP-2026-8901. The verification team has completed their review, and I'm pleased to inform you that all your documents have been verified successfully! ✓",
      time: '10:33 AM',
      status: 'read',
    },
    {
      id: 7,
      type: 'agent',
      sender: 'Rajesh Kumar',
      text: 'The status will be updated to "Approved" within the next 2 hours, and you should receive a notification via SMS and email.',
      time: '10:33 AM',
      status: 'read',
    },
  ]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      text: message,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Simulate message sent
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' as const } : msg
        )
      );
    }, 500);

    // Simulate agent typing
    setTimeout(() => {
      setIsTyping(true);
    }, 1000);

    // Simulate agent response
    setTimeout(() => {
      setIsTyping(false);
      
      const agentResponse: Message = {
        id: messages.length + 2,
        type: 'agent',
        sender: 'Rajesh Kumar',
        text: 'Thank you for your message! I will help you with that right away.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      };

      setMessages(prev => [...prev, agentResponse]);
    }, 3000);
  };

  const handleFileAttach = () => {
    toast.info('File attachment coming soon!');
  };

  const handleVideoCall = () => {
    toast.info('Video call feature coming soon!');
  };

  const handleVoiceCall = () => {
    toast.info('Voice call feature coming soon!');
  };

  const handleRateChat = () => {
    toast.success('Thank you for your feedback!');
  };

  return (
    <div className="min-h-full bg-background flex items-center justify-center p-4">
      <div className={`w-full transition-all duration-300 ${isMinimized ? 'max-w-sm' : 'max-w-4xl'}`}>
        {/* Chat Window */}
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ height: isMinimized ? '80px' : '700px' }}>
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Rajesh Kumar</h3>
                <p className="text-xs text-primary-foreground/80">Support Agent • Online</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleVoiceCall}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={handleVideoCall}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Video className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/30">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {msg.type === 'system' && (
                      <div className="flex justify-center">
                        <div className="bg-muted/50 px-4 py-2 rounded-full">
                          <p className="text-xs text-muted-foreground text-center">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    )}

                    {msg.type === 'agent' && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">{msg.sender}</p>
                          <div className="bg-card border border-border rounded-2xl rounded-tl-none p-4 max-w-lg">
                            <p className="text-sm">{msg.text}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">{msg.time}</p>
                            {msg.status === 'read' && (
                              <CheckCheck className="w-3 h-3 text-primary" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {msg.type === 'user' && (
                      <div className="flex items-start gap-3 justify-end">
                        <div className="flex-1 flex justify-end">
                          <div>
                            <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none p-4 max-w-lg">
                              <p className="text-sm">{msg.text}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1 justify-end">
                              <p className="text-xs text-muted-foreground">{msg.time}</p>
                              {msg.status === 'sending' && (
                                <Clock className="w-3 h-3 text-muted-foreground" />
                              )}
                              {msg.status === 'sent' && (
                                <CheckCheck className="w-3 h-3 text-muted-foreground" />
                              )}
                              {msg.status === 'read' && (
                                <CheckCheck className="w-3 h-3 text-primary" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="bg-card border border-border rounded-2xl rounded-tl-none p-4">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="border-t border-border p-3 bg-muted/30">
                <div className="flex gap-2 overflow-x-auto">
                  {[
                    'Check Application Status',
                    'Track My Documents',
                    'Payment Issues',
                    'Update Profile',
                  ].map((action, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(action)}
                      className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium hover:bg-accent whitespace-nowrap"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="border-t border-border p-4 bg-card">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleFileAttach}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />

                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Rating Footer */}
              <div className="border-t border-border p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">How was your experience?</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={handleRateChat}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className="w-5 h-5 text-muted-foreground hover:text-warning hover:fill-warning" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Chat Info */}
        {!isMinimized && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Your conversation is encrypted and secure • Average response time: 2 min
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
