# e-commerce_application
A full-stack e-commerce application that allows users to browse products, add items to a cart, place orders, and manage their profiles.

# Prerequisites:
 1.Node.js (v14 or later)
 2.PostgreSQL/MySQL (or any database you’ve chosen)

# Steps:
1. Clone the repository.
    git clone <repository_url>
    cd <repository_folder>
2. Install dependencies:
    npm install
3. Set up environment variables
   -> Create a .env file in the root directory. see once .env.example file

1. users Table
This table holds the details of users who can interact with the system (register, login, place orders, etc.).

id: Primary key for identifying users.
username: The unique username for each user.
email: The unique email address of the user.
password: The hashed password for authentication.
address: The user's address, used for shipping orders.
is_admin: A boolean field to specify if the user is an admin (can manage products, approve orders).
created_at: Timestamp of when the user was created.
updated_at: Timestamp of when the user details were last updated.
deleted_at: Timestamp to mark a user as deleted (soft deletion).


2. products Table
This table contains details about the products in the e-commerce platform.

id: Primary key for each product.
name: The product name (unique).
description: A brief description of the product.
price: The price of the product, with a check to ensure it’s greater than 0.
stock: The quantity available in the inventory, with a check to ensure it’s non-negative.
created_at: Timestamp of when the product was added to the system.
updated_at: Timestamp of when the product details were last updated.
deleted_at: Timestamp to mark the product as deleted (soft deletion).


3. orders Table
This table stores information about customer orders.

id: Primary key for each order.
user_id: Foreign key to the users table, indicating which user placed the order.
total_amount: The total price of the order.
status: The current status of the order (e.g., pending, approved, shipped, canceled).
approved_by: Foreign key to the users table indicating the admin who approved the order (if any).
created_at: Timestamp of when the order was created.
updated_at: Timestamp of when the order details were last updated.
deleted_at: Timestamp to mark the order as deleted (soft deletion).



4. order_items Table
This table stores the details of the products in each order (i.e., line items).

id: Primary key for each order item.
order_id: Foreign key to the orders table, linking the item to a specific order.
product_id: Foreign key to the products table, indicating which product is part of the order.
quantity: The quantity of the product ordered.
price: The price of the product at the time of the order.


5. Indexes for Optimization
Indexes are created to improve the performance of queries, particularly for common searches and filters.

idx_users_email: Index on the email column to speed up searches for users by email.
idx_products_name: Index on the name column for fast product searches.
idx_orders_user_id: Index on the user_id column to quickly retrieve orders by a specific user.
idx_orders_status: Index on the status column for filtering orders by status.
idx_order_items_order_id: Index on the order_id column for efficient order item lookups.
idx_order_items_product_id: Index on the product_id column to improve queries related to specific products in orders.

# User Management Endpoints
1.  user register
    http POST http://localhost:5000/api/users/register   username="user"   password="password"   email="user@example.com"
2. user login 
    http POST http://localhost:5000/api/users/login username="user"  password="password"
3. profile view
    http GET http://localhost:5000/api/users/{id} Authorization:"Bearer <TOKEN>"
4. update profile
    http PUT http://localhost:5000/api/users/{id}   Authorization:"Bearer <TOKEN>"   username="updateduser" email="updateduser@example1.com"

# Product Management Endpoints
1. List Products: GET /products
   http GET http://localhost:5000/api/products
2. View Single Product: GET /products/{id}
   http GET http://localhost:5000/api/products/{id}
3. Add Product (Admin only): POST /products
   http POST http://localhost:5000/api/products Authorization:"Bearer <ADMIN-TOKEN>" name="Product 1" description="First product description" price:=50.99 stock:=100
4. Update Product (Admin only): PUT /products/{id}
   http PUT http://localhost:5000/api/products/1 Authorization:"Bearer <ADMIN TOKEN>" name="Updated Product Name" description="Updated Description" price:=39.99 stock:=60

# Order Management Endpoints
1. Place Order: POST /orders
     http POST http://localhost:5000/api/orders Authorization:"Bearer <USER TOKEN>" items:='[{"product_id":3, "quantity":2}]'
2. View Order History: GET /orders
     http GET http://localhost:5000/api/orders Authorization:"Bearer <USER TOKEN>"
3. View Single Order: GET /orders/{id}
    http GET http://localhost:5000/api/orders/{id} Authorization:"Bearer <USER TOKEN>"
4. Cancel order: DELETE /orders/{id}
    http DELETE http://localhost:5000/api/order/{id} Authorization:"Bearer <ADMIN TOKEN>
    http DELETE http://localhost:5000/api/order/{id} Authorization:"Bearer <USER TOKEN> (user who placed order )
5. Approve order: PATCH
      http PATCH http://localhost:5000/api/orders/{id}/approve Authorization:"Bearer <ADMIN TOKEN>"
