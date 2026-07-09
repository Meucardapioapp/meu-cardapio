"use client";

import FAQDesktop from "./FAQDesktop";
import FAQMobile from "./FAQMobile";

export default function FAQ() {
  return (
    <>
      <div className="block lg:hidden">
        <FAQMobile />
      </div>

      <div className="hidden lg:block">
        <FAQDesktop />
      </div>
    </>
  );
}