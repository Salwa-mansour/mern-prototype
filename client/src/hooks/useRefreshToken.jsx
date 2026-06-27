import axios from "../api/axios";
import { useAuth } from "./useAuth";
import getAuthDataFromToken from "../utils/jwtUtils";

let refreshPromise = null;

const useRefreshToken = () => {
    const { setAuth } = useAuth();

    const refresh = async () => {
        if (refreshPromise) {
            return refreshPromise;
        }

        refreshPromise = (async () => {
            try {
                const response = await axios.get('auth/refresh', {
                    withCredentials: true
                });

                const rawAccessToken = response.data.accessToken; // 💡 Grab raw string
                const authData = getAuthDataFromToken(rawAccessToken);

                setAuth(prev => ({
                    
                    ...authData,
                    accessToken: rawAccessToken, // 💡 Ensure the raw token is explicitly saved in state!
                }));

        //    setAuth({
        //     ...authData,
        //     accessToken
        // });
                return rawAccessToken; // 💡 FIXED: Return the raw string token explicitly
            } finally {
                refreshPromise = null;
            }
        })();

        return refreshPromise;
    };

    return refresh;
};

export default useRefreshToken;