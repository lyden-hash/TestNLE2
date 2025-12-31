
import { GoogleGenAI, Type } from "@google/genai";
import { Estimate, AIInsight, SuggestedItem, LineItem, SiteReport, ChatMessage, Customer, MarketInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeEstimate(estimate: Estimate): Promise<AIInsight> {
  const prompt = `
    As an expert construction estimator and project risk manager, analyze the following estimate and provide a detailed audit.
    
    Project Name: ${estimate.name}
    Location: ${estimate.location}
    Total Amount: $${estimate.total}
    Line Items:
    ${estimate.lineItems.map(item => `- ${item.name}: ${item.qty} units @ $${item.rate} each (Total: $${item.amount})`).join('\n')}
    
    Exclusions: ${estimate.exclusions || 'None provided'}
    Memo: ${estimate.memo || 'None provided'}
    
    Identify potential risks (under-budgeting, missing scope), suggest recommendations, and provide an overall confidence score (0-100) for the bid's accuracy and competitiveness.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Confidence score 0-100" },
          summary: { type: Type.STRING, description: "One-paragraph executive summary" },
          risks: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of identified risks" 
          },
          recommendations: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Actionable recommendations" 
          }
        },
        required: ["score", "summary", "risks", "recommendations"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim()) as AIInsight;
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    throw new Error("Invalid AI response format");
  }
}

export async function getMaterialSuggestions(estimate: Estimate): Promise<SuggestedItem[]> {
  const prompt = `
    As an expert construction estimator, suggest 5-8 missing or complementary materials/labor items for the following project.
    
    Project Name: ${estimate.name}
    Project Location: ${estimate.location}
    Current Scope:
    ${estimate.lineItems.map(item => `- ${item.name}: ${item.description}`).join('\n')}
    
    Consider standard construction practices for this type of project.
    Provide realistic suggested quantities and rates based on typical market averages.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                suggestedQty: { type: Type.NUMBER },
                suggestedRate: { type: Type.NUMBER },
                reason: { type: Type.STRING }
              },
              required: ["name", "description", "suggestedQty", "suggestedRate", "reason"]
            }
          }
        },
        required: ["suggestions"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text.trim());
    return data.suggestions as SuggestedItem[];
  } catch (e) {
    console.error("Failed to parse material suggestions:", e);
    throw new Error("Invalid suggestions format");
  }
}

export async function analyzeDocumentImage(base64Image: string, mimeType: string): Promise<Partial<LineItem>[]> {
  const prompt = `
    Extract construction line items from this document (invoice, quote, or site note). 
    For each item, identify:
    1. Name/Title
    2. Detailed Description
    3. Quantity
    4. Unit Rate (Cost per unit)
    
    Return a list of items. If a value is missing, use reasonable defaults (Qty: 1, Rate: 0).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                qty: { type: Type.NUMBER },
                rate: { type: Type.NUMBER }
              },
              required: ["name", "description", "qty", "rate"]
            }
          }
        },
        required: ["items"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text.trim());
    return data.items;
  } catch (e) {
    console.error("Failed to parse document extraction:", e);
    throw new Error("Document analysis failed to return valid items.");
  }
}

export async function generateSiteReport(prompt: string, base64Image?: string, mimeType?: string): Promise<Omit<SiteReport, 'id' | 'date'>> {
  const visualPart = base64Image ? [{ inlineData: { data: base64Image, mimeType: mimeType || 'image/jpeg' } }] : [];
  const textPart = { text: `
    Generate a professional construction site daily report based on the following observations and/or image:
    User Input: "${prompt}"
    
    If an image is provided, analyze it for work in progress, safety hazards, and material usage.
    
    The report should include:
    1. Project Name (infer from context or provide a generic placeholder)
    2. Work Completed (array of items)
    3. Materials Used (array of items)
    4. Issues or Delays (array of items)
    5. Weather observations (infer if possible or use generic placeholder)
    6. Safety Observations (summarize findings)
    7. Overall Summary (1-2 sentences)
  ` };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [...visualPart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING },
          workCompleted: { type: Type.ARRAY, items: { type: Type.STRING } },
          materialsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
          issues: { type: Type.ARRAY, items: { type: Type.STRING } },
          weather: { type: Type.STRING },
          safetyObservations: { type: Type.STRING },
          summary: { type: Type.STRING }
        },
        required: ["projectName", "workCompleted", "materialsUsed", "issues", "weather", "safetyObservations", "summary"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse site report:", e);
    throw new Error("Report generation failed.");
  }
}

export async function* streamSalesAdvice(
  history: ChatMessage[],
  context: { estimates: Estimate[]; customers: Customer[] }
) {
  const systemInstruction = `
    You are the "ConstructAI Closing Specialist," a world-class construction sales strategist.
    Your mission is to help the user win more projects, improve client relationships, and negotiate better margins.
    
    Current Portfolio Context:
    - Active Bids: ${context.estimates.length}
    - Total Pipeline Value: $${context.estimates.reduce((a, b) => a + b.total, 0).toLocaleString()}
    - Key Clients: ${context.customers.map(c => c.name).join(', ')}
    
    Available Data (Project Details):
    ${context.estimates.map(e => `- Project: ${e.name}, Status: ${e.status}, Value: $${e.total}`).join('\n')}

    Rules:
    1. Be professional, aggressive yet ethical, and highly strategic.
    2. Give specific advice based on the project names or client names if mentioned.
    3. Offer tactical tips for construction bidding (e.g., follow-up cadences, "value engineering" as a sales hook).
    4. Use bold text and bullet points for readability.
  `;

  const chat = ai.chats.create({
    model: "gemini-3-pro-preview",
    config: { systemInstruction },
  });

  const lastUserMsg = history.filter(m => m.role === 'user').pop();
  if (!lastUserMsg) return;

  const result = await chat.sendMessageStream({ message: lastUserMsg.text });
  for await (const chunk of result) {
    yield chunk.text;
  }
}

export async function fetchMarketIntelligence(estimate: Estimate): Promise<MarketInsight> {
  const query = `Current construction material costs and labor rates in ${estimate.location} for: ${estimate.lineItems.map(i => i.name).slice(0, 3).join(', ')}.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    ?.filter((web: any) => web && web.uri)
    ?.map((web: any) => ({ title: web.title || 'Market Source', uri: web.uri })) || [];

  return {
    text: response.text || "No detailed market intelligence found for this specific query.",
    sources: sources,
  };
}
