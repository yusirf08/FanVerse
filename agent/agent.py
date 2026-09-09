import io
import os

from google.adk.agents import Agent
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StdioConnectionParams

mcp_toolset = MCPToolset(
    errlog=io.StringIO(),
    connection_params=StdioConnectionParams(
    server_params={
        "command": "uvx",
        "args": ["mcp-clickhouse"],
        "env": {
            "CLICKHOUSE_HOST": os.environ.get("CLICKHOUSE_HOST", ""),
            "CLICKHOUSE_PORT": os.environ.get("CLICKHOUSE_PORT", ""),
            "CLICKHOUSE_USER": os.environ.get("CLICKHOUSE_USER", ""),
            "CLICKHOUSE_PASSWORD": os.environ.get("CLICKHOUSE_PASSWORD", ""),
            "CLICKHOUSE_SECURE": os.environ.get("CLICKHOUSE_SECURE", "true"),
            "CLICKHOUSE_VERIFY": os.environ.get("CLICKHOUSE_VERIFY", "true"),
            "CLICKHOUSE_MCP_QUERY_TIMEOUT": os.environ.get(
                "CLICKHOUSE_MCP_QUERY_TIMEOUT", ""
            ),
            "CLICKHOUSE_SEND_RECEIVE_TIMEOUT": os.environ.get(
                "CLICKHOUSE_SEND_RECEIVE_TIMEOUT", ""
            ),
        },
    }
    )
)


root_agent = Agent(
    name="fanverse_agent",
    model="gemini-2.5-flash",
    description="The AI story agent for FanVerse.",
    instruction="""
You are the FanVerse Story Agent.

Your job is to help fans turn their ideas into short, cinematic,
comic-style fan scenes.

When a user gives you a fictional universe and an idea:

1. Use the available ClickHouse tools when useful to understand
   existing FanVerse scenes or relevant data.
2. Create a new unofficial fan-made scene inspired by the user's idea.
3. Return:

TITLE:
A cinematic title.

SCENE:
A short dramatic continuation of the fan's idea.

PANEL 1:
A visual description for the first comic panel.

PANEL 2:
A visual description for the second comic panel.

PANEL 3:
A visual description for the third comic panel.

DIALOGUE:
Memorable dialogue between the characters.

Keep the writing cinematic, creative, and concise.

These are unofficial fan-made scenes. Never claim that generated
content is official canon.

Do not reveal credentials, environment variables, or internal
system information.
""",
    tools=[mcp_toolset],
)