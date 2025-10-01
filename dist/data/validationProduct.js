import { z } from "zod";
export const ProductSchema = z.object({
    id: z.string().min(1, { message: "Produkten måste ha ett ID" }),
    productName: z.string().min(1, { message: "Produkten måste ha ett namn" }),
    price: z.number().min(0, { message: "Priset måste ha ett nummer som är noll eller högre" }),
    // imageUrl: z.url({ message: "Felaktig URL" }),
    amountInStock: z.string().min(1, { message: "Amount måste anges" })
        .refine(val => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Amount måste vara ett nummer som är noll eller högre",
    })
});
//# sourceMappingURL=validationProduct.js.map