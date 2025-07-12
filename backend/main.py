from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
from openai import OpenAI
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from deep_translator import GoogleTranslator
from sentence_transformers import SentenceTransformer, util
import pdfkit
import uuid
import shutil

from PIL import Image


# --- Load environment variables ---
load_dotenv(override=True)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# --- Initialize clients ---
client = OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
sentiment_analyzer = SentimentIntensityAnalyzer()
translator = GoogleTranslator()
clip_model = SentenceTransformer('clip-ViT-B-32')  # CLIP for image similarity

# --- App setup ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- Load product data ---
try:
    products = pd.read_json('data/products.json')
    products['id'] = products['id'].astype(str).str.strip()
    
    vectorizer = TfidfVectorizer()
    product_matrix = vectorizer.fit_transform(products['name'])
    text_embeddings = clip_model.encode(products['name'].tolist(), convert_to_tensor=True)
except Exception as e:
    raise Exception(f"Data loading error: {str(e)}")

# --- Request models ---
class ReviewRequest(BaseModel):
    review: str

class ChatRequest(BaseModel):
    query: str

class TranslateRequest(BaseModel):
    reviewText: str
    langCode: str

class FakeReviewRequest(BaseModel):
    reviewText: str

class CartSummaryRequest(BaseModel):
    cartItems: List[str]

class ReceiptRequest(BaseModel):
    orderDetails: dict

# --- Routes ---
@app.get("/")
def home():
    return {"status": "AI Backend running via FastAPI + Groq"}

@app.get("/recommendations")
def get_recommendations(product_id: str):
    try:
        product_name = products[products['id'] == product_id]['name'].values[0]
    except IndexError:
        return {"error": "Product ID not found"}

    vec = vectorizer.transform([product_name])
    sims = cosine_similarity(vec, product_matrix).flatten()
    indices = sims.argsort()[::-1][1:4]

    results = products.iloc[indices][['id', 'name']].to_dict(orient="records")
    return {"recommended_products": results}

@app.post("/analyze-review")
def analyze_review(payload: ReviewRequest):
    scores = sentiment_analyzer.polarity_scores(payload.review)
    sentiment = ("positive" if scores["compound"] > 0.3 else
                 "negative" if scores["compound"] < -0.3 else "neutral")
    return {"sentiment": sentiment, "scores": scores}

import markdown

@app.post("/chatbot")
def chatbot(payload: ChatRequest):
    try:
        res = client.chat.completions.create(
            model="mistral-saba-24b",
            messages=[{"role": "user", "content": payload.query}]
        )
        raw_response = res.choices[0].message.content

        # Convert markdown + newlines to HTML
        html_response = markdown.markdown(raw_response)

        return {
            "response_raw": raw_response,
            "response_html": html_response
        }
    except Exception as e:
        return {"error": f"Groq API error: {str(e)}"}


@app.post("/reviews/translate")
def translate_review(payload: TranslateRequest):
    try:
        translated = GoogleTranslator(source=payload.langCode, target='en').translate(payload.reviewText)
        return {"translated": translated}
    except Exception as e:
        return {"error": str(e)}

@app.post("/reviews/sentiment")
def review_sentiment(payload: ReviewRequest):
    scores = sentiment_analyzer.polarity_scores(payload.review)
    sentiment = "positive" if scores['compound'] > 0.3 else "negative" if scores['compound'] < -0.3 else "neutral"
    return {"sentiment": sentiment, "score": scores['compound']}

@app.post("/reviews/check")
def fake_review_check(payload: FakeReviewRequest):
    confidence = np.random.uniform(70, 99)  # Dummy, replace with model output
    is_fake = "fake" if confidence > 85 else "genuine"
    return {"isFake": is_fake == "fake", "confidence": round(confidence, 2)}

@app.post("/cart/summary")
def cart_summary(payload: CartSummaryRequest):
    prompt = f"Generate a short promotional sales pitch for the following products: {', '.join(payload.cartItems)}"
    try:
        res = client.chat.completions.create(
            model="mistral-saba-24b",
            messages=[{"role": "user", "content": prompt}]
        )
        return {"summaryText": res.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}

@app.post("/receipt")
def generate_receipt(data: ReceiptRequest):
    receipt_id = str(uuid.uuid4())[:8]
    file_path = f"receipts/{receipt_id}.pdf"
    os.makedirs("receipts", exist_ok=True)

    html_content = f"<h1>Receipt ID: {receipt_id}</h1><ul>"
    for k, v in data.orderDetails.items():
        html_content += f"<li><strong>{k}</strong>: {v}</li>"
    html_content += "</ul>"

    pdfkit.from_string(html_content, file_path)
    return {"downloadLink": f"/static/receipts/{receipt_id}.pdf"}

@app.post("/visual-search")
async def visual_search(file: UploadFile = File(...)):
    # Save uploaded file
    file_path = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Load image and convert to RGB
    from PIL import Image
    img = Image.open(file_path).convert("RGB")

    # Encode uploaded image using CLIP (image → embedding)
    img_embedding = clip_model.encode([img], convert_to_tensor=True)

    # Compute similarity to product name embeddings (already computed)
    similarities = util.pytorch_cos_sim(img_embedding, text_embeddings).squeeze().cpu().numpy()

    # Find best match index
    best_match_index = similarities.argmax()
    matched_product_name = products.iloc[best_match_index]["name"]

    # Match product by exact name
    matched_product = products[products["name"] == matched_product_name].to_dict(orient="records")

    if matched_product:
        return {"match": matched_product[0]}
    else:
        return {"error": "No product match found"}


