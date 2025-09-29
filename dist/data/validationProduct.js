// src/data/validationProduct.ts
import { z } from "zod";
export const productSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, "Product name is required"),
    price: z.number().nonnegative("Price must be >= 0"),
    imageUrl: z.url("Invalid URL").optional(),
    amountInStock: z.number().int().nonnegative("Stock must be >= 0")
});
//# sourceMappingURL=validationProduct.js.map