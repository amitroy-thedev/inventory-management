import { Supplier, Product, StockOrder } from './types';

export const INITIAL_SUPPLIERS: Supplier[] = [
  { Supplier_ID: 1, Supplier_Name: "Apex Logistics", Contact_Person: "Alice Smith", City: "Boston" },
  { Supplier_ID: 2, Supplier_Name: "Global Tech Parts", Contact_Person: "Bob Johnson", City: "New York" },
  { Supplier_ID: 3, Supplier_Name: "Nova Industries", Contact_Person: "Charlie Brown", City: "Chicago" },
  { Supplier_ID: 4, Supplier_Name: "Vanguard Supplies", Contact_Person: "Diana Prince", City: "Boston" },
  { Supplier_ID: 5, Supplier_Name: "Horizon Distributors", Contact_Person: "Evan Wright", City: "Seattle" }
];

export const INITIAL_PRODUCTS: Product[] = [
  { Product_ID: 101, Product_Name: "Intel Core i9-13900K", Category: "Electronics", Unit_Price: 499.99, Stock_Quantity: 12, Supplier_ID: 2 },
  { Product_ID: 102, Product_Name: "Corsair Vengeance 32GB RAM", Category: "Electronics", Unit_Price: 129.99, Stock_Quantity: 4, Supplier_ID: 2 },
  { Product_ID: 103, Product_Name: "Logitech MX Master 3S Mouse", Category: "Accessories", Unit_Price: 99.99, Stock_Quantity: 25, Supplier_ID: 1 },
  { Product_ID: 104, Product_Name: "Dell 27\" UltraSharp U2723QE", Category: "Electronics", Unit_Price: 349.99, Stock_Quantity: 3, Supplier_ID: 3 },
  { Product_ID: 105, Product_Name: "Keychron K2 Mechanical Keyboard", Category: "Accessories", Unit_Price: 89.99, Stock_Quantity: 18, Supplier_ID: 1 },
  { Product_ID: 106, Product_Name: "Ergonomic Office Mesh Chair", Category: "Furniture", Unit_Price: 249.99, Stock_Quantity: 8, Supplier_ID: 4 },
  { Product_ID: 107, Product_Name: "Standing Desk (Bamboo Top)", Category: "Furniture", Unit_Price: 450.00, Stock_Quantity: 2, Supplier_ID: 4 },
  { Product_ID: 108, Product_Name: "Anker USB-C Multiport Hub", Category: "Accessories", Unit_Price: 49.99, Stock_Quantity: 40, Supplier_ID: 5 }
];

export const INITIAL_ORDERS: StockOrder[] = [
  { Order_ID: 5001, Product_ID: 101, Quantity_Ordered: 5, Order_Date: "2026-06-25", Delivery_Status: "Delivered" },
  { Order_ID: 5002, Product_ID: 102, Quantity_Ordered: 10, Order_Date: "2026-06-26", Delivery_Status: "Pending" },
  { Order_ID: 5003, Product_ID: 104, Quantity_Ordered: 8, Order_Date: "2026-06-26", Delivery_Status: "Ordered" },
  { Order_ID: 5004, Product_ID: 107, Quantity_Ordered: 5, Order_Date: "2026-06-27", Delivery_Status: "Pending" },
  { Order_ID: 5005, Product_ID: 105, Quantity_Ordered: 12, Order_Date: "2026-06-24", Delivery_Status: "Delivered" },
  { Order_ID: 5006, Product_ID: 108, Quantity_Ordered: 20, Order_Date: "2026-06-23", Delivery_Status: "Cancelled" }
];
