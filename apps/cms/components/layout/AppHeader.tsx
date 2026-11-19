import Image from "next/image";
import Link from "next/link";
import { USER_ROLE_LABEL } from "@erenos/shared";
import { initialsOf, type Staff } from "@/lib/auth";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";

export function AppHeader({ staff }: { staff: Staff }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 bg-deep px-4 text-white sm:gap-6 sm:px-10">
      <Link href="/" className="flex shrink-0 items-center gap-3">
        <Image
          src="/logo-erenos.png"
          alt=""
          width={191}
          height={240}
          className="h-10 w-auto rounded-md bg-white p-0.5"
        />
        <span className="text-base font-semibold">Erenos CMS</span>
      </Link>
      <NavLinks role={staff.role} />
      <UserMenu
        initials={initialsOf(staff.fullName)}
        name={staff.fullName}
        email={staff.email}
        roleLabel={USER_ROLE_LABEL[staff.role]}
      />
    </header>
  );
}
