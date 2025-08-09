const OpenAI = require("openai");

require("dotenv").config();
const use = require('@tensorflow-models/universal-sentence-encoder');
const tf  = require('@tensorflow/tfjs-node');
const products = require('../products.json');

const CATEGORIES = [
  'Electronics',
  'Apparel',
  'Home & Kitchen',
  'Sports & Outdoors',
  'Beauty & Personal Care'
];

let model = null;
async function loadModel() {
  model = await use.load();
}

let catEmbeddings = null;
async function embedCategories() {
  if (!model) await loadModel();
  catEmbeddings = await model.embed(CATEGORIES);
}

async function getCategoryMatches(query) {
  if (!model) await loadModel();
  if (!catEmbeddings) await embedCategories();

  const qEmb = await model.embed([query]);

  const sims = await tf.matMul(qEmb, catEmbeddings, false, true)
    .div(
      tf.norm(qEmb, 2, 1)
        .expandDims(1)
        .mul(tf.norm(catEmbeddings, 2, 1).expandDims(0))
    )
    .array();

  const scores = sims[0];  
  let bestIdx = 0;
  let bestScore = scores[0];
  scores.forEach((s,i) => {
    if (s > bestScore) { bestScore = s; bestIdx = i; }
  });
  console.log('Best category:', CATEGORIES[bestIdx], 'score', bestScore);

  const cat = CATEGORIES[bestIdx].toLowerCase();
  return products.filter(p => p.category.toLowerCase() === cat);
}
async function extractCategoryGPT(searchQuery) {
  console.log("Running GPT to extract category from:", searchQuery);
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const structure = {
    type: "json_schema",
    json_schema: {
      name: "search_category",
      schema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description:
              "The single best matching category for the user’s query.",
            enum: [
              "Electronics",
              "Apparel",
              "Home & Kitchen",
              "Sports & Outdoors",
              "Beauty & Personal Care"
            ]
          }
        },
        required: ["category"],
        additionalProperties: false
      },
      strict: true
    }
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-5-nano",
    messages: [
      {
        role: "system",
        content: `You will be given a search query. Return exactly one category (as a JSON enum value) from this list: Electronics, Apparel, Home & Kitchen, Sports & Outdoors, Beauty & Personal Care.`
      },
      { role: "user", content: searchQuery }
    ],
    response_format: structure
  });

  const content = completion.choices[0].message.content;
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error("extractCategoryGPT: invalid JSON: " + content);
  }

  console.log("GPT extracted category:", parsed.category);
  return parsed.category;
}

async function OldrankProducts(searchQuery, matchedProducts) {
    console.log("Running GPT with input:", searchQuery);
    const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
    });

    const structure = {
  "type": "json_schema",
  "json_schema": {
    "name": "product_list",
    "schema": {
      "type": "object",
      "properties": {
        "recommendedProducts": {
          "type": "array",
          "description": "A list of products matching the criteria. If no products are found, return an empty array. make sure products are sorted by relevance to the search query.",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "description": "Unique identifier for the product."
              },
              "name": {
                "type": "string",
                "description": "Name of the product."
              },
              "price": {
                "type": "number",
                "description": "Price of the product in USD."
              },
              "category": {
                "type": "string",
                "description": "Category to which the product belongs."
              },
              "description": {
                "type": "string",
                "description": "Short description of the product."
              },
              "rating": {
                "type": "number",
                "description": "Average user rating of the product, on a scale from 0 to 5."
              }
            },
            "required": ["id", "name", "price", "category", "description", "rating"],
            "additionalProperties": false
          }
        },
        "RestOfTheProducts": {
          "type": "array",
          "description": "A list of all products that were not in recommended products. This can be an empty array if all products match the criteria.",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "description": "Unique identifier for the product."
              },
              "name": {
                "type": "string",
                "description": "Name of the product."
              },
              "price": {
                "type": "number",
                "description": "Price of the product in USD."
              },
              "category": {
                "type": "string",
                "description": "Category to which the product belongs."
              },
              "description": {
                "type": "string",
                "description": "Short description of the product."
              },
              "rating": {
                "type": "number",
                "description": "Average user rating of the product, on a scale from 0 to 5."
              }
            },
            "required": ["id", "name", "price", "category", "description", "rating"],
            "additionalProperties": false
          }
        }
      },
      "required": ["recommendedProducts", "RestOfTheProducts"],
      "additionalProperties": false
    },
    "strict": true
  }
}

    const completion = await openai.chat.completions.create({
    model: "gpt-5-nano",
    messages: [
        {
        role: "system",
content: `you will be given a search query and you have to rank the following products ${JSON.stringify(matchedProducts)}. based on the query You can use the product name, description, category, and other attributes to find matches.`
        },
        { role: "user", content: `${searchQuery}` }
    ],
    response_format: structure
    });
    console.log("GPT completion response:", completion.choices[0].message.content);
    const content = completion.choices[0].message.content;
    let result;
    try {
    result = JSON.parse(content);
    } catch (e) {
    throw new Error("getProducts: invalid JSON: " + content);
    }
    return result;

}
async function rankProducts(searchQuery, matchedProducts) {
  console.log("Running GPT with input:", searchQuery);
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const structure = {
    type: "json_schema",
    json_schema: {
      name: "product_id_lists",
      schema: {
        type: "object",
        properties: {
          recommendedProductsIDs: {
            type: "array",
            description:
              "A list of product IDs matching the criteria, sorted by relevance. If no products are found, return an empty array.",
            items: { type: "integer" }
          },
          RestOfTheProductsIDs: {
            type: "array",
            description:
              "A list of all product IDs not in the recommended list, sorted by relevance. May be empty if all products are recommended.",
            items: { type: "integer" }
          }
        },
        required: ["recommendedProductsIDs", "RestOfTheProductsIDs"],
        additionalProperties: false
      },
      strict: true
    }
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-5-nano",
    messages: [
      {
        role: "system",
        content: `You will be given a search query and a list of products: ${JSON.stringify(
          matchedProducts
        )}. Return two arrays of IDs: first the IDs of the products most relevant to the query, then the IDs of the rest, both in relevance order.`
      },
      { role: "user", content: searchQuery }
    ],
    response_format: structure
  });

  const content = completion.choices[0].message.content;
  let idLists;
  try {
    idLists = JSON.parse(content);
  } catch (e) {
    throw new Error("rankProducts: invalid JSON: " + content);
  }

  const lookup = id => products.find(p => p.id === id);

  const recommendedProducts = idLists.recommendedProductsIDs
    .map(lookup)
    .filter(Boolean);

  const RestOfTheProducts = idLists.RestOfTheProductsIDs
    .map(lookup)
    .filter(Boolean);

  return {
    recommendedProducts,
    RestOfTheProducts
  };
}
async function getProducts(searchQuery) {
  if (!searchQuery) return products;

  const category = await extractCategoryGPT(searchQuery);
  if (!category) return [];  

  const matched = products.filter(
    p => p.category.toLowerCase() === category.toLowerCase()
  );
  if (matched.length === 0) return [];

  return await rankProducts(searchQuery, matched);
}
module.exports = {
    getProducts
};
