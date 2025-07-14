from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
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
import json
import markdown
from PIL import Image
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from datetime import datetime

# SerpApi for image fetching (make sure you have it installed: pip install google-search-results)
from serpapi import GoogleSearch # 👈 Added this import

# --- Load environment variables ---
load_dotenv(override=True)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
MONGO_URI = os.getenv("MONGO_URI")

# --- Initialize clients ---
groq_client = OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
sentiment_analyzer = SentimentIntensityAnalyzer()
translator = GoogleTranslator()
clip_model = SentenceTransformer('clip-ViT-B-32')

# MongoDB Client
client = AsyncIOMotorClient(MONGO_URI)
db = client["ecommerce"]
users_collection = db["users"]
products_collection = db["products"] # We'll use this to store products for better management

# --- App setup ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.mount("/images", StaticFiles(directory="images"), name="images")

# Utility for password hashing
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

class AnalyticsEvent(BaseModel):
    eventName: str
    eventData: dict = {} # Optional data related to the event (e.g., productId, quantity, page)
    timestamp: Optional[datetime] = None
    userId: Optional[str] = None # If you track logged-in users
    sessionId: Optional[str] = None # For guest users or session tracking

# --- MongoDB Collection for Analytics ---
# Ensure this is defined near your other collection definitions (users_collection, products_collection)
analytics_collection = db["analytics_events"]

# Pydantic Models for Cart Items and Requests
class CartItem(BaseModel):
    productId: str
    name: str
    price: float
    quantity: int
    image: Optional[str] = None

# In main.py
class AddToCartRequest(BaseModel):
    username: str
    productId: str 
    quantity: int

class UpdateCartItemRequest(BaseModel):
    username: str
    productId: str
    quantity: int

class RemoveFromCartRequest(BaseModel):
    username: str
    productId: str

# --- Load product data (modified to store in MongoDB) ---
async def load_products_to_mongodb():
    if await products_collection.count_documents({}) == 0: # Only load if collection is empty
        try:
            products_df = pd.read_json('data/products.json')
            products_df['id'] = products_df['id'].astype(str).str.strip()

            image_dict = {}
            image_cache_path = 'data/product_images.json'
            if os.path.exists(image_cache_path):
                with open(image_cache_path, "r") as f:
                    image_dict = json.load(f)

            def fetch_serp_image(product_name):
                try:
                    search = GoogleSearch({
                        "q": product_name,
                        "tbm": "isch",
                        "api_key": SERPAPI_KEY
                    })
                    results = search.get_dict()
                    return results["images_results"][0]["original"]
                except Exception:
                    return "https://via.placeholder.com/600"

            def get_or_cache_image(product_name):
                if product_name in image_dict:
                    return image_dict[product_name]
                image_url = fetch_serp_image(product_name)
                image_dict[product_name] = image_url
                return image_url

            products_df["image"] = products_df["name"].apply(get_or_cache_image)

            with open(image_cache_path, "w") as f:
                json.dump(image_dict, f, indent=2)

            # Store products in MongoDB
            products_to_insert = products_df.to_dict(orient="records")
            await products_collection.insert_many(products_to_insert)
            print("Products loaded to MongoDB.")

        except Exception as e:
            raise Exception(f"Product data loading error: {str(e)}")
    else:
        print("Products already exist in MongoDB. Skipping initial load.")

# Run this on startup
@app.on_event("startup")
async def startup_event():
    await load_products_to_mongodb()

# Vectorization (now done on products fetched from MongoDB)
product_data_for_vectorization = []
vectorizer = TfidfVectorizer()
product_matrix = None
text_embeddings = None

@app.post("/api/analytics/track")
async def track_analytics_event(event: AnalyticsEvent):
    try:
        # Add a timestamp if not provided by the frontend (though frontend often provides it)
        if not event.timestamp:
            event.timestamp = datetime.utcnow()

        # Convert Pydantic model to dictionary for MongoDB insertion
        event_data_dict = event.dict()
        await analytics_collection.insert_one(event_data_dict)
        print(f"Analytics event tracked: {event.eventName} for user: {event.userId}") # For backend console visibility
        return {"message": "Analytics event tracked successfully"}
    except Exception as e:
        # Log the error on the backend for debugging
        print(f"ERROR: Failed to track analytics event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to track analytics event: {str(e)}")


@app.on_event("startup")
async def setup_vectorization():
    global product_data_for_vectorization, vectorizer, product_matrix, text_embeddings
    products_from_db = await products_collection.find().to_list(length=None)
    product_data_for_vectorization = products_from_db # Store for later use
    if product_data_for_vectorization:
        product_names = [p['name'] for p in product_data_for_vectorization]
        vectorizer = TfidfVectorizer()
        product_matrix = vectorizer.fit_transform(product_names)
        text_embeddings = clip_model.encode(product_names, convert_to_tensor=True)
    else:
        print("No products found in DB for vectorization.")

# --- Request models (existing) ---
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

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    username: str
    password: str

class LoginIn(BaseModel):
    username: str
    password: str

# --- Routes ---
@app.get("/")
def home():
    return {"status": "AI Backend running via FastAPI + Groq"}

