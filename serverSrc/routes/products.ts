// src/routes/products.ts
import express, { Router } from "express";
import type { Request, Response } from "express";
import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, tableName } from "../data/dynamoDb.js";
import {z} from "zod";
import { ProductSchema, type ProductInput } from "../data/validationProduct.js";
import { cryptoId } from "../utils/idGenerator.js";

const router: Router = express.Router();

// Get a single product by ID
router.get('/:productId', async (req: Request, res: Response) => {
    try {
        const productId = req.params.productId;
        const result = await db.send(new GetCommand({
            TableName: tableName,
            Key: {
                PK: `PRODUCT#${productId}`,
                SK: "METADATA"
            }
        }));

        if (result.Item) {
            res.send(result.Item);
        } else {
            res.status(404).send({ error: "Kan inte hitta produkten" });
        }
    } catch (error) {
        console.error("Fel vid hämtning av enskild produkt:", error);
        res.status(500).send({ error: "Internal server error" });
    }
});

// Get all products
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await db.send(new ScanCommand({
            TableName: tableName,
            FilterExpression: "begins_with(PK, :pk)",
            ExpressionAttributeValues: {
                ":pk": "PRODUCT#",
				// ":sk": "METADATA"
            }
        }));

        res.send(result.Items || []);
    } catch (error) {
        console.error("Fel vid hämtning av alla produkter", error);
        res.status(500).send({ message: "Kunde inte hämta produkter", error: String(error) });
    }
});  

// Create a new product
router.post("/", async (req: Request, res: Response) => {
  try {
    // validate input with Zod
	const randomId: string = cryptoId(8);
    const parsed = ProductSchema.parse(req.body);

    const item = {
      PK: `PRODUCT#${randomId}`,
      SK: "METADATA",
	  productId: randomId,
      ...parsed,
    };

    const command = new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(PK)", //prevent duplicate
    });

    await db.send(command);

    res.status(201).send({ message: "Produkten har skapats", product: item });//if succeed
  } catch (err: any) {
    if (err.name === "ConditionalCheckFailedException") {
      return res.status(400).send({ error: "Produkt med detta ID finns redan!" });//if duplicated
    }
    if (err.errors) {
      // Zod validation errors
      return res.status(400).send({ error: err.errors });
    }
    console.error("Fel vid skapande av produkt!", err);
    res.status(500).send({ error: "Internal server error" });
  }
});

// PUT 

const PartialProductSchema = ProductSchema.partial();

router.put('/:id', async (req, res) => {
  try {
    
    const parsed = PartialProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).send({ error: z.treeifyError(parsed.error) });
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
      TableName: tableName,
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

    return res.send(out.Attributes);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'Failed to update product' });
  }
});

// Delete a product by ID
router.delete('/:productId', async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId;

    const command = new DeleteCommand({
      TableName: tableName,
      Key: {
        PK: `PRODUCT#${productId}`,
        SK: "METADATA"
      }
    });

    await db.send(command);

    res.status(200).send({ message: "Produkt har tagits bort" });
  } catch (error) {
    console.error("Fel vid borttagning av produkt:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});


export default router;