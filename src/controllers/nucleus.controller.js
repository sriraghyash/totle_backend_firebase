import { Op, literal } from "sequelize";
import { User } from "../Models/UserModels/UserModel.js";
import { Language } from "../Models/LanguageModel.js";
import UserDomainProgress from "../Models/progressModels.js";
import { Teachertopicstats } from "../Models/TeachertopicstatsModel.js";
import { BookedSession } from "../Models/BookedSession.js";
import { Session } from "../Models/SessionModel.js";
import { Test } from "../Models/test.model.js";
import { TestFlag } from "../Models/TestflagModel.js";
import Feedback from "../Models/feedbackModels.js";

export const getAllUserDetails = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        "id", "firstName", "lastName", "email", "mobile", "dob", "gender",
        "known_language_ids", "preferred_language_id", "ipAddress", "location", "isLoggedIn", "status"
      ]
    });

    if (!users.length) return res.status(404).json({ error: "No users found" });

    // Language map
    const langIdsSet = new Set();
    users.forEach(user => {
      (user.known_language_ids || []).forEach(id => langIdsSet.add(id));
      if (user.preferred_language_id) langIdsSet.add(user.preferred_language_id);
    });

    const languages = await Language.findAll({
      where: { language_id: { [Op.in]: [...langIdsSet] } },
      attributes: ["language_id", "language_name"]
    });

    const languageMap = {};
    languages.forEach(lang => languageMap[lang.language_id] = lang.language_name);

    // Result aggregation
    const results = [];

    for (const user of users) {
      const userId = user.id;

      const [
        activeSessionsCount,
        testsTaken,
        testsPassed,
        testsFailed,
        missedTests,
        learnerSessions,
        goalsAddedCount,
        totalBookedSessions,
        totalAttendedSessions,
        sessionsUserGotFlaggedFor,
        sessionsFlaggedByUser,
        teachingStats
      ] = await Promise.all([
        Session.count({ where: { student_id: userId, status: "available" } }),
        Test.count({ where: { user_id: userId, submitted_at: { [Op.ne]: null } } }),
        Test.count({ where: { user_id: userId, submitted_at: { [Op.ne]: null }, [Op.and]: literal(`(result->>'passed')::boolean = true`) } }),
        Test.count({ where: { user_id: userId, submitted_at: { [Op.ne]: null }, [Op.and]: literal(`(result->>'passed')::boolean = false`) } }),
        TestFlag.count({ where: { user_id: userId, reason: { [Op.in]: ['network_issue', 'fraudulent_activity'] } } }),
        BookedSession.count({ where: { learner_id: userId } }),
        UserDomainProgress.count({ where: { user_id: userId, goal: { [Op.not]: null } } }),
        Session.count({ where: { [Op.or]: [{ student_id: userId }, { teacher_id: userId }], student_id: { [Op.ne]: null } } }),
        Session.count({ where: { [Op.or]: [{ student_id: userId }, { teacher_id: userId }], status: "completed" } }),
        Feedback.count({
          where: { flagged_issue: true },
          include: [{
            model: Session,
            as: "session",
            required: true,
            where: {
              [Op.or]: [{ teacher_id: userId }, { student_id: userId }]
            }
          }]
        }),
        Feedback.count({ where: { bridger_id: userId, flagged_issue: true } }),
        Teachertopicstats.findAll({
          where: { teacherId: userId },
          attributes: ["tier", "sessionCount"]
        }),
      ]);

      const missedSessions = totalBookedSessions - totalAttendedSessions;

      const roleCounts = {
        Bridger: 0,
        Expert: 0,
        Master: 0,
        Legend: 0
      };

      teachingStats.forEach(stat => {
        if (roleCounts[stat.tier] !== undefined) {
          roleCounts[stat.tier] += stat.sessionCount;
        }
      });

      const totalTeacherSessions = Object.values(roleCounts).reduce((a, b) => a + b, 0);

      results.push({
        // Personal Info
        id: user.id,
        name: `${user.firstName} ${user.lastName || ""}`.trim(),
        email: user.email,
        mobile: user.mobile || "Not Provided",
        known_languages: (user.known_language_ids || []).map(
          id => languageMap[id] || `ID: ${id}`
        ),
        preferred_language: user.preferred_language_id
          ? languageMap[user.preferred_language_id] || `ID: ${user.preferred_language_id}`
          : null,
        gender: user.gender,
        dob: user.dob,
        ip_location: user.ipAddress
          ? `${user.ipAddress} ${user.location || ""}`.trim()
          : "Not Available",
        logged: user.isLoggedIn ? "Active" : "Inactive",
        status: user.status || "Not Set",
        // Stats
        learner_sessions: learnerSessions,
        active_sessions: activeSessionsCount,
        goals_added: goalsAddedCount,
        bridger_sessions: roleCounts.Bridger,
        expert_sessions: roleCounts.Expert,
        master_sessions: roleCounts.Master,
        legend_sessions: roleCounts.Legend,
        teacher_sessions_total: totalTeacherSessions,
        testsTaken,
        testsPassed,
        testsFailed,
        missedTests,
        missedSessions,
        sessionsFlaggedByUser,
        sessionsUserGotFlaggedFor,
      });
    }

    return res.json(results);
  } catch (error) {
    console.error("Error fetching combined user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