@app.get("/products")
async def get_products():
    # Fetch products directly from MongoDB
    products_list = await products_collection.find().to_list(length=None)
    # Convert ObjectId to string for JSON serialization
    for product in products_list:
        product['_id'] = str(product['_id'])
    return products_list

@app.get("/recommendations")
async def get_recommendations(product_id: str):
    if not product_matrix or not text_embeddings:
        raise HTTPException(status_code=500, detail="Product data not loaded for recommendations.")

    # Find the product by its 'id' field (which comes from the original JSON, not MongoDB's _id)
    try:
        product_doc = await products_collection.find_one({"id": product_id})
        if not product_doc:
            raise HTTPException(status_code=404, detail="Product ID not found")
        product_name = product_doc['name']
    except Exception:
        raise HTTPException(status_code=404, detail="Product ID not found")

    vec = vectorizer.transform([product_name])
    sims = cosine_similarity(vec, product_matrix).flatten()
    indices = sims.argsort()[::-1][1:4] # Get top 3 (excluding itself)

    # Map indices back to original product data for names and images
    results = []
    for idx in indices:
        # Assuming product_data_for_vectorization still holds the original DataFrame structure or similar
        # A more robust way would be to fetch by a unique identifier if possible
        matched_product = product_data_for_vectorization[idx]
        results.append({
            "id": matched_product.get('id', str(matched_product.get('_id'))), # Use 'id' or '_id'
            "name": matched_product['name'],
            "image": matched_product.get('image', 'https://via.placeholder.com/600')
        })
    return {"recommended_products": results}


@app.post("/analyze-review")
def analyze_review(payload: ReviewRequest):
    scores = sentiment_analyzer.polarity_scores(payload.review)
    sentiment = "positive" if scores["compound"] > 0.3 else "negative" if scores["compound"] < -0.3 else "neutral"
    return {"sentiment": sentiment, "scores": scores}

@app.post("/chatbot")
def chatbot(payload: ChatRequest):
    try:
        res = groq_client.chat.completions.create(
            model="mistral-saba-24b",
            max_tokens=300,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are SmartShop AI — a friendly, helpful shopping assistant. "
                        "Always respond in 3-5 short bullet points. "
                        "Keep replies under 100 words. "
                        "Avoid tech jargon unless asked. "
                        "Reply only to shopping-related queries. "
                        "Use simple language that everyday users understand."
                    )
                },
                {"role": "user", "content": payload.query}
            ]
        )

        raw_response = res.choices[0].message.content
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
    confidence = np.random.uniform(70, 99)
    is_fake = "fake" if confidence > 85 else "genuine"
    return {"isFake": is_fake == "fake", "confidence": round(confidence, 2)}

@app.post("/cart/summary")
def cart_summary(payload: CartSummaryRequest):
    prompt = f"Generate a short promotional sales pitch for the following products: {', '.join(payload.cartItems)}"
    try:
        # Assuming `client` here refers to the Groq client, not the Mongo client
        res = groq_client.chat.completions.create( # Changed `client` to `groq_client`
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
    if not text_embeddings:
        raise HTTPException(status_code=500, detail="Product data not loaded for visual search.")

    file_path = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    img = Image.open(file_path).convert("RGB")
    img_embedding = clip_model.encode([img], convert_to_tensor=True)
    similarities = util.pytorch_cos_sim(img_embedding, text_embeddings).squeeze().cpu().numpy()
    best_match_index = similarities.argmax()
    # Assuming product_data_for_vectorization is a list of dicts
    matched_product = product_data_for_vectorization[best_match_index]
    return {"match": matched_product}

@app.post("/api/signup")
async def signup(user: UserSignup):
    existing = await users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_pwd = hash_password(user.password)
    new_user = {
        "name": user.name,
        "email": user.email,
        "username": user.username,
        "password": hashed_pwd,
        "cart": [],  # Initialize empty cart for new user
        "orders": []
    }
    await users_collection.insert_one(new_user)
    return {"message": "Signup successful"}

@app.post("/auth/login")
async def login(data: LoginIn):
    user = await db.users.find_one({"username": data.username})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(401, "Invalid username or password")
    return {"username": user["username"], "email": user["email"]}

@app.get("/api/user/{email}")
async def get_user_by_email(email: str): # Renamed to avoid conflict with get_user_by_username
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return user

@app.get("/auth/user/{username}")
async def get_user_by_username(username: str):
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(404, "User not found")
    # Ensure cart and orders fields exist, even if empty
    return {
        "username": user["username"],
        "email": user["email"],
        "name": user["name"],
        "cart": user.get("cart", []),
        "orders": user.get("orders", [])
    }

@app.get("/health/db")
async def check_db_connection():
    try:
        await db.command("ping")
        return {"status": "connected"}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}

# --- NEW CART ROUTES ---

