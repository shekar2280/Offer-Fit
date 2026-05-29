from enum import Enum
from typing import Dict

class ModelPricing(Enum):
    GEMINI_3_1_FLASH_LITE = {"model": "gemini-3.1-flash-lite", "input": 0.25, "output": 1.5}
    GEMINI_2_5_FLASH_LITE = {"model": "gemini-2.5-flash-lite", "input": 0.1, "output": 0.4}
    GEMINI_3_FLASH = {"model": "gemini-3-flash", "input": 0.5, "output": 3.0}
    GEMINI_2_5_FLASH = {"model": "gemini-2.5-flash", "input": 0.3, "output": 2.5}

    @classmethod
    def get_pricing(cls, model_name: str) -> Dict[str, float]:
        for enum_member in cls:
            if enum_member.value["model"] == model_name:
                return enum_member.value
        return {"input_price": 0.15, "output_price": 0.60}

class PlanQuotas(Enum):
    FREE = 20
    PREMIUM = 50
