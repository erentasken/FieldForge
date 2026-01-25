import faiss
import numpy as np
from rag.embeddings import get_embedder
from rag.knowledge import ABBREVIATION_GLOSSARY

_embedder = get_embedder()

golden_raw = [g["abbr"].lower() for g in ABBREVIATION_GLOSSARY]
golden_norm = [g["meaning"] for g in ABBREVIATION_GLOSSARY]

emb = _embedder.encode(golden_raw, convert_to_tensor=False).astype(np.float32)
faiss.normalize_L2(emb)

index = faiss.IndexFlatIP(emb.shape[1])
index.add(emb)

def retrieve(field: str, relateDic, k=2, threshold=0.6):
    q = _embedder.encode([field.lower()], convert_to_tensor=False).astype(np.float32)
    faiss.normalize_L2(q)
    D, I = index.search(q, k)

    subDic = {}
    for idx in I[0]:  # I is a 2D array: shape (1, k)
        subDic[golden_raw[idx]] = golden_norm[idx]
    relateDic[field] = subDic
    return [
        f'{golden_raw[i]}→{golden_norm[i]}'
        for i, d in zip(I[0], D[0])
        if i >= 0 and d > threshold
    ]
