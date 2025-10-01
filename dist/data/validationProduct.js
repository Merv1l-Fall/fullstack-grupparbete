// src/data/validationProduct.ts
import { z } from "zod";
//const productsIdRegex = /^p[0-9]+$/
//const userIdRegex = /^u[0-9]+$/
//const cartIdRegex = /^[0-9]+$/
export const ProductSchema = z.object({
    id: z.string().min(1, { message: "Produkten måste ha ett ID" }),
    name: z.string().min(1, { message: "Produkten måste ha ett namn" }),
    price: z.number().min(0, { message: "Priset måste ha ett nummer som är noll eller högre" }),
    imageUrl: z.url({ message: "Felaktig URL" }),
    amountInStock: z.number().int({ message: "Amount måste vara ett heltal" }).min(0, { message: "Amount måste vara noll eller högre" }),
});
//# sourceMappingURL=validationProduct.js.map