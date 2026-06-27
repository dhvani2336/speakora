const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Credential token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: "Email not provided by Google account" });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists by email
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      // If user exists but has no googleId, link it
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.picture) {
          user.picture = picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        name,
        email: cleanEmail,
        googleId,
        picture,
        languages: ["English"], // default fallback language
        subscription: "Free"
      });
      await user.save();
    }

    // Generate JWT Token
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username || "",
      email: user.email,
      phone: user.phone || "",
      languages: user.languages,
      picture: user.picture || "",
      subscription: user.subscription,
      token: jwtToken
    });

  } catch (error) {
    console.error("Google Auth verification failed:", error);
    res.status(401).json({ message: "Google authentication failed", details: error.message });
  }
};
