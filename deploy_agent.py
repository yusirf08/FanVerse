import vertexai
from vertexai import agent_engines

from agent.agent import root_agent


client = vertexai.Client(
    project="gen-lang-client-0095142361",
    location="us-central1",
)

app = agent_engines.AdkApp(
    agent=root_agent,
)

print("Deploying FanVerse Agent...")

remote_agent = client.agent_engines.create(
    agent=app,
    config={
        "display_name": "FanVerse Story Agent",
    },
)

print("DEPLOYED:")
print(remote_agent)