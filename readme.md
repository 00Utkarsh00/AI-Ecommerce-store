# AI E-Commerce Catalog (Demo)

Tiny Node + Express app with:
- **Catalog Viewer** (static list, filter by category + max price)
- **AI Search** (natural-language query → ranked products)

---

## How to Run

**Prereqs**
- Node.js ≥ 18
- OpenAI API key

**Setup**
```bash
npm install
````

Create `.env` in the project root:

```bash
OPENAI_API_KEY=your_api_key_here
```

**Start**

```bash
npm start
# or
node main.js
```

Open: [http://localhost:3000](http://localhost:3000)

---

## AI Feature

**Natural-language ranking** using the OpenAI API.
The server sends the user query + candidate products and requests two arrays of product **IDs** via a strict JSON schema. It then maps IDs back to full product objects and returns:

```json
{
  "recommendedProducts": [ /* ranked product objects */ ],
  "RestOfTheProducts":   [ /* remaining product objects */ ]
}
```

---

## Tools / Libraries

* **Express** – HTTP server + static hosting
* **OpenAI Node SDK** – Chat Completions with JSON schema output
* **dotenv** – load `OPENAI_API_KEY`
* **Vanilla HTML/CSS/JS** – no build step


