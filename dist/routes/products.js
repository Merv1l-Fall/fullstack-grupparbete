// src/routes/products.ts
import express, { Router } from "express";
import { GetCommand, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";
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
router.put('/:productId', async (req, res) => {
    const productId = req.params.productId;
    try {
        // Hämta befintlig produkt
        const getRes = await db.send(new GetCommand({
            TableName: "fullstack_grupparbete",
            Key: { PK: `PRODUCT#${productId}`, SK: "METADATA" }
        }));
        if (!getRes.Item) {
            return res.status(404).json({ error: "Produkten hittas inte!" });
        }
        const existingProduct = getRes.Item;
        console.log("PUT body received:", req.body);
        // Validera bodyn
        // let parsedData: ProductInput;
        // try {
        //   parsedData = ProductSchema.parse(req.body);
        // } catch (err: any) {
        //   const issues = err.errors?.map((e: any) => ({
        //     path: e.path.join('.'),
        //     message: e.message
        //   })) ?? [];
        //   return res.status(400).json({ error: "Valideringsfel", issues });
        // }
        const validation = ProductSchema.safeParse(req.body);
        if (!validation.success) {
            const issues = validation.error.issues.map(e => ({
                path: e.path.join('.') || '(root)',
                message: e.message,
            }));
            console.warn('Valideringsfel:', issues);
            return res.status(400).json({ error: "Valideringsfel", issues });
        }
        const parsedData = validation.data;
        // Kontrollera att id matchar URL
        if (parsedData.id !== `PRODUCT#${productId}`) {
            return res.status(400).json({ error: "Produkt ID i URL och body måste vara samma" });
        }
        //  Bygg objektet som ska sparas
        const now = new Date().toISOString();
        const itemToSave = {
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
            productId,
            name: parsedData.productName,
            price: parsedData.price,
            // url: parsedData.imageUrl,
            amountInStock: parsedData.amountInStock,
            createdAt: existingProduct.createdAt ?? now,
            updatedAt: now,
        };
        // Jämför relevant innehåll för att undvika onödig uppdatering
        const existComparable = {
            name: existingProduct.name,
            price: existingProduct.price,
            url: existingProduct.url ?? null,
            amountInStock: existingProduct.amountInStock ?? 0
        };
        const newComparable = {
            name: itemToSave.name,
            price: itemToSave.price,
            // url: itemToSave.url ?? null,
            amountInStock: itemToSave.amountInStock ?? 0
        };
        if (JSON.stringify(existComparable) === JSON.stringify(newComparable)) {
            return res.sendStatus(204);
        }
        // Spara med PutCommand
        await db.send(new PutCommand({
            TableName: "fullstack_grupparbete",
            Item: itemToSave
        }));
        //  Returnera den uppdaterade produkten
        return res.status(200).json(itemToSave);
    }
    catch (err) {
        console.error("Error med PUT /:productId:", err);
        return res.status(500).json({ error: "Internt serverfel", details: String(err) });
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