const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

let posts = [];

app.get("/", (req, res) => {
  res.render("index", { posts });
});

app.post("/new", (req, res) => {
  const newPost = {
    id: Date.now(),
    author: req.body.author,
    title: req.body.title,
    content: req.body.content,
    createdAt: new Date(),
  };

  posts.push(newPost);
  res.redirect("/?success=1");
});

app.post("/edit/:id", (req, res) => {
  const postId = Number(req.params.id);
  const index = posts.findIndex((p) => p.id === postId);
  if (index === -1) return res.redirect("/");

  posts[index] = {
    ...posts[index],
    author: req.body.author,
    title: req.body.title,
    content: req.body.content,
  };

  res.redirect("/?success=1");
});

app.post("/delete/:id", (req, res) => {
  const postId = Number(req.params.id);
  posts = posts.filter((p) => p.id !== postId);
  res.redirect("/?success=1");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
