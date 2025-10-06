// interface/types för users, cart och products

export interface User { 
    userId: string;
    userName: string;
	SK: string;
	PK: string;
}

export interface Cart { 
    cartId: string;
    userId: string;
    // productIds: string[];
    // amount: number[];
}

export interface CartItem { 
	cartId: string;
	productId: string;
	amount: number;
}

export interface Products { 
    productId: string;
    productName: string;
    price: number;
    image: string;
    amountInStock: string;
}