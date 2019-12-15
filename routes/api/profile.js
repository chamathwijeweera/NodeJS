const express = require("express");
const request = require("request");
const config = require("config");
const router = express.Router();
const authentication = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const logger = require("../../services/logger.js");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route   GET api/profile/me
// desc     Get current user's profile
// access   Private
router.get("/me", authentication, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "No profile found for this user" });
    }

    res.json(profile);
  } catch (error) {
    logger.error(error);
    res.status(500).send("Server error");
  }
});

// @route   POST api/profile
// desc     Create or update user profile
// access   Private
router.post(
  "/",
  [
    authentication,
    [
      check("status", "Status is required")
        .not()
        .isEmpty(),
      check("skills", "Skills are required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    // Build profile object
    const profileFields = {};

    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map(skill => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (youtube) profileFields.social.youtube = youtube;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (twitter) profileFields.social.twitter = twitter;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // Create
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (error) {
      logger.error(error);
      res.status(500).send("Server error");
    }
  }
);

// @route   GET api/profile
// desc     Get all profiles
// access   Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (error) {
    logger.error(error);
    res.status(500).send("Server error");
  }
});

// @route   GET api/profile/user/:user_id
// desc     Get profile by user ID
// access   Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate("user", ["name", "avatar"]);
    if (!profile) return res.status(400).json({ msg: "Profile not found" });
    res.json(profile);
  } catch (error) {
    if (error.kind === "ObjectId")
      return res.status(400).json({ msg: "Profile not found" });

    logger.error(error);
    res.status(500).send("Server error");
  }
});

// @route   Delete api/profile
// desc     Delete profile, user & posts
// access   Public
router.delete("/", authentication, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id });
    res.json({ msg: "profile deleted" });
  } catch (error) {
    logger.error(error);
    res.status(500).send("Server error");
  }
});

// @route   GET api/profile/experience
// desc     add profile experience
// access   Private
router.put(
  "/experience",
  [
    authentication,
    [
      check("title", "Title is required")
        .not()
        .isEmpty(),
      check("company", "Company is required")
        .not()
        .isEmpty(),
      check("from", "From date is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExperience = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExperience);

      await profile.save();

      res.json(profile);
    } catch (error) {
      logger.error(error);
      res.status(500).send("Server error");
    }
  }
);

// @route   Delete api/profile/experience/:exp_id
// desc     Delete experience from profile
// access   Private
router.delete("/experience/:exp_id", authentication, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (error) {
    logger.error(error);
    res.status(500).send("Server error");
  }
});

// @route   GET api/profile/education
// desc     add profile education
// access   Private
router.put(
  "/education",
  [
    authentication,
    [
      check("school", "School is required")
        .not()
        .isEmpty(),
      check("degree", "Degree is required")
        .not()
        .isEmpty(),
      check("fieldofstudy", "Field of study is required")
        .not()
        .isEmpty(),
      check("from", "From date is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEducation = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEducation);

      await profile.save();

      res.json(profile);
    } catch (error) {
      logger.error(error);
      res.status(500).send("Server error");
    }
  }
);

// @route   Delete api/profile/education/:exp_id
// desc     Delete education from profile
// access   Private
router.delete("/education/:edu_id", authentication, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (error) {
    logger.error(error);
    res.status(500).send("Server error");
  }
});

// @route   Get api/profile/github/:username
// desc     Get user repos from GitHub
// access   Public
router.get("/github/:username", (req, res) => {
  try {
    const options = {
      url: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&
            sort=created:asc&client_id=${config.get(
              "githubClientId"
            )}&client_secret=
            ${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" }
    };

    request(options, (error, response, body) => {
      if (error) console.log(error);

      if (response.statusCode !== 200) {
        res.status(404).json({ msg: "No Github profile found" });
      }

      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
