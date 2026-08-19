# 💳 Subscription Overlap & Cost Leak Detector

> 🚀 A backend application that helps users manage recurring subscriptions, identify overlapping services, and understand how much they are spending over time.

---

## 📌 Problem Statement

With the increasing number of subscription-based services, users often end up paying for multiple services that provide similar features. This makes it difficult to track total spending and identify unnecessary or overlapping subscriptions.

**Subscription Overlap & Cost Leak Detector** is designed to solve this problem by allowing users to record their subscriptions and analyze their spending based on **categories, billing cycles, and costs**.

---

## 🎯 Objectives

| 🎯 Objective | 📝 Description |
|---|---|
| 📋 **Track Subscriptions** | Manage all recurring subscriptions in one place |
| 💰 **Calculate Expenses** | Calculate monthly and yearly subscription expenses |
| 🔍 **Detect Overlaps** | Identify potentially overlapping services |
| 💸 **Find Cost Leaks** | Identify unnecessary recurring expenses |
| 📊 **Analyze Spending** | Provide a clear analysis of subscription spending |

---

## ✨ Features

- ➕ **Add and manage subscriptions**
- 🏷️ Store **subscription name, category, cost, and billing cycle**
- 🔄 **Normalize billing cycles** into a common cost format
- 📅 Calculate estimated **monthly and annual spending**
- 🔎 Detect subscriptions belonging to the **same category**
- ⚠️ Identify **potential subscription overlaps**
- 🌐 Provide a **REST API** for subscription analysis
- 💾 Support **persistent database storage**
- 🧩 Follow a **structured backend architecture**

---

## 🔄 How It Works

```text
        📋 Add Subscription
                ↓
       🔄 Normalize Billing Cycle
                ↓
        💰 Calculate Costs
                ↓
        🏷️ Group by Category
                ↓
        🔍 Detect Overlaps
                ↓
        ⚠️ Find Cost Leaks
                ↓
        📊 Generate Analysis
