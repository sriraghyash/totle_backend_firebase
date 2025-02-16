import passport from "passport";
// import "../config/passportConfig.js"; // Ensure the file extension is .js
// import { prisma } from "../index.js";
import { hashPassword, comparePassword } from "../utils/hashUtils.js";
import {  verifyOtp } from "../utils/otpService.js";
// import prisma from "../config/prismaClient.js"; // ✅ Prisma DB Client
import { sendOtp } from "../utils/otpService.js"; // ✅ Utility for OTP sending
import { userDb } from "../config/prismaClient.js";
import admin from 'firebase-admin';
import jwt from "jsonwebtoken";
import { generateToken } from "../generateToken.js";

// import {serviceAccount} from '../../firebaseAdmin.json'

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// })

const googleAuth = (req, res, next) => {
  const isNewUser = req.query.isNew === "true";
  const prompt = isNewUser ? "consent select_account" : "select_account";
  passport.authenticate("google", { scope: ["profile", "email"], prompt })(req, res, next);
};

const googleCallback = (req, res, next) => {
  console.log("Google callback route reached");
  passport.authenticate("google", (err, user, info) => {
    if (err || !user) {
      console.error("Authentication failed:", err || "No user found");
      return res.redirect("/");
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error("Login error:", loginErr);
        return next(loginErr);
      }
      console.log("Login successful. Redirecting to /platform");
      return res.redirect(`https://www.totle.co/platform`);
    });
  })(req, res, next);
};

const logout = (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
};

const verifyToken = async (req, res) => {
  const { token } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email } = decodedToken;

    const backendToken = jwt.sign({ uid, email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "✅ Authentication Successful!",
      backendToken,
      user: { uid, email },
    });
  } catch (error) {
    res.status(401).json({ message: "❌ Invalid Token", error: error.message });
  }
}


export const signupUserAndSendOtp = async (req, res) => {
  const { email, mobile } = req.body;

  if (!email && !mobile) {
    return res.status(400).json({ error: true, message: "Email/Mobile number is required" });
  }

  const identifier = email || mobile;
  const isEmail = !!email;

  try {
    console.log("Checking if user exists...");
    const existingUser = await userDb.user.findUnique({ where: isEmail? { email }: {mobile} });

    if (existingUser) {
      return res.status(403).json({ error: true, message: `User with this ${isEmail ? "email" : "mobile"} already exists`  });
    }

    console.log("Sending OTP...");
    const otpResponse = await sendOtp(identifier);

    if (otpResponse.error) {
      return res.status(400).json({ error: true, message: otpResponse.message });
    }

    return res.status(200).json({ error: false, message: otpResponse.message });
  } catch (error) {
    console.error("🔥 ERROR during signup: ", error);
    return res.status(500).json({ error: true, message: "Internal Server Error", details: error.message });
  }
};


export const otpVerification = async (req, res) => {
    const { email, mobile, password, firstName } = req.body;
    let otp = parseInt(req.body.otp, 10);
    if (isNaN(otp)) {
      return { error: true, message: "Invalid OTP format." };
    }
  
    if (!firstName) {
      return res.status(400).json({ error: true, message: "Firstname is required" });
    }
    if ((!email && !mobile) || !otp) {
      return res.status(400).json({ error: true, message: "Email/Mobile and OTP are required" });
    }
  
    try {
      const result = await verifyOtp(email || mobile, otp);
      if (result.error) {
        return res.status(400).json({ error: true, message: result.message });
      }

      if (email && !password) {
        return res.status(400).json({ error: true, message: "Password is required for email signup" });
      }
  
      const hashedPassword = password ? await hashPassword(password) : null;
  
      // Save the verified user to the database
      await userDb.user.upsert({
        where: email ? { email } : { mobile },  // ✅ Use a single unique field
        update: { isVerified: true },  // ✅ If user exists, mark as verified
        create: {
          email: email || null,  // ✅ Store email only if provided
          mobile: mobile || null,  // ✅ Store mobile only if provided
          password: email ? hashedPassword : null,  // ✅ Password only for email signup
          isVerified: true,
          firstName,
        },
      });
      
  
      return res.status(200).json({ error: false, message: "OTP verified successfully ✅" });
    } catch (error) {
      console.error("Error during OTP verification:", error);
      return res.status(500).json({ error: true, message: "Internal server error." });
    }
};
  

