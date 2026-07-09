"use client";

import NavbarDesktop from "./NavbarDesktop";
import NavbarMobile from "./NavbarMobile";

export default function Navbar() {
  return (
    <>
      <div className="block lg:hidden">
        <NavbarMobile />
      </div>

      <div className="hidden lg:block">
        <NavbarDesktop />
      </div>
    </>
  );
}