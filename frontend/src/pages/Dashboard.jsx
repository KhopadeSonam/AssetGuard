import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/api";

function Dashboard() {

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

    const [dashboard, setDashboard] = useState({
        opening_balance: 0,
        closing_balance: 0,
        net_movement: 0,
        purchases: 0,
        transfer_in: 0,
        transfer_out: 0,
        assigned: 0,
        expended: 0,
    });

    // Net Movement Popup
    const [showMovementModal, setShowMovementModal] = useState(false);

    // Filter data
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);

    // Selected filters
    const [base, setBase] = useState(isNonAdmin ? String(user.base) : "");
    const [equipmentType, setEquipmentType] = useState("");
    const [date, setDate] = useState("");

    // Loading and error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const extractArray = (data) => {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.results)) {
            return data.results;
        }

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

    const loadDashboard = async () => {
        setLoading(true);
        setError("");

        try {
            const params = {};

            const selectedBase = isNonAdmin ? String(user.base) : base;

            if (selectedBase) {
                params.base = selectedBase;
            }

            if (equipmentType) {
                params.equipment_type = equipmentType;
            }

            if (date) {
                params.date = date;
            }

            const response = await api.get("dashboard/", { params });
            setDashboard(response.data);

        } catch (error) {
            console.error("Dashboard error:", error.response?.data || error);
            setError("Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFilterData();
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [base, equipmentType, date]);

    const clearFilters = () => {
        if (!isNonAdmin) {
            setBase("");
        }
        setEquipmentType("");
        setDate("");
    };

    return (
        <AdminLayout>

            <div className="page-header">
                <h1>Dashboard</h1>
                <p>
                    Overview of military asset movement, assignment and expenditure.
                </p>
            </div>

            <section className="dashboard-filters">

                {/* BASE FILTER */}
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

                {/* EQUIPMENT FILTER */}
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

                {/* DATE FILTER */}
                <div>
                    <label>Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                {/* CLEAR FILTERS */}
                <button type="button" onClick={clearFilters}>
                    Clear Filters
                </button>

            </section>

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            <section className="dashboard-metrics">

                <div className="metric-card">
                    <span>Opening Balance</span>
                    <strong>{loading ? "..." : dashboard.opening_balance}</strong>
                </div>

                <div className="metric-card">
                    <span>Closing Balance</span>
                    <strong>{loading ? "..." : dashboard.closing_balance}</strong>
                </div>

                <div
                    className="metric-card clickable-card"
                    onClick={() => setShowMovementModal(true)}
                >
                    <span>Net Movement</span>
                    <strong>{loading ? "..." : dashboard.net_movement}</strong>
                    <small>Purchases + Transfer In − Transfer Out</small>
                    <small className="view-details">Click to view details</small>
                </div>

                <div className="metric-card">
                    <span>Assigned</span>
                    <strong>{loading ? "..." : dashboard.assigned}</strong>
                </div>

                <div className="metric-card">
                    <span>Expended</span>
                    <strong>{loading ? "..." : dashboard.expended}</strong>
                </div>

            </section>

            <section className="movement-summary">
                <h2>Net Movement Details</h2>
                <div className="movement-grid">
                    <div>
                        <span>Purchases</span>
                        <strong>{loading ? "..." : dashboard.purchases}</strong>
                    </div>

                    <div>
                        <span>Transfer In</span>
                        <strong>{loading ? "..." : dashboard.transfer_in}</strong>
                    </div>

                    <div>
                        <span>Transfer Out</span>
                        <strong>{loading ? "..." : dashboard.transfer_out}</strong>
                    </div>
                </div>
            </section>

            {showMovementModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowMovementModal(false)}
                >
                    <div
                        className="movement-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h2>Net Movement Details</h2>
                                <p>Purchases + Transfer In − Transfer Out</p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setShowMovementModal(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-details">
                            <div className="modal-detail-row">
                                <span>Purchases</span>
                                <strong>+ {dashboard.purchases}</strong>
                            </div>

                            <div className="modal-detail-row">
                                <span>Transfer In</span>
                                <strong>+ {dashboard.transfer_in}</strong>
                            </div>

                            <div className="modal-detail-row">
                                <span>Transfer Out</span>
                                <strong>- {dashboard.transfer_out}</strong>
                            </div>

                            <div className="modal-total">
                                <span>Net Movement</span>
                                <strong>{dashboard.net_movement}</strong>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="modal-done-button"
                            onClick={() => setShowMovementModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}

export default Dashboard;