import { auth } from "@/lib/auth";
import {
  getUserAccounts,
  getUserByEmail,
  getUserById,
  listUserSessions,
  userExists,
} from "@/lib/users";

import { PrettyStringify } from "@/components/dev/pretty-stringify";

export default async function Page() {
  await auth.protect({ role: "user" });
  const user = await getUserByEmail("keko@mail.com");
  const user2 = await getUserById("6acddf0801efa7687e697f77");
  const user3 = await userExists("keko@mail.com");
  const user4 = await getUserAccounts("6acddf0801efa7687e697f77");
  const user5 = await listUserSessions("6acddf0801efa7687e697f77", { onlyActiveSessions: false });

  return (
    <div>
      <PrettyStringify data={user} />
      <PrettyStringify data={user2} />
      <PrettyStringify data={user3} />
      <PrettyStringify data={user4} />
      <PrettyStringify data={user5} />
    </div>
  );
}
