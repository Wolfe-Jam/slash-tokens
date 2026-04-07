# /slash-tokens

Pre-flight checks for API calls. 4.8 KB WASM. Sub-millisecond. Zero dependencies.

**Fly First. Pay Economy.**

```bash
npm install slash-tokens
```

```js
import { preflight } from 'slash-tokens'

const check = preflight(prompt, 'claude-opus')
// tokens: 47,000 | cost: $0.71 | 11 cheaper options | save 99%
```

Or one line — every API call pre-flighted automatically:

```js
import 'slash-tokens/auto'
```

Full docs, examples, and model pricing at **[GitHub](https://github.com/Wolfe-Jam/slash-tokens)**

[slashtokens.com](https://slashtokens.com) | MIT
