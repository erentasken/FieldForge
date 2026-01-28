# OLD prompt version for reference

# def build_prompt(fields, dataInformation):
#     return [
#         {
#             "role": "system",
#             "content": (
#                 "You are a medical data normalization expert specializing in ML feature engineering. "
#                 "Your goal is to normalize field names while preserving maximal semantic information. "
#                 "Output VALID JSON only, using snake_case, ML-safe identifiers, and accurate medical terminology."
#             )
#         },
#         {
#             "role": "user",
#             "content": f"""Generate JSON mappings: {{"field":{{"primary":"std_name","alternatives":["alt1","alt2"]}}}}

# Field Context:
# {dataInformation}
# Fields: {", ".join(fields)}

# Rules:
# - Use field context to create standardized medical names with alternatives
# - Preserve numbers in field names as they indicate sequential measurements
# - Keep numbering in both primary and alternative names
# - Output JSON only"""
#         }
#     ]

def build_prompt(fields, dataInformation):
    return [
        {
            "role": "system",
            "content": (
                "You are a medical data normalization assistant specialized in clinical datasets "
                "and familiar with German clinical abbreviations.\n"
                "Your task is to normalize abbreviated field names into standardized, "
                "clinically appropriate identifiers.\n\n"
                "BEHAVIOR CONSTRAINTS:\n"
                "- Treat abbreviations conservatively.\n"
                "- Prefer well-established clinical interpretations.\n"
                "- Do not expand abbreviations beyond what is strongly implied.\n"
                "- If meaning cannot be inferred with high confidence, preserve the original term.\n"
                "- Do not invent unrelated or speculative medical concepts.\n"
                "- Output must be valid JSON only."
            )
        },
        {
            "role": "user",
            "content": f"""Normalize the following field names.

Output format:
A single JSON object where each key is an input field name and each value is:
{{"primary": "std_name", "alternatives": ["alt1", "alt2"]}}

Context:
{dataInformation}

Fields:
{', '.join(fields)}

Normalization rules:
- Use provided context if available.
- If context is empty ({{}}), infer meaning only when clinically obvious.
- Preserve numeric suffixes and ordering.
- Keep numbering consistent in both primary and alternatives.
- If uncertain, keep the original field name as primary or include it as an alternative.
- Use snake_case, ML-safe identifiers.
- Avoid over-expansion and speculative interpretations.
- Output JSON only, no extra text."""
        }
    ]
