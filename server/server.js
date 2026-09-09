import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI, mcpToTool } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createClient } from "@clickhouse/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const clickhouse = createClient({
  url: `https://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT}`,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
  secure: process.env.CLICKHOUSE_SECURE === "true",
  verify: process.env.CLICKHOUSE_VERIFY === "true",
});
const mcpClient = new Client({
  name: "fanverse",
  version: "1.0.0",
});

const mcpTransport = new StdioClientTransport({
  command: "uvx",
  args: ["mcp-clickhouse"],
  env: {
    ...process.env,
  },
});
await mcpClient.connect(mcpTransport);

const mcpTools = await mcpClient.listTools();

console.log(
  "MCP tools:",
  mcpTools.tools.map((tool) => tool.name)
);
app.post("/api/generate", async (req, res) => {
  try {
    const { universe, prompt, userId } = req.body;
    const existingResult = await clickhouse.query({
  query: `
  SELECT
    story,
    prompt,
    (
      length(
        arrayIntersect(
          arrayFilter(x -> length(x) > 2,
            splitByWhitespace(lowerUTF8({prompt:String}))
          ),
          arrayFilter(x -> length(x) > 2,
            splitByWhitespace(lowerUTF8(prompt))
          )
        )
      )
      /
      greatest(
        length(
          arrayFilter(x -> length(x) > 2,
            splitByWhitespace(lowerUTF8({prompt:String}))
          )
        ),
        1
      )
    ) AS match_score
  FROM fanverse_scenes
  WHERE universe = {universe:String}
  ORDER BY match_score DESC
  LIMIT 1
`,
  query_params: {
    universe,
    prompt,
  },
  format: "JSONEachRow",
});

const existingRows = await existingResult.json();

if (existingRows.length > 0 && existingRows[0].match_score >= 0.7)  {
  return res.json({
    story: existingRows[0].story,
    fromCache: true,
  });
}

    const fullPrompt = `
You are the FanVerse Story Agent.

A fan wants to create a new, unofficial fan-made scene inspired by this fictional universe:

UNIVERSE:
${universe}

THE FAN'S IDEA:
${prompt}

Turn this into an exciting comic-style scene.

Return the following:

TITLE:
Give the scene a cinematic title.

SCENE:
Write a short dramatic continuation.

PANEL 1:
Describe what happens visually.

PANEL 2:
Describe what happens visually.

PANEL 3:
Describe what happens visually.

DIALOGUE:
Include memorable dialogue.

Keep it cinematic, creative and suitable for a comic-style fan experience.
`;

  const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: fullPrompt,
  config: {
    tools: [mcpToTool(mcpClient)],
  },
});
    const text =
      response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No story was generated.");
    }
    const sceneId = crypto.randomUUID();

await clickhouse.insert({
  table: "fanverse_scenes",
  values: [{
    id: sceneId,
    created_at: new Date().toISOString().slice(0,19).replace("T", " "),
    user_id: userId,
    universe,
    prompt,
    story: text,
  }],
  format: "JSONEachRow",
});

   res.json({
  story: text,
  sceneId,
});

  } catch (error) {
    console.error("Generation error:", error);

    res.status(500).json({
      error: error.message || "Failed to generate scene",
    });
  }
});
app.get("/api/scenes", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required.",
      });
    }

    const result = await clickhouse.query({
      query: `
       SELECT
  id,
  created_at,
  universe,
  prompt,
  story,
  is_public
FROM fanverse_scenes
        WHERE user_id = {userId:UUID}
        ORDER BY created_at DESC
        LIMIT 50
      `,
      query_params: {
        userId,
      },
      format: "JSONEachRow",
    });

    const scenes = await result.json();

    res.json({ scenes });
  } catch (error) {
    console.error("Scenes error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch scenes",
    });
  }
});