export const completeSignup = async (req, res) => {
  const { preferredLanguage, knownLanguages, email } = req.body;

  if (!preferredLanguage || !Array.isArray(knownLanguages)) {
    return res.status(400).json({ error: true, message: "Languages are required." });
  }

  try {
    const prefLanguage = await userDb.language.findUnique({
      where: { language_name: preferredLanguage },
      select: { language_id: true },
    });

    if (!prefLanguage) {
      return res.status(400).json({ error: true, message: "Preferred language not found." });
    }

    const knownLanguagesList = await userDb.language.findMany({
      where: { language_name: { in: knownLanguages } },
      select: { language_id: true },
    });

    if (knownLanguagesList.length !== knownLanguages.length) {
      return res.status(400).json({ error: true, message: "One or more known languages are invalid." });
    }

    await userDb.user.update({
      where: { email },
      data: {
        preferred_language_id: prefLanguage.language_id,
        known_language_ids: knownLanguagesList.map(lang => lang.language_id),
      },
    });

    return res.status(201).json({ error: false, message: "User registered successfully." });
  } catch (error) {
    console.error("Error during final registration:", error);
    return res.status(500).json({ error: true, message: "Internal server error." });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email) return res.status(400).json({ error: true, message: "Please enter your email" });
  if (!password) return res.status(400).json({ error: true, message: "Please enter your password" });

  try {
    const user = await userDb.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: true, message: "User doesn't exist, please register" });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({ error: true, message: "Invalid Password" });
    }

    const tokenResponse =await generateToken(email);
    if (tokenResponse.error) {
      return res.status(500).json({ error: true, message: "Failed to generate token" });
    }

    return res.status(200).json({
      error: false,
      message: "Login successful",
      token: tokenResponse.token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || null,
        email: user.email,
        // preferredLanguage,
        // knownLanguages,
      },
    });
  } catch (error) {
    console.error("Error during login: ", error);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

export const resetUser = async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: true, message: "Email is required" });
    }
    try {
      const otpRecord = await userDb.otp.findUnique({ where: { email } });
  
      if (otpRecord) {
        const timeRemaining = Math.round((otpRecord.expiry - new Date()) / 1000);
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
  
        if (new Date() < otpRecord.expiry) {
          return res.status(200).json({
            error: false,
            message: `Your OTP is still valid for ${minutes}m ${seconds}s.`,
          });
        }
      }
  
      const result = await sendOtp(email);
      if (result.error) {
        return res.status(500).json({ error: true, message: result.message });
      }
  
      return res.status(200).json({ error: false, message: result.message });
    } catch (error) {
      console.error("Error during OTP reset: ", error);
      return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};
  

export const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: true, message: "Email and new password are required" });
    }
  
    try {
      const user = await userDb.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: true, message: "User not found" });
      }
  
      const hashedPassword = await hashPassword(newPassword);
      await userDb.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
  
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

export const getUserProfile = async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: true, message: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId || decoded.uid; // Ensure correct field
    if (!userId) {
      return res.status(401).json({ error: true, message: "Unauthorized: Invalid token" });
    }
    
    const user = await userDb.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dob: true,
        gender: true,
        status: true,
        currentOccupation: true,
        skills: true,
        years_of_experience: true,  // ✅ Correct field name
        location: true,
        preferredLanguage: {
          select: {
            language_name: true,  // ✅ Fetch preferred language name
          },
        },
      },
    });
    
    

    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: true, message: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId || decoded.uid;

    if (!userId) {
      return res.status(401).json({ error: true, message: "Unauthorized: Invalid token" });
    }

    // Extract fields to update (only allowed fields)
    const {
      firstName,
      lastName,
      dob,
      gender,
      knownLanguages,
      preferredLanguages,
      qualification,
      status,
      currentOccupation,
      skills,
      years_of_experience,
      location,
    } = req.body;

    // Prepare update data
    const updateData = {
      firstName,
      lastName,
      dob,
      gender,
      qualification,
      status,
      currentOccupation,
      skills,
      years_of_experience,
      location,
    };

    // Handle language updates
    if (preferredLanguages && preferredLanguages.length > 0) {
      const prefLanguage = await userDb.language.findUnique({
        where: { language_name: preferredLanguages[0] },
        select: { language_id: true },
      });
      if (prefLanguage) updateData.preferred_language_id = prefLanguage.language_id;
    }

    if (knownLanguages && knownLanguages.length > 0) {
      const knownLanguagesList = await userDb.language.findMany({
        where: { language_name: { in: knownLanguages } },
        select: { language_id: true },
      });

      if (knownLanguagesList.length === knownLanguages.length) {
        updateData.known_language_ids = knownLanguagesList.map((lang) => lang.language_id);
      }
    }

    if (updateData.dob) {
      updateData.dob = new Date(updateData.dob).toISOString();
    }

    // Update user in the database
    const updatedUser = await userDb.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dob: true,
        gender: true,
        qualification: true,
        status: true,
        currentOccupation: true,
        skills: true,
        years_of_experience: true,
        location: true,
        preferredLanguage: { select: { language_name: true } },
        known_language_ids: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        ...updatedUser,
        preferredLanguage: updatedUser.preferredLanguage?.language_name || null,
        knownLanguages: updatedUser.known_language_ids || [],
      },
    });
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
};



export { googleAuth, googleCallback, logout, verifyToken };
