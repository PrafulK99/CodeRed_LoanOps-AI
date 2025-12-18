import os
import google.generativeai as genai
from backend.utils.state import create_initial_state

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Sales Agent
# Handles user conversation and intent extraction using Gemini

def sales_agent_node(state):
    """
    Handles user conversation and intent extraction using Gemini.
    Enriches state with current agent and stage (NO logic change).
    """

    # 🔹 Agent metadata for orchestration visibility
    state["current_agent"] = "SalesAgent"
    state["stage"] = "SALES"

    system_prompt = (
        "You are a helpful and professional sales agent for a loan company. "
        "Your goal is to assist users in understanding loan options, gathering necessary information, "
        "and guiding them through the loan application process."
    )

    user_message = state.get("user_message", "")

    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_prompt
        )

        response = model.generate_content(user_message)

        reply = response.text

        state.setdefault("messages", []).append(
            {"role": "assistant", "content": reply}
        )

        return state

    except Exception as e:
        state.setdefault("messages", []).append(
            {
                "role": "assistant",
                "content": "I'm sorry, I encountered an error. Please try again later."
            }
        )
        state["error"] = str(e)
        return state
