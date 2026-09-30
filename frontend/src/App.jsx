import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Purchases from "./pages/Purchases";
import Transfers from "./pages/Transfers";
import Assignments from "./pages/Assignments";
import Assets from "./pages/Assets";
import AuditLogs from "./pages/AuditLogs";
import UserManagement from "./pages/UserManagement";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"]}>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/purchases"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "LOGISTICS_OFFICER"]}>
                            <Purchases />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/transfers"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"]}>
                            <Transfers />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/assignments"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "BASE_COMMANDER"]}>
                            <Assignments />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/assets"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"]}>
                            <Assets />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/audit-logs"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "LOGISTICS_OFFICER"]}>
                            <AuditLogs />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/users"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <UserManagement />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;