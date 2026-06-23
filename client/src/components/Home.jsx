import { useAuth } from "../hooks/useAuth";


const Home = () => {
    const { auth } = useAuth();
 console.log("Current Auth State on Home:", auth);

    return (
        <section>
            <h1>Home</h1>
            <br />
            <p>wellcom {auth?.email || 'Guest'}</p>
         
        
        </section>
    )
}

export default Home
