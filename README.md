# Subscription Overlap & Cost Leak Detector

## Overview

The Subscription Overlap & Cost Leak Detector is a web-based application that helps users manage recurring subscriptions, track their spending, and identify possible cost leaks caused by overlapping services.

## Features

- Add and manage subscriptions
- Store subscription name, category, cost, billing cycle, payment method, and renewal date
- Calculate monthly and yearly subscription expenses
- Normalize subscription costs based on billing cycle
- Group subscriptions by category
- Detect possible subscription overlaps
- Identify potential unnecessary spending
- Display subscription spending analysis
- Store user and subscription data using Local Storage
- Admin dashboard to manage users and view platform-wide insights

## Technologies Used

- HTML
- CSS
- JavaScript
- Local Storage
- Git and GitHub
- Vercel for deployment

## How It Works

The user enters subscription details such as subscription name, category, cost, billing cycle, payment method, and renewal date.

The application converts subscription costs into a common monthly value so that different billing cycles can be compared easily.

Subscriptions are grouped according to their category. If multiple subscriptions belong to the same category, the application identifies them as possible overlaps and calculates the potential cost leak.

The dashboard also shows monthly spending, yearly spending, subscription statistics, and overlap information.

## Project Structure

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
