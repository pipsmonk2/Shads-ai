export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");
  return res.status(200).json({ status: "ok", timestamp: Date.now(), platform: "vercel-serverless" });
}
