```python
import re
import nltk

from nltk.corpus import stopwords
from nltk.tokenize import wordpunct_tokenize

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# Download required NLTK data if it is not already available.
nltk.download("stopwords", quiet=True)

STOP_WORDS = set(stopwords.words("english"))


def preprocess_text(text):
    """
    Clean and preprocess text using NLP techniques.
    """

    # Convert to lowercase.
    text = text.lower()

    # Remove URLs.
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    # Keep alphabetic words and spaces.
    text = re.sub(r"[^a-z\s]", " ", text)

    # Tokenize the text.
    tokens = wordpunct_tokenize(text)

    # Remove stopwords and very short tokens.
    tokens = [
        token
        for token in tokens
        if token not in STOP_WORDS and len(token) > 1
    ]

    return " ".join(tokens)


class FAQMatcher:
    """
    Match user questions against a collection of FAQs.
    """

    def __init__(self, faqs):
        self.faqs = faqs

        self.questions = [
            faq["question"]
            for faq in faqs
        ]

        # Preprocess stored FAQ questions.
        self.processed_questions = [
            preprocess_text(question)
            for question in self.questions
        ]

        # Configure TF-IDF vectorization.
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True
        )

        # Convert FAQ questions into numerical vectors.
        self.question_vectors = self.vectorizer.fit_transform(
            self.processed_questions
        )

    def get_best_match(self, user_question):
        """
        Return the most similar FAQ and its similarity score.
        """

        processed_question = preprocess_text(user_question)

        # Empty input after preprocessing.
        if not processed_question:
            return None, 0.0

        # Transform the user's question using the same vectorizer.
        user_vector = self.vectorizer.transform(
            [processed_question]
        )

        # If no known terms match, no FAQ can be identified.
        if user_vector.nnz == 0:
            return None, 0.0

        # Calculate cosine similarity against every FAQ.
        similarities = cosine_similarity(
            user_vector,
            self.question_vectors
        ).flatten()

        # Find the FAQ with the highest score.
        best_index = similarities.argmax()
        best_score = float(similarities[best_index])

        # Minimum confidence threshold.
        threshold = 0.18

        if best_score < threshold:
            return None, best_score

        return self.faqs[best_index], best_score

