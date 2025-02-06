from sentence_transformers import SentenceTransformer
import torch
import numpy as np

class RelationService:
    def __init__(self):
        self.model = SentenceTransformer('all-mpnet-base-v2')
        self.relation_types = [
            'continuation', 'contradiction', 'example', 
            'prerequisite', 'analogy', 'shared_context'
        ]

    def get_embedding(self, text):
        return self.model.encode(text, convert_to_tensor=True)

    def cosine_similarity(self, embedding1, embedding2):
        return torch.nn.functional.cosine_similarity(embedding1.unsqueeze(0), embedding2.unsqueeze(0))[0].item()

    def detect_relation(self, text1, text2):
        # Get embeddings
        emb1 = self.get_embedding(text1)
        emb2 = self.get_embedding(text2)

        # Calculate similarity
        similarity = self.cosine_similarity(emb1, emb2)

        # Determine relation type based on similarity and content
        if similarity > 0.8:
            return 'continuation'
        elif similarity > 0.6:
            return 'shared_context'
        elif similarity > 0.4:
            return 'analogy'
        else:
            return None  # No strong relation detected