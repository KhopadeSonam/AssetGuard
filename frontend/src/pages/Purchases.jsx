import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/api";

function Purchases() {

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

    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [purchases, setPurchases] = useState([]);

    const [base, setBase] = useState(isNonAdmin ? String(user.base) : "");
    const [equipmentType, setEquipmentType] = useState("");
    const [quantity, setQuantity] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const extractArray = (data) => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
    };

    const loadData = async () => {
        let fetchErrors = [];

        try {
            const baseResponse = await api.get("bases/");
            setBases(extractArray(baseResponse.data));
        } catch (err) {
            console.error("API ERROR (bases):", err);
            fetchErrors.push("Bases");
        }

        try {
            const equipmentResponse = await api.get("equipment-types/");
            setEquipmentTypes(extractArray(equipmentResponse.data));
        } catch (err) {
            console.error("API ERROR (equipment-types):", err);
            fetchErrors.push("Equipment Types");
        }

        try {
            const purchaseResponse = await api.get("purchases/");
            setPurchases(extractArray(purchaseResponse.data));
        } catch (err) {
            console.error("API ERROR (purchases):", err);
            fetchErrors.push("Purchases");
        }

        if (fetchErrors.length > 0) {
            setError(`Failed to load data: ${fetchErrors.join(", ")}`);
        } else {
            setError("");
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const selectedBase = isNonAdmin ? Number(user.base) : Number(base);

            await api.post("purchases/", {
                base: selectedBase,
                equipment_type: Number(equipmentType),
                quantity: Number(quantity),
                purchase_date: purchaseDate,
            });

            setMessage("Purchase recorded successfully.");

            setBase(isNonAdmin ? String(user.base) : "");
            setEquipmentType("");
            setQuantity("");
            setPurchaseDate("");

            loadData();

        } catch (error) {
            console.error(error);
            setError(
                error.response?.data
                    ? JSON.stringify(error.response.data)
                    : "Failed to record purchase."
            );
        }
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <h1>Purchases</h1>
                <p>Record and view asset purchases across bases.</p>
            </div>

            <section className="purchase-form-section">
                <h2>Record Purchase</h2>

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Base</label>
                        <select
                            value={isNonAdmin ? String(user.base) : base}
                            onChange={(e) => setBase(e.target.value)}
                            disabled={isNonAdmin}
                            required
                        >
                            {!isNonAdmin && <option value="">Select Base</option>}
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
                            required
                        >
                            <option value="">Select Equipment</option>
                            {equipmentTypes.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Quantity</label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label>Purchase Date</label>
                        <input
                            type="date"
                            value={purchaseDate}
                            onChange={(e) => setPurchaseDate(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="primary-button">
                        Record Purchase
                    </button>
                </form>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
            </section>

            <section className="purchase-history">
                <h2>Purchase History</h2>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Base</th>
                                <th>Equipment</th>
                                <th>Quantity</th>
                                <th>Purchase Date</th>
                                <th>Recorded By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.length === 0 ? (
                                <tr>
                                    <td colSpan="5">No purchases recorded yet.</td>
                                </tr>
                            ) : (
                                purchases.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.base_name}</td>
                                        <td>{item.equipment_name}</td>
                                        <td><strong>{item.quantity}</strong></td>
                                        <td>{item.purchase_date}</td>
                                        <td>{item.created_by_username || "Admin"}</td>
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

export default Purchases;