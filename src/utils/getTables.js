import db from "../config/db.js";  // Import the existing database connection

/**
 * Fetch all table names from the PostgreSQL database.
 * This function queries the 'pg_tables' system table to get all tables in the 'public' schema.
 */
export async function getTableNames() {
  try {
    console.log("🔍 Running table fetch query..."); // ✅ Log query execution
    
    const query = "SELECT tablename FROM pg_tables WHERE schemaname = 'public';";
    const { rows } = await db.pool.query(query); // ✅ Query the database

    if (rows.length === 0) {
      console.warn("⚠ No tables found in the database.");
      return [];
    }

    console.log("✅ Tables fetched successfully:", rows.map(row => row.tablename));
    return rows.map(row => row.tablename);
  } catch (error) {
    console.error("❌ Database Query Error:", error); // ✅ Log full error details
    throw new Error(`Database query failed: ${error.message}`); // ✅ Provide detailed error
  }
}
