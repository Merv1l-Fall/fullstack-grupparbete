//GET PUT POST DELETE etc för cart

import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import {cartItemSchema, cartSchema} from "../data/validationCart.js"

const router = express.Router();

// Sökväg till cart.json i data-mappen / _dirname kan ersättas - just nu absolut sökväg till filen som ligger i /Users/timmy/project/src
const cartFilePath = path.join(__dirname, "../data/cart.json");

// En arrow-funktion som inte tar några argument, läser innehållet i filen cart.json och returnerar det som ett JS-object.
//fs - Node.js inbyggda File-System-modul - läser synkront, väntar på att filen läses färdigt innan den läser nästa rad. Finns alternativt en asynkron version, men denna är synkron. 
//cartFilePath -> sökväg till avsedd fil. 
// utf-8 -> anger teckenkodning, vilket gör att det blir en string istället för en Buffer. 
// Resultatet sparas i vår variabel 'data' och är då en string som innehåller JSON-data från cart.json.

//Exempel: Om cart.json innehåller:
// {"items": [{"id": 1, "name": "Apple", "quantity": 3}]}
//så blir den konverterade data en sträng som ser ut såhär: '{"items":[{"id":1,"name":"Apple","quantity":3}]}

//const parsedData = JSON.parse(data);
//JSON.parse tar en JSON-string och omvandlar den till ett JS Object
//Efter den här raden är parsedData ett vanligt JS object.

//return cartSchema.parse(parsedData);
//cartSchema -> är ett Zod-schema som definerar HUR ett cart-object SKA se ut
//.parse(parsedData) -> gör runtime-validering
//1. Kontrollerar att parsedData matchar strukturen som defineras i Zod
//2. Om vanlideringen lyckas, returneras objektet enligt cartSchema
//3. Om valideringen misslyckas, kastar Zod(throw) ett fel som du kan fånga upp i din kod
//Exempel:
// Om cartSchema förväntar sig att varje item ska ha productId som string och quantity som positivt heltal så kommer ett objekt som SAKNAR något av dessa fält att kasta ett fel.

const readCartData = () => {
  const data = fs.readFileSync(cartFilePath, "utf-8");
  const parsedData = JSON.parse(data);
  return cartSchema.parse(parsedData);
};

//Sammanfattat:
//1. Vi läser filen cart.json SYNKRONT som en sträng
//2. Vi konverterar vår string från JSON till ett JS-object
//3. Vi returnerar vårt object så vi kan använda det direkt i koden.
//4. Vi validerar med zod genom vårt cartSchema som vi importerar från validationCart.ts

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Ännu en arrow-funktion som heter writeCartData
// Vi tar argument från data av typen any
// Vi använder funktionen för att skriva data till filen cart.json

//JSON.stringify -> konverterar ett JS object till en JSON-string
//Parametrar är:
//1. data -> object som skall konverteras
//2. null -> används för att inte filtrera ut något
//3. 2 -> anger vilken indentering det skall bli i JSON-strängen för att vi skall kunna läsa den enklare.

//fs.writeFileSync(cartFilePath,...) -> en File-System-method för att skriva filer synkront
//1. cartFilePath -> den fullständiga sökvägen till cart.json
//2. JSON-string som ska skrivas (med JSON.sringify)

//Eftersom det körs synkront kommer Node.js att vänta tills filen är helt skriven innan den kör vidare.
//Därtill om filen inte finns så skapas den automatiskt, om den redan finns så skrivs den över.

