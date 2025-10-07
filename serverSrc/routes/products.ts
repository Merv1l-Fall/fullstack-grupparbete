import express, { Router } from "express";
import type { Request, Response } from "express";
import { GetCommand, ScanCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";
import { z } from "zod";
import { ProductSchema, type ProductInput } from "../data/validationProduct.js";


const router: Router = express.Router();

// GET /:productId
router.get('/:productId', async (req: Request, res: Response) => {
  const productId = req.params.productId;
  try {
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
      res.status(404).json({ error: "Kan inte hitta produkten" });
    }
  } catch (error) {
    console.error("Fel vid hämtning av enskild produkt:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET all products/
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await db.send(new ScanCommand({
      TableName: "fullstack_grupparbete",
      FilterExpression: "begins_with(PK, :pk)",
      ExpressionAttributeValues: {
        ":pk": "PRODUCT#"
      }
    }));

    res.json(result.Items || []);
  } catch (error) {
    console.error("Fel vid hämtning av alla produkter", error);
    res.status(500).json({ message: "Kunde inte hämta produkter", error: String(error) });
  }
});

// POST (creat a new product)/
router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = ProductSchema.parse(req.body);

    const item = {
      PK: `PRODUCT#${parsed.id}`,
      SK: "METADATA",
      ...parsed,
    };

    const command = new PutCommand({
      TableName: "fullstack_grupparbete",
      Item: item,
      ConditionExpression: "attribute_not_exists(PK)",
    });

    await db.send(command);

    res.status(201).json({ message: "Produkten har skapats", product: item });
  } catch (err: any) {
    if (err.name === "ConditionalCheckFailedException") {
      return res.status(400).json({ error: "Produkt med detta ID finns redan!" });
    }
    if (err.errors) {
      return res.status(400).json({ error: err.errors });
    }
    console.error("Fel vid skapande av produkt!", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /:productId
router.delete('/:productId', async (req: Request, res: Response) => {
  const productId = req.params.productId;

  try {
    const command = new DeleteCommand({
      TableName: "fullstack_grupparbete",
      Key: {
        PK: `PRODUCT#${productId}`,
        SK: "METADATA"
      }
    });

    await db.send(command);

    res.status(200).json({ message: "Produkt har tagits bort" });
  } catch (error) {
    console.error("Fel vid borttagning av produkt:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
