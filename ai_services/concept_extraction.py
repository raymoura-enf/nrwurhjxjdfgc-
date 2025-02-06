from sentence_transformers import SentenceTransformer
import numpy as np

class ConceptService:
    def __init__(self):
        self.model = SentenceTransformer('all-mpnet-base-v2')
        self.cache = {}  # Simple cache for concept reuse

    def extract_concepts(self, text):
        if text in self.cache:
            return self.cache[text]

        # Get embeddings for key phrases
        embeddings = self.model.encode(text)

        # For now, we'll return the processed text as concepts
        # We can add more sophisticated concept extraction later
        concepts = [text.strip() for text in text.split('.') if text.strip()]
        self.cache[text] = concepts[:3]  # Keep top 3 concepts
        return self.cache[text]