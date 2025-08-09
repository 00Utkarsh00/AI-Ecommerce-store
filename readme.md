AI E-commerce Catalog (Demo)
A tiny Node + Express app with a static catalog viewer and an AI-powered search that ranks products from natural-language queries.

How to run the app
1) Prereqs
Node.js ≥ 18 (tested with 22.x)

An OpenAI API key

2) Install deps
npm install
3) Configure environment
Create a .env at the project root:

bash
Copy
OPENAI_API_KEY=your_api_key_here

npm start
# or
node main.js
Open http://localhost:3000 in your browser.


Tools / Libraries used
Express — lightweight HTTP server and static hosting

OpenAI Node SDK — calls the Chat Completions API with a JSON schema response format

Vanilla HTML/CSS/JS for the frontend


AI Search
One search box for natural-language queries
Examples: “running shoes under $100 with good reviews”, “cheap electronics”, “a good camera”

Backend endpoint: GET /search?query=...

The server calls OpenAI to rank products by relevance and responds in the shape the frontend expects:


{
  "recommendedProducts": [ /* ranked product objects */ ],
},{
  "recommendedProducts": [ /* ranked product objects */ ],
  "RestOfTheProducts": [ /* remaining product objects */ ]
}
