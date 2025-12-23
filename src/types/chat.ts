import type { User as UserType, Message as FriendMessage } from '../Services/api';
import type { Friend } from '../Services/friendshipApi';

export type RandomChatMessage = {
    id: string;
    fromSelf: boolean;
    content: string;
    timestamp: number;
    system?: boolean;
};

export type SocketState = 'disconnected' | 'connecting' | 'connected';
export type RandomState = 'idle' | 'queueing' | 'paired';
export type ChatType = 'random' | 'friend';

export type FriendMessageWithStatus = FriendMessage & { 
    status?: 'pending' | 'sent' | 'failed'; 
    tempId?: string 
};

export type Notification = {
    message: string;
    type: 'success' | 'error';
};

export type ChatContextType = {
    user: UserType | null;
    selectedFriend: Friend | null;
    chatType: ChatType;
    randomState: RandomState;
    socketState: SocketState;
};

