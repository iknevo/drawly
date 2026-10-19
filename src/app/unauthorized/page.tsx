import { UnauthorizedView } from "@/modules/auth/ui/views/unauthorized-view";

export const metadata = {
  title: "Not Authorized",
  description: "You don't have permission to view this page.",
};

export default function Page() {
  return <UnauthorizedView />;
}
