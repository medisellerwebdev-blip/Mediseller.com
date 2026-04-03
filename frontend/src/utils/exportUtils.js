import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Export products to Excel
 */
export const exportProductsToExcel = (products) => {
  const worksheet = XLSX.utils.json_to_sheet(products.map(p => ({
    'ID': p.product_id,
    'Name': p.name,
    'Generic Name': p.generic_name,
    'Brand': p.brand,
    'Category': p.category,
    'Dosage': p.dosage,
    'Form': p.form,
    'Price ($)': p.price,
    'Price (INR)': p.price_inr,
    'In Stock': p.in_stock ? 'Yes' : 'No',
    'Rating': p.rating,
    'Orders': p.order_count
  })));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  XLSX.writeFile(workbook, `Mediseller_Products_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Export products to PDF
 */
export const exportProductsToPDF = (products) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  doc.setFontSize(20);
  doc.text("Mediseller Product Inventory", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  const tableColumn = ["Name", "Brand", "Category", "Dosage", "Form", "Price ($)", "Stock"];
  const tableRows = products.map(p => [
    p.name,
    p.brand,
    p.category,
    p.dosage,
    p.form,
    `$${p.price}`,
    p.in_stock ? 'Yes' : 'No'
  ]);
  
  doc.autoTable(tableColumn, tableRows, { startY: 35 });
  doc.save(`Mediseller_Products_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export orders to Excel
 */
export const exportOrdersToExcel = (orders) => {
  const worksheet = XLSX.utils.json_to_sheet(orders.map(o => ({
    'Order ID': o.order_id,
    'Customer Name': o.shipping_address?.full_name,
    'Email': o.shipping_address?.email,
    'Phone': o.shipping_address?.phone,
    'Total Amount ($)': o.total,
    'Currency': o.currency,
    'Status': o.status,
    'Date': new Date(o.created_at).toLocaleDateString(),
    'Address': `${o.shipping_address?.address_line1}, ${o.shipping_address?.city}, ${o.shipping_address?.country}`
  })));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  XLSX.writeFile(workbook, `Mediseller_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Export orders to PDF
 */
export const exportOrdersToPDF = (orders) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  doc.setFontSize(20);
  doc.text("Mediseller Customer Orders", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  const tableColumn = ["Order ID", "Customer", "Email", "Amount", "Status", "Date"];
  const tableRows = orders.map(o => [
    o.order_id,
    o.shipping_address?.full_name,
    o.shipping_address?.email,
    `$${o.total}`,
    o.status.toUpperCase(),
    new Date(o.created_at).toLocaleDateString()
  ]);
  
  doc.autoTable(tableColumn, tableRows, { startY: 35 });
  doc.save(`Mediseller_Orders_${new Date().toISOString().split('T')[0]}.pdf`);
};