app.post("/api/signup", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (
      !name?.trim() ||
      !username?.trim() ||
      !email?.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Name, username, email and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Username rules:
    // 3-20 characters
    // Must start with a letter
    // Only letters, numbers and underscores
    const usernameRegex = /^[a-z][a-z0-9_]{2,19}$/;

    if (!usernameRegex.test(cleanUsername)) {
      return res.status(400).json({
        error:
          "Username must be 3-20 characters, start with a letter, and contain only letters, numbers and underscores.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters.",
      });
    }

    // Check email
    const existingEmailResult = await clickhouse.query({
      query: `
        SELECT id
        FROM fanverse_users
        WHERE email = {email:String}
        LIMIT 1
      `,
      query_params: {
        email: cleanEmail,
      },
      format: "JSONEachRow",
    });

    const existingEmailUsers = await existingEmailResult.json();

    if (existingEmailUsers.length > 0) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    // Check username
    const existingUsernameResult = await clickhouse.query({
      query: `
        SELECT id
        FROM fanverse_users
        WHERE lower(username) = {username:String}
        LIMIT 1
      `,
      query_params: {
        username: cleanUsername,
      },
      format: "JSONEachRow",
    });

    const existingUsernameUsers = await existingUsernameResult.json();

    if (existingUsernameUsers.length > 0) {
      return res.status(409).json({
        error: "That username is already taken.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userId = crypto.randomUUID();

    await clickhouse.insert({
      table: "fanverse_users",
      values: [
        {
          id: userId,
          created_at: new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          password_hash: passwordHash,
        },
      ],
      format: "JSONEachRow",
    });

    res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: userId,
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      error: error.message || "Failed to create account.",
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const result = await clickhouse.query({
      query: `
        SELECT
          id,
          name,
          username,
          email,
          password_hash
        FROM fanverse_users
        WHERE email = {email:String}
        LIMIT 1
      `,
      query_params: {
        email: email.trim().toLowerCase(),
      },
      format: "JSONEachRow",
    });

    const users = await result.json();

    if (users.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const user = users[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    res.json({
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: error.message || "Failed to log in.",
    });
  }
});
 

app.put("/api/profile", async (req, res) => {
  try {
    const { userId, name } = req.body;

    if (!userId || !name?.trim()) {
      return res.status(400).json({
        error: "User ID and name are required.",
      });
    }

    const cleanName = name.trim();

    await clickhouse.command({
      query: `
        ALTER TABLE fanverse_users
        UPDATE name = {name:String}
        WHERE id = {userId:UUID}
      `,
      query_params: {
        name: cleanName,
        userId,
      },
    });

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: userId,
        name: cleanName,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);

    res.status(500).json({
      error: "Failed to update profile.",
    });
  }
});
app.put("/api/scenes/:id/public", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isPublic } = req.body;

    if (!id || !userId) {
      return res.status(400).json({
        error: "Scene ID and User ID are required.",
      });
    }

    await clickhouse.command({
      query: `
        ALTER TABLE fanverse_scenes
        UPDATE is_public = {isPublic:UInt8}
        WHERE id = {id:UUID}
          AND user_id = {userId:UUID}
      `,
      query_params: {
        id,
        userId,
        isPublic: isPublic ? 1 : 0,
      },
    });

    res.json({
      message: isPublic
        ? "Scene posted to profile."
        : "Scene removed from profile.",
    });
  } catch (error) {
    console.error("Public scene update error:", error);

    res.status(500).json({
      error: error.message || "Failed to update scene.",
    });
  }
});

