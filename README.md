# AssetGuard

**AssetGuard** is a full-stack Military Asset Management System designed to manage and track military assets across multiple bases.

The system provides visibility into asset inventory, purchases, transfers, assignments, expenditures, and movement history while using role-based access control to restrict users according to their responsibilities.

---

## Features

### Dashboard

The dashboard provides an overview of asset activity, including:

- Opening Balance
- Closing Balance
- Net Movement
- Assigned Assets
- Expended Assets
- Purchases
- Transfers In
- Transfers Out

Net Movement is calculated as:

```text
Net Movement = Purchases + Transfer In - Transfer Out
```

Dashboard data can be filtered using:

- Base
- Equipment Type
- Date

The Net Movement card also provides a detailed breakdown of purchases, transfers in, and transfers out.

---

### Asset Inventory

The Assets section provides visibility into available inventory across military bases.

Users can:

- View available assets
- View equipment by base
- Filter assets by base
- Filter by equipment type
- Track available quantities

Supported equipment categories include:

- Vehicles
- Weapons
- Ammunition
- Other equipment

---

### Purchases

The Purchases module records newly acquired assets.

Features include:

- Record a purchase
- Select base
- Select equipment type
- Enter quantity
- Record purchase date
- View purchase history
- Filter purchase records

When a purchase is successfully recorded, the corresponding inventory quantity is automatically increased.

---

### Transfers

Assets can be transferred between military bases.

The system records:

- Source Base
- Destination Base
- Equipment Type
- Quantity
- Transfer Date
- User responsible for the transaction
- Transaction timestamp

When a transfer is completed:

```text
Source Inventory      → Decreased
Destination Inventory → Increased
```

The system also validates inventory availability before allowing a transfer.

---

### Assignments

Assets can be assigned to personnel.

Assignment records contain:

- Base
- Equipment
- Personnel Name
- Quantity
- Assignment Date
- User who created the assignment

Assigned quantities are deducted from available inventory.

---

### Expenditures

Assets such as ammunition or other consumable resources can be recorded as expended.

Expenditure records include:

- Base
- Equipment
- Quantity
- Reason
- Expenditure Date
- User who recorded the expenditure

Expended quantities are deducted from available inventory.

---

### Audit Logs

AssetGuard maintains audit records for important asset transactions.

The audit system records:

- User
- Action
- Base
- Equipment
- Quantity
- Transaction details
- Date and time

Audited operations include:

- Purchases
- Transfers
- Assignments
- Expenditures

Audit logs help provide traceability and accountability for asset movements.

---

### User Management

Administrators can manage AssetGuard users directly from the application.

Features include:

- Create users
- Edit users
- Assign roles
- Assign users to bases
- Activate users
- Deactivate users
- Delete users
- Reset/change user passwords

Passwords are handled using Django's password hashing system and are not stored as plain text.

---

## Role-Based Access Control

AssetGuard supports three user roles.

### Admin

Administrators have system-wide access.

Admin capabilities include:

- Access all bases
- Dashboard access
- Asset inventory
- Purchases
- Transfers
- Assignments
- Expenditures
- Audit logs
- User management

### Base Commander

Base Commanders are associated with a specific military base.

Their access is intended to be restricted to their assigned base.

Typical capabilities include:

- Dashboard
- Assets
- Purchases
- Transfers
- Assignments
- Expenditures
- Audit information for their base

### Logistics Officer

Logistics Officers are responsible primarily for asset movement and logistics operations.

Typical capabilities include:

- Dashboard
- Assets
- Purchases
- Transfers
- Relevant audit information

They do not have access to User Management.

> Role-based access restrictions should be enforced by the Django backend in addition to frontend route/navigation restrictions.

---

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- React Router
- Axios
- CSS

### Backend

- Python
- Django
- Django REST Framework
- Simple JWT

### Database

- MySQL

### Authentication

- JWT Authentication
- Access Tokens
- Refresh Tokens
- Role-Based Access Control

---

## Project Structure

```text
AssetGuard/
│
├── backend/
│   │
│   ├── manage.py
│   │
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   └── assetguard/
│       ├── migrations/
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── serializers.py
│       ├── permissions.py
│       ├── urls.py
│       └── views.py
│
├── frontend/
│   │
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── requirements.txt
└── README.md
```

