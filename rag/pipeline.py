from rag.retriever import retrieve
from rag.prompt import build_prompt

def run_rag(fields):
    relateDic = {}
    for f in fields:
        retrieve(f, relateDic)

    dataInformation = ""
    for k, v in relateDic.items():
        dataInformation += f'{k} : {v}\n'
    print(dataInformation)
    return build_prompt(relateDic.keys(), dataInformation)
