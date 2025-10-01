// src/routes/products.ts
import express, { Router } from "express";
import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ProductSchema } from "../data/validationProduct.js";
import { db } from "../data/dynamoDb.js";
const router = express.Router();
// Get a single product by ID
router.get('/:productId', async (req, res) => {
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
        }
        else {
            res.status(404).json({ error: "product not found" });
        }
    }
    catch (error) {
        console.error("Error fetching single product:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Get all products
router.get('/', async (req, res) => {
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
    }
    catch (error) {
        console.error("Error fetching all products:", error);
        res.status(500).json({ message: "could not fetch products", error: String(error) });
    }
});
// Create a new product
router.post("/", async (req, res) => {
    try {
        // validate input with Zod
        const parsed = ProductSchema.parse(req.body);
        const item = {
            PK: `PRODUCT#${parsed.id}`,
            SK: "METADATA",
            ...parsed,
        };
        const command = new PutCommand({
            TableName: "fullstack_grupparbete",
            Item: item,
            ConditionExpression: "attribute_not_exists(PK)", // جلوگیری از duplicate
        });
        await db.send(command);
        res.status(201).json({ message: "Product created", product: item });
    }
    catch (err) {
        if (err.name === "ConditionalCheckFailedException") {
            return res.status(400).json({ error: "Product with this ID already exists" });
        }
        if (err.errors) {
            // Zod validation errors
            return res.status(400).json({ error: err.errors });
        }
        console.error("Error creating product:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
//# sourceMappingURL=products.js.map