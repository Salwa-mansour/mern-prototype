import { useLocation, Navigate, Outlet } from "react-router-dom";
import {useAuth} from "../hooks/useAuth";


const  RequireAuth = ()=>{
 
    const { auth } = useAuth();
    const location = useLocation();
    console.log("Current Auth State require uth:", auth);
  return (
  auth?.userId  ?
   <Outlet />
    : <Navigate to="/login" state={{ from: location }} replace />
  );
}

export default RequireAuth;

