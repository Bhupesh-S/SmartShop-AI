const BASE_URL = "http://localhost:8000";

// Common POST function
async function apiPost(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// ===== Product APIs =====
export async function fetchProducts() {
  const res = await fetch(`${BASE_URL}/products`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}



// ===== Review Analysis =====
export async function translateReview(reviewText, langCode = "auto") {
  const data = await apiPost("/reviews/translate", { reviewText, langCode });
  return data.translated;
}

export async function analyzeSentiment(reviewText) {
  const data = await apiPost("/reviews/sentiment", { review: reviewText });
  return data;
}

export async function checkReviewLegitimacy(reviewText) {
  const data = await apiPost("/reviews/check", { reviewText });
  return {
    isLegit: !data.isFake,
    confidence: data.confidence,
    reason: data.isFake ? "Suspicious language patterns" : "Review looks normal"
  };
}

// ===== Cart Summary =====
export async function generateCartSummary(cartItems) {
  const data = await apiPost("/cart/summary", { cartItems });
  return data.summaryText;
}

// ===== Chatbot =====
export async function sendMessageToBot(userInput) {
  const data = await apiPost("/chatbot", { query: userInput });
  return data.response_html || data.response_raw || "No response received.";
}

export async function sendMessageToBotStream(userInput) {
  try {
    const data = await apiPost("/chatbot", { query: userInput });
    const rawText = data.response_html || data.response_raw || "";

    async function* streamChunks(text) {
      const words = text.split(/\s+/);
      for (const word of words) {
        await new Promise(resolve => setTimeout(resolve, 40));
        yield { text: word + " " };
      }
    }

    return streamChunks(rawText);
  } catch {
    async function* errorStream() {
      yield { text: "⚠️ Failed to reach chatbot API." };
    }
    return errorStream();
  }
}

// ===== Receipt =====
export async function generateReceipt(orderDetails) {
  const data = await apiPost("/receipt", { orderDetails });
  return data.downloadLink;
}

// ===== Visual Search =====
export async function searchByImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/visual-search`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) throw new Error("Image search failed");
  return await response.json();
}

// ===== AUTH =====
export async function signupUser({ name, email, username, password }) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, username, password })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Signup failed: ${err}`);
  }

  return res.json();
}

export async function loginUser(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Login failed: ${err}`);
  }

  return await res.json();
}

export async function getUserDetails(username) {
  const res = await fetch(`${BASE_URL}/auth/user/${username}`);
  if (!res.ok) throw new Error("User not found");
  return await res.json();

  
}