app.get("/api/my-posts", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required.",
      });
    }

    const result = await clickhouse.query({
      query: `
        SELECT
          id,
          created_at,
          universe,
          prompt,
          story
        FROM fanverse_scenes
        WHERE user_id = {userId:UUID}
          AND is_public = 1
        ORDER BY created_at DESC
        LIMIT 50
      `,
      query_params: {
        userId,
      },
      format: "JSONEachRow",
    });

    const posts = await result.json();

    res.json({ posts });
  } catch (error) {
    console.error("My posts error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch posts",
    });
  }
});
app.get("/api/users/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q?.trim()) {
      return res.status(400).json({
        error: "Search query is required.",
      });
    }

    const search = q.trim();

    const result = await clickhouse.query({
      query: `
        SELECT
          id,
          name,
          username
        FROM fanverse_users
        WHERE
          positionCaseInsensitiveUTF8(name, {search:String}) > 0
          OR positionCaseInsensitiveUTF8(username, {search:String}) > 0
        ORDER BY name ASC
        LIMIT 20
      `,
      query_params: {
        search,
      },
      format: "JSONEachRow",
    });

    const users = await result.json();

    res.json({ users });
  } catch (error) {
    console.error("User search error:", error);

    res.status(500).json({
      error: error.message || "Failed to search users.",
    });
  }
});
app.get("/api/users/:username", async (req, res) => {
  try {
    const { username } = req.params;

    if (!username?.trim()) {
      return res.status(400).json({
        error: "Username is required.",
      });
    }

    const result = await clickhouse.query({
      query: `
        SELECT
          id,
          username,
          email
        FROM fanverse_users
        WHERE lower(username) = lower({username:String})
        LIMIT 1
      `,
      query_params: {
        username: username.trim(),
      },
      format: "JSONEachRow",
    });

    const users = await result.json();

    if (users.length === 0) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const user = users[0];

    const postsResult = await clickhouse.query({
      query: `
        SELECT
          id,
          created_at,
          universe,
          prompt,
          story
        FROM fanverse_scenes
        WHERE user_id = {userId:UUID}
          AND is_public = 1
        ORDER BY created_at DESC
        LIMIT 50
      `,
      query_params: {
        userId: user.id,
      },
      format: "JSONEachRow",
    });

    const posts = await postsResult.json();

    res.json({
      user: {
        id: user.id,
        username: user.username,
      },
      posts,
    });
  } catch (error) {
    console.error("Public profile error:", error);

    res.status(500).json({
      error: error.message || "Failed to load profile.",
    });
  }
});
// =========================
// LIKES
// =========================

app.post("/api/scenes/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!id || !userId) {
      return res.status(400).json({
        error: "Scene ID and User ID are required.",
      });
    }

    // Check the user's latest like action for this scene
    const existingResult = await clickhouse.query({
      query: `
        SELECT action
        FROM fanverse_scene_likes
        WHERE scene_id = {sceneId:UUID}
          AND user_id = {userId:UUID}
        ORDER BY created_at DESC
        LIMIT 1
      `,
      query_params: {
        sceneId: id,
        userId,
      },
      format: "JSONEachRow",
    });

    const existing = await existingResult.json();

    const currentlyLiked =
  existing.length > 0 && Number(existing[0].action) === 1;

const newAction = currentlyLiked ? 0 : 1;

    await clickhouse.command({
  query: `
    INSERT INTO fanverse_scene_likes
      (scene_id, user_id, action, created_at)
    VALUES
      ({sceneId:UUID}, {userId:UUID}, {action:Int8}, {createdAt:DateTime64(3)})
  `,
  query_params: {
    sceneId: id,
    userId,
    action: newAction,
   createdAt: new Date().toISOString().slice(0, 23),
  },
});

    // Get current like count
    const countResult = await clickhouse.query({
      query: `
        SELECT
          greatest(sum(latest_action), 0) AS like_count
        FROM
        (
          SELECT
            user_id,
            argMax(action, created_at) AS latest_action
          FROM fanverse_scene_likes
          WHERE scene_id = {sceneId:UUID}
          GROUP BY user_id
        )
      `,
      query_params: {
        sceneId: id,
      },
      format: "JSONEachRow",
    });

    const countRows = await countResult.json();

    res.json({
      liked: newAction === 1,
      likeCount: Number(countRows[0]?.like_count || 0),
    });
  } catch (error) {
    console.error("Like error:", error);

    res.status(500).json({
      error: error.message || "Failed to update like.",
    });
  }
});









app.get("/api/scenes/:id/likes", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const countResult = await clickhouse.query({
      query: `
        SELECT
          greatest(sum(latest_action), 0) AS like_count
        FROM
        (
          SELECT
            user_id,
            argMax(action, created_at) AS latest_action
          FROM fanverse_scene_likes
          WHERE scene_id = {sceneId:UUID}
          GROUP BY user_id
        )
      `,
      query_params: {
        sceneId: id,
      },
      format: "JSONEachRow",
    });

    const rows = await countResult.json();

    let liked = false;

    if (userId) {
      const userResult = await clickhouse.query({
        query: `
          SELECT action
          FROM fanverse_scene_likes
          WHERE scene_id = {sceneId:UUID}
            AND user_id = {userId:UUID}
          ORDER BY created_at DESC
          LIMIT 1
        `,
        query_params: {
          sceneId: id,
          userId,
        },
        format: "JSONEachRow",
      });

      const userRows = await userResult.json();
      liked =
        userRows.length > 0 &&
        Number(userRows[0].action) === 1;
    }

    res.json({
      likeCount: Number(rows[0]?.like_count || 0),
      liked,
    });

  } catch (error) {
    console.error("Likes fetch error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch likes.",
    });
  }
});


