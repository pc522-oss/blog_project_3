const express = require("express");
const bodyParser = require("body-parser");

const { Pool } = require("pg");
const db = new Pool({
  user: "postgres",
  host: "localhost",
  database: "blogdb",
  password: "patsy454",
  port: 5432,
});

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const session = require("express-session");

app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: true,
  }),
);

app.set("view engine", "ejs");

// HOME PAGE — load posts from SQL
app.get("/", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM blogs ORDER BY date_created DESC",
  );

  res.render("index", {
    posts: result.rows,
    sessionUser: req.session.user, // <-- needed for ownership buttons
  });
});

// CREATE NEW BLOG POST (SQL + ownership)
app.post("/new", async (req, res) => {
  if (!req.session.user) return res.redirect("/signin");

  const { title, content } = req.body;

  await db.query(
    "INSERT INTO blogs (creator_id, creator_name, title, body, date_created) VALUES ($1, $2, $3, $4, NOW())",
    [
      req.session.user.user_id, // owner ID
      req.session.user.name, // owner name
      title,
      content,
    ],
  );

  res.redirect("/?success=1");
});

// EDIT BLOG POST (SQL + ownership)
app.post("/edit/:id", async (req, res) => {
  if (!req.session.user) return res.redirect("/signin");

  const blogId = req.params.id;
  const { title, content } = req.body;

  await db.query(
    "UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3 AND creator_id = $4",
    [title, content, blogId, req.session.user.user_id],
  );

  res.redirect("/?success=1");
});

// DELETE BLOG POST (SQL + ownership)
app.post("/delete/:id", async (req, res) => {
  if (!req.session.user) return res.redirect("/signin");

  const blogId = req.params.id;

  await db.query("DELETE FROM blogs WHERE blog_id = $1 AND creator_id = $2", [
    blogId,
    req.session.user.user_id,
  ]);

  res.redirect("/?success=1");
});

// SIGNUP PAGE
app.get("/signup", (req, res) => {
  res.render("signup", { message: null });
});

// SIGNUP LOGIC
app.post("/signup", async (req, res) => {
  const { user_id, password, name } = req.body;

  const checkUser = await db.query("SELECT * FROM users WHERE user_id = $1", [
    user_id,
  ]);

  if (checkUser.rows.length > 0) {
    return res.render("signup", { message: "User ID already taken." });
  }

  await db.query(
    "INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)",
    [user_id, password, name],
  );

  res.redirect("/signin?created=1");
});

// SIGNIN PAGE
app.get("/signin", (req, res) => {
  res.render("signin", { message: null });
});

// SIGNOUT LOGIC
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/signin");
  });
});

// SIGNIN LOGIC
app.post("/signin", async (req, res) => {
  const { user_id, password } = req.body;

  const result = await db.query(
    "SELECT * FROM users WHERE user_id = $1 AND password = $2",
    [user_id, password],
  );

  if (result.rows.length === 0) {
    return res.render("signin", { message: "Invalid user ID or password." });
  }

  req.session.user = {
    user_id: result.rows[0].user_id,
    name: result.rows[0].name,
  };

  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
