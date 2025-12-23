import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Redirect old Chat route to new structure
const Chat = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/chat', { replace: true });
    }, [navigate]);
    
    return null;
};

export default Chat;
