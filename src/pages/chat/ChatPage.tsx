import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User as UserType } from '../../Services/api';
import type { Friend } from '../../Services/friendshipApi';
import { getFriends } from '../../Services/friendshipApi';
import { clearSessionData } from '../../utils/auth';
import { ChatLayout } from './ChatLayout';
import { ProfileModal } from '../../components/chat/ProfileModal';
import { NotificationToast } from '../../components/chat/NotificationToast';
import type { Notification } from '../../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const MAX_AVATAR_BYTES = 500 * 1024;

export const ChatPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserType | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('jwt_token');

        if (!token) {
            navigate('/login');
            return;
        }

        const validateToken = async () => {
            try {
                await getFriends(1);
            } catch (error) {
                const apiError = error as { status?: number };
                if (apiError.status === 401) {
                    clearSessionData();
                }
            }
        };

        validateToken();

        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser) as UserType);
            } catch {
                localStorage.removeItem('user');
            }
        }
    }, [navigate]);

    const handleFriendClick = (friend: Friend) => {
        setSelectedFriend(friend);
    };

    const handleRemoveFriend = async (friendId: number) => {
        try {
            const { removeFriend } = await import('../../Services/friendshipApi');
            const response = await removeFriend(friendId);
            setNotification({ message: response.message || 'Friend removed successfully', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
            await getFriends(1).then(res => setFriends(res.friends || []));
        } catch (error) {
            const apiError = error as { error?: string; status?: number };
            setNotification({
                message: apiError.error || 'Failed to remove friend',
                type: 'error'
            });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleBlockFriend = async (friendId: number) => {
        try {
            const { blockFriend } = await import('../../Services/friendshipApi');
            const response = await blockFriend(friendId);
            setNotification({ message: response.message || 'Friend blocked successfully', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
            await getFriends(1).then(res => setFriends(res.friends || []));
        } catch (error) {
            const apiError = error as { error?: string; status?: number };
            setNotification({
                message: apiError.error || 'Failed to block friend',
                type: 'error'
            });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (uploadingAvatar) return;

        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_AVATAR_BYTES) {
            setUploadError('File is too large. Maximum size is 500KB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploadError(null);

        const token = localStorage.getItem('jwt_token');
        if (!token) {
            setUploadError('Missing token. Please log in again.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('avatar_img', file);

        setUploadingAvatar(true);
        try {
            const response = await fetch(`${API_BASE_URL}/user/avatar`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.status === 401) {
                clearSessionData();
                navigate('/login?message=' + encodeURIComponent('Your session has expired. Please log in again.'));
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                const reason = data?.error || data?.message || 'Failed to upload avatar';
                throw new Error(`${reason} (code ${response.status})`);
            }

            const newUrl = data?.avatar_url || null;
            const updatedUser = user ? { ...user, avatar_url: newUrl || user.avatar_url } : user;
            setUser(updatedUser);
            // Save updated user to localStorage so avatar persists on refresh
            if (updatedUser) {
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            setAvatarPreview(newUrl);
            setUploadError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to upload avatar';
            setUploadError(message);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setUploadingAvatar(false);
        }
    };

    const closeProfileModal = () => {
        setShowProfileModal(false);
        setUploadError(null);
    };

    const profileAvatarSrc = avatarPreview || user?.avatar_url || '';

    const formatBirthdate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
    };

    return (
        <>
            <ChatLayout
                user={user}
                setUser={setUser}
                friends={friends}
                setFriends={setFriends}
                friendsLoading={friendsLoading}
                setFriendsLoading={setFriendsLoading}
                selectedFriend={selectedFriend}
                onFriendClick={handleFriendClick}
                showProfileModal={showProfileModal}
                setShowProfileModal={setShowProfileModal}
                profileAvatarSrc={profileAvatarSrc}
                uploadingAvatar={uploadingAvatar}
                uploadError={uploadError}
                fileInputRef={fileInputRef}
                handleAvatarChange={handleAvatarChange}
                formatBirthdate={formatBirthdate}
                onRemoveFriend={handleRemoveFriend}
                onBlockFriend={handleBlockFriend}
            />

            <ProfileModal
                user={user}
                isOpen={showProfileModal}
                onClose={closeProfileModal}
                avatarPreview={avatarPreview}
                uploadingAvatar={uploadingAvatar}
                uploadError={uploadError}
                fileInputRef={fileInputRef}
                onAvatarChange={handleAvatarChange}
                formatBirthdate={formatBirthdate}
            />

            <NotificationToast
                notification={notification}
                onClose={() => setNotification(null)}
            />
        </>
    );
};

