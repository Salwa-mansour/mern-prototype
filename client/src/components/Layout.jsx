import { Outlet } from "react-router-dom";
import LogoutBtn from "./LogoutBtn";


const Layout = () => {
    return (
        <main className="App">
            <LogoutBtn />
            <Outlet />
        </main>
    )
}

export default Layout
