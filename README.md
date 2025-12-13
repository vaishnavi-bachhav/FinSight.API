# FinSight API – Backend Documentation

This document describes the REST API for **FinSight**, a personal finance dashboard backend built with **Express.js**, **MongoDB**, and **Clerk authentication**.  
The API is deployed on **Google Cloud Run** and serves a React frontend hosted separately.

---

## 🔐 Authentication

- Authentication is handled using **Clerk**
- Protected routes require a valid Clerk session
- Backend uses:
  - `clerkMiddleware()` (global)
  - `requireAuth()` on protected route groups
  - `getAuth(req)` to extract `userId`

### Authorization Header
All protected endpoints require:

Authorization: Bearer <CLERK_JWT>

If authentication fails, the API returns:

```json 
{ "message": "Not authenticated" }
```

## 🌍 Base URLs 
| Environment |	Base URL |
| ------------| ---------|
| Local | http://localhost:8080 |
| Production |https://finsight-api-834761250594.us-central1.run.app |

---

❤️ Health Status Endpoints (Public) 
GET `/health`

Used by Cloud Run for health checks.

Response

```json
{
  "status": "ok",
  "service": "finsight-api",
  "uptime": 123.45,
  "timestamp": "2025-12-13T00:00:00.000Z"
}
```

---

## 🗂️ Categories API (Protected) 

Base path: `/category`
Authentication: ✅ Required

Category Model
```json
{
  "_id": "ObjectId",
  "userId": "clerk_user_id",
  "name": "Groceries",
  "type": "income | expense",
  "icon": "base64 string",
  "createdAt": "ISO Date",
  "updatedAt": "ISO Date"
}
```

GET `/category`

Fetch all categories belonging to the authenticated user.

Response
```json
[
  {
    "_id": "656...",
    "name": "Groceries",
    "type": "expense",
    "icon": "base64...",
    "createdAt": "2025-12-13T00:00:00.000Z"
  }
]
```

POST `/category`
Create a new category.
Request Body
```json
{
  "name": "Salary",
  "type": "income",
  "icon": "base64 string (optional)"
}
```

Response
```json
{
  "acknowledged": true,
  "insertedId": "656..."
}
```

Errors

- 400 – Missing name or type
- 401 – Not authenticated

PUT `/category/:id`
Update a category owned by the current user.
Request Body
```json
{
  "name": "Food",
  "type": "expense"
}
```

Response
```json
{ "message": "Category updated successfully" }
```

DELETE `/category/:id`
Delete a category owned by the current user.
Response
```json
{ "message": "Category deleted successfully" }
```
⚠️ Important Behavior
**Transactions linked to a deleted category are not deleted. They will appear as “Uncategorized” in transaction results**

---

## 💸 Transactions API (Protected)

Base path: `/transaction`
Authentication: ✅ Required
Transaction Model
```json
{
  "_id": "ObjectId",
  "userId": "clerk_user_id",
  "date": "ISO Date",
  "type": "income | expense",
  "amount": 50.25,
  "note": "Optional",
  "categoryId": "ObjectId",
  "createdAt": "ISO Date",
  "updatedAt": "ISO Date"
}
```

GET `/transaction`
Returns transactions grouped by month, with totals.
Response
```json
[
  {
    "month": "Dec 2025",
    "transactions": [...],
    "totalIncome": 3000,
    "totalExpense": 1200,
    "net": 1800
  }
]
```

Category Fallback
If a category is deleted:
```json
{
  "name": "Uncategorized",
  "type": "expense",
  "icon": null
}
```

POST `/transaction`
Create a new transaction.
Request Body
```json
{
  "date": "2025-12-12",
  "type": "expense",
  "amount": 25.5,
  "note": "Dinner",
  "categoryId": "656..."
}
```

Response
```json
{
  "acknowledged": true,
  "insertedId": "656..."
}
```

PUT `/transaction/:id`
Update a transaction owned by the current user.
Response
```json
{ "message": "Transaction updated successfully" }
```

DELETE `/transaction/:id`
Delete a transaction owned by the current user.
Response
```json
{ "message": "Transaction deleted successfully" }
```

---

## 💱 Currency API (Public)
Base path: `/currency`
Authentication: ❌ Not required
Powered by Frankfurter API

GET `/currency/rate`
Query Parameters
| Param | Default | Example |
| ----- | --------| -------|
|base | USD |    USD|
|symbols | INR |  INR,EUR |

Example
GET `/currency/rate?base=USD&symbols=INR,EUR`

Response
```json
{
  "base": "USD",
  "date": "2025-12-13",
  "rates": {
    "INR": 83.12,
    "EUR": 0.92
  }
}
```

---

## 📉 Inflation API (Public)
Base path: `/inflation`
Authentication: ❌ Not required
Powered by World Bank Open Data API
Indicator used:
FP.CPI.TOTL.ZG

GET `/inflation`
Query Parameters
| Param | Default | Example |
| ----- | --------| -------|
|country | USD |    IND|

Response
```json
{
  "country": "USA",
  "latest": { "year": 2023, "value": 4.1 },
  "series": [
    { "year": 2015, "value": 0.1 },
    { "year": 2016, "value": 1.3 }
  ],
  "cached": false
}
```
⏱ Cached for 12 hours to reduce API usage.

---

## ⚙️ CORS Configuration
The API allows requests from:
FRONTEND_URL= `https://finsight-120798-77dca.web.app`

with:`credentials: true`

strict origin matching

## 📌 Notes

- All data is scoped per user
- Users cannot access or modify another user’s data
- Backend aggregation improves performance and simplifies frontend logic
- Designed for cloud-native deployment (Cloud Run)

## 📄 License
This API is built for educational purposes and demonstrates modern secure backend practices.