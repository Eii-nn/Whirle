import { apiFetch, getAuthHeaders, API_BASE_URL } from '../utils/apiClient';

export interface Friend {
    id: number;
    username: string;
    bio: string | null;
    bdate: string;
    'country-code': string | null;
    'country-name': string | null;
    avatar: string | null;
}

export interface FriendsResponse {
    status: number;
    friends: Friend[];
}

export interface Message {
    ID: number;
    SenderID: number;
    ReceiverID: number;
    Content: string;
    Timestamp: string;
}

export interface MessagesResponse {
    status: number;
    messages: Message[];
}

export interface ApiError {
    status: number;
    error: string;
    fields?: Record<string, string>;
}

export interface FriendshipSuccessResponse {
    status: number;
    message: string;
}

export const getFriends = async (page = 1): Promise<FriendsResponse> => {
    const response = await apiFetch(`${API_BASE_URL}/friends?page=${page}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const responseData = await response.json();

    if (!response.ok) {
        const error: ApiError = responseData;
        throw error;
    }

    // Normalize the response - handle potential null values from backend
    // Backend may fail to scan if bio/avatar are NULL, but if it succeeds, normalize nulls
    if (responseData.friends && Array.isArray(responseData.friends)) {
        responseData.friends = responseData.friends.map((friend: any) => ({
            ...friend,
            bio: friend.bio || '',
            avatar: friend.avatar || '',
            'country-code': friend['country-code'] || '',
            'country-name': friend['country-name'] || '',
        }));
    }

    return responseData as FriendsResponse;
};

export const addFriend = async (friendId: number): Promise<void> => {
    const response = await apiFetch(`${API_BASE_URL}/friend`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ to: friendId, status: 'accepted' }),
    });

    const responseData = await response.json();

    if (!response.ok) {
        const error: ApiError = responseData;
        throw error;
    }
};

export const removeFriend = async (friendId: number): Promise<FriendshipSuccessResponse> => {
    const response = await apiFetch(`${API_BASE_URL}/friend`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ to: friendId }),
    });

    const responseData = await response.json();

    if (!response.ok) {
        const error: ApiError = responseData;
        throw error;
    }

    return responseData as FriendshipSuccessResponse;
};

export const blockFriend = async (friendId: number): Promise<FriendshipSuccessResponse> => {
    const response = await apiFetch(`${API_BASE_URL}/friend`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ to: friendId, status: 'blocked' }),
    });

    const responseData = await response.json();

    if (!response.ok) {
        const error: ApiError = responseData;
        throw error;
    }

    return responseData as FriendshipSuccessResponse;
};

export const getMessages = async (friendId: number, page = 1): Promise<MessagesResponse> => {
    const response = await apiFetch(`${API_BASE_URL}/messages/${friendId}?page=${page}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const responseData = await response.json();

    if (!response.ok) {
        const error: ApiError = responseData;
        throw error;
    }

    return responseData as MessagesResponse;
};
