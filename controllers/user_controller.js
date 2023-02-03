const User = require("../models/User");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const key = process.env.JWT;

const createJWTToken = (userId) => {
  return jwt.sign({ userId }, key, { expiresIn: "1d" });
};

module.exports.get_users = async (req, res) => {
  const perPage = req.query.perPage || 5;
  const page = req.query.page || 1;
  const query = {
    fullName: { $regex: req.query.name?.trim() ?? "", $options: "i" },
  };
  try {
    const users = await User.find(query)
      .skip(perPage * page - perPage)
      .limit(perPage);

    const count = await User.count();

    return res.send({
      success: true,
      message: "Users fetched successfully",
      currentPage: page,
      perPage,
      totalPages: Math.ceil(count / perPage),
      totalResults: count,
      data: users,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.get_user = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.get_me = async (req, res) => {
  return res.json({
    success: true,
    message: "User fetched successfully",
    data: req.user,
  });
};

module.exports.create_user = async (req, res) => {
  const schema = Joi.object().keys({
    firstName: Joi.string().min(2).required().messages({
      "any.required": "First name must be up to 2 characters",
    }),
    lastName: Joi.string()
      .min(2)
      .required()
      .messages({ "any.required": "Last name must be up to 2 characters" }),
    email: Joi.string()
      .email()
      .required()
      .messages({ "any.required": "Invalid email format" }),
    password: Joi.string()
      .regex(/^(?=\S*[a-z])(?=\S*[A-Z])(?=\S*\d)(?=\S*[^\w\s])\S{8,30}$/)
      .pattern(new RegExp(""))
      .messages({
        "any.required":
          "Password must have a capital letter, small letter, number, a special character and be more than 8 in length",
      }),
    confirmPassword: Joi.string()
      .required()
      .valid(Joi.ref("password"))
      .messages({
        "any.required": "Passwords do not match",
      }),
  });

  const result = schema.validate(req.body);

  if (result.error) {
    return res.status(400).send({
      success: false,
      message: result.error.details[0].message,
    });
  }

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  try {
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      fullName: req.body.firstName + " " + req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
    });

    return res.json({
      success: true,
      message: "User created",
      data: user,
    });
  } catch (error) {
    if (error.keyValue.email != null && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists!",
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.login = async (req, res) => {
  const schema = Joi.object().keys({
    email: Joi.string()
      .email()
      .required()
      .messages({ "any.required": "Invalid email format" }),
    password: Joi.string()
      .required()
      .messages({ "any.required": "Password must be provided" }),
  });

  const result = schema.validate(req.body);

  if (result.error) {
    return res.status(400).send({
      success: false,
      message: result.error.details[0].message,
    });
  }

  try {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      const auth = await bcrypt.compare(req.body.password, user.password);
      if (auth) {
        const token = createJWTToken(user._id);

        return res.json({
          success: true,
          message: "login successful",
          data: user,
          token,
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: "incorrect login details",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.update_user = async (req, res) => {
  const { userId } = req.params;
  const schema = Joi.object().keys({
    firstName: Joi.string()
      .min(2)
      .messages({ "any.required": "First name must be up to 2 characters" }),
    lastName: Joi.string()
      .min(2)
      .messages({ "any.required": "Last name must be up to 2 characters" }),
  });

  const result = schema.validate(req.body);

  if (result.error) {
    return res.status(400).send({
      success: false,
      message: result.error.details[0].message,
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.fullName = req.body.firstName + " " + req.body.lastName;
    await user.save();

    return res.json({
      success: true,
      message: "user update successful",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.change_password = async (req, res) => {
  const schema = Joi.object().keys({
    oldPassword: Joi.string()
      .required()
      .messages({ "any.required": "Your old password is required" }),
    newPassword: Joi.string()
      .regex(/^(?=\S*[a-z])(?=\S*[A-Z])(?=\S*\d)(?=\S*[^\w\s])\S{8,30}$/)
      .pattern(new RegExp(""))
      .required()
      .messages({
        "any.required":
          "Password must have a capital letter, small letter, number, a special character and be more than 8 in length",
      }),
    confirmPassword: Joi.string()
      .required()
      .valid(Joi.ref("newPassword"))
      .messages({
        "any.required": "Passwords do not match",
      }),
  });

  const result = schema.validate(req.body);

  if (result.error) {
    return res.status(400).send({
      success: false,
      message: result.error.details[0].message,
    });
  }

  try {
    const user = req.user;

    const auth = await bcrypt.compare(req.body.oldPassword, user.password);
    if (auth) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);
      user.password = hashedPassword;
    } else {
      return res.status(405).json({
        success: false,
        message: "Wrong Password",
      });
    }

    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.delete_user = async (req, res) => {
  const { userId } = req.params;
  try {
    await User.deleteOne({ _id: userId });

    return res.json({
      success: true,
      message: "user deleted!",
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
