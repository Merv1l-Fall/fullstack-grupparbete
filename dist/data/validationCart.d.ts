import { z } from "zod";
export declare const cartItemSchema: z.ZodObject<{
    productId: z.ZodString;
    amount: z.ZodNumber;
}, z.core.$strip>;
export declare const cartSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    productId: z.ZodString;
    amount: z.ZodNumber;
}, z.core.$strip>;
export declare const cartsSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    productId: z.ZodString;
    amount: z.ZodNumber;
}, z.core.$strip>>;
export type Cart = z.infer<typeof cartItemSchema>;
export type Carts = z.infer<typeof cartsSchema>;
//# sourceMappingURL=validationCart.d.ts.map