import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { UserPlus, Clock, Check, Send, Menu } from 'lucide-react';
import type { RandomChatMessage, SocketState, RandomState } from '../../types/chat';
import { handleServerOffline } from '../../utils/auth';
import StartWhirlIcon from '../../assets/icons/startwhirl.svg';
import BG from '../../assets/icons/BG.svg';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const RANDOM_STORAGE_KEY = 'random_chat_session';

export const RandomChat = () => {
    const navigate = useNavigate();
    const context = useOutletContext<any>();
    const setShowSidebar = context?.setShowSidebar || (() => {});
    
    const [socketState, setSocketState] = useState<SocketState>('disconnected');
    const [randomState, setRandomState] = useState<RandomState>('idle');
    const [_statusText, setStatusText] = useState<string>('Tap Start Whirl to find a partner');
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<RandomChatMessage[]>([]);
    const [friendRequestStatus, setFriendRequestStatus] = useState<'idle' | 'pending' | 'sent' | 'received' | 'success'>('idle');
    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const randomPlaceholder = {
        id: 'random-partner',
        name: 'Random Whirler',
        bio: 'Say hi to your new match!',
        country: 'Unknown',
        countryFlag: '🌍',
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const appendSystemMessage = (content: string) => {
        setChatMessages((prev) => {
            const next = [
                ...prev,
                {
                    id: `${Date.now()}-sys`,
                    content,
                    fromSelf: false,
                    timestamp: Date.now(),
                    system: true,
                },
            ];
            localStorage.setItem(
                RANDOM_STORAGE_KEY,
                JSON.stringify({ messages: next, randomState, hadChat: true })
            );
            return next;
        });
    };

    const connectSocket = () => {
        if (socketState === 'connecting' || socketState === 'connected') {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                return;
            }
        }

        const token = localStorage.getItem('jwt_token');
        if (!token) {
            setStatusText('Missing token. Please log in again.');
            return;
        }

        setSocketState('connecting');
        const wsUrl = `${API_BASE_URL.replace(/^http/, 'ws')}/websocket/connect?token=${encodeURIComponent(token)}`;

        let ws: WebSocket;
        try {
            ws = new WebSocket(wsUrl);
        } catch (err) {
            console.error('WebSocket init failed', err);
            setSocketState('disconnected');
            setStatusText('Unable to open websocket. Check token or server.');
            return;
        }
        wsRef.current = ws;

        ws.onopen = () => {
            setSocketState('connected');
            setStatusText('Connected. Tap Start Whirl to join the queue.');
        };

        ws.onclose = (evt) => {
            if (evt.code !== 1000 && evt.code !== 1001) {
                setSocketState('disconnected');
                setRandomState('idle');
                
                if (evt.code === 1006 || evt.code === 1002 || !evt.wasClean) {
                    setTimeout(() => {
                        fetch(`${API_BASE_URL}/health`, { 
                            method: 'GET',
                            signal: AbortSignal.timeout(2000)
                        }).catch(() => {
                            handleServerOffline('Server is offline. Please try again later.');
                        });
                    }, 1000);
                }
                
                const reasonText = evt.code === 1008 ? 'Unauthorized websocket. Please re-login.' : 'Disconnected. Tap to retry.';
                setStatusText(reasonText);
            }
        };

        ws.onerror = () => {
            setStatusText('Socket error. Retrying...');
            setTimeout(() => {
                fetch(`${API_BASE_URL}/health`, { 
                    method: 'GET',
                    signal: AbortSignal.timeout(2000)
                }).catch(() => {
                    handleServerOffline('Server is offline. Please try again later.');
                });
            }, 1000);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const type = data?.type as string;

                switch (type) {
                    case 'random_joined':
                        setRandomState('paired');
                        setFriendRequestStatus('idle');
                        setStatusText('You are now connected! Say hi.');

                        setChatMessages((prevMessages) => {
                            const systemMessage = {
                                id: `${Date.now()}-sys`,
                                content: 'You have been whirled! Start chatting.',
                                fromSelf: false,
                                timestamp: Date.now(),
                                system: true,
                            };
                            const next = [...prevMessages, systemMessage];
                            localStorage.setItem(
                                RANDOM_STORAGE_KEY,
                                JSON.stringify({
                                    messages: next,
                                    randomState: 'paired',
                                    hadChat: true,
                                })
                            );
                            return next;
                        });
                        break;

                    case 'message_random':
                        setChatMessages((prev) => {
                            const next = [
                                ...prev,
                                {
                                    id: `${Date.now()}-in`,
                                    content: data.content ?? '',
                                    fromSelf: false,
                                    timestamp: Date.now(),
                                },
                            ];
                            localStorage.setItem(
                                RANDOM_STORAGE_KEY,
                                JSON.stringify({ messages: next, randomState: 'paired', hadChat: true })
                            );
                            return next;
                        });
                        break;

                    case 'friend_request':
                        appendSystemMessage('You received a friend request!');
                        if (friendRequestStatus === 'pending') {
                        } else {
                            setFriendRequestStatus('received');
                        }
                        break;

                    case 'friend_request_success':
                        setFriendRequestStatus('success');
                        appendSystemMessage('🎉 You are now friends!');
                        navigate('/chat/friends');
                        break;

                    case 'friend_request_failed':
                        setFriendRequestStatus('idle');
                        appendSystemMessage('Failed to send friend request. Please try again.');
                        break;

                    case 'notification':
                        if (data.content === 'random_pair_left') {
                            setRandomState('idle');
                            setFriendRequestStatus('idle');
                            appendSystemMessage('Your match has left. Tap Start Whirl to find another.');
                            setStatusText('Your match left. Re-queue to connect again.');
                            localStorage.removeItem(RANDOM_STORAGE_KEY);
                        }
                        break;

                    case 'error':
                        appendSystemMessage(data.content || 'Something went wrong.');
                        setStatusText(data.content || 'Error received from server.');
                        if (data.code === 'CONNECTION_NOT_EXIST' || data.code === 'INVALID_RECEIVER') {
                            setRandomState('idle');
                            setFriendRequestStatus('idle');
                            localStorage.removeItem(RANDOM_STORAGE_KEY);
                        } else if (data.code === 'SEND_MESSAGE_FAILED') {
                            setRandomState('idle');
                            setFriendRequestStatus('idle');
                            appendSystemMessage('Your match has disconnected.');
                            localStorage.removeItem(RANDOM_STORAGE_KEY);
                        }
                        break;
                }
            } catch (err) {
                appendSystemMessage('Received malformed message from server.');
                console.error(err);
            }
        };
    };

    useEffect(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            connectSocket();
        }
        return () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };
    }, []);

    const sendSocketMessage = (payload: Record<string, unknown>) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
        } else {
            setStatusText('Socket not ready. Tap Connect to retry.');
        }
    };

    const joinRandom = () => {
        if (socketState !== 'connected') {
            setStatusText('Connecting socket...');
            connectSocket();
            return;
        }
        setChatMessages([]);
        localStorage.removeItem(RANDOM_STORAGE_KEY);
        setRandomState('queueing');
        setStatusText('Finding a partner...');
        appendSystemMessage('Joining random queue...');
        sendSocketMessage({ type: 'join_random' });
    };

    const leaveRandom = () => {
        const wasPaired = randomState === 'paired';
        const wasQueueing = randomState === 'queueing';
        
        if (wasQueueing || wasPaired) {
            sendSocketMessage({ type: 'leave_random' });
        }
        
        setRandomState('idle');
        setFriendRequestStatus('idle');
        
        if (wasPaired) {
            setStatusText('Left chat. Tap Start Whirl to find a new partner.');
            appendSystemMessage('You left the chat.');
            setChatMessages([]);
            localStorage.removeItem(RANDOM_STORAGE_KEY);
        } else if (wasQueueing) {
            setStatusText('Left queue. Tap Start Whirl to try again.');
            appendSystemMessage('You left the queue.');
        }
    };

    const handleSendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        if (randomState !== 'paired') {
            appendSystemMessage('You are not connected to a random user yet.');
            return;
        }
        const content = chatInput.trim();
        setChatMessages((prev) => {
            const next = [
                ...prev,
                {
                    id: `${Date.now()}-out`,
                    content,
                    fromSelf: true,
                    timestamp: Date.now(),
                },
            ];
            localStorage.setItem(
                RANDOM_STORAGE_KEY,
                JSON.stringify({ messages: next, randomState, hadChat: true })
            );
            return next;
        });
        setChatInput('');
        sendSocketMessage({ type: 'message_random', content });
    };

    const handleAddFriend = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && randomState === 'paired') {
            if (friendRequestStatus === 'received') {
                setFriendRequestStatus('pending');
            } else {
                setFriendRequestStatus('pending');
            }
            wsRef.current.send(JSON.stringify({ type: 'friend_request' }));
        }
    };

    const isPaired = randomState === 'paired';

    return (
        <main className="flex-1 flex flex-col bg-white transition-all duration-300 min-h-0 overflow-hidden">
            <header className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSidebar(true)}
                        className="lg:hidden p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Menu size={20} className="text-[#3498DB]" />
                    </button>
                    {isPaired && (
                        <>
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-[#3498DB] font-bold text-lg">{randomPlaceholder.name}</h1>
                                <div className="status-dot status-online"></div>
                            </div>
                        </>
                    )}
                    {!isPaired && (
                        <h1 className="text-[#3498DB] font-bold text-lg">Random Chat</h1>
                    )}
                </div>
                {isPaired && (
                    <button
                        onClick={handleAddFriend}
                        disabled={friendRequestStatus === 'pending' || friendRequestStatus === 'success'}
                        className={`p-2 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            friendRequestStatus === 'pending' 
                                ? 'text-yellow-600 bg-yellow-50' 
                                : friendRequestStatus === 'received'
                                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                    : friendRequestStatus === 'success'
                                        ? 'text-green-600 bg-green-50'
                                        : 'text-[#3498DB]'
                        }`}
                        title={
                            friendRequestStatus === 'pending' 
                                ? 'Request pending...' 
                                : friendRequestStatus === 'received'
                                    ? 'Click to accept friend request'
                                    : friendRequestStatus === 'success'
                                        ? 'Friend request sent!'
                                        : 'Add Friend'
                        }
                    >
                        {friendRequestStatus === 'pending' ? (
                            <Clock size={20} />
                        ) : friendRequestStatus === 'received' ? (
                            <Check size={20} />
                        ) : friendRequestStatus === 'success' ? (
                            <Check size={20} />
                        ) : (
                            <UserPlus size={20} />
                        )}
                    </button>
                )}
            </header>

            <div className="flex-1 flex flex-col items-center justify-center px-6 w-full min-h-0 bg-[#FAFBFC]">
                {isPaired ? (
                    <div className="w-full max-w-4xl flex flex-col h-full max-h-full min-h-0 py-6">
                        <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hide-scrollbar min-h-0">
                            {chatMessages.length === 0 ? (
                                <div className="text-center text-gray-500 text-sm">
                                    Say hi to your match!
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {chatMessages.map((msg, idx) => (
                                        <div key={msg.id}>
                                            {idx === 1 && !msg.system && (
                                                <div className="date-divider">
                                                    <span>Today</span>
                                                </div>
                                            )}
                                            <div
                                                className={`flex ${msg.system ? 'justify-center' : msg.fromSelf ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`message-bubble ${msg.system
                                                        ? 'message-system max-w-md'
                                                        : msg.fromSelf
                                                            ? 'message-sent'
                                                            : 'message-received'
                                                        }`}
                                                >
                                                    {msg.content}
                                                </div>
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
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type your message ..."
                                className="flex-1 border border-gray-300 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!chatInput.trim()}
                                className="w-12 h-12 bg-yellow-400 text-white rounded-full shadow-md hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center w-full">
                        <div className="relative z-10 mb-[-30px] sm:mb-[-45px]">
                            <img
                                src={StartWhirlIcon}
                                alt="Start Whirl Character"
                                className="w-40 sm:w-48 md:w-60 h-auto object-contain drop-shadow-2xl"
                            />
                        </div>

                        <button
                            onClick={randomState === 'queueing' ? leaveRandom : joinRandom}
                            className={`relative z-20 px-8 sm:px-12 md:px-16 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg md:text-xl hover:scale-105 transition-all transform border-b-4 active:border-b-0 active:translate-y-1 overflow-hidden group ${
                                randomState === 'queueing'
                                    ? 'bg-[#3B82F6] text-white border-[#2563EB] hover:bg-red-500 hover:border-red-600 shadow-[0_10px_20px_-5px_rgba(59,130,246,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(239,68,68,0.5)]'
                                    : 'bg-[#3B82F6] text-white border-[#2563EB] shadow-[0_10px_20px_-5px_rgba(59,130,246,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(59,130,246,0.5)]'
                            }`}
                        >
                            {randomState === 'queueing' ? (
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity -z-10 rounded-full"></div>
                            ) : (
                                <img src={BG} alt="" className="absolute inset-0 w-full h-full object-cover -z-10" />
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-1">
                                {randomState === 'queueing' ? (
                                    <>
                                        <span className="group-hover:hidden flex items-center gap-1">
                                            Queueing
                                            <span className="flex gap-1">
                                                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                                                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                                                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                                            </span>
                                        </span>
                                        <span className="hidden group-hover:inline">Cancel</span>
                                    </>
                                ) : 'Start Whirl'}
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
};

