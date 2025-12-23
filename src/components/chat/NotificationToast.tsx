import { X, Check, AlertCircle } from 'lucide-react';
import type { Notification } from '../../types/chat';

interface NotificationToastProps {
    notification: Notification | null;
    onClose: () => void;
}

export const NotificationToast = ({ notification, onClose }: NotificationToastProps) => {
    if (!notification) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
            <div className={`rounded-lg shadow-lg p-4 max-w-sm border ${
                notification.type === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
            }`}>
                <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                        {notification.type === 'success' ? (
                            <Check size={16} className="text-green-600" />
                        ) : (
                            <AlertCircle size={16} className="text-red-600" />
                        )}
                    </div>
                    <div className="flex-1">
                        <p className={`text-sm font-semibold ${
                            notification.type === 'success' ? 'text-green-900' : 'text-red-900'
                        }`}>
                            {notification.message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

