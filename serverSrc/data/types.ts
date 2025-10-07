// interface/types för users, cart och products

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
    productName: string;
    price: number;
   imageUrl?: string;//optional
    amountInStock: string;
}