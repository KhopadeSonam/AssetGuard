import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/api";

function Assets() {

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

    const [assets, setAssets] = useState([]);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);

    // Filters
    const [base, setBase] = useState(isNonAdmin ? String(user.base) : "");
    const [equipmentType, setEquipmentType] = useState("");

    // Loading / Error
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

    const loadAssets = async () => {
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

            const response = await api.get("inventory/", { params });
            setAssets(extractArray(response.data));

        } catch (error) {
            console.error("Inventory error:", error.response?.data || error);
            setError("Failed to load inventory.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFilterData();
    }, []);

    useEffect(() => {
        loadAssets();
    }, [base, equipmentType]);

    const totalQuantity = assets.reduce(
        (total, asset) => total + Number(asset.quantity || 0),
        0
    );

    const clearFilters = () => {
        if (!isNonAdmin) {
            setBase("");
        }
        setEquipmentType("");
    };

    const formatCategory = (category) => {
        if (!category) {
            return "-";
        }
        return category
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <h1>Assets</h1>
                <p>
                    View current asset inventory across military bases.
                </p>
            </div>

            <section className="asset-filters">
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

            <section className="asset-summary">
                <div className="asset-summary-card">
                    <span>Total Asset Records</span>
                    <strong>{loading ? "..." : assets.length}</strong>
                </div>

                <div className="asset-summary-card">
                    <span>Total Asset Units</span>
                    <strong>{loading ? "..." : totalQuantity}</strong>
                </div>
            </section>

            {error && <p className="error-message">{error}</p>}

            <section className="asset-table-section">
                <div className="asset-table-header">
                    <h2>Inventory List</h2>
                </div>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Base</th>
                                <th>Equipment Type</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5">Loading assets...</td>
                                </tr>
                            ) : assets.length === 0 ? (
                                <tr>
                                    <td colSpan="5">No assets found.</td>
                                </tr>
                            ) : (
                                assets.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.base_name}</td>
                                        <td>{item.equipment_name}</td>
                                        <td>{formatCategory(item.equipment_category)}</td>
                                        <td><strong>{item.quantity}</strong></td>
                                        <td>{new Date(item.updated_at).toLocaleString()}</td>
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

export default Assets;