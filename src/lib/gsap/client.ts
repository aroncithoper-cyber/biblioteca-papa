import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

let pluginsReady = false;

export function ensureGsapPlugins() {
  if (!pluginsReady) {
    gsap.registerPlugin(useGSAP, ScrollTrigger);
    pluginsReady = true;
  }
}

ensureGsapPlugins();

export { gsap, ScrollTrigger, useGSAP };
