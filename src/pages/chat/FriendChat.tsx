import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { User, Menu, Send, Loader2, CheckCheck, AlertCircle } from 'lucide-react';
import type { FriendMessageWithStatus } from '../../types/chat';
import type { Friend } from '../../Services/friendshipApi';
import { getMessages } from '../../Services/friendshipApi';
import { formatTimestamp } from '../../utils/formatTimestamp';
import { ProfilePanel } from '../../components/chat/ProfilePanel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface FriendChatContext {
    user: { id: number } | null;
    friends: Friend[];
    selectedFriend: Friend | null;
    onFriendClick: (friend: Friend) => void;
    setShowSidebar: (show: boolean) => void;
    onRemoveFriend: (id: number) => Promise<void>;
    onBlockFriend: (id: number) => Promise<void>;
}

export const FriendChat = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const context = useOutletContext<FriendChatContext>();
    const { user, friends, onFriendClick, setShowSidebar, onRemoveFriend, onBlockFriend } = context;
    
    const friendId = id ? parseInt(id, 10) : null;
    const selectedFriend = friends.find((f: Friend) => f.id === friendId) || null;
    
    // Update selected friend in parent when friend changes
    useEffect(() => {
        if (selectedFriend && onFriendClick) {
            onFriendClick(selectedFriend);
        }
    }, [friendId, selectedFriend?.id, onFriendClick]);
    
    // Update selected friend in parent when friend changes
    useEffect(() => {
        if (selectedFriend && context.onFriendClick) {
            context.onFriendClick(selectedFriend);
        }
    }, [selectedFriend?.id]);
    
    const [friendMessages, setFriendMessages] = useState<Map<number, FriendMessageWithStatus[]>>(new Map());
    const [friendPages, setFriendPages] = useState<Map<number, number>>(new Map());
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState<Map<number, boolean>>(new Map());
    const [friendChatInput, setFriendChatInput] = useState('');
    const [showChatProfile, setShowChatProfile] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const loadFriendMessages = async (friendId: number, page = 1, append = false) => {
        try {
            const response = await getMessages(friendId, page);
            const messages = response.messages || [];
            
            setFriendMessages(prev => {
                const updated = new Map(prev);
                if (append) {
                    const existing = updated.get(friendId) || [];
                    // Backend returns cumulative results (page 1 = 10, page 2 = 20, etc.)
                    // So we need to extract only the new messages
                    const existingIds = new Set(existing.map(msg => msg.ID));
                    const allMessages = [...messages].reverse(); // Reverse to get oldest first
                    const newMessages = allMessages.filter(msg => !existingIds.has(msg.ID));
                    updated.set(friendId, [...newMessages, ...existing]);
                } else {
                    // For initial load, just reverse to show oldest first
                    updated.set(friendId, [...messages].reverse());
                }
                return updated;
            });
            
            setFriendPages(prev => new Map(prev).set(friendId, page));
            // Check if there are more messages (if we got exactly 10 * page messages, there might be more)
            setHasMoreMessages(prev => new Map(prev).set(friendId, messages.length === 10 * page));
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    useEffect(() => {
        if (friendId) {
            loadFriendMessages(friendId);
        }
    }, [friendId]);

    const loadOlderMessages = async (friendId: number) => {
        if (loadingOlderMessages || !hasMoreMessages.get(friendId)) return;
        
        setLoadingOlderMessages(true);
        const currentPage = friendPages.get(friendId) || 1;
        const scrollHeight = messagesContainerRef.current?.scrollHeight || 0;
        
        try {
            await loadFriendMessages(friendId, currentPage + 1, true);
            
            // Restore scroll position after loading older messages
            requestAnimationFrame(() => {
                if (messagesContainerRef.current) {
                    const newScrollHeight = messagesContainerRef.current.scrollHeight;
                    messagesContainerRef.current.scrollTop = newScrollHeight - scrollHeight;
                }
            });
        } catch (error) {
            console.error('Failed to load older messages:', error);
        } finally {
            setLoadingOlderMessages(false);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        // Load older messages when scrolled to top (with small threshold)
        if (container.scrollTop <= 50 && friendId && !loadingOlderMessages && hasMoreMessages.get(friendId)) {
            loadOlderMessages(friendId);
        }
    };

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (!loadingOlderMessages) {
            scrollToBottom();
        }
    }, [friendMessages, loadingOlderMessages]);

    // WebSocket setup for receiving messages
    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token || !friendId) return;

        const wsUrl = `${API_BASE_URL.replace(/^http/, 'ws')}/websocket/connect?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'direct_message' && data.from === friendId) {
                    const messageId = data.id || data.message_id || Date.now();
                    setFriendMessages(prev => {
                        const updated = new Map(prev);
                        const messages = updated.get(friendId) || [];
                        // Check if message already exists by ID
                        const exists = messages.some(msg => msg.ID === messageId || (msg.tempId && msg.ID === messageId));
                        if (exists) return updated;
                        
                        const newMessage: FriendMessageWithStatus = {
                            ID: messageId,
                            SenderID: data.from,
                            ReceiverID: user?.id || 0,
                            Content: data.content || '',
                            Timestamp: data.timestamp || new Date().toISOString(),
                        };
                        updated.set(friendId, [...messages, newMessage]);
                        return updated;
                    });
                    setTimeout(() => scrollToBottom(), 100);
                }
            } catch (err) {
                console.error('WebSocket message error:', err);
            }
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [friendId, user?.id]);

    const sendSocketMessage = (payload: Record<string, unknown>) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
        }
    };

    const handleSendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (!friendChatInput.trim() || !friendId) return;
        
        const content = friendChatInput.trim();
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const tempMessageId = Date.now();
        const newMessage: FriendMessageWithStatus = {
            ID: tempMessageId,
            SenderID: user?.id || 0,
            ReceiverID: friendId,
            Content: content,
            Timestamp: new Date().toISOString(),
            status: 'pending',
            tempId,
        };
        
        setFriendMessages(prev => {
            const updated = new Map(prev);
            const messages = updated.get(friendId) || [];
            // Check if message already exists
            const exists = messages.some(msg => msg.tempId === tempId || (msg.ID === tempMessageId && msg.SenderID === user?.id));
            if (exists) return updated;
            updated.set(friendId, [...messages, newMessage]);
            return updated;
        });
        
        setFriendChatInput('');
        sendSocketMessage({ type: 'direct_message', to: friendId, content });
        
        setTimeout(() => {
            setFriendMessages(prev => {
                const updated = new Map(prev);
                const messages = updated.get(friendId) || [];
                const updatedMessages = messages.map(msg => {
                    if (msg.tempId === tempId && msg.status === 'pending') {
                        return { ...msg, status: 'sent' as const };
                    }
                    return msg;
                });
                updated.set(friendId, updatedMessages);
                return updated;
            });
        }, 500);
    };

    const handleRemove = async () => {
        if (!friendId) return;
        await onRemoveFriend(friendId);
        navigate('/chat/friends');
    };

    const handleBlock = async () => {
        if (!friendId) return;
        await onBlockFriend(friendId);
        navigate('/chat/friends');
    };

    if (!friendId || !selectedFriend) {
        return (
            <main className="flex-1 flex flex-col bg-white">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">Friend not found</div>
                </div>
            </main>
        );
    }

    const currentMessages = friendMessages.get(friendId) || [];

    return (
        <>
            <main className="flex-1 flex flex-col bg-white transition-all duration-300 min-h-0 overflow-hidden">
                <header className={`flex items-center justify-between px-6 border-b border-gray-100 transition-all duration-300 ${showChatProfile ? 'opacity-0 -translate-y-full h-0 overflow-hidden border-0' : 'opacity-100 translate-y-0 h-20'}`}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowSidebar(true)}
                            className="lg:hidden p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <Menu size={20} className="text-[#3498DB]" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                            {selectedFriend.avatar ? (
                                <img src={selectedFriend.avatar} alt={selectedFriend.username} className="w-full h-full object-cover" />
                            ) : (
                                <User size={24} className="text-gray-500 m-auto mt-2.5" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-[#3498DB] font-bold text-lg">{selectedFriend.username}</h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowChatProfile(!showChatProfile)}
                        className={`text-[#3498DB] p-2 hover:bg-blue-50 rounded-full transition-colors ${showChatProfile ? 'bg-blue-50' : ''}`}
                    >
                        <User size={20} />
                    </button>
                </header>

                <div className={`flex-1 flex flex-col items-center justify-center px-6 w-full min-h-0 bg-[#FAFBFC] transition-all duration-300 ${showChatProfile ? 'pt-0' : ''}`}>
                    <div className="w-full max-w-4xl flex flex-col h-full max-h-full min-h-0 py-6">
                        <div 
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hide-scrollbar min-h-0"
                        >
                            {currentMessages.length === 0 ? (
                                <div className="text-center text-gray-500 text-sm">
                                    Start a conversation with {selectedFriend.username}!
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {loadingOlderMessages && (
                                        <div className="text-center py-2">
                                            <Loader2 size={16} className="animate-spin text-gray-400 mx-auto" />
                                        </div>
                                    )}
                                    {currentMessages.map((msg, idx) => (
                                        <div key={msg.tempId || `${msg.ID}-${idx}`}>
                                            {idx === 0 && (
                                                <div className="date-divider">
                                                    <span>Today</span>
                                                </div>
                                            )}
                                            <div className={`flex items-end gap-2 ${msg.SenderID === user?.id ? 'justify-end' : 'justify-start'}`}>
                                                <div 
                                                    className={`message-bubble ${msg.SenderID === user?.id ? 'message-sent' : 'message-received'} ${msg.status === 'failed' ? 'opacity-75' : ''} relative group cursor-default`}
                                                >
                                                    {msg.Content}
                                                    <div className={`absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${
                                                        msg.SenderID === user?.id ? 'right-0' : 'left-0'
                                                    }`}>
                                                        {formatTimestamp(msg.Timestamp)}
                                                    </div>
                                                </div>
                                                {msg.SenderID === user?.id && (
                                                    <div className="flex-shrink-0 mb-1">
                                                        {msg.status === 'pending' && (
                                                            <Loader2 size={12} className="text-blue-300 animate-spin" />
                                                        )}
                                                        {msg.status === 'sent' && (
                                                            <CheckCheck size={12} className="text-blue-300" />
                                                        )}
                                                        {msg.status === 'failed' && (
                                                            <div title="Message failed to send">
                                                                <AlertCircle size={12} className="text-red-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="mt-3 flex gap-3 flex-shrink-0">
                            <input
                                type="text"
                                value={friendChatInput}
                                onChange={(e) => setFriendChatInput(e.target.value)}
                                placeholder="Type your message ..."
                                className="flex-1 border border-gray-300 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!friendChatInput.trim()}
                                className="w-12 h-12 bg-yellow-400 text-white rounded-full shadow-md hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            {showChatProfile && (
                <ProfilePanel
                    selectedFriend={selectedFriend}
                    onClose={() => setShowChatProfile(false)}
                    onRemove={handleRemove}
                    onBlock={handleBlock}
                />
            )}
        </>
    );
};

