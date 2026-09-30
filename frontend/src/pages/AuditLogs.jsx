import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/api";

function AuditLogs() {
    let user = null;
    try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            user = JSON.parse(storedUser);
        }
    } catch (e) {
        console.error("Failed to parse user", e);
    }

    const isNonAdmin = user && user.role !== "ADMIN" && user.base;

    const [logs, setLogs] = useState([]);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);

    const [action, setAction] = useState("");
    const [base, setBase] = useState(isNonAdmin ? String(user.base) : "");
    const [equipmentType, setEquipmentType] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const extractArray = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.results)) return data.results;
        return [];
    };

    const loadFilterData = async () => {
        const results = await Promise.allSettled([
            api.get("bases/"),
            api.get("equipment-types/"),
        ]);

        if (results[0].status === "fulfilled") {
            setBases(extractArray(results[0].value.data));
        }

        if (results[1].status === "fulfilled") {
            setEquipmentTypes(extractArray(results[1].value.data));
        }
    };

    const loadLogs = async () => {
        setLoading(true);
        setError("");

        try {
            const params = {};

            if (action) {
                params.action = action;
            }

            const selectedBase = isNonAdmin ? String(user.base) : base;

            if (selectedBase) {
                params.base = selectedBase;
            }

            if (equipmentType) {
                params.equipment_type = equipmentType;
            }

            const response = await api.get("audit-logs/", { params });
            setLogs(extractArray(response.data));

        } catch (error) {
            console.error("Audit logs error:", error.response?.data || error);
            setError("Failed to load audit logs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFilterData();
    }, []);

    useEffect(() => {
        loadLogs();
    }, [action, base, equipmentType]);

    const clearFilters = () => {
        setAction("");
        if (!isNonAdmin) {
            setBase("");
        }
        setEquipmentType("");
    };

    const getActionBadgeClass = (actionType) => {
        switch (actionType) {
            case "PURCHASE":
                return "badge-purchase";
            case "TRANSFER":
                return "badge-transfer";
            case "ASSIGNMENT":
                return "badge-assignment";
            case "EXPENDITURE":
                return "badge-expenditure";
            default:
                return "";
        }
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <h1>Audit Logs</h1>
                <p>System-wide activity log tracking purchases, transfers, assignments, and expenditures.</p>
            </div>

            <section className="audit-filters">
                <div>
                    <label>Action</label>
                    <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                    >
                        <option value="">All Actions</option>
                        <option value="PURCHASE">PURCHASE</option>
                        <option value="TRANSFER">TRANSFER</option>
                        <option value="ASSIGNMENT">ASSIGNMENT</option>
                        <option value="EXPENDITURE">EXPENDITURE</option>
                    </select>
                </div>

                <div>
                    <label>Base</label>
                    <select
                        value={isNonAdmin ? String(user.base) : base}
                        onChange={(e) => setBase(e.target.value)}
                        disabled={isNonAdmin}
                    >
                        {!isNonAdmin && <option value="">All Bases</option>}
                        {bases.map((item) => (
                            (!isNonAdmin || String(item.id) === String(user.base)) && (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            )
                        ))}
                    </select>
                </div>

                <div>
                    <label>Equipment Type</label>
                    <select
                        value={equipmentType}
                        onChange={(e) => setEquipmentType(e.target.value)}
                    >
                        <option value="">All Equipment</option>
                        {equipmentTypes.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="button" onClick={clearFilters}>
                    Clear Filters
                </button>
            </section>

            {error && <p className="error-message">{error}</p>}

            <section className="audit-table-section">
                <div className="audit-header">
                    <h2>System Audit Trail</h2>
                </div>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Base</th>
                                <th>Equipment</th>
                                <th>Quantity</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7">Loading audit logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="7">No audit records found.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                        <td>{log.username || "System"}</td>
                                        <td>
                                            <span className={`audit-action ${getActionBadgeClass(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>{log.base_name || "-"}</td>
                                        <td>{log.equipment_name || "-"}</td>
                                        <td>{log.quantity || "-"}</td>
                                        <td className="audit-details">{log.details}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </AdminLayout>
    );
}

export default AuditLogs;