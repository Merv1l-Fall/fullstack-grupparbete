import { z } from "zod";
export declare const productSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    price: z.ZodNumber;
    imageUrl: z.ZodOptional<z.ZodURL>;
    amountInStock: z.ZodNumber;
}, z.core.$strip>;
export type ProductInput = z.infer<typeof productSchema>;
//# sourceMappingURL=validationProduct.d.ts.map