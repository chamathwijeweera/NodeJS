const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

// @route   GET api/users
// desc     Test route
// access   Public
router.get("/", (req, res) => res.send("Users route"));

// @route   Post api/users/activate
// desc     Activate user account
// access   Public
router.post("/activate", async (req, res) => {
  // Check for user existence
  let user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).json({ errors: [{ msg: "No user account found" }] });
  }

  // Activate User
  user.isActive = true;

  await User.findOneAndUpdate(
    { email: req.body.email },
    { $set: user },
    { new: true }
  );

  return res.status(200).json({ msg: "User account successfully activated" });
});

// @route   POST api/users
// desc     Register route
// access   Public
router.post(
  "/",
  [
    check("name", "Name is required")
      .not()
      .isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check for user existence
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exist" }] });
      }

      // Get user's gravatar
      const avatar = gravatar.url(email, { s: "200", r: "pg", d: "mm" });

      user = new User({
        name,
        email,
        avatar,
        password
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Deactivate User
      user.isActive = false;

      await user.save();

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });

      // Return JWT
      // const payload = {
      //   user: {
      //     id: user.id
      //   }
      // };
      // JWT.sign(
      //   payload,
      //   config.get("jwtSecret"),
      //   { expiresIn: 36000000 },
      //   (error, token) => {
      //     if (error) throw error;
      //     res.json({ token });
      //   }
      // );
    } catch (error) {
      console.log(error.message);
      req.status(500).send("Server error");
    }
  }
);

module.exports = router;
