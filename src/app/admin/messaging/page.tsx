import { getMessageTemplates } from "@/lib/actions/admin-messaging";
import { MessagingTemplates } from "@/components/admin/MessagingTemplates";

export default async function MessagingPage() {
  const templates = await getMessageTemplates();
  return <MessagingTemplates initialTemplates={templates} />;
}
