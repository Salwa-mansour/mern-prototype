import axios from '../api/axios';
import { useRef ,useState,useEffect} from "react";
import {faCheck ,faTimes,faInfoCircle, faEye,faEyeSlash} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; 

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/ ;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}/ ;

const REGISTER_URL = '/signup';


const Register = () => {
  const userNameRef = useRef();
  const errRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  const [userName, setUserName] = useState('');
  const [validName, setValidName] = useState(false);
  const [userFocus, setUserFocus] = useState(false);

  const [email, setEmail] = useState('');
  const [validEmail, setValidEmail] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

  const [password, setPassword] = useState('');
  const [validPassword, setValidPassword] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [validMatch, setValidMatch] = useState(false);
  const [matchFocus, setMatchFocus] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [errMsg, setErrMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => { userNameRef.current.focus(); }, [])
   useEffect(() => {
    const result = USER_REGEX.test(userName);
    setValidName(result);
    }, [userName]);

    useEffect(() => {
        const result = EMAIL_REGEX.test(email);
        setValidEmail(result);
    }, [email]);

   // Validates the first password against the Regex
    useEffect(() => {
    const result = PASSWORD_REGEX.test(password);
    setValidPassword(result);
    // Also re-check the match whenever the primary password changes
    const match = password === confirmPassword;
    setValidMatch(match);
    }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowPwd(false);
    setIsLoading(true);
    // final validation before sending to backend
     const v1 = USER_REGEX.test(userName);
     const v2 = EMAIL_REGEX.test(email);
     const v3 = PASSWORD_REGEX.test(password);
        if (!v1 || !v2 || !v3) {
            setErrMsg("Invalid Entry");
            return;
        }
        const data = {
            userName :userName.trim(),
            email : email.trim(),
            password : password.trim(),
            confirmPassword :confirmPassword.trim()
        }
    try {
        const response = await axios.post(REGISTER_URL, data,  { withCredentials: true } );

        setSuccess(true);
        // Clear inputs
        setUserName('');
        setPassword('');
        setConfirmPassword('');
        setErrMsg(''); // Clear any old errors

    } catch (err) {
        // 1. Check if the server even responded (Network Error)
        if (!err?.response) {
            setErrMsg('No Server Response');
        } 
        // 2. Display the specific error message sent by your backend
        else if (err.response?.data?.error) {
            setErrMsg(err.response.data.error); 
        } 
        // 3. Fallback for generic errors
        else {
            setErrMsg('Registration Failed');
        }

        // Use that useRef we talked about to focus the error message for accessibility
        errRef.current.focus();
    }finally {
    setIsLoading(false); // Stop loading regardless of success or error
    }
}

    return (
          <>
            {success ? (
                <section>
                    <h1>Success!</h1>
                    <p>
                        <a href="#">Sign In</a>
                    </p>
                </section>
            ) : (
                <section>
                    <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
                    <h1>Register</h1>
                    <form onSubmit={handleSubmit}>
                       <label htmlFor="username">
                        Username:
                        {/* Show a green check if valid, or a red X if invalid + something is typed */}
                        <span className={validName ? "valid" : "hide"}>
                            <FontAwesomeIcon icon={faCheck} />
                        </span>
                        <span className={validName || !userName ? "hide" : "invalid"}>
                            <FontAwesomeIcon icon={faTimes} />
                        </span>
                    </label>

                    <input
                        type="text"
                        id="username"
                        ref={userNameRef}
                        autoComplete="off"
                        onChange={(e) => setUserName(e.target.value)}
                        value={userName}
                        required
                        aria-invalid={validName ? "false" : "true"}
                        aria-describedby="uidnote"
                        onFocus={() => setUserFocus(true)}
                        onBlur={() => setUserFocus(false)}
                    />

                    {/* The instructions box */}
                    <p id="uidnote" className={userFocus && userName && !validName ? "instructions" : "offscreen"}>
                        <FontAwesomeIcon icon={faInfoCircle} />
                        4 to 24 characters.<br />
                        Must begin with a letter.<br />
                        Letters, numbers, underscores, hyphens allowed.
                    </p>
                      
                        <label htmlFor="email">
                        Email:
                        <span className={validEmail ? "valid" : "hide"}>
                            <FontAwesomeIcon icon={faCheck} />
                        </span>
                        <span className={validEmail || !email ? "hide" : "invalid"}>
                            <FontAwesomeIcon icon={faTimes} />
                        </span>
                    </label>

                    <input
                        type="email"
                        id="email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        required
                        aria-invalid={validEmail ? "false" : "true"}
                        aria-describedby="emailnote"
                        onFocus={() => setEmailFocus(true)}
                        onBlur={() => setEmailFocus(false)}
                    />

                    <p id="emailnote" className={emailFocus && email && !validEmail ? "instructions" : "offscreen"}>
                        <FontAwesomeIcon icon={faInfoCircle} />
                        Please enter a valid email address.<br />
                        Example: name@directory.com
                    </p>

                       <label htmlFor="password">
                        Password:
                        <FontAwesomeIcon icon={faCheck} className={validPassword ? "valid" : "hide"} />
                        <FontAwesomeIcon icon={faTimes} className={validPassword || !password ? "hide" : "invalid"} />
                    </label>
                    <div className='input-box'>
                        <input
                        type={showPwd ? "text" : "password"}
                        id="password"
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        required
                        aria-invalid={validPassword ? "false" : "true"}
                        aria-describedby="pwdnote"
                        onFocus={() => setPasswordFocus(true)}
                        onBlur={() => setPasswordFocus(false)}
                    />
                    <button 
                    type="button" 
                   onMouseDown={(e) => e.preventDefault()} // Stops the jump
                    onClick={() => setShowPwd(prev => !prev)} // Handles the actual logic
                    className="show-pwd-btn"
                >
                    <FontAwesomeIcon icon={showPwd ? faEyeSlash : faEye} />
                </button>
                    </div>
                    
                    <p id="pwdnote" className={passwordFocus && !validPassword ? "instructions" : "offscreen"}>
                        <FontAwesomeIcon icon={faInfoCircle} />
                        8 to 24 characters.<br />
                        Must include uppercase and lowercase letters, a number and a special character.<br />
                        Allowed special characters: <span aria-label="exclamation mark">!</span> <span aria-label="at symbol">@</span> <span aria-label="hashtag">#</span> <span aria-label="dollar sign">$</span> <span aria-label="percent">%</span>
                    </p>
                       

                      <label htmlFor="confirmPassword">
                            Confirm Password:
                            <FontAwesomeIcon icon={faCheck} className={validMatch && confirmPassword ? "valid" : "hide"} />
                            <FontAwesomeIcon icon={faTimes} className={validMatch || !confirmPassword ? "hide" : "invalid"} />
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            value={confirmPassword}
                            required
                            aria-invalid={validMatch ? "false" : "true"}
                            aria-describedby="confirmnote"
                            onFocus={() => setMatchFocus(true)}
                            onBlur={() => setMatchFocus(false)}
                        />
                        <p id="confirmnote" className={matchFocus && !validMatch ? "instructions" : "offscreen"}>
                            <FontAwesomeIcon icon={faInfoCircle} />
                            Must match the first password input field.
                        </p>

                        <button disabled={!validName || !validEmail || !validPassword || !validMatch || isLoading ? true : false}>
                            {isLoading ? "Signing Up..." : "Sign Up"}
                        </button>
                    </form>
                    <p>
                        Already registered?<br />
                        <span className="line">
                            {/*put router link here*/}
                            <a href="#">Sign In</a>
                        </span>
                    </p>
                </section>
            )}
        </>
    );
};

export default Register