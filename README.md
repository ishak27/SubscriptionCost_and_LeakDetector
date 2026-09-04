# 💳 Subscription Overlap & Cost Leak Detector

The **Subscription Overlap & Cost Leak Detector** is a web-based application designed to help users manage recurring subscriptions, track their spending, and identify unnecessary expenses caused by overlapping services.

It provides users with a simple dashboard to monitor subscriptions and understand how much they are spending monthly and yearly.

## ✨ Features

* Add and manage recurring subscriptions
* Store subscription details including:

  * Subscription name
  * Category
  * Cost
  * Billing cycle
  * Payment method
  * Renewal date
* Calculate total **monthly and yearly subscription expenses**
* Normalize subscription costs based on different billing cycles
* Group subscriptions according to category
* Detect possible overlapping subscriptions
* Calculate potential **cost leaks**
* Display subscription statistics and spending analysis
* Store user and subscription data using **Local Storage**
* User login and logout functionality
* Admin login and dashboard
* Admin dashboard for managing users and viewing platform-wide insights

## ⚙️ How It Works

Users enter their subscription details such as the subscription name, category, cost, billing cycle, payment method, and renewal date.

The application then converts subscription costs into a common monthly value so that subscriptions with different billing cycles can be compared easily.

For example:

* Weekly subscriptions are converted into monthly estimates
* Monthly subscriptions remain unchanged
* Yearly subscriptions are converted into monthly values

Subscriptions are then grouped according to their categories.

If multiple subscriptions belong to the same category, the application identifies them as **possible overlaps** and calculates the amount that may be contributing to unnecessary spending.

The dashboard provides users with an overview of:

* Total monthly spending
* Total yearly spending
* Number of active subscriptions
* Subscription categories
* Possible subscription overlaps
* Estimated cost leaks

## 🛠️ Technologies Used

* **HTML** – Structure of the website
* **CSS** – Styling and responsive design
* **JavaScript** – Application logic and interactivity
* **Local Storage** – Storing user and subscription data
* **Git & GitHub** – Version control and team collaboration
* **Vercel** – Website deployment

## 📁 Project Structure

```text
SubscriptionCost_and_LeakDetector/
│
├── JS_Files/
│   ├── admin.js
│   ├── app.js
│   ├── auth.js
│   └── utils.js
│
├── Pages/
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── admin-login.html
│   └── admin-dashboard.html
│
├── Styles/
│   ├── index.css
│   ├── login.css
│   ├── dashboard.css
│   ├── admin-login.css
│   └── admin-dashboard.css
│
└── README.md
```

## 👥 User & Admin Modules

### User Module

Users can:

* Create/login to their account
* Add subscriptions
* View existing subscriptions
* Monitor monthly and yearly expenses
* Identify overlapping services
* View potential cost leaks
* Manage their subscription information

### Admin Module

The admin can:

* Login through the admin portal
* View registered users
* Monitor user subscription activity
* View platform-wide subscription statistics
* Access overall spending and subscription insights

## 🎯 Project Objective

The main objective of this project is to help users become more aware of recurring subscription expenses.

With multiple streaming platforms, productivity tools, cloud services, and other subscriptions, users may unknowingly pay for services that provide similar functionality.

This application helps identify such overlaps and gives users a clearer understanding of where their money is being spent.

## 🌐 Live Website

🔗 **Subscription Overlap & Cost Leak Detector**

https://subscription-cost-and-leak-detector.vercel.app/

## 🚀 Future Scope

Possible future improvements include:

* Database integration
* Secure authentication
* Automatic renewal reminders
* Email notifications
* Advanced spending charts
* AI-based subscription recommendations
* Improved overlap detection
* Personalized cost-saving suggestions
* Integration with payment services

## 👩‍💻 Contributors

* **Isha Kashyap**
* **Sonal**
* **Namya**

---

⭐ If you find this project useful, feel free to explore the repository and check out the live website.
