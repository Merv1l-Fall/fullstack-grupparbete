import { z } from "zod";
export declare const ProductSchema: z.ZodObject<{
    id: z.ZodString;
    productName: z.ZodString;
    price: z.ZodNumber;
    amountInStock: z.ZodString;
}, z.core.$strip>;
export type ProductInput = z.infer<typeof ProductSchema>;
//# sourceMappingURL=validationProduct.d.ts.map