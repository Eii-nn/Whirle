import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { LogOut, User, X, Menu, MessageCircle, Users } from 'lucide-react';
import type { User as UserType } from '../../Services/api';
import type { Friend } from '../../Services/friendshipApi';
import { getFriends } from '../../Services/friendshipApi';
import { clearSessionData } from '../../utils/auth';
import Logo from '../../assets/icons/Logo.svg';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const MAX_AVATAR_BYTES = 500 * 1024;

interface ChatLayoutProps {
    user: UserType | null;
    setUser: (user: UserType | null) => void;
    friends: Friend[];
    setFriends: (friends: Friend[]) => void;
    friendsLoading: boolean;
    setFriendsLoading: (loading: boolean) => void;
    selectedFriend: Friend | null;
    onFriendClick: (friend: Friend) => void;
    showProfileModal: boolean;
    setShowProfileModal: (show: boolean) => void;
    profileAvatarSrc: string;
    uploadingAvatar: boolean;
    uploadError: string | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleAvatarChange: (e: ChangeEvent<HTMLInputElement>) => void;
    formatBirthdate: (dateStr?: string) => string;
    onRemoveFriend: (friendId: number) => Promise<void>;
    onBlockFriend: (friendId: number) => Promise<void>;
}

export const ChatLayout = ({
    user,
    setUser,
    friends,
    setFriends,
    friendsLoading,
    setFriendsLoading,
    selectedFriend,
    onFriendClick,
    showProfileModal,
    setShowProfileModal,
    profileAvatarSrc,
    uploadingAvatar,
    uploadError,
    fileInputRef,
    handleAvatarChange,
    formatBirthdate,
    onRemoveFriend,
    onBlockFriend,
}: ChatLayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showSidebar, setShowSidebar] = useState(false);
    const friendsRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Determine active tab based on current route
    const activeTab = location.pathname.startsWith('/chat/friend/') || location.pathname === '/chat/friends' ? 'friends' : 'chat';

    const loadFriends = async (showLoading = true): Promise<void> => {
        if (showLoading) {
            setFriendsLoading(true);
        }
        try {
            const response = await getFriends(1);
            setFriends(response.friends || []);
        } catch (error) {
            console.error('Failed to load friends:', error);
            setFriends([]);
        } finally {
            if (showLoading) {
                setFriendsLoading(false);
            }
        }
    };

    useEffect(() => {
        loadFriends();
    }, [location.pathname]);

    useEffect(() => {
        friendsRefreshIntervalRef.current = setInterval(() => {
            loadFriends(false);
        }, 5 * 60 * 1000);
        return () => {
            if (friendsRefreshIntervalRef.current) {
                clearInterval(friendsRefreshIntervalRef.current);
            }
        };
    }, [location.pathname]);

    const handleLogout = () => {
        clearSessionData();
        navigate('/login');
    };

    const closeProfileModal = () => {
        setShowProfileModal(false);
    };

    return (
        <div className="flex h-screen w-full bg-white font-sans overflow-hidden relative max-h-screen">
            {/* Mobile Sidebar Overlay */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setShowSidebar(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-[#F0F8FF] flex flex-col border-r border-blue-50/50 z-50 transform transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>
                {/* Logo */}
                <div className="h-20 flex items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <img src={Logo} alt="logo" className="w-10 h-10" />
                        <span className="text-2xl font-black text-[#3B82F6] tracking-wide">HIRL</span>
                    </div>
                    <button
                        onClick={() => setShowSidebar(false)}
                        className="lg:hidden p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-[#3498DB]" />
                    </button>
                </div>

                {/* Toggle Buttons */}
                <div className="px-6 mb-4">
                    <div className="flex gap-2 bg-white/60 p-1 rounded-full">
                        <button
                            onClick={() => navigate('/chat')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'chat'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-blue-600'
                                }`}
                        >
                            <MessageCircle size={16} />
                            Chat
                        </button>
                        <button
                            onClick={() => navigate('/chat/friends')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${activeTab === 'friends'
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'text-gray-600 hover:text-blue-600'
                                }`}
                        >
                            <Users size={16} />
                            Friends
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-6 hide-scrollbar">
                    {activeTab === 'friends' && location.pathname.startsWith('/chat/friend/') ? (
                        <div className="pb-4">
                            <h2 className="text-lg font-bold text-gray-800 mb-3">Friends</h2>
                            {friendsLoading ? (
                                <div className="text-center text-gray-500 py-8">Loading...</div>
                            ) : friends.length === 0 ? (
                                <div className="text-center text-gray-500 py-8 text-sm">
                                    No friends yet. Add friends after random chats!
                                </div>
                            ) : (
                                friends.map((friend) => (
                                    <div
                                        key={friend.id}
                                        onClick={() => {
                                            onFriendClick(friend);
                                            navigate(`/chat/friend/${friend.id}`);
                                        }}
                                        className={`user-list-item ${selectedFriend?.id === friend.id ? 'active' : ''}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                                                {friend.avatar ? (
                                                    <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={24} className="text-gray-500" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-sm font-bold text-gray-800 truncate">{friend.username}</h3>
                                            </div>
                                            <p className="text-xs text-gray-600 truncate">{friend.bio || 'No bio'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : null}
                </div>

                {/* User Profile */}
                <div
                    className="mx-4 mb-4 p-3 bg-[#D6EAF8]/50 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#D6EAF8]/70 transition-colors"
                    onClick={() => setShowProfileModal(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setShowProfileModal(true);
                        }
                    }}
                >
                    <div className="w-10 h-10 rounded-full bg-gray-400 border-2 border-white shadow-sm relative flex-shrink-0 overflow-hidden">
                        {profileAvatarSrc ? (
                            <img
                                src={profileAvatarSrc}
                                alt="User avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User size={20} className="text-gray-200" />
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#3498DB] truncate">
                            {user?.username || 'Guest'}
                        </p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleLogout();
                        }}
                        className="p-2 text-[#5DADE2] hover:text-[#3498DB] bg-[#AED6F1] rounded-lg flex-shrink-0 hover:bg-[#85C1E9] transition-colors"
                    >
                        <LogOut size={16} className="rotate-180" />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex relative min-h-0 overflow-hidden">
                <Outlet context={{
                    user,
                    friends,
                    selectedFriend: location.pathname.startsWith('/chat/friend/') ? selectedFriend : null,
                    onFriendClick,
                    setShowSidebar,
                    onRemoveFriend,
                    onBlockFriend,
                } as any} />
            </div>
        </div>
    );
};

