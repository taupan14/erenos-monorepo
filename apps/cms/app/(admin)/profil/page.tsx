import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { USER_ROLE_LABEL } from "@erenos/shared";
import { ProfileForms } from "@/components/account/ProfileForms";
import { PageHead } from "@/components/ui/form";
import { MIN_PASSWORD } from "@/lib/accounts";
import { getCurrentStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");

  return (
    <>
      <PageHead
        title="Profil"
        subtitle="Nama tampilan dan kata sandi akun Anda."
      />
      <ProfileForms
        name={staff.fullName === staff.email ? "" : staff.fullName}
        email={staff.email}
        roleLabel={USER_ROLE_LABEL[staff.role]}
        minPassword={MIN_PASSWORD}
      />
    </>
  );
}
