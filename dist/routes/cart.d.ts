import { Router } from "express";
export interface CartItem {
    id: string;
    productId: string;
    amount: number;
}
export type Cart = CartItem[];
declare const router: Router;
export default router;
//# sourceMappingURL=cart.d.ts.map