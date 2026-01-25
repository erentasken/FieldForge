def build_prompt(fields, dataInformation):
    return [
        {
            "role": "system",
            "content": "Medical data normalization expert. Output valid JSON only using snake_case and accurate medical terminology."
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