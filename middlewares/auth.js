const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();
const key = process.env.JWT;

const requireAuth = (req, res, next) => {
  const token = req.headers.auth;
  // check if json web token exists and is verified
  if (token) {
    jwt.verify(token, key, async (err, decodedToken) => {
      if (err) {
        res.status(402).json({
          success: false,
          message: "Not Authorized to view this page",
        });
      } else {
        try {
          req.user = await User.findById(decodedToken.userId);
          if (req.user) next();
          else
            res.status(402).json({
              success: false,
              message: "Not authorized to access this route, wrong user",
            });
        } catch (e) {
          res.status(402).json({
            success: false,
            message: "Not authorized to access this route, wrong user",
          });
        }
      }
    });
  } else {
    res.status(402).json({
      success: false,
      message: "Not Authorized",
    });
  }
};

module.exports = { requireAuth };
