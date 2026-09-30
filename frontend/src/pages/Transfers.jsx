import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/api";

function Transfers() {
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
    const [transfers, setTransfers] = useState([]);

    const [fromBase, setFromBase] = useState(isNonAdmin ? String(user.base) : "");
    const [toBase, setToBase] = useState("");
    const [equipmentType, setEquipmentType] = useState("");
    const [quantity, setQuantity] = useState("");
    const [transferDate, setTransferDate] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const extractArray = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.results)) return data.results;
        return [];
    };

    const loadData = async () => {
        try {
            setError("");

            const results = await Promise.allSettled([
                api.get("bases/"),
                api.get("equipment-types/"),
                api.get("transfers/"),
            ]);

            if (results[0].status === "fulfilled") {
                setBases(extractArray(results[0].value.data));
            }

            if (results[1].status === "fulfilled") {
                setEquipmentTypes(extractArray(results[1].value.data));
            }

            if (results[2].status === "fulfilled") {
                setTransfers(extractArray(results[2].value.data));
            }

        } catch (err) {
            console.error(err);
            setError("Failed to load transfer data.");
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const selectedFromBase = isNonAdmin ? Number(user.base) : Number(fromBase);
        const selectedToBase = Number(toBase);

        if (selectedFromBase === selectedToBase) {
            setError("Source base and destination base cannot be the same.");
            return;
        }

        try {
            await api.post("transfers/", {
                from_base: selectedFromBase,
                to_base: selectedToBase,
                equipment_type: Number(equipmentType),
                quantity: Number(quantity),
                transfer_date: transferDate,
            });

            setMessage("Asset transfer completed successfully.");

            setFromBase(isNonAdmin ? String(user.base) : "");
            setToBase("");
            setEquipmentType("");
            setQuantity("");
            setTransferDate("");

            loadData();

        } catch (error) {
            console.error(error);
            setError(
                error.response?.data
                    ? JSON.stringify(error.response.data)
                    : "Failed to create transfer."
            );
        }
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <h1>Transfers</h1>
                <p>Transfer military equipment between bases safely with transaction validation.</p>
            </div>

            <section className="transfer-form-section">
                <h2>Initiate Equipment Transfer</h2>

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>From Base (Source)</label>
                        <select
                            value={isNonAdmin ? String(user.base) : fromBase}
                            onChange={(e) => setFromBase(e.target.value)}
                            disabled={isNonAdmin}
                            required
                        >
                            {!isNonAdmin && <option value="">Select Source Base</option>}
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
                        <label>To Base (Destination)</label>
                        <select
                            value={toBase}
                            onChange={(e) => setToBase(e.target.value)}
                            required
                        >
                            <option value="">Select Destination Base</option>
                            {bases.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
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
                        <label>Transfer Date</label>
                        <input
                            type="date"
                            value={transferDate}
                            onChange={(e) => setTransferDate(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="primary-button">
                        Complete Transfer
                    </button>
                </form>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
            </section>

            <section className="transfer-history">
                <h2>Transfer History</h2>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>From Base</th>
                                <th>To Base</th>
                                <th>Equipment</th>
                                <th>Quantity</th>
                                <th>Transfer Date</th>
                                <th>Created By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.length === 0 ? (
                                <tr>
                                    <td colSpan="6">No transfers recorded yet.</td>
                                </tr>
                            ) : (
                                transfers.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.from_base_name}</td>
                                        <td>{item.to_base_name}</td>
                                        <td>{item.equipment_name}</td>
                                        <td><strong>{item.quantity}</strong></td>
                                        <td>{item.transfer_date}</td>
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

export default Transfers;