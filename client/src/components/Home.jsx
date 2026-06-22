import { useAuth } from "../hooks/useAuth";


const Home = () => {
    const { auth } = useAuth();


    return (
        <section>
            <h1>Home</h1>
            <br />
            <p>wellcom {auth?.userName || 'Guest'}</p>
         
        
        </section>
    )
}

export default Home
