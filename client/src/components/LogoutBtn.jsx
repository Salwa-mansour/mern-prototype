import { useState,useContext } from "react";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { AuthContext } from "../context/AuthProvider";


function LogoutBtn() {
  const [isLogingOut, setIsLogingOut] = useState(false);
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const { setAuth } = useContext(AuthContext);

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    setIsLogingOut(true);

    localStorage.removeItem("persist"); 
    setAuth({});
    try {
      // 💡 Fix 3: Changed 'axios' to 'axiosPrivate' to prevent a 'ReferenceError: axios is not defined' crash
      await axiosPrivate.post('auth/logout', {}); 
    } catch (err) {
      console.error("Backend failed to clear session:", err);
    } finally {
      setIsLogingOut(false);
      navigate("/login", { replace: true });
    }
  };



    
  return (
  <form onSubmit={handleLogout} className="logout-form">
    <button type="submit" className="logout-btn" disabled={isLogingOut}>
      {isLogingOut ? "Logging out..." : "Logout"}
    </button>
  </form>
  )
}

export default LogoutBtn