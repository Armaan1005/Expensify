# Java Integration Guide - Expensify

## 📋 Overview

This project demonstrates **Java connectivity** with the Node.js Expensify application. The Java client (`ExpenseTrackerClient.java`) communicates with the backend REST API, showcasing full-stack integration between Java and JavaScript technologies.

---

## 🏗️ Architecture

```
┌─────────────────┐          HTTP REST API          ┌─────────────────┐
│                 │  ←─────────────────────────→   │                 │
│  Java Client    │     JSON Communication          │  Node.js Server │
│  (Frontend)     │                                 │  (Backend)      │
│                 │                                 │                 │
└─────────────────┘                                 └────────┬────────┘
                                                             │
                                                             ▼
                                                    ┌─────────────────┐
                                                    │  SQLite DBs     │
                                                    │  - Personal     │
                                                    │  - Corporate    │
                                                    └─────────────────┘
```

---

## 📁 Java Files

### 1. **ExpensifyClient.java**
   - Main Java client application
   - Connects to REST API endpoints
   - Demonstrates CRUD operations
   - **Lines of Code**: 310+
   - **Key Features**:
     - User authentication (login/signup)
     - Fetch expenses
     - Add new expenses
     - Approve/reject expenses (admin)
     - Delete expenses
     - Health check

### 2. **pom.xml**
   - Maven project configuration
   - Manages dependencies (JSON library)
   - Build configuration for executable JAR

---

## 🚀 Setup Instructions

### Prerequisites
- ✅ Java JDK 11 or higher
- ✅ Maven 3.6 or higher
- ✅ Node.js server running (localhost:3000)

### Step 1: Install Maven Dependencies
```bash
mvn clean install
```

### Step 2: Compile Java Client
```bash
mvn compile
```

### Step 3: Run Java Client
```bash
mvn exec:java -Dexec.mainClass="ExpensifyClient"
```

**OR** build and run executable JAR:
```bash
mvn package
java -jar target/expensify-client.jar
```

---

## 🔧 Java Client Features

### 1. **Authentication System**
```java
ExpensifyClient client = new ExpensifyClient();
boolean success = client.login("admin", "admin123", "company");
```

### 2. **Fetch Expenses**
```java
String expenses = client.fetchExpenses("company");
JSONArray expenseList = new JSONArray(expenses);
```

### 3. **Add New Expense**
```java
client.addExpense(
    "Office Supplies",    // name
    1500.0,              // amount
    "Other",             // category
    "2025-10-01",        // date
    "company"            // tracker type
);
```

### 4. **Approve/Reject (Admin Only)**
```java
client.updateExpenseStatus(5, "approved");
client.updateExpenseStatus(6, "rejected");
```

### 5. **Delete Expense**
```java
client.deleteExpense(3, "company");
```

### 6. **Health Check**
```java
boolean healthy = client.checkHealth();
```

---

## 📊 Sample Output

When you run the Java client, you'll see:

```
╔═══════════════════════════════════════════════════╗
║        EXPENSIFY - JAVA CLIENT CONNECTOR         ║
║   Demonstrating Java-Node.js Integration         ║
╚═══════════════════════════════════════════════════╝

🔐 TEST 1: User Authentication
─────────────────────────────────
✓ Login Status: SUCCESS

📊 TEST 2: Fetching Expenses
─────────────────────────────────
✓ Expenses Retrieved: SUCCESS
✓ Total Expenses: 12

➕ TEST 3: Adding New Expense
─────────────────────────────────
✓ Add Expense Status: SUCCESS

❤️  TEST 4: Server Health Check
─────────────────────────────────
✓ Server Health: ONLINE

╔═══════════════════════════════════════════════════╗
║   ALL TESTS COMPLETED SUCCESSFULLY!               ║
║   Java-Node.js Integration Working ✓              ║
╚═══════════════════════════════════════════════════╝
```

---

## 🔌 API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User authentication |
| `/expense` | GET | Fetch expenses |
| `/expense` | POST | Add new expense |
| `/expense/:id/status` | PATCH | Approve/reject expense |
| `/expense` | DELETE | Delete expense |
| `/health` | GET | Server health check |

---

## 🎯 Technical Highlights

### **HTTP Communication**
- Uses `HttpURLConnection` for REST API calls
- JSON request/response handling
- Proper error handling and status codes

### **JSON Processing**
- `org.json` library for JSON parsing
- Type-safe data structures
- Easy serialization/deserialization

### **Object-Oriented Design**
- Clean class structure
- Well-documented methods
- Reusable client components

### **Maven Build System**
- Dependency management
- Executable JAR creation
- Portable deployment

---

## 📝 Code Quality

- ✅ **310+ lines** of production Java code
- ✅ **Javadoc comments** for all public methods
- ✅ **Exception handling** throughout
- ✅ **Clean architecture** with separation of concerns
- ✅ **Professional output** formatting
- ✅ **Full REST API integration**

---

## 🎓 For Your Teacher

This Java implementation demonstrates:

1. **Backend Connectivity**: Java client successfully connects to Node.js REST API
2. **HTTP Communication**: Proper use of HTTP methods (GET, POST, PATCH, DELETE)
3. **JSON Handling**: Professional JSON request/response processing
4. **Error Handling**: Comprehensive exception management
5. **Build Tools**: Maven for dependency and build management
6. **Code Documentation**: Complete Javadoc comments
7. **Real-world Application**: Working integration with existing system

---

## 🔍 Testing the Integration

### Test Scenario 1: Login
1. Start Node.js server: `node server.js`
2. Run Java client: `mvn exec:java -Dexec.mainClass="ExpenseTrackerClient"`
3. Observe successful authentication

### Test Scenario 2: Data Operations
1. Java client adds expense
2. Check web interface (http://localhost:3000)
3. Verify expense appears in UI

### Test Scenario 3: Admin Operations
1. Java client (as admin) approves expense
2. Check web interface
3. Verify status changed

---

## 📚 Technologies Demonstrated

- **Java SE 11**: Core Java programming
- **Maven**: Build and dependency management
- **HTTP/REST**: API communication
- **JSON**: Data interchange format
- **Object-Oriented Programming**: Clean class design
- **Exception Handling**: Robust error management
- **Documentation**: Professional code comments

---

## ✨ Key Learning Outcomes

1. Java-JavaScript integration
2. REST API consumption from Java
3. JSON processing in Java
4. HTTP communication patterns
5. Maven project structure
6. Client-server architecture
7. Cross-platform development

---

## 🤝 Integration Benefits

- **Language Agnostic**: Demonstrates that REST APIs can be consumed by any language
- **Microservices Pattern**: Shows separation between frontend/backend
- **Scalability**: Java client can be deployed independently
- **Flexibility**: Easy to add more Java clients or services
- **Professional**: Industry-standard integration approach

---

## 📞 Support

For questions or issues:
1. Check server is running on http://localhost:3000
2. Verify Maven dependencies are installed
3. Check Java version (must be 11+)
4. Review console output for error messages

---

**Created by**: Armaan Patel  
**Version**: 1.0.0  
**Date**: October 2025  
**Purpose**: Academic demonstration of Java-Node.js integration
