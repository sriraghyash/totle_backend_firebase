import { DataTypes } from 'sequelize';
import { sequelize1 } from '../config/sequelize.js';

const Feedback = sequelize1.define('learner_session_feedback', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  learner_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User giving feedback',
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Session being reviewed',
  },
  bridger_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Bridger being reviewed',
  },
  star_rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  helpfulness_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  clarity_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  pace_feedback: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  engagement_yn: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  confidence_gain_yn: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  text_feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  flagged_issue: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  flag_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  schema: 'user',
  tableName: 'learner_session_feedback',
  timestamps: false
});

export default Feedback;
