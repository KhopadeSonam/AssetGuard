import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/api";

function Assignments() {
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

    // History
    const [assignments, setAssignments] = useState([]);
    const [expenditures, setExpenditures] = useState([]);

    const [assignmentBase, setAssignmentBase] = useState(isNonAdmin ? String(user.base) : "");
    const [assignmentEquipment, setAssignmentEquipment] = useState("");
    const [personnelName, setPersonnelName] = useState("");
    const [assignmentQuantity, setAssignmentQuantity] = useState("");
    const [assignmentDate, setAssignmentDate] = useState("");

    const [expenditureBase, setExpenditureBase] = useState(isNonAdmin ? String(user.base) : "");
    const [expenditureEquipment, setExpenditureEquipment] = useState("");
    const [expenditureQuantity, setExpenditureQuantity] = useState("");
    const [reason, setReason] = useState("");
    const [expenditureDate, setExpenditureDate] = useState("");

    // Messages
    const [assignmentMessage, setAssignmentMessage] = useState("");
    const [assignmentError, setAssignmentError] = useState("");

    const [expenditureMessage, setExpenditureMessage] = useState("");
    const [expenditureError, setExpenditureError] = useState("");

    const [loading, setLoading] = useState(true);

    const extractArray = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.results)) return data.results;
        return [];
    };

    const getErrorMessage = (error) => {
        const data = error.response?.data;
        if (!data) return "Unable to connect to the server.";
        if (typeof data === "string") return data;
        if (data.detail) return data.detail;
        if (data.non_field_errors) {
            return Array.isArray(data.non_field_errors)
                ? data.non_field_errors.join(" ")
                : data.non_field_errors;
        }
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
            const value = data[firstKey];
            return Array.isArray(value) ? value.join(" ") : String(value);
        }
        return "Something went wrong.";
    };

    const loadData = async () => {
        setLoading(true);

        const results = await Promise.allSettled([
            api.get("bases/"),
            api.get("equipment-types/"),
            api.get("assignments/"),
            api.get("expenditures/"),
        ]);

        if (results[0].status === "fulfilled") {
            setBases(extractArray(results[0].value.data));
        }

        if (results[1].status === "fulfilled") {
            setEquipmentTypes(extractArray(results[1].value.data));
        }

        if (results[2].status === "fulfilled") {
            setAssignments(extractArray(results[2].value.data));
        }

        if (results[3].status === "fulfilled") {
            setExpenditures(extractArray(results[3].value.data));
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAssignmentSubmit = async (e) => {
        e.preventDefault();
        setAssignmentMessage("");
        setAssignmentError("");

        try {
            const selectedBase = isNonAdmin ? Number(user.base) : Number(assignmentBase);

            await api.post("assignments/", {
                base: selectedBase,
                equipment_type: Number(assignmentEquipment),
                personnel_name: personnelName,
                quantity: Number(assignmentQuantity),
                assignment_date: assignmentDate,
            });

            setAssignmentMessage("Asset assigned successfully.");

            setAssignmentBase(isNonAdmin ? String(user.base) : "");
            setAssignmentEquipment("");
            setPersonnelName("");
            setAssignmentQuantity("");
            setAssignmentDate("");

            loadData();

        } catch (error) {
            console.error(error);
            setAssignmentError(getErrorMessage(error));
        }
    };

    const handleExpenditureSubmit = async (e) => {
        e.preventDefault();
        setExpenditureMessage("");
        setExpenditureError("");

        try {
            const selectedBase = isNonAdmin ? Number(user.base) : Number(expenditureBase);

            await api.post("expenditures/", {
                base: selectedBase,
                equipment_type: Number(expenditureEquipment),
                quantity: Number(expenditureQuantity),
                reason: reason,
                expenditure_date: expenditureDate,
            });

            setExpenditureMessage("Expenditure recorded successfully.");

            setExpenditureBase(isNonAdmin ? String(user.base) : "");
            setExpenditureEquipment("");
            setExpenditureQuantity("");
            setReason("");
            setExpenditureDate("");

            loadData();

        } catch (error) {
            console.error(error);
            setExpenditureError(getErrorMessage(error));
        }
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <h1>Assignments & Expenditures</h1>
                <p>Assign military assets to personnel or record consumed/expended equipment.</p>
            </div>

            <section className="assignment-form-grid">
                <div className="assignment-card">
                    <h2>Assign Equipment to Personnel</h2>

                    <form onSubmit={handleAssignmentSubmit}>
                        <div>
                            <label>Base</label>
                            <select
                                value={isNonAdmin ? String(user.base) : assignmentBase}
                                onChange={(e) => setAssignmentBase(e.target.value)}
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
                                value={assignmentEquipment}
                                onChange={(e) => setAssignmentEquipment(e.target.value)}
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
                            <label>Personnel Name</label>
                            <input
                                type="text"
                                value={personnelName}
                                onChange={(e) => setPersonnelName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label>Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={assignmentQuantity}
                                onChange={(e) => setAssignmentQuantity(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label>Assignment Date</label>
                            <input
                                type="date"
                                value={assignmentDate}
                                onChange={(e) => setAssignmentDate(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="primary-button">
                            Assign Equipment
                        </button>
                    </form>

                    {assignmentMessage && <p className="success-message">{assignmentMessage}</p>}
                    {assignmentError && <p className="error-message">{assignmentError}</p>}
                </div>

                <div className="assignment-card">
                    <h2>Record Asset Expenditure</h2>

                    <form onSubmit={handleExpenditureSubmit}>
                        <div>
                            <label>Base</label>
                            <select
                                value={isNonAdmin ? String(user.base) : expenditureBase}
                                onChange={(e) => setExpenditureBase(e.target.value)}
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
                                value={expenditureEquipment}
                                onChange={(e) => setExpenditureEquipment(e.target.value)}
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
                                value={expenditureQuantity}
                                onChange={(e) => setExpenditureQuantity(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label>Reason / Mission Details</label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label>Expenditure Date</label>
                            <input
                                type="date"
                                value={expenditureDate}
                                onChange={(e) => setExpenditureDate(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="primary-button">
                            Record Expenditure
                        </button>
                    </form>

                    {expenditureMessage && <p className="success-message">{expenditureMessage}</p>}
                    {expenditureError && <p className="error-message">{expenditureError}</p>}
                </div>
            </section>

            <section className="assignment-section">
                <h2>Assignment History</h2>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Base</th>
                                <th>Equipment</th>
                                <th>Personnel</th>
                                <th>Quantity</th>
                                <th>Assignment Date</th>
                                <th>Created By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.length === 0 ? (
                                <tr>
                                    <td colSpan="6">No assignments recorded.</td>
                                </tr>
                            ) : (
                                assignments.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.base_name}</td>
                                        <td>{item.equipment_name}</td>
                                        <td>{item.personnel_name}</td>
                                        <td><strong>{item.quantity}</strong></td>
                                        <td>{item.assignment_date}</td>
                                        <td>{item.created_by_username || "Admin"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="history-section">
                <h2>Expenditure History</h2>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Base</th>
                                <th>Equipment</th>
                                <th>Quantity</th>
                                <th>Reason</th>
                                <th>Expenditure Date</th>
                                <th>Created By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenditures.length === 0 ? (
                                <tr>
                                    <td colSpan="6">No expenditures recorded.</td>
                                </tr>
                            ) : (
                                expenditures.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.base_name}</td>
                                        <td>{item.equipment_name}</td>
                                        <td><strong>{item.quantity}</strong></td>
                                        <td>{item.reason}</td>
                                        <td>{item.expenditure_date}</td>
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

export default Assignments;