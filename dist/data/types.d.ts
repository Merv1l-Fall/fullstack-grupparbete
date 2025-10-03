export interface User {
    userId: string;
    userName: string;
    SK: string;
    PK: string;
}
export interface Cart {
    id: string;
    userId: string;
    productIds: string[];
    amount: number[];
}
export interface Products {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    amountInStock: string;
}
//# sourceMappingURL=types.d.ts.map