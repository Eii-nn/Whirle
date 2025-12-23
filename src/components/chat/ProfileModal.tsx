import { X, User } from 'lucide-react';
import type { User as UserType } from '../../Services/api';

interface ProfileModalProps {
    user: UserType | null;
    isOpen: boolean;
    onClose: () => void;
    avatarPreview: string | null;
    uploadingAvatar: boolean;
    uploadError: string | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    formatBirthdate: (dateStr?: string) => string;
}

export const ProfileModal = ({
    user,
    isOpen,
    onClose,
    avatarPreview,
    uploadingAvatar,
    uploadError,
    fileInputRef,
    onAvatarChange,
    formatBirthdate,
}: ProfileModalProps) => {
    if (!isOpen) return null;

    const profileAvatarSrc = avatarPreview || user?.avatar_url || '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-[#3498DB]">{user?.username || 'Your profile'}</h3>
                        <p className="text-sm text-gray-500">Manage your account details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border border-gray-100 shadow-inner">
                        {profileAvatarSrc ? (
                            <img src={profileAvatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-gray-500 text-sm">No avatar</div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-[#5DADE2] text-white rounded-lg hover:bg-[#3498DB] transition-colors disabled:opacity-60"
                            disabled={uploadingAvatar}
                        >
                            {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onAvatarChange}
                        />
                        {uploadError && (
                            <p className="text-xs text-red-500">{uploadError}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <p className="text-xs uppercase text-gray-400">Username</p>
                        <p className="text-sm text-gray-800">{user?.username || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-gray-400">Email</p>
                        <p className="text-sm text-gray-800">{user?.email || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-gray-400">Bio</p>
                        <p className="text-sm text-gray-800 whitespace-pre-line">{user?.bio || 'No bio yet.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs uppercase text-gray-400">Birthdate</p>
                            <p className="text-sm text-gray-800">{formatBirthdate(user?.birthdate)}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-gray-400">Country</p>
                            <p className="text-sm text-gray-800">
                                {user?.['country-name'] || user?.['country-code'] || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[#3498DB] hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

