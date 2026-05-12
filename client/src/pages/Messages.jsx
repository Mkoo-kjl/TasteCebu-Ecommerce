import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiSend, FiMessageSquare, FiArrowLeft, FiSearch, FiCheck, FiCheckCircle } from 'react-icons/fi';
import CustomerSidebar from '../components/CustomerSidebar';

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data.conversations);
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convId, silent = false) => {
    if (!convId) return;
    if (!silent) setChatLoading(true);
    try {
      const res = await api.get(`/messages/conversations/${convId}`);
      setMessages(res.data.messages);
      setOtherUser(res.data.other_user);
      // Mark as read
      await api.put(`/messages/conversations/${convId}/read`);
      // Refresh conversation list to update unread counts
      if (!silent) {
        const listRes = await api.get('/messages/conversations');
        setConversations(listRes.data.conversations);
      }
    } catch {
      if (!silent) toast.error('Failed to load messages');
    } finally {
      setChatLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle URL param for opening specific conversation
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId && !loading) {
      setActiveConversation(Number(convId));
      setMobileShowChat(true);
    }
  }, [searchParams, loading]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    }
  }, [activeConversation, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Polling for new messages
  useEffect(() => {
    if (activeConversation) {
      pollRef.current = setInterval(() => {
        fetchMessages(activeConversation, true);
        fetchConversations();
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConversation, fetchMessages, fetchConversations]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    try {
      const res = await api.post(`/messages/conversations/${activeConversation}`, {
        content: newMessage.trim()
      });
      setMessages(prev => [...prev, res.data.message]);
      setNewMessage('');
      scrollToBottom();
      // Refresh conversation list
      fetchConversations();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (convId) => {
    setActiveConversation(convId);
    setMobileShowChat(true);
    setSearchParams({ conversation: convId });
  };

  const handleBackToList = () => {
    setMobileShowChat(false);
    setActiveConversation(null);
    setSearchParams({});
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchTerm.trim()) return true;
    const name = (c.business_name || c.other_name || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const oneDay = 86400000;

    if (diff < oneDay && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 7 * oneDay) {
      return d.toLocaleDateString('en-PH', { weekday: 'short' });
    }
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = formatMessageDate(msg.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-main-standalone" id="messages-page">
        <div className="messages-page" id="messages-page">
          <div className="page-header">
            <h1><FiMessageSquare size={24} /> Messages</h1>
      </div>

      <div className="messages-layout">
        {/* Conversation List */}
        <div className={`messages-sidebar ${mobileShowChat ? 'mobile-hidden' : ''}`}>
          <div className="messages-search">
            <FiSearch size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="conversations-list">
            {filteredConversations.length === 0 ? (
              <div className="conversations-empty">
                <FiMessageSquare size={32} />
                <p>{searchTerm ? 'No matches' : 'No conversations yet'}</p>
                <span>Start a conversation </span>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${activeConversation === conv.id ? 'active' : ''}`}
                  onClick={() => selectConversation(conv.id)}
                  id={`conversation-${conv.id}`}
                >
                  <div className="conv-avatar">
                    {conv.other_avatar ? (
                      <img src={conv.other_avatar} alt={conv.other_name} />
                    ) : (
                      <div className="conv-avatar-placeholder">
                        {(conv.business_name || conv.other_name)?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    {conv.unread_count > 0 && (
                      <span className="conv-unread-dot"></span>
                    )}
                  </div>
                  <div className="conv-info">
                    <div className="conv-info-top">
                      <span className="conv-name">{conv.business_name || conv.other_name}</span>
                      <span className="conv-time">{conv.last_message_at ? formatTime(conv.last_message_at) : ''}</span>
                    </div>
                    <div className="conv-info-bottom">
                      <span className="conv-last-msg">{conv.last_message || 'No messages yet'}</span>
                      {conv.unread_count > 0 && (
                        <span className="conv-unread-badge">{conv.unread_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`messages-chat ${!mobileShowChat && !activeConversation ? 'mobile-hidden' : ''}`}>
          {!activeConversation ? (
            <div className="chat-empty">
              <FiMessageSquare size={48} />
              <h3>Select a conversation</h3>
              <p>Choose from your existing conversations or start a new one</p>
            </div>
          ) : chatLoading && messages.length === 0 ? (
            <div className="loading-screen"><div className="spinner"></div></div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <button className="chat-back-btn" onClick={handleBackToList}>
                  <FiArrowLeft size={18} />
                </button>
                <div className="chat-header-avatar">
                  {otherUser?.avatar ? (
                    <img src={otherUser.avatar} alt={otherUser.name} />
                  ) : (
                    <div className="conv-avatar-placeholder sm">
                      {(otherUser?.business_name || otherUser?.name)?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="chat-header-info">
                  <span className="chat-header-name">{otherUser?.business_name || otherUser?.name}</span>
                  <span className="chat-header-role">{otherUser?.role === 'seller' ? 'Seller' : 'Customer'}</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="chat-messages" id="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-no-messages">
                    <p>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                      <div className="chat-date-divider">
                        <span>{date}</span>
                      </div>
                      {msgs.map(msg => (
                        <div
                          key={msg.id}
                          className={`chat-message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                          id={`message-${msg.id}`}
                        >
                          <div className="chat-bubble">
                            <p>{msg.content}</p>
                            <span className="chat-msg-time">
                              {formatMessageTime(msg.created_at)}
                              {msg.sender_id === user.id && (
                                <span className="chat-msg-status">
                                  {msg.is_read ? <FiCheckCircle size={12} /> : <FiCheck size={12} />}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form className="chat-input-bar" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  id="message-input"
                />
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!newMessage.trim() || sending}
                  id="send-message-btn"
                >
                  <FiSend size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
