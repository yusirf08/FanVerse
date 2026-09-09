import { useEffect, useState } from "react";
import { Play, ArrowLeft, Sparkles, Menu, X, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import "./App.css";


const lines = [
  "What if the story didn't end when the screen went dark?",
  "What happens after the credits roll?",
  "Your favorite universe doesn't have to end.",
  "The next scene could be yours."
];

function IntroScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3500);

    

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="intro-screen">
      <div className="intro-logo">FANVERSE</div>
    </div>
  );
}
function SceneEngagement({
  
  scene,
  currentUser,
  sceneLikes,
  likedScenes,
  sceneComments,
  sceneCommentCounts,
  openComments,
  newComment,
  toggleLike,
  toggleComments,
  setNewComment,
  submitComment,
}) {
  console.log("ENGAGEMENT SCENE:", scene);
  const sceneId = scene?.id ?? scene?.["s.id"];
  const comments = sceneComments[sceneId] || [];
  const isCommentsOpen = Boolean(openComments[sceneId]);

  return (
    <div
      className="scene-engagement"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="engagement-actions">
       <button
  className={`engagement-button ${
    likedScenes[sceneId] ? "liked" : ""
  }`}
  onClick={() => {
    console.log("LIKE BUTTON SCENE:", scene);
    console.log("BUTTON ID:", sceneId);
    toggleLike(sceneId);
  }}
>
  {likedScenes[sceneId] ? "♥" : "♡"}
  <span>{sceneLikes[sceneId] || 0}</span>
</button>

        <button
          className="engagement-button"
          onClick={() => toggleComments(sceneId)}
        >
          💬
          <span>{sceneCommentCounts[sceneId] ?? comments.length}</span>
        </button>
      </div>

      {isCommentsOpen && (
        <div className="comments-section">
          {comments.length > 0 && (
            <div className="comments-list">
              {comments.map((comment) => (
                <div className="comment-item" key={comment.id}>
                  <div className="comment-author">
                    {comment.name || comment.username}
                  </div>

                  <div className="comment-text">
                    {comment.comment}
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentUser ? (
            <div className="comment-input-row">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment[sceneId] || ""}
                maxLength={500}
                onChange={(event) =>
                  setNewComment((prev) => ({
                    ...prev,
                    [sceneId]: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    submitComment(sceneId);
                  }
                }}
              />

              <button
                className="comment-submit"
                onClick={() => submitComment(sceneId)}
              >
                Post
              </button>
            </div>
          ) : (
            <p className="comment-login-message">
              Log in to comment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [lineIndex, setLineIndex] = useState(0);
 const [currentPage, setCurrentPage] = useState("home");
const [previousPage, setPreviousPage] = useState("home");
const navigateTo = (page) => {
  setPreviousPage(currentPage);
  setCurrentPage(page);
};

  const [selectedUniverse, setSelectedUniverse] = useState("");
  const [scenePrompt, setScenePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
const [generatedStory, setGeneratedStory] = useState("");
const [currentSceneId, setCurrentSceneId] = useState(null);
const [isScenePublic, setIsScenePublic] = useState(false);
const [selectedSearchedPost, setSelectedSearchedPost] = useState(null);

const [savedScenes, setSavedScenes] = useState([]);
const [myPosts, setMyPosts] = useState([]);
const [searchUsername, setSearchUsername] = useState("");
const [searchedUsers, setSearchedUsers] = useState([]);
const [searchedUser, setSearchedUser] = useState(null);
const [searchedPosts, setSearchedPosts] = useState([]);
const [sceneLikes, setSceneLikes] = useState({});
const [likedScenes, setLikedScenes] = useState({});
const [sceneComments, setSceneComments] = useState({});
const [sceneCommentCounts, setSceneCommentCounts] = useState({});
const [openComments, setOpenComments] = useState({});
const [newComment, setNewComment] = useState({});
const [discoverScenes, setDiscoverScenes] = useState([]);
const [trendingScenes, setTrendingScenes] = useState([]);
const [discoverSearch, setDiscoverSearch] = useState("");
const [trendingSearch, setTrendingSearch] = useState("");
const [authMode, setAuthMode] = useState("login");
const [isAuthenticated, setIsAuthenticated] = useState(
  () => Boolean(localStorage.getItem("fanverse_user"))
);

const [currentUser, setCurrentUser] = useState(() => {
  const savedUser = localStorage.getItem("fanverse_user");

  return savedUser ? JSON.parse(savedUser) : null;
});
const [showAccountMenu, setShowAccountMenu] = useState(false);
const [authName, setAuthName] = useState("");
const [authUsername, setAuthUsername] = useState("");
const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");
const [editingProfile, setEditingProfile] = useState(false);
const [profileName, setProfileName] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex((current) => (current + 1) % lines.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  if (currentPage !== "scenes") return;

  const fetchScenes = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/scenes?userId=${currentUser.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load scenes");
      }

      setSavedScenes(data.scenes);
    } catch (error) {
      console.error("Scenes error:", error);
      alert("Could not load your scenes: " + error.message);
    }
  };

  fetchScenes();
}, [currentPage]);

useEffect(() => {
  if (currentPage !== "posts") return;

  const fetchMyPosts = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/my-posts?userId=${currentUser.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load posts");
      }
      console.log("MY POSTS DATA:", data.posts);

      

const posts = data.posts.map((scene) => ({
  ...scene,
  id: scene.id ?? scene["s.id"],
}));

setMyPosts(posts);
for (const scene of posts) {
  console.log("LOADING ENGAGEMENT FOR:", scene.id);
  loadSceneEngagement(scene.id);
}

    } catch (error) {
      console.error("My posts error:", error);
      alert("Could not load your posts: " + error.message);
    }
  };

  fetchMyPosts();
}, [currentPage, currentUser?.id]);

useEffect(() => {
  if (currentPage !== "discover") return;

  const loadDiscoverScenes = async () => {
    try {
      const params = new URLSearchParams();

      if (discoverSearch.trim()) {
        params.set("q", discoverSearch.trim());
      }

      if (currentUser?.id) {
        params.set("userId", currentUser.id);
      }
      console.log("DISCOVER USER ID:", currentUser?.id);

      const response = await fetch(
        `http://localhost:3001/api/discover?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load Discover.");
      }

      setDiscoverScenes(data.scenes || []);

      for (const scene of data.scenes || []) {
  const sceneId = scene.id ?? scene["s.id"];

  setSceneLikes((prev) => ({
    ...prev,
    [sceneId]: Number(scene.like_count || 0),
  }));

  setLikedScenes((prev) => ({
    ...prev,
    [sceneId]: Number(scene.liked_by_me || 0) === 1,
  }));

  setSceneCommentCounts((prev) => ({
    ...prev,
    [sceneId]: Number(scene.comment_count || 0),
  }));
}
    } catch (error) {
      console.error("Discover error:", error);
    }
  };

  loadDiscoverScenes();
}, [currentPage, discoverSearch, currentUser?.id]);


useEffect(() => {
  if (currentPage !== "trending") return;

  const loadTrendingScenes = async () => {
    try {
      const params = new URLSearchParams();

      if (trendingSearch.trim()) {
        params.set("q", trendingSearch.trim());
      }

      if (currentUser?.id) {
        params.set("userId", currentUser.id);
      }

      const response = await fetch(
        `http://localhost:3001/api/trending?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load Trending.");
      }

      setTrendingScenes(data.scenes || []);

      for (const scene of data.scenes || []) {
        setSceneLikes((prev) => ({
          ...prev,
          [scene.id]: Number(scene.like_count || 0),
        }));

        setLikedScenes((prev) => ({
          ...prev,
          [scene.id]: Number(scene.liked_by_me || 0) === 1,
        }));

        setSceneCommentCounts((prev) => ({
          ...prev,
          [scene.id]: Number(scene.comment_count || 0),
        }));
      }
    } catch (error) {
      console.error("Trending error:", error);
    }
  };

  loadTrendingScenes();
}, [currentPage, trendingSearch, currentUser?.id]);
const handleAuth = async () => {
  if (!authEmail.trim() || !authPassword) {
    alert("Please enter your email and password.");
    return;
  }

  if (authMode === "signup" && !authName.trim()) {
  alert("Please enter your name.");
  return;
}

if (authMode === "signup" && !authUsername.trim()) {
  alert("Please choose a username.");
  return;
}

  try {
    const endpoint =
      authMode === "signup"
        ? "http://localhost:3001/api/signup"
        : "http://localhost:3001/api/login";

    const body =
      authMode === "signup"
       ? {
    name: authName,
    username: authUsername,
    email: authEmail,
    password: authPassword,
  }
        : {
            email: authEmail,
            password: authPassword,
          };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Authentication failed");
    }

   setCurrentUser(data.user);
setIsAuthenticated(true);

localStorage.setItem(
  "fanverse_user",
  JSON.stringify(data.user)
);
  } catch (error) {
    console.error("Auth error:", error);
    alert(error.message);
  }
};

  const handleGenerate = async () => {
    if (!selectedUniverse || !scenePrompt.trim()) {
      alert("Choose a universe and describe your scene first.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        "http://localhost:3001/api/generate",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
  universe: selectedUniverse,
  prompt: scenePrompt,
  userId: currentUser.id,
}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

    console.log("Generated scene:", data.story);

setGeneratedStory(data.story);
setCurrentSceneId(data.sceneId);
setIsScenePublic(false);

navigateTo("result");
    } catch (error) {
      console.error("Generation error:", error);

      alert("Something went wrong: " + error.message);

    } finally {
      setIsGenerating(false);
    }
  };
 const searchUser = async () => {
  if (!searchUsername.trim()) return;

  try {
    const response = await fetch(
      `http://localhost:3001/api/users/search?q=${encodeURIComponent(
        searchUsername.trim()
      )}`
    );

    const data = await response.json();

    if (!response.ok) {
      setSearchedUser(null);
      setSearchedPosts([]);
      alert(data.error || "Search failed.");
      return;
    }

   setSearchedUsers(data.users || []);
setSearchedUser(null);
setSearchedPosts([]);
  } catch (error) {
    console.error("Search error:", error);
    alert("Could not connect to the server.");
  }
};
const toggleLike = async (sceneId) => {
  console.log("LIKE SCENE ID:", sceneId);

  if (!currentUser) return;

  const wasLiked = Boolean(likedScenes[sceneId]);
  const currentCount = Number(sceneLikes[sceneId] || 0);

  // Update the UI immediately
  setLikedScenes((prev) => ({
    ...prev,
    [sceneId]: !wasLiked,
  }));

  setSceneLikes((prev) => ({
    ...prev,
    [sceneId]: Math.max(0, currentCount + (wasLiked ? -1 : 1)),
  }));

  try {
    const response = await fetch(
      `http://localhost:3001/api/scenes/${sceneId}/like`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      }
    );

    const data = await response.json();

    console.log("LIKE RESPONSE:", data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to update like.");
    }

    // Sync with the actual backend result
    setLikedScenes((prev) => ({
      ...prev,
      [sceneId]: Boolean(data.liked),
    }));

    setSceneLikes((prev) => ({
      ...prev,
      [sceneId]: Number(data.likeCount || 0),
    }));
  } catch (error) {
    console.error("Like error:", error);

    // Revert the UI if the request failed
    setLikedScenes((prev) => ({
      ...prev,
      [sceneId]: wasLiked,
    }));

    setSceneLikes((prev) => ({
      ...prev,
      [sceneId]: currentCount,
    }));

    alert("Could not update like.");
  }
};


const loadSceneEngagement = async (sceneId) => {
  try {
    const likesResponse = await fetch(
      `http://localhost:3001/api/scenes/${sceneId}/likes?userId=${currentUser?.id || ""}`
    );

    const likesData = await likesResponse.json();

    if (likesResponse.ok) {
  console.log("LOADED LIKE:", sceneId, likesData);

  setSceneLikes((prev) => ({
    ...prev,
    [sceneId]: Number(likesData.likeCount || 0),
  }));

  setLikedScenes((prev) => ({
    ...prev,
    [sceneId]: Boolean(likesData.liked),
  }));
}

    const commentsResponse = await fetch(
      `http://localhost:3001/api/scenes/${sceneId}/comments`
    );

    const commentsData = await commentsResponse.json();

    if (commentsResponse.ok) {
      setSceneComments((prev) => ({
        ...prev,
        [sceneId]: commentsData.comments || [],
      }));
    }
  } catch (error) {
    console.error("Engagement error:", error);
  }
};

const toggleComments = async (sceneId) => {
  const isOpen = openComments[sceneId];

  setOpenComments((prev) => ({
    ...prev,
    [sceneId]: !isOpen,
  }));

  if (!isOpen && !sceneComments[sceneId]) {
    await loadSceneEngagement(sceneId);
  }
};

const submitComment = async (sceneId) => {
  if (!currentUser) return;

  const commentText = newComment[sceneId]?.trim();

  if (!commentText) return;

  try {
    const response = await fetch(
      `http://localhost:3001/api/scenes/${sceneId}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.id,
          comment: commentText,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to add comment.");
    }

    setNewComment((prev) => ({
      ...prev,
      [sceneId]: "",
    }));

    await loadSceneEngagement(sceneId);
  } catch (error) {
    console.error("Comment error:", error);
    alert(error.message || "Could not add comment.");
  }
};

  if (showIntro) {
    return (
      <IntroScreen
        onFinish={() => setShowIntro(false)}
      />
    );
  }
if (currentPage === "scenes") {
  return (
    <main className="result-page">
      <nav className="studio-nav">
  <div className="menu-wrapper">
    <button
      className="menu-button"
      onClick={() => setShowAccountMenu(!showAccountMenu)}
      aria-label="Open menu"
    >
      {showAccountMenu ? <X size={24} /> : <Menu size={24} />}
    </button>

    {showAccountMenu && (
      <div className="side-menu">
        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("home");
          }}
        >
          Home
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("scenes");
          }}
        >
          My Scenes
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("posts");
          }}
        >
          My Posts
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("profile");
          }}
        >
          Profile
        </button>

        <div className="menu-divider"></div>

        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("fanverse_user");
            setCurrentUser(null);
            setIsAuthenticated(false);
            setShowAccountMenu(false);
          }}
        >
          Log Out
        </button>
      </div>
    )}
  </div>

  <div className="logo">
    FAN<span>VERSE</span>
  </div>

  <div className="studio-label">
    MY SCENES
  </div>
</nav>

<button
  className="back-button"
  onClick={() => setCurrentPage("home")}
>
  ← Back
</button>
      <section className="result-content">
        <div className="badge">
          YOUR FANVERSE
        </div>

        <h1>
          Your <span>scenes.</span>
        </h1>

        <p className="description">
          Every scene you've created, all in one place.
        </p>

        <div className="scenes-grid">
          {savedScenes.length === 0 ? (
            <div className="story-card">
              <div className="story-markdown">
                <h2>No scenes yet.</h2>
                <p>
                  Create your first FanVerse scene and it will appear here.
                </p>
              </div>
            </div>
          ) : (
  <>
    {savedScenes.map((scene) => (
      <div
        className="scene-preview-card"
        key={scene.id}
       onClick={() => {
  setGeneratedStory(scene.story);
  setCurrentSceneId(scene.id);
  setIsScenePublic(Boolean(scene.is_public));
  navigateTo("result");
}}
      >
        <div className="badge">
          {scene.universe}
        </div>

      <h2>
  {scene.prompt}
</h2>

        <p className="scene-preview">
          {scene.story
            .replace(/[#*_]/g, "")
            .replace(/\n/g, " ")
            .slice(0, 140)}
          {scene.story.length > 140 ? "..." : ""}
        </p>

       <div className="scene-open">
  Read scene →
</div>
      </div>
    ))}
  </>
)}
        </div>

        <button
          className="generate-button"
          onClick={() => setCurrentPage("create")}
        >
          <Sparkles size={18} />
          Create New Scene
        </button>
      </section>
    </main>
  );
}
if (currentPage === "posts") {
  return (
    <main className="result-page">
      <nav className="studio-nav">
  <div className="menu-wrapper">
    <button
      className="menu-button"
      onClick={() => setShowAccountMenu(!showAccountMenu)}
      aria-label="Open menu"
    >
      {showAccountMenu ? <X size={24} /> : <Menu size={24} />}
    </button>

    {showAccountMenu && (
      <div className="side-menu">
        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("home");
          }}
        >
          Home
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("scenes");
          }}
        >
          My Scenes
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("posts");
          }}
        >
          My Posts
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("profile");
          }}
        >
          Profile
        </button>

        <div className="menu-divider"></div>

        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("fanverse_user");
            setCurrentUser(null);
            setIsAuthenticated(false);
            setShowAccountMenu(false);
          }}
        >
          Log Out
        </button>
      </div>
    )}
  </div>
 

  <div className="logo">
    FAN<span>VERSE</span>
  </div>

  <div className="studio-label">
    MY POSTS
  </div>
</nav>
<button
  className="back-button"
  onClick={() => setCurrentPage("home")}
>
  ← Back
</button>

      <section className="result-content">
        <div className="badge">
          YOUR PUBLIC SCENES
        </div>

        <h1>
          Your <span>posts.</span>
        </h1>

        <p className="description">
          Scenes you've shared with the FanVerse community.
        </p>

        <div className="scenes-grid">
          {myPosts.length === 0 ? (
            <div className="story-card">
              <div className="story-markdown">
                <h2>No posts yet.</h2>
                <p>
                  Post a scene to your profile and it will appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              {myPosts.map((scene) => (
                <div
                  className="scene-preview-card"
                  key={scene.id}
                  onClick={() => {
                    setGeneratedStory(scene.story);
                    setCurrentSceneId(scene.id);
                    setIsScenePublic(true);
                    navigateTo("result");
                  }}
                >
                  <div className="badge">
                    {scene.universe}
                  </div>

                  <h2>
                    {scene.prompt}
                  </h2>

                  <p className="scene-preview">
                    {scene.story
                      .replace(/[#*_]/g, "")
                      .replace(/\n/g, " ")
                      .slice(0, 140)}
                    {scene.story.length > 140 ? "..." : ""}
                  </p>

                  <div className="scene-open">
                    Read post →
                  </div>
                  <SceneEngagement
  scene={scene}
  currentUser={currentUser}
  sceneLikes={sceneLikes}
  likedScenes={likedScenes}
  sceneComments={sceneComments}
  sceneCommentCounts={sceneCommentCounts}
  openComments={openComments}
  newComment={newComment}
  toggleLike={toggleLike}
  toggleComments={toggleComments}
  setNewComment={setNewComment}
  submitComment={submitComment}
/>
                </div>
              ))}
            </>
          )}
        </div>

        <button
          className="generate-button"
          onClick={() => setCurrentPage("create")}
        >
          <Sparkles size={18} />
          Create New Scene
        </button>
      </section>
    </main>
  );
}
if (currentPage === "search") {
  return (
    <main className="result-page">
      <nav className="studio-nav">
        <div className="menu-wrapper">
          <button
            className="menu-button"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            aria-label="Open menu"
          >
            {showAccountMenu ? <X size={24} /> : <Menu size={24} />}
          </button>

          {showAccountMenu && (
            <div className="side-menu">
              <button
                onClick={() => {
                  setShowAccountMenu(false);
                  setCurrentPage("home");
                }}
              >
                Home
              </button>

              <button
                onClick={() => {
                  setShowAccountMenu(false);
                  setCurrentPage("scenes");
                }}
              >
                My Scenes
              </button>

              <button
                onClick={() => {
                  setShowAccountMenu(false);
                  setCurrentPage("posts");
                }}
              >
                My Posts
              </button>

              <button
                onClick={() => {
                  setShowAccountMenu(false);
                  setCurrentPage("profile");
                }}
              >
                Profile
              </button>

              <div className="menu-divider"></div>

              <button
                className="logout-button"
                onClick={() => {
                  localStorage.removeItem("fanverse_user");
                  setCurrentUser(null);
                  setIsAuthenticated(false);
                  setShowAccountMenu(false);
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>


        <div className="logo">
          FAN<span>VERSE</span>
        </div>

        <div className="studio-label">
          SEARCH
        </div>
      </nav>
       <button
  className="back-button"
  onClick={() => setCurrentPage("home")}
>
  ← Back
</button>

      <section className="result-content">
        <div className="badge">
          FIND A FAN
        </div>

        <h1>
          Find <span>creators.</span>
        </h1>

        <p className="description">
          Search for a username to discover their public FanVerse scenes.
        </p>

        <div className="search-box">
          <input
            type="text"
            placeholder="Enter a username..."
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                searchUser();
              }
            }}
          />

          <button
            className="generate-button"
            onClick={searchUser}
          >
            Search
          </button>
        </div>

       {searchedUsers.length > 0 && (
  <div className="search-results">
    <div className="search-results-header">
      <h2>Creators</h2>
      <p>{searchedUsers.length} matching creator{searchedUsers.length === 1 ? "" : "s"}</p>
    </div>

    <div className="creator-list">
      {searchedUsers.map((user) => (
        <button
          key={user.id}
          className="creator-card"
          onClick={async () => {
            try {
              const response = await fetch(
                `http://localhost:3001/api/users/${encodeURIComponent(
                  user.username
                )}`
              );

              const data = await response.json();

              if (!response.ok) {
                alert(data.error || "Could not open profile.");
                return;
              }

              const posts = data.posts || [];

setSearchedUser(data.user);
setSearchedPosts(posts);

for (const post of posts) {
  const sceneId = post.id ?? post["s.id"];
  loadSceneEngagement(sceneId);
}
            } catch (error) {
              console.error("Profile search error:", error);
              alert("Could not connect to the server.");
            }
          }}
        >
          <div className="creator-avatar">
            {(user.name || user.username).charAt(0).toUpperCase()}
          </div>

          <div className="creator-info">
            <strong>{user.name || user.username}</strong>
            <span>@{user.username}</span>
            <small>
              {user.public_scene_count} public scene
              {Number(user.public_scene_count) === 1 ? "" : "s"}
            </small>
          </div>
        </button>
      ))}
    </div>
  </div>
)}

{searchedUser && (
  <div className="search-results">
    <div className="profile-header">
      <div className="profile-avatar">
        {(searchedUser.name || searchedUser.username)
          .charAt(0)
          .toUpperCase()}
      </div>

      <div>
        <h1>{searchedUser.name || searchedUser.username}</h1>
        <p>@{searchedUser.username}</p>
      </div>
    </div>

   {selectedSearchedPost ? (
  <div className="story-card">
    <div className="badge">
      {selectedSearchedPost.universe}
    </div>

    <h2>{selectedSearchedPost.prompt}</h2>

    <div className="story-markdown">
      <ReactMarkdown>
        {selectedSearchedPost.story || ""}
      </ReactMarkdown>
    </div>

    <button
      className="back-button"
      onClick={() => setSelectedSearchedPost(null)}
    >
      ← Back to posts
    </button>

    <SceneEngagement
      scene={selectedSearchedPost}
      currentUser={currentUser}
      sceneLikes={sceneLikes}
      likedScenes={likedScenes}
      sceneComments={sceneComments}
      sceneCommentCounts={sceneCommentCounts}
      openComments={openComments}
      newComment={newComment}
      toggleLike={toggleLike}
      toggleComments={toggleComments}
      setNewComment={setNewComment}
      submitComment={submitComment}
    />
  </div>
) : (
  <>
    {searchedPosts.length === 0 ? (
      <div className="story-card">
        <div className="story-markdown">
          <h2>No public scenes yet.</h2>
          <p>This creator hasn't posted any scenes.</p>
        </div>
      </div>
    ) : (
      searchedPosts.map((post) => (
        <div
          key={post.id}
          className="scene-preview-card"
        >
          <div className="badge">
            {post.universe}
          </div>

          <h2>{post.prompt}</h2>

          <p className="scene-preview">
            {post.story
              ? post.story
                  .replace(/[#*_]/g, "")
                  .replace(/\n/g, " ")
                  .slice(0, 180) +
                (post.story.length > 180 ? "..." : "")
              : ""}
          </p>

          <div
            className="scene-open"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSearchedPost(post);
            }}
          >
            Read scene →
          </div>

          <SceneEngagement
            scene={post}
            currentUser={currentUser}
            sceneLikes={sceneLikes}
            likedScenes={likedScenes}
            sceneComments={sceneComments}
            sceneCommentCounts={sceneCommentCounts}
            openComments={openComments}
            newComment={newComment}
            toggleLike={toggleLike}
            toggleComments={toggleComments}
            setNewComment={setNewComment}
            submitComment={submitComment}
          />
        </div>
      ))
    )}
  </>
)}
  </div>
)}
      </section>
    </main>
  );
}
if (currentPage === "profile") {
  return (
    <main className="result-page">
      <nav className="studio-nav">
  <div className="menu-wrapper">
    <button
      className="menu-button"
      onClick={() => setShowAccountMenu(!showAccountMenu)}
      aria-label="Open menu"
    >
      {showAccountMenu ? <X size={24} /> : <Menu size={24} />}
    </button>

    {showAccountMenu && (
      <div className="side-menu">
        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("home");
          }}
        >
          Home
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("scenes");
          }}
        >
          My Scenes
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("posts");
          }}
        >
          My Posts
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("profile");
          }}
        >
          Profile
        </button>

        <div className="menu-divider"></div>

        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("fanverse_user");
            setCurrentUser(null);
            setIsAuthenticated(false);
            setShowAccountMenu(false);
          }}
        >
          Log Out
        </button>
      </div>
    )}
  </div>
 

  <div className="logo">
    FAN<span>VERSE</span>
  </div>

  <div className="studio-label">
    PROFILE
  </div>
</nav>
<button
  className="back-button"
  onClick={() => setCurrentPage("home")}
>
  ← Back
</button>

      <section className="profile-page">
        <div className="profile-header">
          <div className="profile-avatar">
           {currentUser?.name?.charAt(0).toUpperCase()}
          </div>

          <div>
          <h1>{currentUser?.name}</h1>
<p>@{currentUser?.username}</p>
          </div>
        </div>

       <div className="profile-section">
  <h2>Account</h2>

 <div className="profile-field">
  <label>Name</label>

  {editingProfile ? (
    <input
      className="profile-input"
      type="text"
      value={profileName}
      onChange={(e) => setProfileName(e.target.value)}
    />
  ) : (
    <div className="profile-value">
      {currentUser?.name}
    </div>
  )}
</div>

 <div className="profile-field">
  <label>Username</label>

  <div className="profile-value">
    @{currentUser?.username}
  </div>
</div>

  <div className="profile-field">
    <label>Email</label>

    <div className="profile-value">
      {currentUser?.email}
    </div>
  </div>

  {editingProfile ? (
    <div className="profile-actions">
      <button
        className="save-profile-button"
        onClick={async () => {
         if (!profileName.trim()) {
  alert("Name is required.");
  return;
}

          try {
            const response = await fetch(
              "http://localhost:3001/api/profile",
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
  userId: currentUser.id,
  name: profileName.trim(),
}),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              alert(data.error || "Failed to update profile.");
              return;
            }

            const updatedUser = {
              ...currentUser,
              name: profileName.trim(),
             
            };

            setCurrentUser(updatedUser);

            localStorage.setItem(
              "fanverse_user",
              JSON.stringify(updatedUser)
            );

            setEditingProfile(false);
          } catch (error) {
            console.error("Profile update error:", error);
            alert("Could not connect to the server.");
          }
        }}
      >
        Save
      </button>

      <button
        className="cancel-profile-button"
        onClick={() => setEditingProfile(false)}
      >
        Cancel
      </button>
    </div>
  ) : (
    <button
      className="edit-profile-button"
      onClick={() => {
        setProfileName(currentUser?.name || "");
        setEditingProfile(true);
      }}
    >
      Edit Profile
    </button>
  )}
</div>
      </section>
    </main>
  );
}
if (!isAuthenticated) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="logo">
          FAN<span>VERSE</span>
        </div>

        <div className="badge">
          {authMode === "login" ? "WELCOME BACK" : "JOIN FANVERSE"}
        </div>

        <h1>
          {authMode === "login"
            ? "Welcome back."
            : "Create your account."}
        </h1>

        <p>
          {authMode === "login"
            ? "Continue creating stories from the worlds you love."
            : "Save your scenes and keep your stories going."}
        </p>

     {authMode === "signup" && (
  <>
    <input
      type="text"
      placeholder="Name"
      value={authName}
      onChange={(e) => setAuthName(e.target.value)}
    />

    <input
      type="text"
      placeholder="Username"
      value={authUsername}
      onChange={(e) =>
        setAuthUsername(e.target.value.toLowerCase())
      }
    />

    <p className="username-hint">
      3–20 characters · letters, numbers and underscores only
    </p>
  </>
)}

<input
  type="email"
  placeholder="Email"
  value={authEmail}
  onChange={(e) => setAuthEmail(e.target.value)}
/>

<input
  type="password"
  placeholder="Password"
  value={authPassword}
  onChange={(e) => setAuthPassword(e.target.value)}
/>

  

       <button
  className="generate-button"
  onClick={handleAuth}
>
  {authMode === "login" ? "Log In" : "Create Account"}
</button>

        <button
          className="auth-switch"
          onClick={() =>
            setAuthMode(
              authMode === "login" ? "signup" : "login"
            )
          }
        >
          {authMode === "login"
            ? "Don't have an account? Sign up"
            : "Already have an account? Log in"}
        </button>
      </div>
    </main>
  );
}
  if (currentPage === "result") {
  return (
    <main className="result-page">
     <nav className="studio-nav">
  <div className="menu-wrapper">
    <button
      className="menu-button"
      onClick={() => setShowAccountMenu(!showAccountMenu)}
      aria-label="Open menu"
    >
      {showAccountMenu ? <X size={24} /> : <Menu size={24} />}
    </button>

    {showAccountMenu && (
      <div className="side-menu">
        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("home");
          }}
        >
          Home
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("scenes");
          }}
        >
          My Scenes
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("posts");
          }}
        >
          My Posts
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("profile");
          }}
        >
          Profile
        </button>

        <div className="menu-divider"></div>

        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("fanverse_user");
            setCurrentUser(null);
            setIsAuthenticated(false);
            setShowAccountMenu(false);
          }}
        >
          Log Out
        </button>
      </div>
    )}
  </div>
  

  <div className="logo">
    FAN<span>VERSE</span>
  </div>

  <div className="studio-label">
    YOUR SCENE
  </div>
</nav>
<button
  className="back-button"
  onClick={() => setCurrentPage(previousPage)}
>
  ← Back
</button>
      <section className="result-content">
        <div className="badge">
          YOUR STORY CONTINUES
        </div>

        <h1>
          Your FanVerse <span>scene.</span>
        </h1>

        <div className="story-card">
          <div className="story-markdown">
            <ReactMarkdown>
              {generatedStory}
            </ReactMarkdown>
          </div>
        </div>

       <div className="result-actions">
  {previousPage === "scenes" && (
    <button
      className="generate-button"
            onClick={async () => {
              if (!currentSceneId || !currentUser?.id) return;

              try {
                const response = await fetch(
                  `http://localhost:3001/api/scenes/${currentSceneId}/public`,
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      userId: currentUser.id,
                      isPublic: !isScenePublic,
                    }),
                  }
                );

                const data = await response.json();

                if (!response.ok) {
                  alert(data.error || "Failed to update scene.");
                  return;
                }

                setIsScenePublic(!isScenePublic);
              } catch (error) {
                console.error("Public scene update error:", error);
                alert("Could not connect to the server.");
              }
            }}
          >
            {isScenePublic ? "Posted to Profile" : "Post to Profile"}
          </button>
            )}

          <button
            className="generate-button"
           onClick={() => navigateTo("create")}
          >
            <Sparkles size={18} />
            Create Another Scene
          </button>
        </div>
      </section>
    </main>
  );
}

  if (currentPage === "create") {
    return (
      <main className="studio">

        <nav className="studio-nav">
  <div className="menu-wrapper">
    <button
      className="menu-button"
      onClick={() => setShowAccountMenu(!showAccountMenu)}
      aria-label="Open menu"
    >
      {showAccountMenu ? <X size={24} /> : <Menu size={24} />}
    </button>

    {showAccountMenu && (
      <div className="side-menu">
        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("home");
          }}
        >
          Home
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("scenes");
          }}
        >
          My Scenes
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("posts");
          }}
        >
          My Posts
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("profile");
          }}
        >
          Profile
        </button>

        <div className="menu-divider"></div>

        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("fanverse_user");
            setCurrentUser(null);
            setIsAuthenticated(false);
            setShowAccountMenu(false);
          }}
        >
          Log Out
        </button>
      </div>
    )}
  </div>
  

  <div className="logo">
    FAN<span>VERSE</span>
  </div>

  <div className="studio-label">
    CREATE YOUR SCENE
  </div>
