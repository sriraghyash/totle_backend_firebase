import { sequelize1 } from "./src/config/sequelize.js";  // ✅ your sequelize instance
import Endeavour from "./src/Models/Endeavour.js";       // ✅ your model

(async () => {
  try {
    await sequelize1.authenticate();
    console.log("✅ DB connected");

    // Force recreate table (drops if exists)
    await Endeavour.sync({ force: true });
    console.log("✅ Endeavour table created");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