const writeCartData = (data: any) => {
  fs.writeFileSync(cartFilePath, JSON.stringify(data, null, 2));
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// router.get("/"), (req: Request, res: Response) => ...
// router -> detta är en Express Router, den definerar rutter/endpoints
// .get() -> definterar en GET-endpoint, en URL som klienter kan hämta data från via GET
// Parametrar:
// 1. "/" -> sökväg för endpoint, i detta fall till root
// 2. (req: Request, res: Response) => {...} -> callback-funktion som körs när vi anropar endpointen.

//(req: Request, res: Response)
// req -> innehåller all information om förfrågan som klienten skickar.
// res -> skickar tillbaka svaret
//Request = beskriver en förfrågan
//Respone = beskriver svaret på förfrågan

// const cart = readCartData();
// vi anropar readCartData() - funktionen
// funktionen läser filen cart.json och returnerar ett JS object
// resultatet sparas i vår cart-variabel

//res.status(200).json(cart)
//res.status(200) -> statuskod på svaret (200 OK)
//.json(cart) -> skickar tillbaka JS objectet cart som JSON till klienten
//Express gör om vårt object till en JSON-string automatiskt

//Sammanfattat:
//1. Express anropar vår callback-funktion
//2. readCartData() läser innehållet i cart.json från disken
//3. Server skickar tillbaka detta innehåll som JSON, med status 200 (OK)

router.get("/", (req: Request, res: Response) => {
  const cart = readCartData();
  res.status(200).json(cart);
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// router.post("/", (req: Request, res: Response) => { ... });
//router.post() -> definerar en POST-endpoint
//Den lyssnar på POST-förfrågningar till root ("/") för denna router
//Callback-funktionen körs när klienten skickar en POST med data i body.

//const cart = readCartData();
//Läser den nuvarande kundvagnen från cart.json med vår funktion readCartData()
//cart blir ett JS-arrayobject som innehåller våra varor

//const newItem = req.body;
//req.body -> innehåller data som klienten skickade i POST-förfrågan

//Exempel:
//{ "productId":123, "quantity": 2}

//Vi sparar detta i variabeln newItem

router.post("/", (req: Request, res: Response) => {
  const cart = readCartData();
  const newItem = req.body;

  try {
    cartItemSchema.parse(newItem);
  } catch (err:any){
    return res.status(400).json({message: err.errors || err.message});
  }

  const existingItem = cart.find(item => item.productId === newItem.productId)
  if (existingItem){
    existingItem.quantity += newItem.quantity;
  } else{
    cart.push(newItem);
  }
  writeCartData(cart);
  res.status(201).json(newItem);
  });
  

//Sammanfattat:
//1. Klienten skickar en POST med productId och quantity
//2. Servern läser kundvagnen (cart.json)
//3. Vi validerar och ser till att nödvändig data finns
//4. Om produkten redan finns -> uppdatera antal
//5. Om produkten INTE finns -> lägg till ny produkt
//6. Spara alla ändringar
//7. Vi skickar tillbaka statuskod-201 och den nya produkten

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//router.put("/:productId", (req: Request, res: Response) => {...});
//router.put() -> definerar en PUT-endpoint, den använder vi för att uppdatera en resurs

// /:productId -> DYNAMISK parameter i URL:en
//Exempel:
// /cart/123 -> productId = 123

//Callback-funktionen körs när klienten skickar en PUT-förfrågan till den här endpointen
router.put("/:productId", (req: Request, res: Response) => {

//const cart = readCartData(); ->
//Läser av den nuvarande kundvagnen från cart.json
//cart blir en array med alla varor i den
  const cart = readCartData();

//Hämta productId och quantity
//req.params -> innehåller DYNAMISKA URL-parametrar (:productId)
//req.body -> innehåller data som klienten skickar i PUT-förfrågan
//Vi hämtar quantity från body helt enkelt
  const { productId } = req.params;
  const { quantity } = req.body;

//Exempel:
// PUT /cart/123
// Body: {"quantity": 5}

try{
    cartItemSchema.shape.quantity.parse(quantity);
} catch (err:any){
    return res.status(400).json({message: "quantity måste vara ett POSITIVT heltal"})
}

const item = cart.find(item => item.productId === productId)
if(!item){
    return res.status(404).json({message: "Produkten finns INTE i kundvagnen"})
}

item.quantity = quantity;
writeCartData(cart);
res.status(200).json(item)
});

//Sammanfattat:
//1. Klienten gör en PUT-förfrågan till /cart/:productId med ett nytt quantity(antal)
//2. Servern läser cart.json
//3. Hittar produkten i kundvagnen och:
//          Finns den -> uppdatera quantity(antal)
//          Finns den INTE -> returnera statuskod 404(Not Found)
//4. Spara ändringar till filen
//5. Skicka tillbaka den uppdaterade produkten med statuskod 200 (OK)

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//router.delete() -> definerar en DELETE-endpoint, vi använder den för att ta bort en resurs
// /:productId -> DYNAMISK paramterer i URL:en
//Exempel:
// /cart/123

//Callback-funktionen (readCartData) körs när klienten skickar en DELETE-förfrågan till den här URL:en

router.delete("/:productId", (req: Request, res: Response) => {

//Läser den nuvarande kundvagnen från cart.json
//Våran vart blir en array(lista)
  const cart = readCartData();

//req.params -> innehåller alla DYNAMISKA URL-parametrar
//Här sparar vi produktens ID som ska tas bort
//Exempel:
// DELETE /cart/123 -> blir då -> productId = "123"
  const { productId } = req.params;

//filter() -> skapar en ny array som innehåller alla produkter förutom den som ska tas bort
//Alla objekt där item.productID === productId tas alltså bort från vår array
//Resultatet sparas därefter i newCart
  const newCart = cart.filter((item: any) => item.productId !== productId);

//Vi använder vår funktion för att skriva in den nya arrayen i cart.json
//Nu är produkten permanent borttagen från filen
  writeCartData(newCart);

//Statuskod 200(OK) -> indikerar att borttagningen lyckades
//JSON-svar innehåller vårt message
//Klienten kan nu se detta i kundvagnen
  res.status(200).json({ message: "Produkten har tagits bort" });
});

//Sammanfattat:
//1. Klienten skickar en DELETE-förfrågan till /cart/:productId
//2. Server läser av vår kundvagn (cart.json)
//3. Vi filtrerar bort produkten med det angivna productId
//4. Vi sparar den uppdaterade kundvagnen till filen
//5. Vi skickar tillbaka ett meddelande om att produkten har tagits bort


export default router;
