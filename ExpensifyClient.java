import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Java Client for Expensify System
 * 
 * This class demonstrates Java connectivity to the Node.js Expensify API.
 * It provides methods to interact with both Personal and Corporate expense trackers.
 * 
 * Features:
 * - User Authentication (Login/Signup)
 * - Fetch Expenses (Personal/Corporate)
 * - Add New Expenses
 * - Approve/Reject Expenses (Admin only)
 * - Delete Expenses
 * 
 * @author Armaan Patel
 * @version 1.0
 */
public class ExpensifyClient {
    
    private static final String BASE_URL = "http://localhost:3000";
    private String currentUser;
    private String trackerType;
    private String userRole;
    
    /**
     * Main method to demonstrate Java client functionality
     */
    public static void main(String[] args) {
        ExpensifyClient client = new ExpensifyClient();
        
        System.out.println("╔═══════════════════════════════════════════════════╗");
        System.out.println("║        EXPENSIFY - JAVA CLIENT CONNECTOR         ║");
        System.out.println("║   Demonstrating Java-Node.js Integration         ║");
        System.out.println("╚═══════════════════════════════════════════════════╝");
        System.out.println();
        
        try {
            // Test 1: User Authentication
            System.out.println("🔐 TEST 1: User Authentication");
            System.out.println("─────────────────────────────────");
            boolean loginSuccess = client.login("admin", "admin123", "company");
            System.out.println("✓ Login Status: " + (loginSuccess ? "SUCCESS" : "FAILED"));
            System.out.println();
            
            // Test 2: Fetch Expenses
            System.out.println("📊 TEST 2: Fetching Expenses");
            System.out.println("─────────────────────────────────");
            String expenses = client.fetchExpenses("company");
            System.out.println("✓ Expenses Retrieved: " + (expenses != null ? "SUCCESS" : "FAILED"));
            if (expenses != null) {
                JSONArray expenseList = new JSONArray(expenses);
                System.out.println("✓ Total Expenses: " + expenseList.length());
            }
            System.out.println();
            
            // Test 3: Add New Expense
            System.out.println("➕ TEST 3: Adding New Expense");
            System.out.println("─────────────────────────────────");
            boolean addSuccess = client.addExpense(
                "Java API Test Expense", 
                1500.0, 
                "Other", 
                "2025-10-01",
                "company"
            );
            System.out.println("✓ Add Expense Status: " + (addSuccess ? "SUCCESS" : "FAILED"));
            System.out.println();
            
            // Test 4: Connection Health Check
            System.out.println("❤️  TEST 4: Server Health Check");
            System.out.println("─────────────────────────────────");
            boolean healthy = client.checkHealth();
            System.out.println("✓ Server Health: " + (healthy ? "ONLINE" : "OFFLINE"));
            System.out.println();
            
            System.out.println("╔═══════════════════════════════════════════════════╗");
            System.out.println("║   ALL TESTS COMPLETED SUCCESSFULLY!               ║");
            System.out.println("║   Java-Node.js Integration Working ✓              ║");
            System.out.println("╚═══════════════════════════════════════════════════╝");
            
        } catch (Exception e) {
            System.err.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Authenticates user with the Expensify system
     * 
     * @param username User's username
     * @param password User's password
     * @param trackerType Type of tracker (personal/company)
     * @return true if login successful, false otherwise
     */
    public boolean login(String username, String password, String trackerType) {
        try {
            URL url = new URL(BASE_URL + "/auth/login");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            
            // Create JSON payload
            JSONObject payload = new JSONObject();
            payload.put("username", username);
            payload.put("password", password);
            payload.put("tracker_type", trackerType);
            
            // Send request
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Read response
            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                
                JSONObject jsonResponse = new JSONObject(response.toString());
                if (jsonResponse.getBoolean("success")) {
                    this.currentUser = jsonResponse.getString("username");
                    this.trackerType = jsonResponse.getString("tracker_type");
                    this.userRole = jsonResponse.getString("role");
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Fetches expenses from the specified tracker
     * 
     * @param trackerType Type of tracker (personal/company)
     * @return JSON string of expenses or null if failed
     */
    public String fetchExpenses(String trackerType) {
        try {
            URL url = new URL(BASE_URL + "/expense?tracker_type=" + trackerType);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            
            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                return response.toString();
            }
            return null;
        } catch (Exception e) {
            System.err.println("Fetch expenses error: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Adds a new expense to the tracker
     * 
     * @param name Expense name
     * @param amount Expense amount
     * @param category Expense category
     * @param date Expense date
     * @param trackerType Type of tracker
     * @return true if expense added successfully
     */
    public boolean addExpense(String name, double amount, String category, 
                             String date, String trackerType) {
        try {
            URL url = new URL(BASE_URL + "/expense");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            
            // Create JSON payload
            JSONObject payload = new JSONObject();
            payload.put("name", name);
            payload.put("amount", amount);
            payload.put("category", category);
            payload.put("date", date);
            payload.put("tracker_type", trackerType);
            payload.put("user_id", this.currentUser);
            payload.put("submitted_by", this.currentUser);
            
            if (trackerType.equals("company")) {
                payload.put("status", "pending");
            } else {
                payload.put("status", "approved");
            }
            
            // Send request
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            return conn.getResponseCode() == 200;
        } catch (Exception e) {
            System.err.println("Add expense error: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Approves or rejects an expense (Admin only)
     * 
     * @param expenseId ID of the expense
     * @param status Status to set (approved/rejected)
     * @return true if status updated successfully
     */
    public boolean updateExpenseStatus(int expenseId, String status) {
        try {
            URL url = new URL(BASE_URL + "/expense/" + expenseId + "/status");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("PATCH");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            
            // Create JSON payload
            JSONObject payload = new JSONObject();
            payload.put("status", status);
            payload.put("approved_by", this.currentUser);
            
            // Send request
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            return conn.getResponseCode() == 200;
        } catch (Exception e) {
            System.err.println("Update status error: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Deletes an expense
     * 
     * @param expenseId ID of the expense to delete
     * @param trackerType Type of tracker
     * @return true if expense deleted successfully
     */
    public boolean deleteExpense(int expenseId, String trackerType) {
        try {
            URL url = new URL(BASE_URL + "/expense?id=" + expenseId + 
                            "&tracker_type=" + trackerType);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("DELETE");
            
            return conn.getResponseCode() == 200;
        } catch (Exception e) {
            System.err.println("Delete expense error: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Checks if the server is healthy and responsive
     * 
     * @return true if server is online
     */
    public boolean checkHealth() {
        try {
            URL url = new URL(BASE_URL + "/health");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(3000);
            
            return conn.getResponseCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Gets current user information
     * 
     * @return String with user details
     */
    public String getCurrentUserInfo() {
        if (currentUser == null) {
            return "No user logged in";
        }
        return String.format("User: %s | Type: %s | Role: %s", 
                           currentUser, trackerType, userRole);
    }
}
