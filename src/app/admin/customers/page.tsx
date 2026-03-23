import { CustomerDirectory } from "@/components/admin/CustomerDirectory";
import { getCustomerDirectory } from "@/lib/actions/admin-customers";

export const metadata = {
  title: "Customers | Admin | En-Joy Speed",
};

export default async function CustomersPage() {
  const customers = await getCustomerDirectory();

  return <CustomerDirectory customers={customers} />;
}
