# Smart Expense Tracker

A modern, full-stack expense tracking application with smart parsing capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

That's it! 🎉

### Development Mode
For development with auto-restart:
```bash
npm run dev
```

## 📊 Features

- ✅ **Real Database Storage** - SQLite database (no setup required)
- ✅ **Smart Expense Parser** - Extract expenses from SMS/Email text
- ✅ **Indian Rupee Support** - Full ₹ currency formatting
- ✅ **Visual Analytics** - Interactive charts and breakdowns
- ✅ **User Authentication** - Login/signup system
- ✅ **Sample Data** - Load demo data with one click
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Real-time Updates** - Add, view, delete expenses instantly

## 🛠️ Tech Stack

- **Frontend:** HTML5, Tailwind CSS, Chart.js, Lucide Icons
- **Backend:** Node.js, Express.js
- **Database:** SQLite (file-based, no server needed)
- **Parsing:** Smart regex patterns for Indian expense formats

## 📝 API Endpoints

- `GET /expense` - Fetch all expenses
- `POST /expense` - Add new expense
- `DELETE /expense?id=<id>` - Delete expense
- `GET /health` - Server health check

## 🗂️ Database Schema

```sql
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 File Structure

```
APP Project/
├── server.js          # Node.js backend server
├── package.json       # Dependencies and scripts
├── index.html         # Frontend UI
├── script.js          # Frontend JavaScript
├── style.css          # Styling (if needed)
├── expenses.db        # SQLite database (auto-created)
└── README.md          # This file
```

## 💡 Usage Tips

1. **First Time:** Click "Load Sample" to see demo data
2. **Add Expenses:** Use the manual entry form
3. **Smart Parsing:** Paste SMS/Email text to auto-extract expenses
4. **Categories:** Food, Transport, Bills, Entertainment, Other
5. **Analytics:** View expense breakdown in the chart

## 🐛 Troubleshooting

**Port Already in Use:**
```bash
# Kill process on port 3000
npx kill-port 3000
npm start
```

**Database Issues:**
```bash
# Delete database to reset
rm expenses.db
npm start
```

## 📞 Support

If you encounter any issues:
1. Check that Node.js is installed: `node --version`
2. Ensure all dependencies are installed: `npm install`
3. Check server logs in the terminal
4. Visit health check: `http://localhost:3000/health`

---

**Made with ❤️ using Node.js and SQLite**