// =========================
// COMMENTS
// =========================
app.post("/api/scenes/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, comment } = req.body;

    if (!id || !userId || !comment?.trim()) {
      return res.status(400).json({
        error: "Scene ID, User ID, and comment are required.",
      });
    }

    const cleanComment = comment.trim();

    if (cleanComment.length > 500) {
      return res.status(400).json({
        error: "Comment must be 500 characters or less.",
      });
    }

    await clickhouse.command({
  query: `
    INSERT INTO fanverse_scene_comments
      (id, scene_id, user_id, comment, created_at)
    VALUES
      ({commentId:UUID}, {sceneId:UUID}, {userId:UUID}, {comment:String}, {createdAt:DateTime64(3)})
  `,
  query_params: {
    commentId: crypto.randomUUID(),
    sceneId: id,
    userId,
    comment: cleanComment,
    createdAt: new Date().toISOString().slice(0, 23),
  },
});

    res.json({
      message: "Comment added.",
    });
  } catch (error) {
    console.error("Comment error:", error);

    res.status(500).json({
      error: error.message || "Failed to add comment.",
    });
  }
});
app.get("/api/scenes/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await clickhouse.query({
      query: `
        SELECT
          c.id,
          c.scene_id,
          c.user_id,
          c.comment,
          c.created_at,
          u.username,
          u.name
        FROM fanverse_scene_comments c
        LEFT JOIN fanverse_users u
          ON c.user_id = u.id
        WHERE c.scene_id = {sceneId:UUID}
        ORDER BY c.created_at ASC
      `,
      query_params: {
        sceneId: id,
      },
      format: "JSONEachRow",
    });

    const comments = await result.json();

    res.json({
      comments,
    });
  } catch (error) {
    console.error("Comments fetch error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch comments.",
    });
  }
});

app.post("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, comment } = req.body;

    if (!id || !userId || !comment?.trim()) {
      return res.status(400).json({
        error: "Scene ID, User ID and comment are required.",
      });
    }

    const cleanComment = comment.trim();

    if (cleanComment.length > 500) {
      return res.status(400).json({
        error: "Comment must be 500 characters or less.",
      });
    }

    const commentId = crypto.randomUUID();

    await clickhouse.command({
  query: `
    INSERT INTO fanverse_scene_comments
      (id, scene_id, user_id, comment, created_at)
    VALUES
      ({commentId:UUID}, {sceneId:UUID}, {userId:UUID}, {comment:String}, {createdAt:DateTime64(3)})
  `,
  query_params: {
    commentId: crypto.randomUUID(),
    sceneId: id,
    userId,
    comment: cleanComment,
    createdAt: new Date().toISOString(),
  },
});

    res.status(201).json({
      message: "Comment added.",
      comment: {
        id: commentId,
        sceneId: id,
        userId,
        comment: cleanComment,
      },
    });
  } catch (error) {
    console.error("Comment error:", error);

    res.status(500).json({
      error: error.message || "Failed to add comment.",
    });
  }
});


app.get("/api/scenes/:id/comment-count", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await clickhouse.query({
      query: `
        SELECT count() AS comment_count
        FROM fanverse_scene_comments
        WHERE scene_id = {sceneId:UUID}
      `,
      query_params: {
        sceneId: id,
      },
      format: "JSONEachRow",
    });

    const rows = await result.json();

    res.json({
      commentCount: Number(rows[0]?.comment_count || 0),
    });
  } catch (error) {
    console.error("Comment count error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch comment count.",
    });
  }
});
// =========================
// DISCOVER + TRENDING
// =========================

