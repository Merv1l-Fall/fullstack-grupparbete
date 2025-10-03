// src/routes/products.ts
import express, { Router } from "express";
import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";
import { z } from "zod";
import { ProductSchema } from "../data/validationProduct.js";
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
            res.status(404).json({ error: "Kan inte hitta produkten" });
        }
    }
    catch (error) {
        console.error("Fel vid hämtning av enskild produkt:", error);
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
        console.error("Fel vid hämtning av alla produkter", error);
        res.status(500).json({ message: "Kunde inte hämta produkter", error: String(error) });
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
            ConditionExpression: "attribute_not_exists(PK)", //prevent duplicate
        });
        await db.send(command);
        res.status(201).json({ message: "Produkten har skapats", product: item }); //if succeed
    }
    catch (err) {
        if (err.name === "ConditionalCheckFailedException") {
            return res.status(400).json({ error: "Produkt med detta ID finns redan!" }); //if duplicated
        }
        if (err.errors) {
            // Zod validation errors
            return res.status(400).json({ error: err.errors });
        }
        console.error("Fel vid skapande av produkt!", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// PUT 
const PartialProductSchema = ProductSchema.partial();
router.put('/:id', async (req, res) => {
    try {
        const parsed = PartialProductSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: z.treeifyError(parsed.error) });
        }
        const updates = parsed.data;
        if (Object.keys(updates).length === 0) {
            return res.status(400).send({ error: 'Nothing to update' });
        }
        if ('id' in updates) {
            delete updates.id;
        }
        const exprNames = {};
        const exprValues = {};
        const sets = [];
        let i = 0;
        for (const [k, v] of Object.entries(updates)) {
            i++;
            const nameKey = `#k${i}`;
            const valueKey = `:v${i}`;
            exprNames[nameKey] = k;
            exprValues[valueKey] = v;
            sets.push(`${nameKey} = ${valueKey}`);
        }
        const productId = req.params.id;
        const out = await db.send(new UpdateCommand({
            TableName: "fullstack_grupparbete",
            Key: {
                PK: `PRODUCT#${productId}`,
                SK: "METADATA"
            },
            UpdateExpression: `SET ${sets.join(', ')}`,
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
            ReturnValues: 'ALL_NEW'
        }));
        if (!out.Attributes) {
            return res.status(404).send({ error: 'Not found' });
        }
        return res.json(out.Attributes);
    }
    catch (err) {
        console.error(err);
        return res.status(500).send({ error: 'Failed to update product' });
    }
});
// Delete a product by ID
router.delete('/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const command = new DeleteCommand({
            TableName: "fullstack_grupparbete",
            Key: {
                PK: `PRODUCT#${productId}`,
                SK: "METADATA"
            }
        });
        await db.send(command);
        res.status(200).json({ message: "Produkt har tagits bort" });
    }
    catch (error) {
        console.error("Fel vid borttagning av produkt:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
//# sourceMappingURL=products.js.map