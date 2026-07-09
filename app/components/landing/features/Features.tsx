"use client";

import FeaturesDesktop from "./FeaturesDesktop";
import FeaturesMobile from "./FeaturesMobile";

export default function Features() {
  return (
    <>
      <div className="block lg:hidden">
        <FeaturesMobile />
      </div>

      <div className="hidden lg:block">
        <FeaturesDesktop />
      </div>
    </>
  );
}