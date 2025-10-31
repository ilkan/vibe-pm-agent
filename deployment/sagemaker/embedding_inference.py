"""
SageMaker inference script for NVIDIA NIM embedding model
Handles embedding generation requests in OpenAI-compatible format
"""

import json
import logging
import os
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NIMEmbeddingHandler:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = None
        
    def model_fn(self, model_dir: str):
        """Load the embedding model for inference"""
        try:
            # Determine device
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            logger.info(f"Using device: {self.device}")
            
            # Load tokenizer and model
            model_id = os.environ.get('HF_MODEL_ID', 'nvidia/nv-embedqa-e5-v5')
            
            logger.info(f"Loading tokenizer from {model_id}")
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_id,
                trust_remote_code=True,
                cache_dir=model_dir
            )
            
            logger.info(f"Loading model from {model_id}")
            self.model = AutoModel.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None,
                trust_remote_code=True,
                cache_dir=model_dir
            )
            
            self.model.eval()
            logger.info("Embedding model loaded successfully")
            return self
            
        except Exception as e:
            logger.error(f"Error loading embedding model: {str(e)}")
            raise
    
    def input_fn(self, request_body: str, content_type: str = 'application/json') -> Dict[str, Any]:
        """Parse input request"""
        try:
            if content_type == 'application/json':
                input_data = json.loads(request_body)
            else:
                raise ValueError(f"Unsupported content type: {content_type}")
            
            # Validate required fields
            if 'input' not in input_data:
                raise ValueError("Missing 'input' field in request")
            
            return input_data
            
        except Exception as e:
            logger.error(f"Error parsing input: {str(e)}")
            raise
    
    def predict_fn(self, input_data: Dict[str, Any], model) -> Dict[str, Any]:
        """Generate embeddings"""
        try:
            input_texts = input_data['input']
            model_name = input_data.get('model', 'nvidia-nv-embedqa-e5-v5')
            
            # Ensure input is a list
            if isinstance(input_texts, str):
                input_texts = [input_texts]
            
            embeddings = []
            
            with torch.no_grad():
                for i, text in enumerate(input_texts):
                    # Tokenize input
                    inputs = self.tokenizer(
                        text,
                        return_tensors="pt",
                        padding=True,
                        truncation=True,
                        max_length=512
                    ).to(self.device)
                    
                    # Generate embeddings
                    outputs = self.model(**inputs)
                    
                    # Use mean pooling for sentence embeddings
                    embedding = self._mean_pooling(outputs, inputs['attention_mask'])
                    
                    # Normalize embeddings
                    embedding = torch.nn.functional.normalize(embedding, p=2, dim=1)
                    
                    # Convert to list
                    embedding_list = embedding.cpu().numpy().flatten().tolist()
                    embeddings.append(embedding_list)
            
            # Format response in OpenAI format
            response = {
                "object": "list",
                "data": [
                    {
                        "object": "embedding",
                        "index": i,
                        "embedding": embedding
                    }
                    for i, embedding in enumerate(embeddings)
                ],
                "model": model_name,
                "usage": {
                    "prompt_tokens": sum(len(self.tokenizer.encode(text)) for text in input_texts),
                    "total_tokens": sum(len(self.tokenizer.encode(text)) for text in input_texts)
                }
            }
            
            return response
            
        except Exception as e:
            logger.error(f"Error during embedding generation: {str(e)}")
            raise
    
    def output_fn(self, prediction: Dict[str, Any], accept: str = 'application/json') -> str:
        """Format output response"""
        try:
            if accept == 'application/json':
                return json.dumps(prediction)
            else:
                raise ValueError(f"Unsupported accept type: {accept}")
                
        except Exception as e:
            logger.error(f"Error formatting output: {str(e)}")
            raise
    
    def _mean_pooling(self, model_output, attention_mask):
        """Apply mean pooling to get sentence embeddings"""
        token_embeddings = model_output[0]  # First element contains all token embeddings
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

# Global handler instance
handler = NIMEmbeddingHandler()

# SageMaker entry points
def model_fn(model_dir):
    return handler.model_fn(model_dir)

def input_fn(request_body, content_type):
    return handler.input_fn(request_body, content_type)

def predict_fn(input_data, model):
    return handler.predict_fn(input_data, model)

def output_fn(prediction, accept):
    return handler.output_fn(prediction, accept)