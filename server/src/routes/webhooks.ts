import { Router } from "express";
import { asyncH } from "../middleware.js";
import { processWebhookEvent } from "../core/webhook-handler.js";

export const webhooksRouter = Router();

webhooksRouter.post(
  "/:provider",
  asyncH(async (req, res) => {
    const provider = req.params.provider;
    const rawBody = JSON.stringify(req.body);
    const payload = req.body;

    const result = await processWebhookEvent(provider, rawBody, payload, req.headers);
    res.status(200).json(result);
  })
);
