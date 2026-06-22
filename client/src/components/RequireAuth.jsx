import { useLocation, Navigate, Outlet } from "react-router-dom";
import {useAuth} from "../hooks/useAuth";


const  RequireAuth = ({allowedRoles})=>{
 
    const { auth } = useAuth();
    const location = useLocation();
    console.log(`user rules ${JSON.stringify(auth)}`);
    console.log(allowedRoles)
  return (
   auth?.userRoles?.find(role => allowedRoles?.includes(role))
   ? <Outlet />
   : auth?.email 
    ? <Navigate to="/unauthorized" state={{ from: location }} replace />
   : <Navigate to="/login" state={{ from: location }} replace />
  );
}

export default RequireAuth;

