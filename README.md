# Happy Happy Saloon - Smart Barber Queue Management System

## Overview

Happy Happy Saloon is a full-stack web application developed to simplify queue management in a barber shop. Instead of standing in a physical queue, customers can generate a digital token, monitor their queue status, and receive real-time updates about their appointment.

The application also provides an admin dashboard where the salon owner can manage customers, control the active queue, monitor appointments, and maintain booking history. The interface is designed in Figma and implemented using React with a responsive black-and-gold themed UI.

---

# Features

## Customer Module

* Generate a digital token without creating an account.
* Book an appointment using name and mobile number.
* Track live queue position.
* View estimated waiting time.
* Receive real-time status updates.
* Cancel an active booking.
* Session persistence using Local Storage.
* Responsive interface for desktop and mobile devices.

---

## Admin Module

* Secure admin authentication using JWT.
* Dashboard with live appointment statistics.
* View total appointments, waiting customers and completed services.
* Call the next customer in the queue.
* Complete or cancel appointments.
* Manage two active barber chairs.
* View archived booking history.
* Reset daily queue when required.

---

## System Features

* Real-time updates using Socket.IO.
* Automatic queue management for two barber chairs.
* MongoDB Atlas database support.
* Local JSON database fallback if MongoDB is unavailable.
* Password hashing using bcryptjs.
* JWT-based authentication.
* Cookie-based session management.
* API rate limiting using express-rate-limit.
* Automatic daily queue reset using node-cron.

---

# Technology Stack

## Frontend

* React 19
* Vite
* React Router DOM
* Axios
* React Hot Toast
* Lucide React
* CSS

---

## Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* Socket.IO
* JWT
* bcryptjs
* cookie-parser
* express-rate-limit
* node-cron

---

# Project Structure

```text
server/
│
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── sockets/
└── cron/

src/
│
├── assets/
├── components/
├── context/
├── pages/
├── styles/
├── App.jsx
└── main.jsx
```

---

# Application Flow

1. Customer visits the landing page.
2. Customer generates a digital token.
3. The first two customers are assigned to the available barber chairs.
4. Remaining customers are placed in the waiting queue.
5. Customers receive live updates through Socket.IO.
6. Admin manages the queue using the dashboard.
7. Completed or cancelled bookings are moved to the booking history.

---

# Pages

* Landing Page
* Customer Token Page
* Admin Login
* Admin Dashboard
* Past Bookings Page

---

# Default Admin Credentials

```text
Email    : abhigaming9755@gmail.com
Password : Abhi@9755626744
```

---

# Installation

## Clone the repository

```bash
git clone https://github.com/your-username/happy-happy-saloon.git
```

## Install dependencies

```bash
npm install
```

## Run the development server

```bash
npm run dev
```

## Build the project

```bash
npm run build
```

## Start the production server

```bash
npm start
```

---

# Future Scope

The project can be extended with several additional features in the future:

* Online appointment booking with date and time selection.
* SMS and WhatsApp notifications for token updates.
* Email notifications for appointment confirmation.
* Online payment integration.
* Multiple salon branch management.
* Customer login and profile management.
* Service pricing and billing module.
* Barber-wise appointment allocation.
* Customer feedback and rating system.
* QR code based token verification.
* Analytics dashboard with daily, weekly and monthly reports.
* Inventory management for salon products.
* Dark and light theme support.
* Progressive Web App (PWA) support.
* Mobile application using React Native or Flutter.
* AI-based waiting time prediction using historical booking data.

---

# Learning Outcomes

This project demonstrates practical implementation of:

* React component-based architecture
* REST API development using Express.js
* JWT authentication and authorization
* MongoDB database operations
* Real-time communication using Socket.IO
* State management with React Context API
* Queue management algorithms
* Responsive UI development
* CRUD operations
* Client-server architecture

#Screenshots

<img width="1897" height="912" alt="Screenshot 2026-07-05 195211" src="https://github.com/user-attachments/assets/2b213ae1-41e8-4fa1-a26d-e445937eb303" />

<img width="1897" height="907" alt="Screenshot 2026-07-05 195330" src="https://github.com/user-attachments/assets/aa34a123-5b88-4fd3-8065-266a03f1f040" />

<img width="1892" height="900" alt="Screenshot 2026-07-05 195433" src="https://github.com/user-attachments/assets/0bf6b3f3-14ec-4f14-8be9-d8e0fb450fba" />


---

# Developed By

**Abhishek Mishra**
