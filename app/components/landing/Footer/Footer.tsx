"use client";

import FooterDesktop from "./FooterDesktop";
import FooterMobile from "./FooterMobile";

export default function Footer() {
  return (
    <>
      <div className="block lg:hidden">
        <FooterMobile />
      </div>

      <div className="hidden lg:block">
        <FooterDesktop />
      </div>
    </>
  );
}