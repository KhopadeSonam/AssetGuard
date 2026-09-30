import { NavLink } from "react-router-dom";

function Sidebar() {
    let user = null;
    try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            user = JSON.parse(storedUser);
        }
    } catch (e) {
        console.error("Failed to parse user from localStorage", e);
    }

    const role = user?.role;

    return (
        <aside>
            <h2>AssetGuard</h2>

            <nav>
                <NavLink to="/dashboard">
                    Dashboard
                </NavLink>

                <NavLink to="/assets">
                    Assets
                </NavLink>

                <NavLink to="/purchases">
                    Purchases
                </NavLink>

                <NavLink to="/transfers">
                    Transfers
                </NavLink>

                {(role === "ADMIN" || role === "BASE_COMMANDER") && (
                    <NavLink to="/assignments">
                        Assignments & Expenditures
                    </NavLink>
                )}

                <NavLink to="/audit-logs">
                    Audit Logs
                </NavLink>

                {role === "ADMIN" && (
                    <NavLink to="/users">
                        User Management
                    </NavLink>
                )}
            </nav>
        </aside>
    );
}

export default Sidebar;