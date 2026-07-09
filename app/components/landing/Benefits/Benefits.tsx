"use client";

import BenefitsDesktop from "./BenefitsDesktop";
import BenefitsMobile from "./BenefitsMobile";

export default function Benefits() {
  return (
    <>
      <div className="block lg:hidden">
        <BenefitsMobile />
      </div>

      <div className="hidden lg:block">
        <BenefitsDesktop />
      </div>
    </>
  );
}