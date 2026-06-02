import { NotificationListView } from "@/components/notifications/NotificationListView";
import { getNotificationCopy } from "@/lib/api/notifications";

export default async function NotificationsPage() {
  const copy = await getNotificationCopy();
  return <NotificationListView copy={copy} />;
}