---

# Installation

## 1. Clone the Repository

```bash
git clone https://github.com/KhopadeSonam/AssetGuard.git
```

Move into the project:

```bash
cd AssetGuard
```

---

# Backend Setup

## 2. Create a Virtual Environment

On Windows:

```bash
python -m venv myenv
```

Activate it:

```powershell
.\myenv\Scripts\Activate.ps1
```

---

## 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configure MySQL

Create a MySQL database for the application.

Example:

```sql
CREATE DATABASE assetguard_db;
```

Configure the Django database connection in the project settings/environment configuration.

Example configuration:

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "assetguard_db",
        "USER": "root",
        "PASSWORD": "",
        "HOST": "localhost",
        "PORT": "3306",
    }
}
```

For production or public repositories, database credentials and secret values should be stored in environment variables rather than committed directly to GitHub.

---

## 5. Run Migrations

Move into the backend directory:

```bash
cd backend
```

Run:

```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 6. Create an Administrator

```bash
python manage.py createsuperuser
```

Enter the requested username, email, and password.

The application's custom role configuration may also need to be configured for the user depending on the current project setup.

---

## 7. Start Django

```bash
python manage.py runserver
```

The backend will normally run at:

```text
http://127.0.0.1:8000/
```

The REST API is available under:

```text
http://127.0.0.1:8000/api/
```

---

# Frontend Setup

Open another terminal from the AssetGuard project.

Move into:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173/
```

---

# Authentication Flow

Users sign in through the AssetGuard login page.

The frontend sends credentials to the Django authentication API.

After successful authentication, the backend returns:

- Access Token
- Refresh Token
- User information
- User role

The frontend uses the access token for authenticated API requests.

Axios interceptors handle authenticated requests and token refresh behavior.

---

# Main API Areas

The application contains APIs for:

```text
Authentication
Dashboard
Bases
Equipment Types
Inventory
Purchases
Transfers
Assignments
Expenditures
Audit Logs
User Management
```

Examples include:

```text
/api/auth/login/
/api/auth/refresh/

/api/dashboard/

/api/bases/
/api/equipment-types/
/api/inventory/

/api/purchases/
/api/transfers/

/api/assignments/
/api/expenditures/

/api/audit-logs/

/api/users/
```

---

# Inventory Logic

AssetGuard automatically updates inventory when transactions occur.

### Purchase

```text
Inventory = Inventory + Purchase Quantity
```

### Transfer

```text
Source Inventory      = Source Inventory - Transfer Quantity

Destination Inventory = Destination Inventory + Transfer Quantity
```

### Assignment

```text
Available Inventory = Available Inventory - Assigned Quantity
```

### Expenditure

```text
Available Inventory = Available Inventory - Expended Quantity
```

Database transactions are used for critical inventory operations to help prevent partially completed asset movements.

---

# Security

AssetGuard includes:

- JWT authentication
- Protected API endpoints
- Role-based access control
- Django password hashing
- Protected frontend routes
- Transaction validation
- Inventory validation
- Audit logging

Authorization should always be enforced by the backend rather than relying only on hidden frontend navigation.

---

# Interface

AssetGuard uses a clean administrative interface with:

- White and blue design
- Responsive sidebar navigation
- Dashboard metric cards
- Data filters
- Transaction forms
- Inventory tables
- Audit history
- User management

The interface is designed to remain simple and readable for asset-management workflows.

---

# Future Improvements

Potential improvements include:

- More detailed historical inventory snapshots
- Advanced date-range reporting
- Export reports to PDF/Excel
- Notifications and alerts
- Advanced audit search
- Inventory threshold warnings
- Deployment configuration
- Automated testing
- Analytics and charts

---

# Author

**Sonam Khopade**

GitHub: `KhopadeSonam`

---

## Repository

AssetGuard source code is available in this GitHub repository.

---

> AssetGuard is an educational full-stack project demonstrating Django REST APIs, React frontend development, JWT authentication, inventory transaction management, audit logging, and role-based access control.
