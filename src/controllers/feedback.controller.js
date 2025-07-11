import Feedback from "../models/feedbackModels.js";

export const postFeedBack = async (req, res) => {
  try {
    const {
      learner_id,
      session_id,
      bridger_id,
      star_rating,
      helpfulness_rating,
      clarity_rating,
      pace_feedback,
      engagement_yn,
      confidence_gain_yn,
      text_feedback,
      flagged_issue,
      flag_reason,
    } = req.body;

    if (!learner_id || !session_id || !bridger_id) {
      return res.status(400).json({
        success: false,
        message: "learner_id, session_id, and bridger_id are required.",
      });
    }
    if (star_rating === undefined) {
      return res.status(400).json({
        success: false,
        message: 'star_rating is required and must be between 1 and 5.'
      });
    }

    const feedback = await Feedback.create({
      learner_id,
      session_id,
      bridger_id,
      star_rating,
      helpfulness_rating,
      clarity_rating,
      pace_feedback,
      engagement_yn,
      confidence_gain_yn,
      text_feedback,
      flagged_issue,
      flag_reason,
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("Error creating feedback:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getAllFeedback = async (req, res) => {
  try {
    const { learner_id, bridger_id, session_id } = req.query;

    const where = {};
    if (learner_id) where.learner_id = learner_id;
    if (bridger_id) where.bridger_id = bridger_id;
    if (session_id) where.session_id = session_id;

    const feedbacks = await Feedback.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    const isTeacher = req.user?.role === 'teacher';

    const sanitizedFeedbacks = feedbacks.map((feedback) => {
      const data = feedback.toJSON();
      if (isTeacher) {
        delete data.flagged_issue;
        delete data.flag_reason;
      }
      return data;
    });

    return res.status(200).json({
      success: true,
      count: sanitizedFeedbacks.length,
      data: sanitizedFeedbacks,
    });

  } catch (error) {
    console.error('Error fetching feedbacks:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
