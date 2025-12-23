import { useNavigate, useOutletContext } from 'react-router-dom';
import { User } from 'lucide-react';
import type { Friend } from '../../Services/friendshipApi';

interface FriendsListContext {
    friends: Friend[];
    selectedFriend: Friend | null;
    onFriendClick: (friend: Friend) => void;
}

export const FriendsList = () => {
    const navigate = useNavigate();
    const { friends, selectedFriend, onFriendClick } = useOutletContext<FriendsListContext>();

    return (
        <main className="flex-1 flex flex-col bg-white">
            <header className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
                <h1 className="text-[#3498DB] font-bold text-lg">Friends</h1>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6">
                {friends.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 text-sm">
                        No friends yet. Add friends after random chats!
                    </div>
                ) : (
                    <div className="space-y-2">
                        {friends.map((friend) => (
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
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};

