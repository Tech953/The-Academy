import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { openai as defaultOpenai } from "./client";

export interface ImageRouteDependencies {
  openai?: Pick<OpenAI, "images">;
}

export function registerImageRoutes(
  app: Express,
  dependencies: ImageRouteDependencies = {},
): void {
  const openai = dependencies.openai ?? defaultOpenai;

  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt, size = "1024x1024" } = req.body;

      if (!prompt) {
        res.status(400).json({ error: "Prompt is required" });
        return;
      }

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: size as "1024x1024" | "512x512" | "256x256",
      });

      const imageData = response.data?.[0];
      res.json({
        url: imageData?.url,
        b64_json: imageData?.b64_json,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
}

