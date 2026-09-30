import { useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();

    let user = null;
    try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            user = JSON.parse(storedUser);
        }
    } catch (e) {
        console.error("Failed to parse user from localStorage", e);
    }

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        navigate("/");
    };

    const formatRole = (role) => {
        if (!role) return "";
        return role
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    return (
        <header>
            <div>
                <h3>Military Asset Management System</h3>
            </div>

            <div>
                <span>
                    <strong>{user?.username}</strong>
                    {user?.role && (
                        <span className="role-badge" style={{ marginLeft: "8px" }}>
                            {formatRole(user.role)}
                        </span>
                    )}
                    {user?.base_name && (
                        <span style={{ marginLeft: "6px", color: "#64748B", fontSize: "12px" }}>
                            ({user.base_name})
                        </span>
                    )}
                </span>

                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </header>
    );
}

export default Navbar;