app.get("/api/discover", async (req, res) => {
  try {
    const { q = "", userId } = req.query;
    const search = q.trim();

    const result = await clickhouse.query({
      query: `
        WITH
        latest_likes AS (
          SELECT
            scene_id,
            user_id,
            argMax(action, created_at) AS latest_action
          FROM fanverse_scene_likes
          GROUP BY scene_id, user_id
        ),

        like_counts AS (
          SELECT
            scene_id,
            greatest(sum(latest_action), 0) AS like_count
          FROM latest_likes
          GROUP BY scene_id
        ),

        comment_counts AS (
          SELECT
            scene_id,
            count() AS comment_count
          FROM fanverse_scene_comments
          GROUP BY scene_id
        )

        SELECT
          s.id,
          s.created_at,
          s.universe,
          s.prompt,
          s.story,
          s.user_id,
          u.name,
          u.username,
          coalesce(l.like_count, 0) AS like_count,
          coalesce(c.comment_count, 0) AS comment_count,

          if(
            {userId:String} = '',
            0,
            (
              SELECT greatest(argMax(action, created_at), 0)
              FROM fanverse_scene_likes
              WHERE scene_id = s.id
                AND user_id = toUUIDOrZero({userId:String})
            )
          ) AS liked_by_me

        FROM fanverse_scenes s

        LEFT JOIN fanverse_users u
          ON s.user_id = u.id

        LEFT JOIN like_counts l
          ON s.id = l.scene_id

        LEFT JOIN comment_counts c
          ON s.id = c.scene_id

        WHERE s.is_public = 1

          AND (
            {search:String} = ''
            OR positionCaseInsensitiveUTF8(s.universe, {search:String}) > 0
            OR positionCaseInsensitiveUTF8(s.prompt, {search:String}) > 0
            OR positionCaseInsensitiveUTF8(s.story, {search:String}) > 0
          )

        ORDER BY s.created_at DESC
        LIMIT 50
      `,
      query_params: {
        search,
        userId: userId || "",
      },
      format: "JSONEachRow",
    });

    const scenes = await result.json();

    res.json({ scenes });
  } catch (error) {
    console.error("Discover error:", error);

    res.status(500).json({
      error: error.message || "Failed to load Discover.",
    });
  }
});


app.get("/api/trending", async (req, res) => {
  try {
    const { q = "", userId } = req.query;
    const search = q.trim();

    const result = await clickhouse.query({
      query: `
        WITH
        latest_likes AS (
          SELECT
            scene_id,
            user_id,
            argMax(action, created_at) AS latest_action
          FROM fanverse_scene_likes
          GROUP BY scene_id, user_id
        ),

        like_counts AS (
          SELECT
            scene_id,
            greatest(sum(latest_action), 0) AS like_count
          FROM latest_likes
          GROUP BY scene_id
        ),

        comment_counts AS (
          SELECT
            scene_id,
            count() AS comment_count
          FROM fanverse_scene_comments
          GROUP BY scene_id
        )

        SELECT
          s.id,
          s.created_at,
          s.universe,
          s.prompt,
          s.story,
          s.user_id,
          u.name,
          u.username,
          coalesce(l.like_count, 0) AS like_count,
          coalesce(c.comment_count, 0) AS comment_count,

          (
            coalesce(l.like_count, 0) * 3
            + coalesce(c.comment_count, 0) * 2
          ) AS engagement_score,

          if(
            {userId:String} = '',
            0,
            (
              SELECT greatest(argMax(action, created_at), 0)
              FROM fanverse_scene_likes
              WHERE scene_id = s.id
                AND user_id = toUUIDOrZero({userId:String})
            )
          ) AS liked_by_me

        FROM fanverse_scenes s

        LEFT JOIN fanverse_users u
          ON s.user_id = u.id

        LEFT JOIN like_counts l
          ON s.id = l.scene_id

        LEFT JOIN comment_counts c
          ON s.id = c.scene_id

        WHERE s.is_public = 1

          AND (
            {search:String} = ''
            OR positionCaseInsensitiveUTF8(s.universe, {search:String}) > 0
            OR positionCaseInsensitiveUTF8(s.prompt, {search:String}) > 0
            OR positionCaseInsensitiveUTF8(s.story, {search:String}) > 0
          )

        ORDER BY
          engagement_score DESC,
          s.created_at DESC

        LIMIT 50
      `,
      query_params: {
        search,
        userId: userId || "",
      },
      format: "JSONEachRow",
    });

    const scenes = await result.json();

    res.json({ scenes });
  } catch (error) {
    console.error("Trending error:", error);

    res.status(500).json({
      error: error.message || "Failed to load Trending.",
    });
  }
});
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

server.on("error", (error) => {
  console.error("Server error:", error);
});

process.on("exit", (code) => {
  console.log("Process exiting with code:", code);
});