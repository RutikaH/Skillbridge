from openai import OpenAI
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

openai_client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


class ModelRouter:

    @staticmethod
    def generate(messages):

        # PRIMARY MODEL
        try:

            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.7
            )

            return {
                "content": response.choices[0].message.content,
                "provider": "GPT-4o"
            }

        # FALLBACK MODEL
        except Exception as e:

            print(f"GPT-4o failed: {e}")
            print("Switching to Groq fallback")

            response = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
            )

            return {
                "content": response.choices[0].message.content,
                "provider": "Groq Fallback Active"
            }