# Count tokens with the real Nemotron tokenizer (Hugging Face `tokenizers`).
# Called by bench/calibrate-nemotron.ts: argv[1] = JSON list of strings,
# argv[2] = tokenizer.json path. Prints a JSON list of counts (content only,
# no special tokens, no chat template — the same basis as the other benches).
import json
import sys

from tokenizers import Tokenizer

texts = json.load(open(sys.argv[1]))
tok = Tokenizer.from_file(sys.argv[2])
print(json.dumps([len(tok.encode(t, add_special_tokens=False).ids) for t in texts]))
