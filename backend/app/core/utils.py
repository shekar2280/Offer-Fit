from .constants import ModelPricing
from typing import Any, Dict

def calculate_cost(input_tokens: int, output_tokens: int, model_name: str) -> float:
    rates = ModelPricing.get_pricing(model_name)
    input_cost = (input_tokens / 1_000_000) * rates["input"]
    output_cost = (output_tokens / 1_000_000) * rates["output"]
    return input_cost + output_cost

def extract_usage_metadata(response: Any) -> Dict[str, int]:
    try:
        metadata = response.usage_metadata
        return {
            "promptTokenCount": getattr(metadata, "prompt_token_count", 0),
            "candidatesTokenCount": getattr(metadata, "candidates_token_count", 0),
            "totalTokenCount": getattr(metadata, "total_token_count", 0)
        }
    except Exception:
        return {
            "promptTokenCount": 0,
            "candidatesTokenCount": 0,
            "totalTokenCount": 0
        }