@app.post("/cart/add")
async def add_to_cart(payload: AddToCartRequest):
    user = await users_collection.find_one({"username": payload.username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    product = await products_collection.find_one({"id": payload.productId}) # Using 'id' from JSON
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive.")

    # --- REMOVED STOCK CHECKING LOGIC ---
    # product_stock = int(product.get("stock", 0))
    # if product_stock < payload.quantity:
    #     raise HTTPException(status_code=400, detail=f"Not enough stock for {product['name']}. Available: {product_stock}")
    # --- END REMOVED STOCK CHECKING LOGIC ---

    # Initialize cart if it doesn't exist
    if "cart" not in user or not isinstance(user["cart"], list):
        user["cart"] = []

    # Check if product is already in cart
    existing_item_index = -1
    for i, item in enumerate(user["cart"]):
        if item["productId"] == payload.productId:
            existing_item_index = i
            break

    if existing_item_index != -1:
        # Product exists, update quantity
        user["cart"][existing_item_index]["quantity"] += payload.quantity
    else:
        # Product not in cart, add new item
        new_cart_item = {
            "productId": product["id"], # Store the 'id' from your products.json
            "name": product["name"],
            "price": float(product["price"]), # Ensure price is float
            "quantity": payload.quantity,
            "image": product.get("image")
        }
        user["cart"].append(new_cart_item)

    # Recalculate total price
    total_price = sum(item["price"] * item["quantity"] for item in user["cart"])

    # Update user's cart in MongoDB
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"cart": user["cart"], "updatedAt": datetime.utcnow()}}
    )

    # --- REMOVED STOCK DECREMENTING LOGIC ---
    # await products_collection.update_one(
    #     {"id": payload.productId},
    #     {"$inc": {"stock": -payload.quantity}}
    # )
    # --- END REMOVED STOCK DECREMENTING LOGIC ---

    return {"message": "Product added to cart successfully", "cart": user["cart"], "totalPrice": total_price}

@app.post("/cart/update")
async def update_cart_item(payload: UpdateCartItemRequest):
    user = await users_collection.find_one({"username": payload.username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "cart" not in user or not isinstance(user["cart"], list):
        raise HTTPException(status_code=400, detail="Cart is empty or invalid.")

    product_in_cart_index = -1
    for i, item in enumerate(user["cart"]):
        if item["productId"] == payload.productId:
            product_in_cart_index = i
            break

    if product_in_cart_index == -1:
        raise HTTPException(status_code=404, detail="Product not found in cart.")

    current_quantity = user["cart"][product_in_cart_index]["quantity"]
    new_quantity = payload.quantity

    if new_quantity <= 0:
        # If quantity is 0 or less, remove the item
        return await remove_from_cart(RemoveFromCartRequest(username=payload.username, productId=payload.productId))

    # Check available stock if increasing quantity
    product_db = await products_collection.find_one({"id": payload.productId})
    if not product_db:
        raise HTTPException(status_code=404, detail="Product details not found in database.")

    product_stock = int(product_db.get("stock", 0))

    quantity_difference = new_quantity - current_quantity
    if quantity_difference > 0 and product_stock < quantity_difference:
        raise HTTPException(status_code=400, detail=f"Not enough stock for {product_db['name']}. Available: {product_stock} more units needed.")


    user["cart"][product_in_cart_index]["quantity"] = new_quantity

    # Update product stock
    await products_collection.update_one(
        {"id": payload.productId},
        {"$inc": {"stock": -quantity_difference}}
    )

    # Recalculate total price
    total_price = sum(item["price"] * item["quantity"] for item in user["cart"])

    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"cart": user["cart"], "updatedAt": datetime.utcnow()}}
    )
    return {"message": "Cart item updated successfully", "cart": user["cart"], "totalPrice": total_price}


@app.post("/cart/remove")
async def remove_from_cart(payload: RemoveFromCartRequest):
    user = await users_collection.find_one({"username": payload.username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "cart" not in user or not isinstance(user["cart"], list):
        raise HTTPException(status_code=400, detail="Cart is empty or invalid.")

    initial_cart_len = len(user["cart"])
    item_removed_quantity = 0

    # Filter out the item to be removed
    new_cart_items = []
    for item in user["cart"]:
        if item["productId"] == payload.productId:
            item_removed_quantity = item["quantity"] # Store quantity to return to stock
        else:
            new_cart_items.append(item)

    if len(new_cart_items) == initial_cart_len:
        raise HTTPException(status_code=404, detail="Product not found in cart.")

    user["cart"] = new_cart_items

    # Return quantity to product stock
    if item_removed_quantity > 0:
        await products_collection.update_one(
            {"id": payload.productId},
            {"$inc": {"stock": item_removed_quantity}}
        )

    # Recalculate total price
    total_price = sum(item["price"] * item["quantity"] for item in user["cart"])

    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"cart": user["cart"], "updatedAt": datetime.utcnow()}}
    )
    return {"message": "Product removed from cart successfully", "cart": user["cart"], "totalPrice": total_price}

@app.get("/cart/{username}")
async def get_user_cart(username: str):
    user = await users_collection.find_one({"username": username}, {"cart": 1, "_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    cart_items = user.get("cart", [])
    total_price = sum(item["price"] * item["quantity"] for item in cart_items)

    return {"cart": cart_items, "totalPrice": total_price}