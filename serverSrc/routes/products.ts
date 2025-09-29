// src/routes/products.ts
import express, { Router } from "express";
import type { Request, Response } from "express";
import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";

const router: Router = express.Router();

// Get a single product by ID
router.get('/:productId', async (req: Request, res: Response) => {
    try {
        const productId = req.params.productId;
        const result = await db.send(new GetCommand({
            TableName: "fullstack_grupparbete",
            Key: {
                PK: `PRODUCT#${productId}`,
                SK: "METADATA"
            }
        }));

        if (result.Item) {
            res.json(result.Item);
        } else {
            res.status(404).json({ error: "product not found" });
        }
    } catch (error) {
        console.error("Error fetching single product:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get all products
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await db.send(new ScanCommand({
            TableName: "fullstack_grupparbete",
            FilterExpression: "begins_with(PK, :pk)",
            ExpressionAttributeValues: {
                ":pk": "PRODUCT#",
				// ":sk": "METADATA"
            }
        }));

        res.json(result.Items || []);
    } catch (error) {
        console.error("Error fetching all products:", error);
        res.status(500).json({ message: "could not fetch products", error: String(error) });
    }
});
export default router;






















