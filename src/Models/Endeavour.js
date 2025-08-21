import { DataTypes } from "sequelize";
import { sequelize1 } from "../config/sequelize.js";
import { User } from "./UserModels/UserModel.js";

// ✅ Debug log to confirm this file is loading
console.log("✅ Endeavour model file loaded");

const Endeavour = sequelize1.define(
  "endeavour",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // 🔹 Newly added fields
    kind: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    eligibility: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // 🔹 Already present fields
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    applicationLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    allowResumeUploads: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    priceAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    priceCurrency: {
      type: DataTypes.STRING,
      defaultValue: "INR",
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING), // PostgreSQL supports array
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    schema: "public", // ✅ use your schema
    tableName: "endeavour", // ✅ force table name
    timestamps: false, // set true if you want createdAt/updatedAt automatically
  }
);

// 🔁 ASSOCIATIONS
Endeavour.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

export default Endeavour;
