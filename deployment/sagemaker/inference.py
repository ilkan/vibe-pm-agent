"""
SageMaker inference script for NVIDIA NIM LLaMA model
Handles chat completion requests in OpenAI-compatible format
"""

import json
import logging
import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NIMInferenceHandler:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.pipeline = None
        self.device = None
        
    def model_fn(self, model_dir: str):
        """Load the model for inference"""
        try:
            # Determine device
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            logger.info(f"Using device: {self.device}")
            
            # Load tokenizer and model
            model_id = os.environ.get('HF_MODEL_ID', 'nvidia/llama-3.1-nemotron-nano-8b-v1')
            
            logger.info(f"Loading tokenizer from {model_id}")
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_id,
                trust_remote_code=True,
                cache_dir=model_dir
            )
            
            logger.info(f"Loading model from {model_id}")
            self.model = AutoModelForCausalLM.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None,
                trust_remote_code=True,
                cache_dir=model_dir
            )
            
            # Create text generation pipeline
            self.pipeline = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if torch.cuda.is_available() else -1,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            
            logger.info("Model loaded successfully")
            return self
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def input_fn(self, request_body: str, content_type: str = 'application/json') -> Dict[str, Any]:
        """Parse input request"""
        try:
            if content_type == 'application/json':
                input_data = json.loads(request_body)
            else:
                raise ValueError(f"Unsupported content type: {content_type}")
            
            # Validate required fields
            if 'messages' not in input_data:
                raise ValueError("Missing 'messages' field in request")
            
            return input_data
            
        except Exception as e:
            logger.error(f"Error parsing input: {str(e)}")
            raise
    
    def predict_fn(self, input_data: Dict[str, Any], model) -> Dict[str, Any]:
        """Generate prediction"""
        try:
            messages = input_data['messages']
            temperature = input_data.get('temperature', 0.7)
            max_tokens = input_data.get('max_tokens', 1024)
            top_p = input_data.get('top_p', 0.9)
            stream = input_data.get('stream', False)
            
            # Convert messages to prompt format
            prompt = self._format_messages(messages)
            
            # Generate response
            generation_kwargs = {
                'max_new_tokens': max_tokens,
                'temperature': temperature,
                'top_p': top_p,
                'do_sample': True,
                'pad_token_id': self.tokenizer.eos_token_id,
                'return_full_text': False
            }
            
            if stream:
                # For streaming, we'll return a single response for now
                # In production, implement proper streaming
                logger.warning("Streaming not fully implemented, returning single response")
            
            outputs = self.pipeline(prompt, **generation_kwargs)
            
            # Format response in OpenAI format
            response = {
                "id": f"chatcmpl-{hash(prompt) % 1000000}",
                "object": "chat.completion",
                "created": int(torch.cuda.Event().query() if torch.cuda.is_available() else 0),
                "model": input_data.get('model', 'nvidia-llama-3.1-nemotron-nano-8b-v1'),
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": outputs[0]['generated_text'].strip()
                        },
                        "finish_reason": "stop"
                    }
                ],
                "usage": {
                    "prompt_tokens": len(self.tokenizer.encode(prompt)),
                    "completion_tokens": len(self.tokenizer.encode(outputs[0]['generated_text'])),
                    "total_tokens": len(self.tokenizer.encode(prompt)) + len(self.tokenizer.encode(outputs[0]['generated_text']))
                }
            }
            
            return response
            
        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
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
    
    def _format_messages(self, messages: List[Dict[str, str]]) -> str:
        """Convert OpenAI message format to model prompt format"""
        prompt_parts = []
        
        for message in messages:
            role = message['role']
            content = message['content']
            
            if role == 'system':
                prompt_parts.append(f"System: {content}")
            elif role == 'user':
                prompt_parts.append(f"User: {content}")
            elif role == 'assistant':
                prompt_parts.append(f"Assistant: {content}")
        
        prompt_parts.append("Assistant:")
        return "\n".join(prompt_parts)

# Global handler instance
handler = NIMInferenceHandler()

# SageMaker entry points
def model_fn(model_dir):
    return handler.model_fn(model_dir)

def input_fn(request_body, content_type):
    return handler.input_fn(request_body, content_type)

def predict_fn(input_data, model):
    return handler.predict_fn(input_data, model)

def output_fn(prediction, accept):
    return handler.output_fn(prediction, accept)