# Intelligent Expense & Bill Management Platform

An AI-powered web application that helps users **digitally manage bills, extract expense information automatically, categorize expenses, and monitor their spending** through an interactive dashboard.

The system combines **OCR, Natural Language Processing, and web technologies** to reduce manual expense entry and provide a centralized view of financial transactions.

---

## 📌 Project Overview

Managing bills and expenses manually can be time-consuming and error-prone. Users often need to enter information such as the merchant name, amount, date, and expense category manually.

The **Intelligent Expense & Bill Management Platform** automates this process.

Users can upload a bill or receipt, and the system:

1. Accepts the uploaded bill/receipt.
2. Extracts text from the image using **Tesseract OCR**.
3. Identifies important expense information from the extracted text.
4. Categorizes the expense using **Hugging Face NLP models**.
5. Stores the processed expense in **MongoDB**.
6. Displays expenses through an interactive dashboard.
7. Provides users with spending insights and category-wise summaries.

---


## ✨ Key Features

### 🧾 Bill & Receipt Upload

Users can upload bills or receipts through the web interface.

Supported input can include:

* Images
* Scanned receipts
* Digital bill screenshots

---

### 🔍 OCR-Based Text Extraction

The system uses **Tesseract OCR** to convert text present in a bill or receipt image into machine-readable text.

Example:

```text
WALMART
Date: 20/08/2026
Milk        ₹60
Bread       ₹45
Total       ₹105
```

The extracted text is then processed by the backend.

---

### 🤖 AI-Based Expense Categorization

The extracted expense information is passed through an NLP-based categorization process using **Hugging Face**.

Expenses can be classified into categories such as:

* Food
* Groceries
* Transportation
* Shopping
* Healthcare
* Utilities
* Entertainment
* Other

This reduces the need for users to manually select an expense category.

---

### 📊 Interactive Dashboard

The dashboard provides a centralized view of financial activity.

It can display:

* Total expenses
* Number of transactions
* Category-wise spending
* Recent transactions
* Monthly spending
* Expense distribution
* Spending trends

Charts and visualizations make the financial data easier to understand.

---

### 💾 Expense Management

Users can manage their stored expenses, including:

* Viewing expenses
* Adding expenses
* Updating expense information
* Deleting expenses
* Filtering expenses
* Viewing categorized transactions

---


# 📌 Conclusion

The **Intelligent Expense & Bill Management Platform** demonstrates how AI and full-stack technologies can be combined to automate everyday financial management.

By integrating **Tesseract OCR** for bill text extraction and **Hugging Face NLP** for expense categorization, the system reduces manual data entry and converts unstructured receipts into organized financial data.

The React-based dashboard provides users with a simple way to monitor their expenses, while the Node.js/Express backend manages processing and database operations. The application is deployed on **AWS EC2**, providing a cloud-based environment for running the frontend and backend.

Overall, the project demonstrates practical implementation of **AI, OCR, NLP, REST APIs, database management, and cloud deployment** in a real-world financial application.
