import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role === "ADMIN") {
    redirect("/admin");
  } else if (role === "RECEPTIONIST") {
    redirect("/receptionist");
  } else if (role === "PHARMACIST") {
    redirect("/pharmacist");
  } else {
    redirect("/login");
  }
}

