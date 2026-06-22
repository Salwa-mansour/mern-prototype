import axios from "../api/axios";
import { useAuth } from "./useAuth";
import getAuthDataFromToken from "../utils/jwtUtils";

// This lives outside the hook so it's shared by all instances
let refreshPromise = null;

const useRefreshToken = () => {
    const { setAuth } = useAuth();

    const refresh = async () => {
        // 1. If a refresh is already in progress, return that same promise
        if (refreshPromise) {
            return refreshPromise;
        }

        // 2. Start the refresh and store the promise
        refreshPromise = (async () => {
            try {
                const response = await axios.get('/refresh', {
                    withCredentials: true
                });

                const authData = getAuthDataFromToken(response.data.accessToken);

                setAuth(prev => ({
                    ...prev,
                    ...authData,
                }));

                return authData.accessToken;
            } finally {
                // 3. Clear the promise when done (success or failure) 
                // so future refreshes can happen
                refreshPromise = null;
            }
        })();

        return refreshPromise;
    };

    return refresh;
};

export default useRefreshToken;