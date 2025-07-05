from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import os
from dotenv import load_dotenv
from openai import OpenAI

# --- Load .env ---
load_dotenv(override=True)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Groq/OpenAI client
client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Load & prepare data
products = pd.read_json("data/products.json")
vectorizer = TfidfVectorizer()
product_matrix = vectorizer.fit_transform(products['name'])
sentiment_analyzer = SentimentIntensityAnalyzer()

class ReviewRequest(BaseModel):
    review: str

class ChatRequest(BaseModel):
    query: str

@app.get("/")
def home():
    return {"status": "Groq-powered AI service running"}

@app.get("/recommendations")
def get_recommendations(product_id: int):
    try:
        product_name = products[products['id'] == str(product_id)]['name'].values[0]
    except:
        return {"error": "Product ID not found"}

    vec = vectorizer.transform([product_name])
    sims = cosine_similarity(vec, product_matrix).flatten()
    indices = sims.argsort()[::-1][1:4]

    results = products.iloc[indices][['id', 'name']].to_dict(orient="records")
    return {"recommended_products": results}


@app.post("/analyze-review")
def analyze_review(payload: ReviewRequest):
    scores = sentiment_analyzer.polarity_scores(payload.review)
    sentiment = ("positive" if scores["compound"]>0.3 else
                  "negative" if scores["compound"]<-0.3 else "neutral")
    return {"sentiment": sentiment, "scores": scores}

@app.post("/chatbot")
def chatbot(payload: ChatRequest):
    try:
        res = client.chat.completions.create(
            model="mistral-saba-24b",  # ← Updated model
            messages=[{"role":"user","content": payload.query}]
        )
        return {"response": res.choices[0].message.content}
    except Exception as e:
        return {"error": f"Groq API error: {str(e)}"}

@app.get("/debug-groq")
def debug_groq():
    try:
        models = client.models.list()
        return {"available_models": [m.id for m in models.data]}
    except Exception as e:
        return {"error": str(e)}
