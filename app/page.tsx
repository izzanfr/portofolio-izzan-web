import { Hero } from "@/components/sections/Hero";
import { Experience } from "@/components/sections/Experience";
import { Projects } from "@/components/sections/Projects";
import { Certifications } from "@/components/sections/Certifications";
import { Contact } from "@/components/sections/Contact";
import { ExperienceZone } from "@/components/ui/ExperienceZone";
import { SectionCut } from "@/components/ui/SectionCut";

export default function Home() {
  return (
    <>
      {/* The one boundary on this page that is a cut rather than a scroll.
          Reaching the foot of the hero and pushing down plays a transition
          instead of moving the page: the hero racks out of focus, the screen
          blooms, and the experience page resolves out of a radial smear. See
          <SectionCut> for how the scroll is moved underneath that bloom. */}
      <SectionCut fromId="home" toId="experience">
        <Hero />
        <ExperienceZone>
          <Experience />
        </ExperienceZone>
      </SectionCut>
      <Projects />
      <Certifications />
      <Contact />
    </>
  );
}
