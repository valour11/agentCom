import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import socket from '../socket';
import { MessageSquare, User, Send, Search, MoreVertical, Phone, Video, Paperclip, Smile } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'https://agentcom-wxmv.onrender.com'}/api`;

const Messages = ({ agentId }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (agentId) {
      fetchConversations();
    }
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/conversations?agentId=${agentId}`);
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`${API_URL}/messages/${conversationId}`);
      console.log('[Messages] Fetched', response.data.length, 'messages for conversation', conversationId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    console.log('[Socket] Setting up listeners, activeConversation:', activeConversation?.id);

    const handleNewMessage = (message) => {
      console.log('[Socket] NEW_MESSAGE received:', {
        msgConvId: message.conversationId,
        activeConvId: activeConversation?.id,
        match: message.conversationId === activeConversation?.id,
        message
      });
      if (activeConversation && message.conversationId === activeConversation.id) {
        setMessages((prev) => [...prev, message]);
      }
      setConversations((prev) =>
        prev.map(c => c.id === message.conversationId ? { ...c, lastMessage: message } : c)
      );
    };

    const handleNewConversation = (conv) => {
      setConversations((prev) => [conv, ...prev]);
    };

    const handleUpdateConversation = (data) => {
      setConversations((prev) =>
        prev.map(c => c.id === data.id ? { ...c, ...data } : c)
      );
      if (activeConversation && data.id === activeConversation.id) {
        setActiveConversation((prev) => ({ ...prev, ...data }));
      }
    };

    socket.on('NEW_MESSAGE', handleNewMessage);
    socket.on('NEW_CONVERSATION', handleNewConversation);
    socket.on('UPDATE_CONVERSATION', handleUpdateConversation);

    return () => {
      socket.off('NEW_MESSAGE', handleNewMessage);
      socket.off('NEW_CONVERSATION', handleNewConversation);
      socket.off('UPDATE_CONVERSATION', handleUpdateConversation);
    };
  }, [activeConversation]);

  useEffect(() => {
    if (activeConversation) {
      console.log('[Socket] Joining room:', activeConversation.id);
      socket.emit('join_conversation', activeConversation.id);
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeConversation) return;

    if (!activeConversation.assignedAgentId) {
      alert('Please claim this conversation first.');
      return;
    }

    const messageData = {
      agentId,
      phoneNumber: activeConversation.contact.phoneNumber,
      messageBody: inputValue
    };

    try {
      setInputValue('');
      await axios.post(`${API_URL}/messages/send`, messageData);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleClaimConversation = async () => {
    if (!activeConversation) return;

    try {
      const response = await axios.post(`${API_URL}/conversations/${activeConversation.id}/assign`, {
        agentId
      });
      setActiveConversation(response.data);
    } catch (error) {
      console.error('Error claiming conversation:', error);
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.contact?.phoneNumber?.includes(searchQuery) || ''
  );

  return (
    <div className="h-full flex gap-5">
      {/* Conversation Panel */}
      <div
        className="w-[320px] flex flex-col flex-shrink-0 overflow-hidden"
        style={{
          background: 'rgba(245, 243, 252, 0.85)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.06)',
          border: '1px solid rgba(120,160,255,0.12)',
          padding: '20px',
        }}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between rounded-md">
          <h2 className="text-sm font-semibold" style={{ color: '#24439b' }}>All Messages</h2>
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(106,167,255,0.15), rgba(138,92,246,0.15))',
              color: '#5f7bd6',
            }}
          >
            {conversations.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative" style={{ marginTop: '16px', marginBottom: '18px' }}>
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8bb1ff' }} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 text-[14px] outline-none transition-all"
            style={{
              height: '35px',
              borderRadius: '10px',
              border: '1px solid rgba(120, 160, 255, 0.45)',
              background: 'rgba(255,255,255,0.5)',
              color: '#1e2a4a',
              paddingLeft: '10px',
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = '0 0 0 3px rgba(106, 167, 255, 0.2)';
              e.target.style.borderColor = 'rgba(106, 167, 255, 0.7)';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
              e.target.style.borderColor = 'rgba(120, 160, 255, 0.45)';
            }}
          />
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto" style={{ borderTop: '1px solid rgba(120,160,255,0.1)', paddingTop: '4px' }}>
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center" style={{ paddingTop: '40px', paddingBottom: '40px', gap: '18px' }}>
              <div
                className="flex items-center justify-center"
                style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
              >
                <MessageSquare className="w-9 h-9 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#5f7bd6' }}>No conversations</p>
                <p className="text-xs mt-2" style={{ color: '#8bb1ff' }}>Waiting for incoming messages</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className="w-full flex items-start text-left transition-all duration-300"
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: activeConversation?.id === conv.id ? 'rgba(255,255,255,0.5)' : 'transparent',
                    borderLeft: activeConversation?.id === conv.id ? '3px solid #8a5cf6' : '3px solid transparent',
                    gap: '14px',
                  }}
                  onMouseEnter={(e) => {
                    if (activeConversation?.id !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeConversation?.id !== conv.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: activeConversation?.id === conv.id
                          ? 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)'
                          : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <User className="w-4 h-4" style={{ color: activeConversation?.id === conv.id ? '#fff' : '#8bb1ff' }} />
                    </div>
                    <span
                      className="absolute"
                      style={{ bottom: '0', right: '0', width: '12px', height: '12px', borderRadius: '50%', background: '#34d399', border: '2px solid white' }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate" style={{ color: '#24439b' }}>
                        {conv.contact?.name || conv.contact?.phoneNumber || 'Unknown'}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-xs ml-2 flex-shrink-0" style={{ color: '#8bb1ff' }}>
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: '#5f7bd6', marginTop: '4px' }}>
                      {conv.lastMessage?.messageBody || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{
                height: '64px',
                padding: '0 24px',
                background: 'rgba(245, 243, 252, 0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                border: '1px solid rgba(120,160,255,0.12)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#24439b' }}>
                    {activeConversation.contact?.name || activeConversation.contact?.phoneNumber || 'Unknown'}
                  </p>
                  <p className="text-xs" style={{ color: '#5f7bd6' }}>
                    {activeConversation.assignedAgentId ? 'Assigned to you' : 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!activeConversation.assignedAgentId && (
                  <button
                    onClick={handleClaimConversation}
                    className="text-white text-sm font-medium rounded-xl transition-all duration-300 hover:brightness-110"
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(90deg, #3d82f6 0%, #8b5cf6 100%)',
                      boxShadow: '0 4px 12px rgba(90,100,255,0.2)',
                    }}
                  >
                    Claim Chat
                  </button>
                )}
                {[Phone, Video, MoreVertical].map((Icon, i) => (
                  <button
                    key={i}
                    className="rounded-xl transition-all duration-300"
                    style={{ padding: '10px', color: '#8bb1ff' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ marginTop: '20px', padding: '32px', borderRadius: '24px', background: 'rgba(245, 243, 252, 0.35)', border: '1px solid rgba(120,160,255,0.08)' }}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center" style={{ paddingTop: '60px', paddingBottom: '60px', gap: '18px' }}>
                  <div
                    className="flex items-center justify-center"
                    style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
                  >
                    <MessageSquare className="w-9 h-9 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#5f7bd6' }}>No messages yet</p>
                    <p className="text-xs mt-2" style={{ color: '#8bb1ff' }}>Start the conversation</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[60%]"
                        style={{
                          padding: '12px 16px',
                          borderRadius: msg.senderType === 'agent' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: msg.senderType === 'agent'
                            ? 'linear-gradient(135deg, #3d82f6 0%, #8b5cf6 100%)'
                            : 'rgba(255,255,255,0.7)',
                          color: msg.senderType === 'agent' ? '#fff' : '#24439b',
                          border: msg.senderType === 'user' ? '1px solid rgba(120,160,255,0.15)' : 'none',
                          boxShadow: msg.senderType === 'user' ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 12px rgba(90,100,255,0.15)',
                        }}
                      >
                        <p className="text-[14px] leading-relaxed break-words">{msg.messageBody}</p>
                        <p className="text-[11px]" style={{ color: msg.senderType === 'agent' ? 'rgba(255,255,255,0.7)' : '#8bb1ff', marginTop: '8px' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div
              className="flex-shrink-0"
              style={{ marginTop: '20px', padding: '16px 20px', background: 'rgba(245, 243, 252, 0.85)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(120,160,255,0.12)' }}
            >
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <button type="button" className="rounded-xl transition-all duration-300 flex-shrink-0" style={{ padding: '10px', color: '#8bb1ff' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Paperclip className="w-[18px] h-[18px]" />
                </button>
                <input
                  type="text"
                  className="flex-1 px-4 text-[14px] outline-none transition-all"
                  style={{
                    height: '48px',
                    borderRadius: '14px',
                    border: '1px solid rgba(120, 160, 255, 0.45)',
                    background: 'rgba(255,255,255,0.5)',
                    color: '#1e2a4a',
                    paddingLeft: '12px',
                  }}
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 3px rgba(106, 167, 255, 0.2)';
                    e.target.style.borderColor = 'rgba(106, 167, 255, 0.7)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = 'rgba(120, 160, 255, 0.45)';
                  }}
                />
                <button type="button" className="rounded-xl transition-all duration-300 flex-shrink-0" style={{ padding: '10px', color: '#8bb1ff' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Smile className="w-[18px] h-[18px]" />
                </button>
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 flex-shrink-0"
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #3d82f6 0%, #8b5cf6 100%)',
                    boxShadow: '0 4px 12px rgba(90,100,255,0.2)',
                  }}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty State */
          <div
            className="flex-1 flex items-center justify-center"
            style={{
              background: 'rgba(245, 243, 252, 0.5)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              border: '1px solid rgba(120,160,255,0.12)',
            }}
          >
            <div className="text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
              <div
                className="flex items-center justify-center"
                style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
              >
                <MessageSquare className="w-9 h-9 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: '#24439b' }}>Select a conversation</h3>
                <p className="text-sm mt-2" style={{ color: '#5f7bd6' }}>Choose a chat from the sidebar to start messaging</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
