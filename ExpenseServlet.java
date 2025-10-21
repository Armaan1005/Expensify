import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import java.sql.*;
import org.json.JSONArray;
import org.json.JSONObject;

public class ExpenseServlet extends HttpServlet {
    private Connection con;

    public void init() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            con = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/expense_tracker", "root", "root");
        } catch (Exception e) { e.printStackTrace(); }
    }
    
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        PrintWriter out = resp.getWriter();
        JSONArray arr = new JSONArray();
        try {
            Statement st = con.createStatement();
            ResultSet rs = st.executeQuery("SELECT * FROM expenses");
            while (rs.next()) {
                JSONObject obj = new JSONObject();
                obj.put("id", rs.getInt("id"));
                obj.put("name", rs.getString("name"));
                obj.put("amount", rs.getDouble("amount"));
                obj.put("category", rs.getString("category"));
                obj.put("date", rs.getString("date"));
                arr.put(obj);
            }
        } catch (Exception e) { e.printStackTrace(); }
        out.print(arr.toString());
    }
    
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String name = req.getParameter("name");
        String amount = req.getParameter("amount");
        String category = req.getParameter("category");
        String date = req.getParameter("date");
        try {
            PreparedStatement ps = con.prepareStatement("INSERT INTO expenses (name,amount,category,date) VALUES (?,?,?,?)");
            ps.setString(1, name);
            ps.setDouble(2, Double.parseDouble(amount));
            ps.setString(3, category);
            ps.setString(4, date);
            ps.executeUpdate();
        } catch (Exception e) { e.printStackTrace(); }
        resp.sendRedirect("index.html");
    }
    
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String id = req.getParameter("id");
        try {
            PreparedStatement ps = con.prepareStatement("DELETE FROM expenses WHERE id=?");
            ps.setInt(1, Integer.parseInt(id));
            ps.executeUpdate();
        } catch (Exception e) { e.printStackTrace(); }
    }
}
