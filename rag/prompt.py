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
                "You are a medical data normalization expert for clinical datasets and fully understand German clinical abbreviations.\n"
                "Your task is to normalize abbreviated field names into standardized, clinically meaningful identifiers.\n\n"
                "IMPORTANT:\n"
                "- Fields may contain German clinical abbreviations.\n"
                "- For fields with empty or missing context, infer the most likely clinical meaning "
                "- Think in German clinical abbreviations rather than converting to English word by word.\n"
                "- Avoid speculative expansions or non-clinical interpretations.\n"
                "- Do NOT invent unrelated medical concepts.\n\n"
                "Output VALID JSON only, using snake_case, ML-safe identifiers, and accurate clinical terminology."
            )
        },
        {
            "role": "user",
            "content": f"""Generate JSON mappings:
{{"field":{{"primary":"std_name","alternatives":["alt1","alt2"]}}}}

Field Context:
{dataInformation}  # empty context is {{}} for inference

Fields:
{', '.join(fields)}

Rules:
- Use context if available to infer medical meaning.
- If context is empty ({{}}), infer the clinical meaning from field name tokens conservatively.
- If the meaning is uncertain, keep the original field name as primary or include it as an alternative.
- Recognize common maternal-child abbreviations (like 'st' for 'stillen') dynamically, without static mapping.
- Preserve numeric suffixes indicating measurement order.
- Keep numbering in both primary and alternatives.
- Avoid over-speculative expansions.
- Output JSON only."""
        }
    ]
