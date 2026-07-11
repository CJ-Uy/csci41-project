# Database handoff

The base form in `index.html` is now connected to the database. It supports multiple milkshakes in one order and saves the order.

## Screens needed for the presentation

Incase we might need the saved orders screens since we also return current orders/all orders . But if not we can delete it nalang guys. Also there is a route (`GET /api/orders/:orderId/receipt` ) for returning the full receipt which is an output if we need that as well.

1. **Order screen** - customer name, cashier, milkshake recipe, size, add-ons, and quantity. The current `index.html` already provides the base version of this.
2. **Confirmation / receipt screen** - shown after an order is saved. It should show the customer, cashier, milkshakes, add-ons, subtotals, and final total. The backend already returns this receipt data; frontend work here is mainly layout, styling, and formatting the amount as pesos.
3. **Saved orders screen** - lists previously saved orders and lets the user open one receipt again.

Prices and totals are already regular peso amounts, such as `150.00`.

## Current form flow

The normal HTML form sends this type of data to `POST /`:

```js
{
  customer_name: "Test",
  cashier_staff_id: "1",
  milkshake_recipe: ["Strawberry Milkshake", "Oreo Milkshake"],
  size: ["12oz", "16oz"],
  customization: [["Banana"], ["Sprinkles"]],
  quantity: [["2"], ["1"]]
}
```

The server looks up the recipe and add-on names in the seeded database and saves the transaction. After it is saved, the submitted form data is passed to `views/Confirmation.html`, then the confirmation page is rendered.

The current seeded cashier choices are Maria Santos, Rosa Garcia, and Ana Reyes. For the frontend version, call `GET /api/menu` to load the cashiers, recipes, and add-ons from the database before showing the order form.

## API routes

- `GET /api/health` checks if the server is running.
- `GET /api/menu` returns cashiers, recipes, sizes, add-ons, and prices.
- `POST /api/orders` saves an order sent as JSON.
- `GET /api/orders` returns the saved order list.
- `GET /api/orders/:orderId/receipt` returns one full receipt.

## POST /api/orders

This is separate from the normal HTML form above. It returns JSON, so the frontend can use it when it makes the order screen with JavaScript.


```json
{
  "customerName": "Juan Dela Cruz",
  "cashierStaffId": 1,
  "items": [
    {
      "recipeId": 1,
      "size": "12oz",
      "addOns": [
        { "ingredientId": 7, "quantity": 2 }
      ]
    }
  ]
}
```

The API checks the cashier, recipe, add-on, size, and quantity using the database. Prices and totals are calculated on the server, so the frontend should not send them.

A successful request returns the saved order ID and receipt:

```json
{
  "message": "Order saved",
  "order": {
    "orderId": 6,
    "total": 150
  },
  "receipt": {
    "orderId": 6,
    "customerName": "Juan Dela Cruz",
    "cashierName": "Maria Santos",
    "items": []
  }
}
```

`total` is already in pesos. For example, `150` means ₱150.00.

## GET routes

`GET /api/menu` is for building dropdowns or a future JavaScript version of the form.

Example response:

```json
{
  "cashiers": [
    { "staffId": 1, "staffName": "Maria Santos" },
    { "staffId": 3, "staffName": "Rosa Garcia" }
  ],
  "recipes": [
    {
      "recipeId": 1,
      "recipeName": "Chocolate Milkshake",
      "sizes": [
        { "size": "8oz", "basePrice": 120 },
        { "size": "12oz", "basePrice": 120 },
        { "size": "16oz", "basePrice": 120 }
      ]
    }
  ],
  "addOns": [
    {
      "ingredientId": 3,
      "ingredientName": "Chocolate Syrup",
      "pricePerServing": 15,
      "quantityOnHand": 3000
    }
  ]
}
```

`GET /api/orders` is for an order-history page.

Example response:

```json
{
  "orders": [
    {
      "orderId": 1,
      "customerName": "John Smith",
      "cashierName": "Maria Santos",
      "status": "completed",
      "orderDateTime": "2026-07-11 13:50:14",
      "total": 280,
      "itemCount": 2
    }
  ]
}
```

`GET /api/orders/:orderId/receipt` is for reopening a saved receipt. For example:

```text
/api/orders/6/receipt
```

Example response:

```json
{
  "receipt": {
    "orderId": 1,
    "customerName": "John Smith",
    "cashierName": "Maria Santos",
    "status": "completed",
    "orderDateTime": "2026-07-11 13:50:14",
    "total": 280,
    "items": [
      {
        "milkshakeId": 1,
        "recipeName": "Chocolate Milkshake",
        "size": "12oz",
        "basePrice": 120,
        "subtotal": 150,
        "addOns": [
          {
            "ingredientName": "Whipped Cream",
            "quantity": 2,
            "unitPrice": 15,
            "subtotal": 30
          }
        ]
      }
    ]
  }
}
```

`GET /api/health` can be used to check if the backend is running:

```json
{ "status": "ok" }
```


Use `GET /api/orders` for the saved-order screen and `GET /api/orders/:orderId/receipt` for reopening a receipt.
