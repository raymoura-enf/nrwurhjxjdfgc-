from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from relation_detection import RelationService
from concept_extraction import ConceptService

app = FastAPI()

# Initialize services with error handling
try:
    relation_service = RelationService()
    concept_service = ConceptService()
except Exception as e:
    print(f"Error initializing AI services: {str(e)}")
    raise

class RelationRequest(BaseModel):
    text1: str
    text2: str

class RelationResponse(BaseModel):
    relation: str

class ConceptRequest(BaseModel):
    text: str

class ConceptResponse(BaseModel):
    concepts: List[str]

@app.post("/detect-relation", response_model=RelationResponse)
async def detect_relation(request: RelationRequest):
    try:
        result = relation_service.detect_relation(request.text1, request.text2)
        if result:
            return {"relation": result.strip()}
        return {"relation": "none"}  # Return none if no strong relation detected
    except Exception as e:
        print(f"Error in detect_relation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-concepts", response_model=ConceptResponse)
async def extract_concepts(request: ConceptRequest):
    try:
        concepts = concept_service.extract_concepts(request.text)
        return {"concepts": concepts}
    except Exception as e:
        print(f"Error in extract_concepts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)