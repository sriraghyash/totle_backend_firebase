import { ensureFounder } from '../controllers/UserControllers/superAdmin.controller.js'; // Import SuperAdmin function
import { insertLanguages } from '../controllers/language.controller.js'; // Import languages insertion function
import { Language } from '../Models/LanguageModel.js'; // Import Sequelize models
import { sequelize1 } from './sequelize.js';
import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
import { Test } from '../Models/test.model.js';
import { BookedSession } from '../Models/BookedSession.js'; // ✅ ADDED
import { SupportQueriesMasterSeeder } from '../seeders/SupportQueriesSeeder.js';
// import { seedCatalogueDomains } from '../seeders/catalogueSeeder.js';
import { ProgressionThresholds } from "../Models/progressionThresholds.model.js";
import "../Models/CatalogModels/catalogueNode.model.js";
import "../Models/TeachertopicstatsModel.js";
import { KeyResult } from '../Models/Objectives/keyresult.model.js'; // ✅ Add this line
import Endeavour from "../Models/Endeavour.js"; // ✅ Import Endeavour model

dotenv.config();

async function createSchemas(sequelize) {
  const schemas = ['admin', 'user', 'catalog'];

  for (const schema of schemas) {
    try {
      await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      console.log(`✅ Schema '${schema}' created or already exists.`);
    } catch (error) {
      console.error(`❌ Failed to create schema '${schema}':`, error.message);
    }
  }
}

async function createSuperAdminIfNeeded() {
  try {
    const [results] = await sequelize1.query('SELECT schema_name FROM information_schema.schemata WHERE schema_name = \'admin\'');

    if (results.length > 0) {
      console.log('✅ Admin schema exists');
      // Run the super admin creation function if the admin schema exists
      await ensureFounder();
    } else {
      console.log('❌ Admin schema does not exist');
    }
  } catch (error) {
    console.error('Error checking admin schema:', error);
  }
}

async function insertLanguagesIfNeeded() {
  try {
    const languagesExist = await Language.count();

    if (languagesExist === 0) {
      console.log('✅ Inserting default languages');
      await insertLanguages();
    } else {
      console.log('✅ Languages already exist');
    }
  } catch (error) {
    console.error('Error inserting languages:', error);
  }
}

async function createDatabaseIfNeeded(dbName) {
  try {
    const sequelizeRoot = new Sequelize("postgres", process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      dialect: "postgres",
      logging: false,
    });

    const [results] = await sequelizeRoot.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`, { type: QueryTypes.SELECT }
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

// At the bottom of syncDb.js
export async function defineModelRelationships() {
  const defineRelationships = await import("../config/associations.js");
  defineRelationships.default();
  console.log("✅ Sequelize model associations initialized");
}

export async function syncDatabase() {
  try {
    const dbName1 = process.env.DB_NAME || 'totle';

    await createDatabaseIfNeeded(dbName1);

    await createSchemas(sequelize1);

    const defineRelationships = await import("../config/associations.js");
    defineRelationships.default();

    console.log("✅ Model associations defined!");

    try {
      console.log("🔄 Syncing tables in defaultdb...");
      await sequelize1.sync({ alter: true });
      console.log("✅ Tables synced successfully!");
    } catch (error) {
      console.error("❌ Error syncing tables:", error);
    }

    console.log("🔄 Syncing tables in the correct order...");

    const { Admin } = await import("../Models/UserModels/AdminModel.js");
    await Admin.sync({ alter: true });

    const { Blog } = await import("../Models/SurveyModels/BlogModel.js");
    await Blog.sync({ alter: true });

    const { Objective } = await import("../Models/Objectives/objective.model.js");
    await Objective.sync({ alter: true });
    console.log("✅ Objective table synced successfully!");

    await KeyResult.sync({ alter: true });
    console.log("✅ KeyResult table synced successfully!");

    const { Survey } = await import("../Models/SurveyModels/SurveyModel.js");
    await Survey.sync({ alter: true });

    const { Question } = await import("../Models/SurveyModels/QuestionModel.js");
    await Question.sync({ alter: true });

    await Test.sync({ alter: true });

    const { CatalogueNode } = await import("../Models/CatalogModels/catalogueNode.model.js");
    await CatalogueNode.sync({ alter: true });

    await BookedSession.sync({ alter: true }); // ✅ ADDED: Ensure this table is created

    await ProgressionThresholds.sync({ alter: true });
    console.log("✅ ProgressionThresholds table synced successfully!");

    // ✅ Sync Endeavour table
    await Endeavour.sync({ alter: true });
    console.log("✅ Endeavour table synced successfully!");

    await sequelize1.sync({ alter: true });

    console.log("✅ All tables synced successfully!");

    await insertLanguagesIfNeeded();
    await SupportQueriesMasterSeeder();
    await createSuperAdminIfNeeded();
    // await seedCatalogueDomains();

  } catch (error) {
    console.error('❌ Error syncing database:', error);
  }
}
