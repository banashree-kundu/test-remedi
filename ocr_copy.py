import google.generativeai as genai
import PIL.Image
import json
import re
import time
from PIL import Image
import requests
from io import BytesIO

# 1. Set your API key here
API_KEY = "AIzaSyAUYtuHR00wdA6bbuJOIcwYxj2LyJFh2Cw"   # <- change this

# 2. Configure the Gemini client
genai.configure(api_key=API_KEY)

def load_image_from_url(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Check for errors (like 404)
        return BytesIO(response.content)
    except Exception as e:
        print(f"Error loading image: {e}")
        return None
# 3. Create the two models (primary + backup)
primary_model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config={"response_mime_type": "application/json"}
)

backup_model = genai.GenerativeModel(
    model_name="gemini-2.5-flash-lite",
    generation_config={"response_mime_type": "application/json"}
)

# 4. Common prompt for both models
PROMPT = """
You are an expert clinical pharmacist. 
Analyze this prescription image and extract the medicine details.

Strict Rules:
1. Identify the Medicine Name. Correct spelling errors based on common drug names (e.g. 'Pcm' -> 'Paracetamol', 'Aug' -> 'Augmentin').
2. Identify Dosage (e.g. 500mg) and Frequency (e.g. 1-0-1, BD, SOS).
3. Return a JSON list of objects.

JSON Structure:
[
  {"name": "Medicine Name", "dosage": "500mg", "frequency": "BD", "confidence": "high"},
  ...
]
"""


def parse_json(raw_text):
    """
    Try to convert model output into Python using json.loads.
    Sometimes the model wraps JSON in ```json ... ``` blocks,
    so we remove those first.
    """
    try:
        clean_text = raw_text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
    except json.JSONDecodeError:
        print("Error: Model returned invalid JSON.")
        return []


def extract_medicines(image_path):
    """
    Main function.
    - Loads the image
    - Sends it to primary model
    - If primary fails, uses backup model
    - Returns list of medicines (or [] if everything fails)
    """
    print(f"Reading: {image_path}")

    # Load image
    try:
        img = PIL.Image.open(image_path)
    except Exception as e:
        return {"error": f"Image load failed: {str(e)}"}

    # --- Try PRIMARY model first ---
    try:
        print("Using primary model (gemini-2.5-flash)...")
        response = primary_model.generate_content([PROMPT, img])
        return parse_json(response.text)

    except Exception as e:
        print(f"Primary model failed: {e}")
        print("Trying backup model...")

        # --- Try BACKUP model ---
        try:
            time.sleep(1)  # small delay
            response = backup_model.generate_content([PROMPT, img])
            return parse_json(response.text)
        except Exception as e2:
            print(f"Backup model also failed: {e2}")
            return []

# --- HOW TO USE IN YOUR WEBAPP ---

if __name__ == "__main__":

    # Call whenever needed
    result = extract_medicines(load_image_from_url("https://ik.imagekit.io/RemediRX/prescription_ClmazNk4t.jpg"))
    print("\n--- FINAL RESULT ---")
    print(json.dumps(result, indent=4))