</nav>
 <button
  className="back-button"
  onClick={() => setCurrentPage("home")}
>
  ← Back
</button>

        <section className="studio-content">

          <div className="studio-heading">

            <div className="badge">
              CREATE A NEW MOMENT
            </div>

            <h1>
              Where should the
              <span> story go next?</span>
            </h1>

            <p>
              Pick a universe, imagine the moment,
              and let FanVerse bring your scene to life.
            </p>

          </div>

          <div className="creation-grid">

            <div className="creation-card">

              <div className="card-step">
                01
              </div>

              <h2>
                Choose a universe
              </h2>

              <p>
                Select a participating universe
                to continue exploring its story.
              </p>

              <select
                className="universe-select"
                value={selectedUniverse}
                onChange={(e) =>
                  setSelectedUniverse(e.target.value)
                }
              >

                <option value="">
                  Choose a universe
                </option>

                <option value="Afterlight">
                  Afterlight
                </option>

                <option value="The Hollow House">
                  The Hollow House
                </option>

                <option value="Kingdom of Ash">
                  Kingdom of Ash
                </option>

              </select>

            </div>

            <div className="creation-card">

              <div className="card-step">
                02
              </div>

              <h2>
                What happens next?
              </h2>

              <p>
                Describe the scene you want to see.
              </p>

              <textarea
                value={scenePrompt}
                onChange={(e) =>
                  setScenePrompt(e.target.value)
                }
                placeholder="Example: After the final scene, the two characters meet again at the empty train station..."
              />

            </div>

          </div>

          <div className="generate-section">

            <button
              className="generate-button"
              onClick={handleGenerate}
              disabled={isGenerating}
            >

              <Sparkles size={18} />

              {isGenerating
                ? "Creating your scene..."
                : "Generate My Scene"}

            </button>

            <p>
              Your scene will be created in
              FanVerse's comic-style format.
            </p>

          </div>

        </section>

      </main>
    );
  }
  if (currentPage === "discover") {
  return (
    <div className="app">
      <nav className="studio-nav">
  <div className="menu-wrapper">
    <button
      className="menu-button"
      onClick={() => setShowAccountMenu(!showAccountMenu)}
      aria-label="Open menu"
    >
      {showAccountMenu ? <X size={24} /> : <Menu size={24} />}
    </button>

    {showAccountMenu && (
      <div className="side-menu">
        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("home");
          }}
        >
          Home
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("scenes");
          }}
        >
          My Scenes
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("posts");
          }}
        >
          My Posts
        </button>

        <button
          onClick={() => {
            setShowAccountMenu(false);
            setCurrentPage("profile");
          }}
        >
          Profile
        </button>

        <div className="menu-divider"></div>

        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("fanverse_user");
            setCurrentUser(null);
            setIsAuthenticated(false);
            setShowAccountMenu(false);
          }}
        >
          Log Out
        </button>
      </div>
    )}
  </div>

  <div className="logo">
    FAN<span>VERSE</span>
  </div>

  <div className="studio-label">
    DISCOVER
  </div>
