# OLD prompt version for reference

# def build_prompt(fields, dataInformation):
#     return [
#         {
#             "role": "system",
#             "content": (
#                 "You are a medical data normalization assistant specialized in clinical datasets "
#                 "and familiar with German clinical abbreviations.\n"
#                 "Your task is to normalize abbreviated field names into standardized, "
#                 "clinically appropriate identifiers.\n\n"
#                 "BEHAVIOR CONSTRAINTS:\n"
#                 "- Treat abbreviations conservatively.\n"
#                 "- Prefer well-established clinical interpretations.\n"
#                 "- Do not expand abbreviations beyond what is strongly implied.\n"
#                 "- If meaning cannot be inferred with high confidence, preserve the original term.\n"
#                 "- Use the overall dataset domain (inferred from the full set of fields and any provided context) to disambiguate abbreviations.\n"
#                 "- Avoid English-looking backronyms unless clearly supported by context.\n"
#                 "- Do not invent unrelated or speculative medical concepts.\n"
#                 "- Output must be valid JSON only."
#             )
#         },
#         {
#             "role": "user",
#             "content": f"""Normalize the following field names.

# Output format:
# A single JSON object where each key is an input field name and each value is:
# {{"primary": "std_name", "alternatives": ["alt1", "alt2"]}}

# Context:
# {dataInformation}

# Fields:
# {', '.join(fields)}

# Normalization rules:
# - Use provided context if available.
# - If context is empty ({{}}), infer meaning only when clinically obvious.
# - Consider the full set of fields to infer dataset domain (e.g., obstetric/perinatal vs oncology vs cardiology).
# - If the field set suggests obstetric/perinatal context (e.g., gestational age/weeks, prenatal measurements), prefer obstetric/postpartum/lactation-consistent interpretations for ambiguous abbreviations.
# - Preserve numeric suffixes and ordering.
# - Keep numbering consistent in both primary and alternatives.
# - If uncertain, keep the original field name as primary or include it as an alternative.
# - Use snake_case, ML-safe identifiers.
# - Do not repeat the primary name in the alternatives list.
# - Avoid over-expansion and speculative interpretations.
# - Output JSON only, no extra text."""
#         }
#     ]


def build_prompt(fields, dataInformation):
    return [
        {
            "role": "system",
            "content": (
                "You are a medical data normalization assistant with expert knowledge of German clinical abbreviations.\n"
                "Normalize abbreviated German field names into standardized, ML-safe English snake_case identifiers.\n\n"

                "RULES:\n"
                "- Use your knowledge of German medical/clinical terminology to infer meanings.\n"
                "- Consider the full set of fields together to infer the dataset domain (e.g., obstetric/perinatal, oncology, cardiology).\n"
                "- Translate German abbreviations into their English clinical equivalents.\n"
                "- Ambiguous abbreviations: provide 1–3 plausible English alternatives based on likely clinical meanings.\n"
                "- Include the original abbreviation as an alternative when expanding.\n"
                "- Preserve numeric suffixes, ordering, and ML-safe snake_case.\n"
                "- Do NOT invent unrelated medical concepts.\n"
                "- Output valid JSON only, no extra text."
            )
        },
        {
            "role": "user",
            "content": f"""Normalize the following German clinical field names into English identifiers.

Output format:
{{"field_name": {{"primary": "english_std_name", "alternatives": ["alt1", "alt2"]}}}}

Context:
{dataInformation}

Fields:
{', '.join(fields)}"""
        }
    ]
