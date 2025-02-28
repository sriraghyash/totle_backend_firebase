import { createSuperAdmin } from '../controllers/superAdmin.controller.js'; // Import SuperAdmin function
import { insertLanguages } from '../controllers/language.controller.js'; // Import languages insertion function
import { Language } from '../Models/LanguageModel.js'; // Import Sequelize models
import { sequelize1,sequelize2 } from './sequelize.js';
import { Sequelize, QueryTypes } from "sequelize";

// Function to create schemas if they don't exist
async function createSchemas(sequelize) {
  const schemas = ['admin', 'public', 'private'];

  for (const schema of schemas) {
    // Create schema if it doesn't exist
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  }
}

// Function to check if admin schema exists and create super admin
async function createSuperAdminIfNeeded() {
  try {
    const [results] = await sequelize1.query('SELECT schema_name FROM information_schema.schemata WHERE schema_name = \'admin\'');

    if (results.length > 0) {
      console.log('✅ Admin schema exists');
      // Run the super admin creation function if the admin schema exists
      await createSuperAdmin();
    } else {
      console.log('❌ Admin schema does not exist');
    }
  } catch (error) {
    console.error('Error checking admin schema:', error);
  }
}

// Function to insert languages
async function insertLanguagesIfNeeded() {
  try {
    const languagesExist = await Language.count(); // Check if languages already exist in the database

    if (languagesExist === 0) {
      console.log('✅ Inserting default languages');
      // Insert languages if none exist
      await insertLanguages();
    } else {
      console.log('✅ Languages already exist');
    }
  } catch (error) {
    console.error('Error inserting languages:', error);
  }
}

async function createDatabaseIfNeeded( dbName) {
  try {
    // Connect to the default "postgres" database first
    const sequelizeRoot = new Sequelize("postgres", "postgres", "Admin", {
      host: "localhost",
      dialect: "postgres",
      logging: false,
    });

    // Check if the database exists
    const [results] = await sequelizeRoot.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`,{ type: QueryTypes.SELECT }
    );

    if (!results) {
      console.log(`✅ Database "${dbName}" does not exist. Creating it...`);
      await sequelizeRoot.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    } else {
      console.log(`✅ Database "${dbName}" already exists.`);
    }

    await sequelizeRoot.close();
  } catch (error) {
    console.error("❌ Error creating database:", error);
  }
}



// Function to sync the database, create schemas, and run necessary functions
export async function syncDatabase() {
  try {
    const dbName1 = process.env.DB_NAME || 'totle'; // Use environment variable or default name
    const dbName2 = process.env.DB_NAME2 || 'catalog_db'; // Use environment variable or default name

    // Step 1: Create database if it doesn't exist for both instances
    await createDatabaseIfNeeded( dbName1);
    await createDatabaseIfNeeded( dbName2);
    
    // Sync models (this will create tables in the corresponding schemas if they don’t exist)
    await createSchemas(sequelize1);
    const defineRelationships = await import("../config/associations.js");
    defineRelationships.default();

    console.log("✅ Model associations defined!");

    // Step 5: Disable foreign key constraints to avoid order issues
    await sequelize1.query("SET session_replication_role = 'replica';");
    await sequelize2.query("SET session_replication_role = 'replica';");

    console.log("🔄 Syncing tables in the correct order...");

    // Step 6: Sync tables in correct order (tables with no dependencies first)
    const { Admin } = await import("../Models/AdminModel.js");
    await Admin.sync({ alter: true }); // Admin table first, since other tables depend on it

    const { Blog } = await import("../Models/BlogModel.js");
    await Blog.sync({ alter: true }); // Now sync Blog after Admin exists

    // Now sync all remaining tables
    await sequelize1.sync({ alter: true });
    await sequelize2.sync({ alter: true });

    console.log("✅ All tables synced successfully!");

    // Step 7: Re-enable foreign key constraints after syncing
    await sequelize1.query("SET session_replication_role = 'origin';");
    await sequelize2.query("SET session_replication_role = 'origin';");

    console.log("✅ Foreign key constraints re-enabled!");

    // Check if admin schema exists and run super admin function
    await createSuperAdminIfNeeded(sequelize1);

    // Insert languages if they don't exist
    await insertLanguagesIfNeeded();

  } catch (error) {
    console.error('❌ Error syncing database:', error);
  }
}

// Run the syncDatabase function
// syncDatabase();