</nav>
<button
  className="back-button"
  onClick={() => setCurrentPage("home")}
>
  ← Back
</button>

      <main className="feed-page">
        <div className="feed-header">
          <div>
            <div className="badge">DISCOVER</div>
            <h1>Discover new scenes.</h1>
            <p className="description">
              Explore the latest scenes created by the FanVerse community.
            </p>
          </div>

          <form
            className="feed-search"
            onSubmit={(event) => {
              event.preventDefault();
              setDiscoverSearch(event.currentTarget.elements.search.value);
            }}
          >
            <Search size={17} />
            <input
              name="search"
              type="text"
              placeholder="Search movies or scenes..."
              defaultValue={discoverSearch}
            />
            <button type="submit">Search</button>
          </form>
        </div>

        <div className="feed-grid">
          {discoverScenes.length === 0 ? (
            <div className="empty-feed">
              <h3>No scenes found.</h3>
              <p>Try a different movie or scene search.</p>
            </div>
          ) : (
            discoverScenes.map((scene) => (
              <div
                className="feed-scene-card"
                key={scene.id}
                onClick={() => {
                  setGeneratedStory(scene.story);
                  setCurrentSceneId(scene.id);
                  setIsScenePublic(Boolean(scene.is_public));
                  setSelectedUniverse(scene.universe);
                  setScenePrompt(scene.prompt);
                  navigateTo("result");
                }}
              >
                <div className="feed-scene-meta">
                  <span>{scene.universe}</span>
                  <span>
                    by {scene.name || scene.username}
                  </span>
                </div>

                <h2>{scene.prompt}</h2>

                <div className="feed-scene-story">
                  <ReactMarkdown>
                    {scene.story}
                  </ReactMarkdown>
                </div>

                <SceneEngagement
                  scene={scene}
                  currentUser={currentUser}
                  sceneLikes={sceneLikes}
                  likedScenes={likedScenes}
                  sceneComments={sceneComments}
                  sceneCommentCounts={sceneCommentCounts}
                  openComments={openComments}
                  newComment={newComment}
                  toggleLike={toggleLike}
                  toggleComments={toggleComments}
                  setNewComment={setNewComment}
                  submitComment={submitComment}
                />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

  if (currentPage === "trending") {
    return (
      <div className="app">
        <nav className="studio-nav">
          <div className="menu-wrapper">
            <button
              className="menu-button"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              aria-label="Open menu"
            >
              {showAccountMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
           

            {showAccountMenu && (
              <div className="side-menu">
                <button onClick={() => {
                  setShowAccountMenu(false);
                  setCurrentPage("home");
                }}>
                  Home
                </button>

                <button onClick={() => {
                  setShowAccountMenu(false);
                  setCurrentPage("scenes");
                }}>
                  My Scenes
                </button>

                <button onClick={() => {
                  setShowAccountMenu(false);
                  setCurrentPage("posts");
                }}>
                  My Posts
                </button>

                <button onClick={() => {
                  setShowAccountMenu(false);
                  setCurrentPage("profile");
                }}>
                  Profile
                </button>

                <div className="menu-divider"></div>

                <button
                  className="logout-button"
                  onClick={() => {
                    localStorage.removeItem("fanverse_user");
                    setCurrentUser(null);
                    setIsAuthenticated(false);
                    setShowAccountMenu(false);
                  }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
         

          <div className="logo">
            FAN<span>VERSE</span>
          </div>

          <div className="studio-label">
            TRENDING
          </div>
        </nav>
         <button
  className="back-button"
  onClick={() => setCurrentPage("home")}
>
  ← Back
</button>

        <main className="feed-page">
          <div className="feed-header">
            <div>
              <div className="badge">TRENDING</div>
              <h1>What's trending.</h1>
              <p className="description">
                Discover the scenes getting the most attention from the FanVerse community.
              </p>
            </div>

            <form
              className="feed-search"
              onSubmit={(event) => {
                event.preventDefault();
                setTrendingSearch(
                  event.currentTarget.elements.search.value
                );
              }}
            >
              <Search size={17} />

              <input
                name="search"
                type="text"
                placeholder="Search movies or scenes..."
                defaultValue={trendingSearch}
              />

              <button type="submit">Search</button>
            </form>
          </div>

          <div className="feed-grid">
            {trendingScenes.length === 0 ? (
              <div className="empty-feed">
                <h3>No scenes found.</h3>
                <p>Try a different movie or scene search.</p>
              </div>
            ) : (
              trendingScenes.map((scene) => {
                const sceneId = scene.id ?? scene["s.id"];

                return (
                  <div
                    className="feed-scene-card"
                    key={sceneId}
                    onClick={() => {
                      setGeneratedStory(scene.story);
                      setCurrentSceneId(sceneId);
                      setIsScenePublic(Boolean(scene.is_public));
                      setSelectedUniverse(scene.universe);
                      setScenePrompt(scene.prompt);
                      navigateTo("result");
                    }}
                  >
                    <div className="feed-scene-meta">
                      <span>{scene.universe}</span>

                      <span>
                        by {scene.name || scene.username}
                      </span>
                    </div>

                    <h2>{scene.prompt}</h2>

                    <div className="feed-scene-story">
                      <ReactMarkdown>
                        {scene.story}
                      </ReactMarkdown>
                    </div>

                    <SceneEngagement
                      scene={scene}
                      currentUser={currentUser}
                      sceneLikes={sceneLikes}
                      likedScenes={likedScenes}
                      sceneComments={sceneComments}
                      sceneCommentCounts={sceneCommentCounts}
                      openComments={openComments}
                      newComment={newComment}
                      toggleLike={toggleLike}
                      toggleComments={toggleComments}
                      setNewComment={setNewComment}
                      submitComment={submitComment}
                    />
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <main className="hero">

      <div className="background-glow"></div>

      <nav className="navbar">

  <div className="navbar-left">

    <div className="menu-wrapper">
      <button
        className="menu-button"
        onClick={() => setShowAccountMenu(!showAccountMenu)}
        aria-label="Open menu"
      >
        {showAccountMenu ? <X size={24} /> : <Menu size={24} />}
      </button>

      {showAccountMenu && (
        <div className="side-menu">

          <button
  onClick={() => {
    console.log("MY SCENES CLICKED");
    setShowAccountMenu(false);
    setCurrentPage("scenes");
  }}
>
  My Scenes
</button>

<button
  onClick={() => {
    setShowAccountMenu(false);
    setCurrentPage("posts");
  }}
>
  My Posts
</button>

      <button
  onClick={() => {
    console.log("PROFILE CLICKED");
    setShowAccountMenu(false);
    setCurrentPage("profile");
  }}
>
  Profile
</button>

          <div className="menu-divider"></div>

        <button
  className="logout-button"
  onClick={() => {
    localStorage.removeItem("fanverse_user");
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowAccountMenu(false);
  }}
>
  Log Out
</button>

        </div>
      )}
    </div>

    <div className="logo">
      FAN<span>VERSE</span>
    </div>

  </div>

  <div className="nav-links">
  <button onClick={() => setCurrentPage("discover")}>
    Discover
  </button>

  <button onClick={() => navigateTo("trending")}>
    Trending
  </button>

  <button onClick={() => setCurrentPage("search")}>
    Search
  </button>
</div>

</nav>

      <section className="hero-content">

        <div className="badge">
          AI-POWERED FAN STORIES
        </div>

        <h1>
          Stay in the <span>story.</span>
        </h1>

        <div className="animated-text">

          <p key={lineIndex}>
            {lines[lineIndex]}
          </p>

        </div>

        <p className="description">
          Create your own comic-style scenes from
          the worlds you love. Share them with fans,
          react to new stories, and see where the
          universe goes next.
        </p>

        <button
          className="create-button"
          onClick={() => setCurrentPage("create")}
        >

          <span className="play-circle">
            <Play
              size={16}
              fill="currentColor"
            />
          </span>

          <span>
            Create Your Scene
          </span>

        </button>

      </section>

      <div className="bottom-text">
        YOUR FANDOM. YOUR STORY. YOUR VERSE.
      </div>

    </main>
  );
}

export default App;