const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const authentication = require("../../middleware/auth");

const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route   GET api/posts
// desc     Get all posts
//access    Private
router.get("/", authentication, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/posts/:id
// desc     Get post
//access    Private
router.get("/:id", authentication, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(400).json({ msg: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    console.log(error.message);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ msg: "Post not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   POST api/posts
// desc     Create a post
//access    Public
router.post(
  "/",
  [
    authentication,
    [
      check("text", "Text is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save();

      res.json(post);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   DELETE api/posts
// desc     Delete post
//access    Private
router.delete("/:id", authentication, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({ msg: "Post not found" });
    }

    // Check user owns this post
    if (post.user.toString() !== req.user.id) {
      res.status(401).json({ msg: "User not authorized" });
    }
    await post.remove();

    res.json({ msg: "Post removed" });
  } catch (error) {
    console.log(error.message);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ msg: "Post not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/posts/like/:id
// desc     Like a post
//access    Private
router.put("/like/:id", authentication, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // Check if the post has already been liked
    if (post.likes.filter(e => e.user.toString() === req.user.id).length > 0) {
      return res.status(400).json({ msg: "Post is already liked" });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/posts/unlike/:id
// desc     Like a post
//access    Private
router.put("/unlike/:id", authentication, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // Check if the post has already been liked
    if (post.likes.filter(e => e.user.toString() === req.user.id).length > 0) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    //Get remove index
    const removeIndex = post.likes
      .map(e => e.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/posts/comments/:id
// desc     Comment on a post
//access    Private
router.post(
  "/",
  [
    authentication,
    [
      check("text", "Text is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);

      const newComment = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   DELETE api/posts/comments/:id/:comment_id
// desc     Delete comment
//access    Private
router.delete("/comment/:id/:comment_id", authentication, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //Pull out comment
    const comment = post.comments.find(e => e.id === req.params.comment_id);

    //Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }

    //Check comment belongs to current user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    //Get remove index
    const removeIndex = post.comments
      .map(e => e.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
