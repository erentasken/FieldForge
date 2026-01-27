def build_prompt(fields, dataInformation):
    return [
        {
            "role": "system",
            "content": (
                "You are a medical data normalization expert specializing in ML feature engineering. "
                "Your goal is to normalize field names while preserving maximal semantic information. "
                "Output VALID JSON only, using snake_case, ML-safe identifiers, and accurate medical terminology."
            )
        },
        {
            "role": "user",
            "content": f"""Generate JSON mappings: {{"field":{{"primary":"std_name","alternatives":["alt1","alt2"]}}}}

Field Context:
{dataInformation}
Fields: {", ".join(fields)}

Rules:
- Use field context to create standardized medical names with alternatives
- Preserve numbers in field names as they indicate sequential measurements
- Keep numbering in both primary and alternative names
- Output JSON only"""
        }
    ]