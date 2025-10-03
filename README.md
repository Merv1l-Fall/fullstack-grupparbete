# API för webbshop

Detta API är byggt med Express och DynamoDB och hanterar användare, produkter och kundvagnar.

## Installation

1. Klona repot:
   ```sh
   git clone https://github.com/Merv1l-Fall/fullstack-grupparbete.git
   ```
2. Installera beroenden:
   ```sh
   npm install
   ```
3. Skapa en `.env`-fil med följande variabler:
	```sh
	AWS_ACCESS_KEY_ID = din-access-key
	AWS_SECRET_ACCESS_KEY = din-secret-key
	PORT = 3350
	TABLE_NAME = ditt-table-name
	```
4. Bygg servern:
   ```sh
   npm run build-server
   ```
5. Starta servern:
	```sh
	npm run start-server
	```


## Endpoints

### Användare

- `GET /users`  
  Hämta alla användare.

- `GET /users/:id`  
  Hämta en användare med ID.

- `POST /users`  
  Skapa en ny användare.  
  **Body:**  
  ```json
  { "userName": "namn" }
  ```

- `PUT /users/:id`  
  Uppdatera en användare.  
  **Body:**  
  ```json
  { "userName": "nytt namn" }
  ```

- `DELETE /users/:id`  
  Radera en användare.

   
   
 