# BookMyGame - Sports Venue Booking Platform 🏆

> A comprehensive Final Year Project (FYP) platform designed to bridge the gap between sports enthusiasts and venue operators.

BookMyGame is a full-stack web application that allows users to seamlessly discover, book, and pay for sports venues on an hourly basis. It also provides venue owners (operators) with a powerful suite of management tools to track bookings, manage availability, and review financial analytics in real-time.

## ✨ Key Features

### For Users
* **Smart Search & Filtering:** Find venues by sport, location, price range, and availability.
* **Real-Time Booking System:** Interactive calendar with instant, clash-free slot reservations.
* **Secure Payments:** Integrated eSewa payment gateway for seamless digital transactions.
* **User Dashboard:** Track upcoming games, view past bookings, and manage profiles.

### For Operators
* **Venue Management:** List venues, set operating hours, upload galleries, and define pricing.
* **Dynamic Analytics:** Real-time dashboard with Recharts-powered revenue trends and booking statistics.
* **Booking Oversight:** Approve, cancel, or modify upcoming reservations.

### For Administrators
* **Platform Governance:** Review and approve pending venue listings and operator requests.
* **Global Analytics:** High-level overview of platform growth, user registrations, and top operators.

## 💻 Tech Stack

### Frontend
* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS
* **Routing:** React Router v6
* **Data Visualization:** Recharts
* **State Management:** React Hooks & Context API

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database Management:** Prisma ORM
* **Database:** PostgreSQL
* **Authentication:** JSON Web Tokens (JWT) & bcrypt
* **File Uploads:** Multer

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites
* Node.js (v18 or higher)
* PostgreSQL database installed and running
* Git

### 1. Clone the repository
```bash
git clone https://github.com/MdInjamamul/BookMyGameFYP.git
cd BookMyGameFYP
```

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder and configure your variables (see Environment Variables section below).
4. Run Prisma database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## ⚙️ Environment Variables (.env)

You will need to set up the following environment variables in your `backend/.env` file:

```env
# Server
PORT=5000

# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/bookmygame_db"

# JWT Authentication
JWT_SECRET="your_highly_secure_jwt_secret_key"
JWT_EXPIRE="30d"

# Payment Gateway (eSewa - Test Credentials)
ESEWA_MERCHANT_ID="EPAYTEST"
ESEWA_SUCCESS_URL="http://localhost:5173/payment/success"
ESEWA_FAILURE_URL="http://localhost:5173/payment/failure"
```

## 📜 License & Academic Integrity
This project was developed as a Final Year Project for academic purposes. It is open-source but intended primarily for academic evaluation.
