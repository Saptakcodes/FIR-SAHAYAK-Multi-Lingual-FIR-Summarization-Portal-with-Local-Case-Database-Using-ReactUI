import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import logging
import re

logger = logging.getLogger(__name__)

class Summarizer:
    def __init__(self, model_path=None):
        # Use pre‑trained 1.5B
        model_name = "Qwen/Qwen2.5-1.5B-Instruct"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Loading model from {model_name} on {self.device}...")

        self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        self.tokenizer.pad_token = self.tokenizer.eos_token
        self.tokenizer.padding_side = "right"

        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="cuda" if torch.cuda.is_available() else "cpu",
            trust_remote_code=True,
        )
        logger.info(f"✅ Model loaded on {self.device}")

    def generate(self, text, max_new_tokens=800):
        # Allow more input context
        if len(text) > 2000:
            text = text[:2000] + "..."

        messages = [
            {"role": "system", "content": """You are a legal expert. Provide a **detailed and comprehensive summary** of the FIR in 6-8 sentences. The summary must cover ALL key facts for a police officer to understand the case.

Include ALL of the following that are present in the FIR:
- Complainant's full name, age, and relationship (e.g., wife of ...)
- Incident date and time
- Exact location of the incident (full address with police station)
- Detailed description of what happened
- Items stolen or damaged with exact value
- Whether the accused is known or unknown (if known, provide name)
- Police station where the FIR was registered
- Any other relevant details (e.g., Zero FIR, transferred from another PS)

Rules:
1. Use names exactly as they appear.
2. Keep 'Late' if present before a name.
3. Do NOT invent any information.
4. Do NOT mention legal sections (IPC/BNS) or investigation procedures.
5. Write in plain English, in a logical flow.
6. Be thorough – include every important detail.
7. Do NOT cut off the summary – write until all facts are covered."""},
            {"role": "user", "content": f"FIR Text:\n{text}"}
        ]

        prompt = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=1024
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                min_new_tokens=200,           # force at least 200 tokens
                do_sample=True,               # enables diversity
                temperature=0.3,              # low temperature to stay factual
                top_p=0.9,
                repetition_penalty=1.15,
                pad_token_id=self.tokenizer.eos_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
                # early_stopping removed
            )

        raw = self.tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[1]:],
            skip_special_tokens=True
        )

        # If the summary is still too short, concatenate with the narrative as a fallback
        if len(raw.split()) < 30:
            logger.warning("Summary too short – using fallback")
            # Fallback: use the narrative directly (truncated)
            fallback = text[:500]
            return f"Summary not generated. FIR narrative: {fallback}"

        return raw.strip()