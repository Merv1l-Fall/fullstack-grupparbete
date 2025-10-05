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
    //productIds: string[]; //Produkter och produktdata ligger separat i ITEM#PRODUCT# i DynamoDB
    //amount: number[];     // Med de här två kodraderna kräver det en extra query för att hämta hela carten - 
    //                          men förenklar tillägg/borttagning/uppdatering av enstaka varor +/-=0
}

export interface Products { 
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    amountInStock: string;
}