// Clean English dictionary for Dukaan
const dict = {
  en: {
    app_name: "Kivo",
    tagline: "Business Made Simple",
    subtag: "Simple billing, stock management, customer records and udhaar tracking made for small businesses.",
    start_free: "Start Free",
    see_demo: "See Features",
    login: "Log in",
    register: "Sign up",
    logout: "Log out",
    email: "Email",
    password: "Password",
    name: "Name",
    dashboard: "Dashboard",
    new_bill: "New Bill",
    products: "Products",
    stock: "Stock",
    customers: "Customers",
    udhaar: "Udhaar",
    orders: "Orders",
    reports: "Reports",
    settings: "Settings",
    billing: "Billing",
    pro_studio: "Pro Studio",
    counter_mode: "Counter Mode",
    today_sales: "Today's Sales",
    today_orders: "Today's Orders",
    cash: "Cash",
    upi: "UPI",
    pending: "Pending Udhaar",
    low_stock: "Low Stock",
    recent_orders: "Recent Orders",
    search: "Search",
    add: "Add",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    qty: "Qty",
    price: "Price",
    total: "Total",
    subtotal: "Subtotal",
    discount: "Discount",
    proceed_payment: "Proceed to Payment",
    payment_received: "Payment Received",
    invoice: "Invoice",
    download_pdf: "Download PDF",
    print: "Print",
    share: "Share",
    hello: "Hello",
    reminder: "Reminder",
    whatsapp_reminder: "Send WhatsApp Reminder",
  },
};

export const LANGUAGES = [
  { code: "en", label: "English" }
];

export function t(lang, key) {
  return dict.en?.[key] || key;
}
