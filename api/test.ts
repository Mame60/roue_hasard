import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({ message: "Test endpoint fonctionne!", method: req.method, url: req.url });
}

