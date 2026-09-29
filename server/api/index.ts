import appPromise from "../src/app.js";

export default async function handler(req: any, res: any) {
  try {
    const app = await appPromise;
    if (!app) {
      res.status(500).json({ error: "Server failed to initialize" });
      return;
    }
    return app(req, res);
  } catch (err: any) {
    res.status(500).json({ error: "Function error", detail: err?.message || String(err) });
  }
}
