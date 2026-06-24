import { useState ,  useEffect} from "react";
import { Outlet } from "react-router-dom";
import useRefreshToken from "../hooks/useRefreshToken";
import {useAuth} from "../hooks/useAuth";
import useLocalStorage from "../hooks/useLocalStorage";

const PersistLogin = () => { // 💡 Capitalized component name (React Best Practice)
    const [isLoading, setIsLoading] = useState(true);
    const refresh = useRefreshToken();
    const { auth } = useAuth();
    const [persist] = useLocalStorage('persist', false);

    useEffect(() => {
        let isMounted = true;
        
        const verifyRefreshToken = async () => {
            try {
                await refresh();
            } catch (err) {
                console.error(err);
            } finally {
                isMounted && setIsLoading(false);
            }
        }
        
        // Only run refresh if we don't have a token, AND persist is enabled
        if (!auth?.accessToken && persist) {
            verifyRefreshToken();
        } else {
            setIsLoading(false);
        }

        return () => isMounted = false;
    }, []);

    useEffect(() => {
        console.log(`persist: ${persist}`);
        console.log(`AT: ${JSON.stringify(auth?.accessToken)}`);
    }, [isLoading]);

    // 💡 FIXED LOGIC SECTION:
    return (
        <>
            {!persist 
                ? <Outlet /> // If they don't want persistence, let RequireAuth handle the in-memory state
                : isLoading 
                    ? <p>Loading ...</p>
                    : <Outlet /> // If loading finished and persist is true, render downstream routes
            }
        </>
    );
}

export default PersistLogin;