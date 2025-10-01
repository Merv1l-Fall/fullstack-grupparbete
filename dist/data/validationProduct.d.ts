import { z } from "zod";
export declare const ProductSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    price: z.ZodNumber;
    imageUrl: z.ZodURL;
    amountInStock: z.ZodNumber;
}, z.core.$strip>;
export type ProductInput = z.infer<typeof ProductSchema>;
//# sourceMappingURL=validationProduct.d.ts.map