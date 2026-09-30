import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function AdminLayout({ children }) {
    return (
        <div className="admin-layout">

            <Sidebar />

            <div className="main-content">

                <Navbar />

                <main>
                    {children}
                </main>

            </div>

        </div>
    );
}

export default AdminLayout;