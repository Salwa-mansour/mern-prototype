import { axiosPrivate } from "../api/axios";
import { useEffect } from "react";
import useRefreshToken from "./useRefreshToken";
import { useAuth } from "./useAuth";
import { useNavigate } from "react-router-dom";
import useLogout from "./useLogout";

const useAxiosPrivate = () => {
    const refresh = useRefreshToken();
   
    const { auth } = useAuth();
    const navigate = useNavigate();
    const logout = useLogout();

        useEffect(() => {   
            
            // the fiest time request or refresh page request >> no token yet
            const requestIntercept = axiosPrivate.interceptors.request.use(
                config =>{
               
                    if(!config.headers['Authorization']){
                        config.headers['Authorization'] = `Bearer ${auth?.accessToken}`;
                    }
                    return config;
                }, (error) => Promise.reject(error)
            )

           const responseIntercept = axiosPrivate.interceptors.response.use(
        response => response,
        async (error) => {
            const prevRequest = error?.config;
            
           
            if ((error?.response?.status === 403 || error?.response?.status === 401) && !prevRequest?.sent) {
                prevRequest.sent = true;
           
                try {
                  
                    const newAccessToken = await refresh();
                    
                    // Ensure we override the header for the retry
                    const authHeader = `Bearer ${newAccessToken}`;
                    prevRequest.headers['Authorization'] = authHeader;
                   
                    // Use the original axiosPrivate instance to retry the request
                    return axiosPrivate(prevRequest);
                } catch (refreshError) {
                    console.error("Refresh failed, logging out...");
                    logout();
                    navigate('/login');
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );

            return ()=>{
                axiosPrivate.interceptors.request.eject(requestIntercept);
                axiosPrivate.interceptors.response.eject(responseIntercept);
            }

        }, [auth, refresh]);
        
    return axiosPrivate;
}

export default useAxiosPrivate;