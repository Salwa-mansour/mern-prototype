import { jwtDecode } from "jwt-decode";

export const getAuthDataFromToken = (token) => {
    try {
        if (!token) return null;
        const decodedToken = jwtDecode(token);
        // console.log(`decodedToken:${JSON.stringify(decodedToken)}`)
        return {
           ...decodedToken,
            accessToken: token
        };
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
};

export default getAuthDataFromToken;