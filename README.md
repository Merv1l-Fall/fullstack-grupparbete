API för Webshop!

Det här är en enkel guide att följa för frontend-team som vill använda ett enkelt REST API med vanliga fetch-anrop. 
API:et har tre huvud-delar, "products, users och cart".

All data sparas i en DynamoDB-databas och skickas i JSON-format.
Standard-adressen som används är: http://localhost:3350

Börja med att klona repot till din dator och skriv sen "npm i" i konsolen för att installera dependencies

Skapa en .env med denhär layouten
AWS_ACCESS_KEY_ID = din-nyckel
AWS_SECRET_ACCESS_KEY = din-hemliga-nyckel
TABLE_NAME = ditt-tablename

För att start servern skriver du först "npm run build-server" och sen "npm run start-server" i din konsol

1. DynamoDB: 
I dynamodb har din tabell eller table ett table name. Det är där all data sparas (och hämtas ifrån).
PK(Partition Key): Används för att gruppera objekt av samma kategori, tex "PRODUCT#123".
SK(Sort Key): Används för att skilja olika objekt inom samma PK.

PK och SK tillsammans ger ett unikt sätt att hämta data från DynamoDB och gör det möjligt attt filtrera och sortera datan bättre.


Endpointsen svarar med JSON och använder vanliga HTTP metoder så som GET, POST, PUT och DELETE.


2. Hur du använder users: 

Base URL: /users

Här hanterar du allt som inkluderar användaren. Varje user har ett unikt ID och användarnamn. 

GET /users – Hämtar en lista med alla användare.

GET /users/:id – Hämtar en specifik användare utifrån ID.

POST /users – Skapar en ny användare.

Kräver ett fält userName.

API:et skapar automatiskt ett unikt ID.

PUT /users/:id – Uppdaterar en användares namn.

DELETE /users/:id – Tar bort en användare med angivet ID.

Om användaren inte finns returneras ett felmeddelande med statuskod 404.


3. Hur du använder produkter

Base URL: /api/products

Samma som i users, du kan hämta, ändra, lägga till och ta bort produkter.
Varje produkt har ett unikt ID, namn, pris och antal i lager.

GET /api/products – Hämtar alla produkter.

GET /api/products/:productId – Hämtar en specifik produkt utifrån ID.

POST /api/products – Skapar en ny produkt.

Kräver fälten productName, price och amountInStock.
ID genereras automatiskt och behöver inte skickas med.

PUT /api/products/:id – Uppdaterar en eller flera egenskaper för produkten.

DELETE /api/products/:id – Tar bort en produkt.

Om du försöker skapa en produkt med samma genererade ID (extremt ovanligt) får du ett felmeddelande.
Om du försöker uppdatera eller ta bort en produkt som inte finns får du status 404.

4. Hur du använder cart: 

Base URL: /cart

Kundvagnen fungerar på samma sätt som users och products, men hanterar vilka produkter en användare har lagt till.

Kundvagnarna är kopplade till användarna(users) och innehåller en lista med produkter(produkt ID:n) plus antal av produkterna.

GET /cart – Hämtar alla kundvagnar.

GET /cart/:id – Hämtar en specifik kundvagn för en användare.

POST /cart – Skapar en ny kundvagn eller lägger till produkter i en befintlig.

Kräver userId, productIds och amount.

PUT /cart/:id – Uppdaterar antal eller produkter i en kundvagn.

DELETE /cart/:id – Tömmer eller tar bort kundvagnen.

5. Validering: 

All data som skickas till API:et valideras, alltså kontrolleras att det stämmer, innan den sparas.
Om något är fel eller saknas skickas ett felmeddelande och en statuskod. 

Exempel på vanliga regler:

Produktens pris måste vara ett nummer som är 0 eller högre.

Namn och ID får inte vara tomma.

Antal i lager måste vara ett nummer.

6. Vanliga felkoder: 

400 Bad Request, Klientfel
Felaktig data, t.ex. saknade fält eller ogiltiga värden.

404 Not Found, Klientfel
Resursen (t.ex. användaren eller produkten) hittades inte.

500 Internal Server Error, Serverfel
Något gick fel på servern.



Allt är byggt med Express och Typescript, datan lagras i AWS DynamoDB
Servern körs på port 3350(detta kan ändras i process.env.PORT)
CORS används för att tillåta anrop från frontend.

(Du som frontendare kan använda fetch. 
Skicka alltid headers: { "Content-Type": "application/json" } vid POST och PUT.)

Kontrollera alltid response.ok innan du läser svaret.

Lycka till!

