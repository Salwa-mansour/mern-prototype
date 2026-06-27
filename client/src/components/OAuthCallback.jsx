import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import getAuthDataFromToken from '../utils/jwtUtils';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setAuth } = useAuth();

    useEffect(() => {
        const accessToken = searchParams.get('token');

        if (accessToken) {
            // REUSE: Tap straight into your existing client token extraction!
            const authData = getAuthDataFromToken(accessToken);
            
            setAuth({
                ...authData,
                accessToken
            });
            
            navigate('/', { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    }, [searchParams, setAuth, navigate]);

    return <p>Completing Google Secure Handshake...</p>;
};

export default OAuthCallback;