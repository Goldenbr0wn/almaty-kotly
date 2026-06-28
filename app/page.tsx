import Script from "next/script";
import { FinalSiteBridge } from "@/components/FinalSiteBridge";

export default function HomePage() {
  return (
    <>
      <link rel="stylesheet" href="/assets/index-mobilefix3-20260628.css?v=20260628-cutout" />
      <div id="root" />
      <FinalSiteBridge />
      <Script src="/assets/index-mobilefix3-20260628.js?v=20260628-cutout" strategy="afterInteractive" />
    </>
  );
}
