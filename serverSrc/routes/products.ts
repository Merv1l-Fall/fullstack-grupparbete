// src/routes/products.ts
import express, { Router } from "express";
import type { Request, Response } from "express";
import { GetCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";
import {z} from "zod";

import { ProductSchema, type ProductInput } from "../data/validationProduct.js";

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
    
      delete (updates as any).id;
    }

  
    const exprNames: Record<string, string> = {};
    const exprValues: Record<string, any> = {};
    const sets: string[] = [];
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
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'Failed to update product' });
  }
});


export default router;






















