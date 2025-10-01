// interface/types för users, cart och products

export interface User { 
    id: string;
    name: string;
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