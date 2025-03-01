// models/user.js
import { DataTypes } from 'sequelize';
import { sequelize1 } from '../config/sequelize.js'; // Use the main DB connection

const User = sequelize1.define('User', {
  id: {
    type: DataTypes.UUID, // ✅ Use UUID as primary key
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
  },
  mobile: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
  },
  dob: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM("male", "female", "other"),
    allowNull: true,
  },
  known_language_ids: {
    type: DataTypes.ARRAY(DataTypes.INTEGER), // ✅ Stores multiple language IDs
    allowNull: true,
  },
  preferred_language_id: {
    type: DataTypes.INTEGER,
    references: {
      model: { schema: "user", tableName: "languages" },
      key: "language_id",
    },
    allowNull: true,
  },
  educational_qualifications: {
    type: DataTypes.ARRAY(DataTypes.STRING), // ✅ Stores multiple qualifications
    allowNull: true,
  },
  currentOccupation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING), // ✅ Stores multiple skills
    allowNull: true,
  },
  years_of_experience: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  image: {
    type: DataTypes.BLOB("long"), // ✅ Store image as BLOB
    allowNull: true,
  },
  isLoggedIn:{
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  schema: 'user', // Private schema
  tableName: 'users', // Table name
  timestamps: true,
});

export {User};
