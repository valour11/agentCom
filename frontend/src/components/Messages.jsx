import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import socket from '../socket';
import { MessageSquare, User, Send, Search, MoreVertical, Phone, Video, Paperclip, Smile } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

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
      <div
        className="w-[320px] flex flex-col flex-shrink-0 overflow-hidden"
        style={{
          background: 'rgba(245, 243, 252, 0.85)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.06)',
          border: '1px solid rgba(120,160,255,0.12)',
        }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold" style={{ color: '#24439b' }}>All Messages</h2>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(106,167,255,0.15), rgba(138,92,246,0.15))',
              color: '#5f7bd6',
            }}
          >
            {conversations.length}
          </span>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8bb1ff' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 text-[14px] outline-none transition-all"
              style={{
                height: '44px',
                borderRadius: '12px',
                border: '1px solid rgba(120, 160, 255, 0.45)',
                background: 'rgba(255,255,255,0.5)',
                color: '#1e2a4a',
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
        </div>

        <div
          className="flex-1 overflow-y-auto"
          style={{ borderTop: '1px solid rgba(120,160,255,0.1)' }}
        >
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
              >
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium" style={{ color: '#5f7bd6' }}>No conversations</p>
              <p className="text-xs mt-1" style={{ color: '#8bb1ff' }}>Waiting for incoming messages</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                className="w-full px-4 py-3.5 flex items-start gap-3 transition-all duration-300 text-left"
                style={{
                  borderLeft: activeConversation?.id === conv.id ? '3px solid #8a5cf6' : '3px solid transparent',
                  background: activeConversation?.id === conv.id ? 'rgba(255,255,255,0.5)' : 'transparent',
                  borderBottom: '1px solid rgba(120,160,255,0.06)',
                }}
                onMouseEnter={(e) => {
                  if (activeConversation?.id !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  if (activeConversation?.id !== conv.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div className="relative">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{
                      background: activeConversation?.id === conv.id
                        ? 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)'
                        : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <User className="w-4 h-4" style={{ color: activeConversation?.id === conv.id ? '#fff' : '#8bb1ff' }} />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full" style={{ background: '#34d399' }} />
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
                  <p className="text-xs truncate mt-1" style={{ color: '#5f7bd6' }}>
                    {conv.lastMessage?.messageBody || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeConversation ? (
          <>
            <div
              className="h-16 flex items-center justify-between px-6 flex-shrink-0"
              style={{
                background: 'rgba(245, 243, 252, 0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(120,160,255,0.12)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
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
                    className="px-4 py-2 text-white text-sm font-medium rounded-xl transition-all duration-300 hover:brightness-110 mr-2"
                    style={{
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
                    className="p-2.5 rounded-xl transition-all duration-300"
                    style={{ color: '#8bb1ff' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 px-5 pb-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[60%] px-4 py-3"
                    style={{
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
                    <p className="text-[11px] mt-1.5" style={{ color: msg.senderType === 'agent' ? 'rgba(255,255,255,0.7)' : '#8bb1ff' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div
              className="flex-shrink-0 px-5 py-4 mt-3"
              style={{
                background: 'rgba(245, 243, 252, 0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(120,160,255,0.12)',
              }}
            >
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <button type="button" className="p-2 rounded-xl transition-all duration-300" style={{ color: '#8bb1ff' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Paperclip className="w-[18px] h-[18px]" />
                </button>
                <input
                  type="text"
                  className="flex-1 px-4 text-[14px] outline-none transition-all"
                  style={{
                    height: '46px',
                    borderRadius: '12px',
                    border: '1px solid rgba(120, 160, 255, 0.45)',
                    background: 'rgba(255,255,255,0.5)',
                    color: '#1e2a4a',
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
                <button type="button" className="p-2 rounded-xl transition-all duration-300" style={{ color: '#8bb1ff' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Smile className="w-[18px] h-[18px]" />
                </button>
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="p-3 rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
                  style={{
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
          <div
            className="flex-1 flex items-center justify-center"
            style={{
              background: 'rgba(245, 243, 252, 0.5)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(120,160,255,0.12)',
            }}
          >
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
              >
                <MessageSquare className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: '#24439b' }}>Select a conversation</h3>
              <p className="text-sm" style={{ color: '#5f7bd6' }}>Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
