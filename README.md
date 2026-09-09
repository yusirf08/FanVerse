# FanVerse

FanVerse is an AI-powered cinematic fan-fiction platform that turns a fan's idea into a short comic-style scene.

Instead of only generating text, FanVerse creates a structured cinematic scene with a title, story continuation, visual panel descriptions, and dialogue. Fans can then discover, like, comment on, and share scenes created by the community.

## What makes FanVerse different?

FanVerse combines AI-assisted creation with community discovery.

A fan can enter an idea such as:

> "What if Spider-Man had to protect New York during a city-wide blackout?"

FanVerse turns that idea into a cinematic scene with:

- A title
- A short story continuation
- Three comic panel descriptions
- Character dialogue

The platform also learns from existing FanVerse scenes. Before generating a new scene, the system checks ClickHouse for related scenes in the same universe. Highly similar prompts can reuse an existing result instead of unnecessarily generating another one.

This creates a foundation for a more efficient AI-powered fan-fiction community.

## Features

### AI Scene Generation

Users provide a fictional universe and a creative idea. The FanVerse Story Agent generates a structured cinematic scene.

### Cinematic Comic Structure

Every generated scene is divided into:

- Title
- Scene
- Panel 1
- Panel 2
- Panel 3
- Dialogue

This makes the output feel closer to a comic storyboard than a conventional text-generation experience.

### Intelligent Scene Reuse

FanVerse uses ClickHouse to search previously generated scenes within the selected universe.

When an incoming idea is sufficiently similar to an existing scene, FanVerse can return the existing result instead of generating duplicate content.

### Community Discovery

Public scenes can be discovered through the platform's social feed and trending content.

### Likes and Comments

Users can interact with public scenes through likes and comments.

### Creator Profiles

Users can view creators and their public posts.

### Private Scene Creation

Scenes created in My Scenes remain private unless the creator chooses to post them publicly.

## AI Architecture

FanVerse uses a Google-powered agent architecture.

The core creative experience is built around a FanVerse Story Agent powered by Gemini through Google's agent tooling.

The project also integrates ClickHouse through the official `mcp-clickhouse` MCP server, allowing the AI workflow to interact with application data through the Model Context Protocol.

High-level flow:

User Idea
    ↓
FanVerse Story Agent
    ↓
Gemini
    ↓
ClickHouse / MCP
    ↓
Scene Generation or Existing Scene
    ↓
FanVerse UI
    ↓
Community Discovery

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express

### AI

- Google Gemini
- Google Agent Development Kit (ADK)
- Google Cloud Agent Runtime / Agent Builder architecture

### Data

- ClickHouse
- ClickHouse Cloud / ClickHouse database
- Official `mcp-clickhouse` MCP server

### Deployment

- Netlify for the frontend
- Google Cloud for the AI agent runtime
- A publicly accessible backend/data environment for production use

## ClickHouse Integration

ClickHouse is used as the application's analytical and retrieval data layer.

FanVerse stores and queries information such as:

- Generated scenes
- Scene metadata
- Likes
- Comments
- Public creator content

The application also uses ClickHouse through the official `mcp-clickhouse` server so that the AI workflow can interact with ClickHouse at runtime.

This integration is particularly useful for FanVerse because the application is naturally data-heavy: scenes, engagement, discovery, and similarity checks can all benefit from fast analytical queries.

## Scene Generation Flow

1. The user selects a fictional universe.
2. The user describes the scene they want.
3. FanVerse checks ClickHouse for related scenes from that universe.
4. If a sufficiently similar scene already exists, the existing result can be reused.
5. Otherwise, the FanVerse Story Agent sends the creative request to Gemini.
6. Gemini produces the structured cinematic scene.
7. The generated scene is stored in ClickHouse.
8. The user can view the result and create another scene.
9. A scene can later be posted publicly for other fans to discover and interact with.

## Community Flow

Public scenes can appear in the discovery experience.

Users can:

- Browse scenes
- Open creator profiles
- Like scenes
- Comment on scenes
- View their own public posts
- Keep newly created scenes private until they choose to publish them

This separates the creation experience from the social discovery experience.

## Project Structure

```text
FanVerse/
├── agent/
│   ├── __init__.py
│   └── agent.py
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── server/
│   └── server.js
│
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
