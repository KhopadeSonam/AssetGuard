import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/api";

function UserManagement() {

    const emptyForm = {
        username: "",
        email: "",
        password: "",
        role: "BASE_COMMANDER",
        base: "",
        is_active: true,
    };

    const [users, setUsers] = useState([]);
    const [bases, setBases] = useState([]);

    const [form, setForm] = useState(emptyForm);

    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const extractArray = (data) => {

        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.results)) {
            return data.results;
        }

        return [];
    };

    const getErrorMessage = (error) => {

        const data = error.response?.data;

        if (!data) {
            return "Something went wrong.";
        }

        if (typeof data === "string") {
            return data;
        }

        if (data.detail) {
            return data.detail;
        }

        const key = Object.keys(data)[0];

        if (key) {

            const value = data[key];

            if (Array.isArray(value)) {
                return `${key}: ${value.join(" ")}`;
            }

            return `${key}: ${value}`;
        }

        return "Something went wrong.";
    };

    const loadUsers = async () => {

        setLoading(true);
        setError("");

        try {

            const response = await api.get("users/");

            setUsers(
                extractArray(response.data)
            );

        } catch (error) {

            console.error(
                "Users error:",
                error.response?.data || error
            );

            setError(
                "Failed to load users."
            );

        } finally {

            setLoading(false);
        }
    };

    const loadBases = async () => {

        try {

            const response = await api.get("bases/");

            setBases(
                extractArray(response.data)
            );

        } catch (error) {

            console.error(
                "Bases error:",
                error.response?.data || error
            );
        }
    };

    useEffect(() => {

        loadUsers();
        loadBases();

    }, []);

    const handleChange = (event) => {

        const {
            name,
            value,
            type,
            checked
        } = event.target;

        setForm((previous) => ({
            ...previous,

            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    const handleRoleChange = (event) => {

        const role = event.target.value;

        setForm((previous) => ({
            ...previous,
            role: role,

            // Admin does not need a base
            base:
                role === "ADMIN"
                    ? ""
                    : previous.base,
        }));
    };

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        // Base required for non-admin users
        if (
            form.role !== "ADMIN" &&
            !form.base
        ) {

            setError(
                "Please select a base for this user."
            );

            return;
        }


        // Password required when creating
        if (
            !editingId &&
            !form.password
        ) {

            setError(
                "Password is required when creating a user."
            );

            return;
        }


        setSaving(true);

        try {

            const payload = {

                username: form.username,

                email: form.email,

                role: form.role,

                base:
                    form.role === "ADMIN"
                        ? null
                        : form.base,

                is_active: form.is_active,
            };


            // Do not overwrite password while editing
            // unless admin enters a new password.
            if (form.password) {
                payload.password = form.password;
            }


            if (editingId) {

                await api.patch(
                    `users/${editingId}/`,
                    payload
                );

                setSuccess(
                    "User updated successfully."
                );

            } else {

                await api.post(
                    "users/",
                    payload
                );

                setSuccess(
                    "User created successfully."
                );
            }


            setForm(emptyForm);
            setEditingId(null);

            await loadUsers();

        } catch (error) {

            console.error(
                "Save user error:",
                error.response?.data || error
            );

            setError(
                getErrorMessage(error)
            );

        } finally {

            setSaving(false);
        }
    };

    const handleEdit = (user) => {

        setEditingId(user.id);

        setForm({

            username: user.username || "",

            email: user.email || "",

            password: "",

            role:
                user.role ||
                "BASE_COMMANDER",

            base:
                user.base
                    ? String(user.base)
                    : "",

            is_active:
                user.is_active ?? true,
        });


        setError("");
        setSuccess("");


        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleCancel = () => {

        setEditingId(null);

        setForm(emptyForm);

        setError("");
        setSuccess("");
    };

    const handleDelete = async (user) => {

        const confirmed = window.confirm(
            `Are you sure you want to delete "${user.username}"?`
        );

        if (!confirmed) {
            return;
        }


        setError("");
        setSuccess("");


        try {

            await api.delete(
                `users/${user.id}/`
            );


            setSuccess(
                "User deleted successfully."
            );


            if (editingId === user.id) {
                setEditingId(null);
                setForm(emptyForm);
            }


            await loadUsers();

        } catch (error) {

            console.error(
                "Delete error:",
                error.response?.data || error
            );

            setError(
                getErrorMessage(error)
            );
        }
    };

    const handleStatusChange = async (user) => {

        setError("");
        setSuccess("");

        try {

            await api.patch(
                `users/${user.id}/`,
                {
                    is_active:
                        !user.is_active
                }
            );


            setSuccess(
                user.is_active
                    ? "User deactivated successfully."
                    : "User activated successfully."
            );


            await loadUsers();

        } catch (error) {

            console.error(
                "Status error:",
                error.response?.data || error
            );

            setError(
                getErrorMessage(error)
            );
        }
    };

    const formatRole = (role) => {

        if (!role) {
            return "-";
        }

        return role
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(
                /\b\w/g,
                (letter) =>
                    letter.toUpperCase()
            );
    };


    return (

        <AdminLayout>

            {/* HEADER */}

            <div className="page-header">

                <h1>User Management</h1>

                <p>
                    Create and manage AssetGuard
                    administrators, base commanders
                    and logistics officers.
                </p>

            </div>


            {/* MESSAGES */}

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}


            {success && (
                <p className="success-message">
                    {success}
                </p>
            )}


            {/* CREATE / EDIT USER */}

            <section className="user-form-section">

                <div className="user-section-header">

                    <div>

                        <h2>
                            {editingId
                                ? "Edit User"
                                : "Create New User"
                            }
                        </h2>

                        <p>
                            Assign a role and base
                            to control system access.
                        </p>

                    </div>

                </div>


                <form
                    className="user-form-grid"
                    onSubmit={handleSubmit}
                >

                    {/* USERNAME */}

                    <div className="form-group">

                        <label>
                            Username
                        </label>

                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="Enter username"
                            required
                        />

                    </div>


                    {/* EMAIL */}

                    <div className="form-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter email"
                        />

                    </div>


                    {/* PASSWORD */}

                    <div className="form-group">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder={
                                editingId
                                    ? "Leave blank to keep password"
                                    : "Enter password"
                            }
                        />

                    </div>


                    {/* ROLE */}

                    <div className="form-group">

                        <label>
                            Role
                        </label>

                        <select
                            name="role"
                            value={form.role}
                            onChange={handleRoleChange}
                            required
                        >

                            <option value="ADMIN">
                                Admin
                            </option>

                            <option value="BASE_COMMANDER">
                                Base Commander
                            </option>

                            <option value="LOGISTICS_OFFICER">
                                Logistics Officer
                            </option>

                        </select>

                    </div>


                    {/* BASE */}

                    <div className="form-group">

                        <label>
                            Base
                        </label>

                        <select
                            name="base"
                            value={form.base}
                            onChange={handleChange}
                            disabled={
                                form.role === "ADMIN"
                            }
                            required={
                                form.role !== "ADMIN"
                            }
                        >

                            <option value="">
                                {form.role === "ADMIN"
                                    ? "Not required for Admin"
                                    : "Select Base"
                                }
                            </option>


                            {bases.map((base) => (

                                <option
                                    key={base.id}
                                    value={base.id}
                                >
                                    {base.name}
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* ACTIVE */}

                    <div className="form-group user-active-group">

                        <label>
                            Status
                        </label>

                        <label className="checkbox-label">

                            <input
                                type="checkbox"
                                name="is_active"
                                checked={
                                    form.is_active
                                }
                                onChange={
                                    handleChange
                                }
                            />

                            Active User

                        </label>

                    </div>


                    {/* BUTTONS */}

                    <div className="user-form-actions">

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={saving}
                        >

                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Update User"
                                    : "Create User"
                            }

                        </button>


                        {editingId && (

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>

                        )}

                    </div>

                </form>

            </section>


            {/* USER LIST */}

            <section className="user-table-section">

                <div className="user-table-header">

                    <div>

                        <h2>System Users</h2>

                        <p>
                            Manage users who have
                            access to AssetGuard.
                        </p>

                    </div>


                    <span>
                        {loading
                            ? "Loading..."
                            : `${users.length} users`
                        }
                    </span>

                </div>


                <div className="table-wrapper">

                    <table>

                        <thead>

                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Base</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>

                        </thead>


                        <tbody>

                            {loading ? (

                                <tr>

                                    <td colSpan="7">
                                        Loading users...
                                    </td>

                                </tr>

                            ) : users.length === 0 ? (

                                <tr>

                                    <td colSpan="7">
                                        No users found.
                                    </td>

                                </tr>

                            ) : (

                                users.map((user) => (

                                    <tr key={user.id}>

                                        <td>
                                            {user.id}
                                        </td>


                                        <td>

                                            <strong>
                                                {user.username}
                                            </strong>

                                        </td>


                                        <td>
                                            {user.email || "-"}
                                        </td>


                                        <td>

                                            <span className="role-badge">

                                                {formatRole(
                                                    user.role
                                                )}

                                            </span>

                                        </td>


                                        <td>
                                            {user.base_name || "-"}
                                        </td>


                                        <td>

                                            <span
                                                className={
                                                    user.is_active
                                                        ? "status-active"
                                                        : "status-inactive"
                                                }
                                            >

                                                {user.is_active
                                                    ? "Active"
                                                    : "Inactive"
                                                }

                                            </span>

                                        </td>


                                        <td>

                                            <div className="user-actions">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(
                                                            user
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>


                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            user
                                                        )
                                                    }
                                                >

                                                    {user.is_active
                                                        ? "Deactivate"
                                                        : "Activate"
                                                    }

                                                </button>


                                                <button
                                                    type="button"
                                                    className="delete-button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            user
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </td>

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

export default UserManagement;