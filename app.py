```python
from flask import Flask, render_template, request, jsonify

from faq_data import FAQS
from nlp_engine import FAQMatcher


app = Flask(__name__)

# Create the FAQ matching engine once at startup.
faq_matcher = FAQMatcher(FAQS)


FALLBACK_RESPONSE = (
    "Sorry, I couldn't find a suitable answer to your question. "
    "Please try asking about admissions, fees, courses, examinations, "
    "attendance, internships, or placements."
)


@app.route("/")
def home():
    """
    Display the chatbot interface.
    """
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    """
    Receive a user message and return the best FAQ answer.
    """

    data = request.get_json(silent=True) or {}

    user_message = data.get("message", "")

    if not isinstance(user_message, str):
        return jsonify({
            "error": "Message must be text."
        }), 400

    user_message = user_message.strip()

    if not user_message:
        return jsonify({
            "error": "Please enter a question."
        }), 400

    # Prevent excessively long requests.
    if len(user_message) > 1000:
        return jsonify({
            "error": "Please enter a shorter question."
        }), 400

    # Find the closest FAQ.
    matched_faq, similarity_score = faq_matcher.get_best_match(
        user_message
    )

    if matched_faq:
        answer = matched_faq["answer"]
        matched_question = matched_faq["question"]
    else:
        answer = FALLBACK_RESPONSE
        matched_question = None

    return jsonify({
        "answer": answer,
        "matched_question": matched_question,
        "similarity": round(similarity_score, 3)
    })


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )
```
