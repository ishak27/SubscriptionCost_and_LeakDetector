# 💳 Subscription Overlap & Cost Leak Detector

A web-based application that helps users manage their recurring subscriptions, track their spending, and identify unnecessary expenses caused by overlapping subscriptions.

The main purpose of this project is to give users a simple way to understand where their subscription money is going and how much they could potentially save.

---

## 📌 Problem Statement

With the increasing use of subscription-based services such as Netflix, Spotify, Amazon Prime, cloud storage, and other platforms, it becomes difficult to keep track of recurring expenses.

Users may also subscribe to multiple services from the same category without realizing how much they are spending.

The **Subscription Overlap & Cost Leak Detector** helps solve this problem by organizing subscriptions, calculating their actual monthly and yearly costs, and detecting possible overlaps.

---

## ✨ Features

- 👤 User Login and Authentication
- ➕ Add New Subscriptions
- ✏️ Edit Existing Subscriptions
- 🗑️ Delete Subscriptions
- 🔍 Search and Filter Subscriptions
- 💰 Monthly and Annual Spending Calculation
- 🔄 Billing Cycle Normalization
- ⚠️ Subscription Overlap Detection
- 📉 Cost Leak Estimation
- 📊 Category-wise Spending Analysis
- 💵 Monthly Budget Planner
- 📅 Subscription Renewal Tracking
- 💳 Payment Method Tracking
- 🌙 Light and Dark Theme
- 💱 Currency Preference
- 💾 Data Storage using Local Storage
- 👨‍💼 Separate Admin Dashboard

---

## 🔍 How Overlap Detection Works

Subscriptions are grouped according to their categories.

For example:

Netflix → Entertainment  
Amazon Prime → Entertainment  
Spotify → Music

If more than one subscription belongs to the same category, the system identifies it as a possible overlap.

The costs are converted into a common monthly value so that subscriptions with different billing cycles can be compared properly.

The system then estimates the potential monthly and yearly savings from overlapping subscriptions.

---

## 💰 Billing Cycle Calculation

Different billing cycles are converted into monthly and yearly costs for easier comparison.

Examples:

- Weekly subscriptions are converted into their monthly equivalent.
- Monthly subscriptions use their monthly cost directly.
- Yearly subscriptions are divided to calculate their monthly equivalent.

This allows the application to calculate the user's total subscription spending accurately.

---

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- DOM Manipulation
- Local Storage
- JSON
- Git
- GitHub

---


