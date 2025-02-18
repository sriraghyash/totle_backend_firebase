import admin from "./config/firebase.js"; // Import Firebase Admin SDK

export async function generateToken(identifier) {
  try {
    let userRecord;

    try {
      if (identifier.includes("@")) {
        // ✅ Check if user exists in Firebase by email
        userRecord = await admin.auth().getUserByEmail(identifier);
      } else {
        // ✅ Check if user exists in Firebase by phone number
        userRecord = await admin.auth().getUserByPhoneNumber(identifier);
      }
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        console.log("⚠️ User not found in Firebase, creating a new user...");

        // ✅ If user doesn't exist, create them in Firebase
        userRecord = await admin.auth().createUser({
          email: identifier.includes("@") ? identifier : undefined,
          phoneNumber: identifier.includes("@") ? undefined : identifier,
          password: "DefaultPassword123", // You can update this logic
          displayName: "New User",
        });

        console.log("✅ New Firebase user created:", userRecord.uid);
      } else {
        throw error; // If it's another error, throw it
      }
    }

    // ✅ Generate a Firebase Custom Token for the user
    const uid = userRecord.uid;
    const customToken = await admin.auth().createCustomToken(uid);

    // console.log("🔥 UID:", uid);
    // console.log("🔥 Firebase Custom Token:", customToken);

    return { uid, token: customToken };
  } catch (error) {
    console.error("❌ Error generating token:", error.message);
    return { error: error.message };
  }
}
