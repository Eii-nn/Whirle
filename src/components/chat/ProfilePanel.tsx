import { User, X } from 'lucide-react';
import type { Friend } from '../../Services/friendshipApi';

interface ProfilePanelProps {
    selectedFriend: Friend | null;
    onClose: () => void;
    onRemove: () => void;
    onBlock: () => void;
}

export const ProfilePanel = ({ selectedFriend, onClose, onRemove, onBlock }: ProfilePanelProps) => {
    if (!selectedFriend) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/20 z-30 lg:hidden"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            ></div>

            <aside className="fixed lg:static top-0 right-0 h-full w-full sm:w-80 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 shadow-xl z-30 flex flex-col transform transition-transform duration-300 overflow-hidden">
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white flex-shrink-0">
                    <h2 className="text-lg font-bold text-[#3498DB]">Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-8 flex-shrink-0">
                    <div className="flex flex-col items-center mb-4">
                        <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden mb-3">
                            {selectedFriend.avatar ? (
                                <img 
                                    src={selectedFriend.avatar} 
                                    alt={selectedFriend.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={48} className="text-gray-400" />
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {selectedFriend.username}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-lg">🌍</span>
                            <span className="text-sm font-medium">
                                {selectedFriend['country-name'] || 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
                    <div className="flex gap-3">
                        <button
                            onClick={onRemove}
                            className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-100 transition-colors border border-red-200"
                        >
                            Remove
                        </button>
                        <button
                            onClick={onBlock}
                            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors border border-gray-300"
                        >
                            Block
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 hide-scrollbar">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                            About
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {selectedFriend.bio || 'No bio available'}
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

