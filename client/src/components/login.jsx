import { useState,useRef,useEffect} from "react";
import {useAuth} from "../hooks/useAuth";
import {Link , useNavigate , useLocation } from 'react-router-dom';
import "../css/form.css";
import axios from "../api/axios";
import getAuthDataFromToken from "../utils/jwtUtils";
import useInput from "../hooks/useInput";
import useToggle from "../hooks/useToggle";
const LOGIN_URL = 'auth/login';

import { faEye,faEyeSlash} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; 

const login = () => {
    const { setAuth } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const emailRef = useRef();
    const errRef = useRef();
    
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [email, resetEmail , emailAttribs] = useInput('email','');// useState
    const [password, setPassword] = useState('');
    const [errMsg, setErrMsg] = useState('');
    const [persist, setPersist] = useToggle('persist',false);
 
  useEffect(() => {
    emailRef.current.focus();
  }, []);
  useEffect(() => {
    setErrMsg('');
  }, [email, password]);

  const handleSubmit =async (e) => {
    e.preventDefault();
    setShowPassword(false);
    setIsLoading(true);
    try {
        const response = await axios.post(LOGIN_URL,
            JSON.stringify({ email, password }),
            {                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            }
        );
       const accessToken = response?.data?.accessToken;
       const authData = getAuthDataFromToken(response?.data?.accessToken);
           setAuth({
            ...authData,
            accessToken
        });
     
       resetEmail('');
        setPassword('');
        navigate(from, { replace: true });
    } catch (err) {
        if (!err?.response) {
            setErrMsg('No Server Response');
        } else if (err.response?.status === 400) {
            setErrMsg('Missing Email or Password');
        } else if (err.response?.status === 401) {
            setErrMsg('Unauthorized');
        } else {
            setErrMsg('Login Failed');
        }
        errRef.current.focus();
    }finally {
    setIsLoading(false); // Stop loading regardless of success or error
    }
  };

  return (
    
        <section>
            <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email:</label>
            <input
                type="email"
                id="email"
                ref={emailRef}
                autoComplete="off"  
                {...emailAttribs}
                required  
            />
            <label htmlFor="password">Password:</label>
            <div className="input-box">
                <input  
                    type={showPassword ? "text" : "password"}
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    required  
                />
                    <button 
                    type="button" 
                   onMouseDown={(e) => e.preventDefault()} // Stops the jump
                    onClick={() => setShowPassword(prev => !prev)} // Handles the actual logic
                    className="show-pwd-btn"
                        >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
          </div>
            <button type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
            </button>
            <div className="persistCheck" >
                    <input
                     type="checkbox"
                     id="persist"
                     onChange={setPersist} 
                     checked={persist} />
                     <label htmlFor="persist">trust this devise</label>
            </div>
        </form>
        <a href="http://localhost:3000/auth/google" className="google-btn">
            Sign in with Google
        </a>
        <p>Need an account? <a href="/register">Register</a></p>
    </section>
   
  )
}

export default login