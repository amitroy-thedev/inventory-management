export interface Supplier {
  Supplier_ID: number;
  Supplier_Name: string;
  Contact_Person: string;
  City: string;
}

export interface Product {
  Product_ID: number;
  Product_Name: string;
  Category: string;
  Unit_Price: number;
  Stock_Quantity: number;
  Supplier_ID: number;
}

export type DeliveryStatus = 'Pending' | 'Ordered' | 'Delivered' | 'Cancelled';

export interface StockOrder {
  Order_ID: number;
  Product_ID: number;
  Quantity_Ordered: number;
  Order_Date: string; // ISO date string or formatted date
  Delivery_Status: DeliveryStatus;
}

export interface SqlQueryLog {
  id: string;
  timestamp: string;
  query: string;
  description: string;
  affectedRows: number;
}

export type ActiveTab = 'dashboard' | 'suppliers' | 'products' | 'orders' | 'reports' | 'sql-console';
